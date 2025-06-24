import { Router } from 'express';
import { Request, Response } from 'express';
import { Pool } from 'pg';
import { createApiResponse, ServiceError } from '@jewelry-shop/shared';
import { logger } from '../utils/logger';

const router = Router();

// Get all categories
router.get('/', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  
  try {
    const result = await db.query(`
      SELECT c.*, 
             pc.name as parent_category_name,
             COUNT(ji.id) as item_count
      FROM categories c
      LEFT JOIN categories pc ON c.parent_id = pc.id
      LEFT JOIN jewelry_items ji ON c.id = ji.category_id AND ji.is_available = true
      WHERE c.is_active = true
      GROUP BY c.id, pc.name
      ORDER BY c.sort_order ASC, c.name ASC
    `);
    
    res.json(createApiResponse(true, result.rows, 'Categories retrieved successfully'));
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json(createApiResponse(false, undefined, null, 'Failed to retrieve categories'));
  }
});

// Get category by ID
router.get('/:id', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT c.*, 
             pc.name as parent_category_name,
             COUNT(ji.id) as item_count,
             AVG(ji.selling_price) as avg_item_price
      FROM categories c
      LEFT JOIN categories pc ON c.parent_id = pc.id
      LEFT JOIN jewelry_items ji ON c.id = ji.category_id AND ji.is_available = true
      WHERE c.id = $1 AND c.is_active = true
      GROUP BY c.id, pc.name
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(createApiResponse(false, undefined, null, 'Category not found'));
    }
    
    res.json(createApiResponse(true, result.rows[0], 'Category retrieved successfully'));
  } catch (error) {
    logger.error('Get category by ID error:', error);
    res.status(500).json(createApiResponse(false, undefined, null, 'Failed to retrieve category'));
  }
});

// Create new category
router.post('/', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  
  try {
    const {
      name,
      nameHi,
      nameKn,
      description,
      parentId,
      makingChargePercentage,
      sortOrder
    } = req.body;
    
    if (!name) {
      return res.status(400).json(createApiResponse(false, undefined, null, 'Category name is required'));
    }
    
    const result = await db.query(`
      INSERT INTO categories (
        name, name_hi, name_kn, description, parent_id, 
        making_charge_percentage, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      name,
      nameHi,
      nameKn,
      description,
      parentId,
      makingChargePercentage || 10,
      sortOrder || 0
    ]);
    
    logger.info('Category created', { categoryId: result.rows[0].id, name });
    
    res.status(201).json(createApiResponse(true, result.rows[0], 'Category created successfully'));
  } catch (error) {
    logger.error('Create category error:', error);
    
    if (error.code === '23505') {
      return res.status(409).json(createApiResponse(false, undefined, null, 'Category name already exists'));
    }
    
    res.status(500).json(createApiResponse(false, undefined, null, 'Failed to create category'));
  }
});

// Update category
router.put('/:id', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  
  try {
    const { id } = req.params;
    const updates = req.body;
    
    delete updates.id;
    
    const setClause = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        setClause.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (setClause.length === 0) {
      return res.status(400).json(createApiResponse(false, undefined, null, 'No valid fields to update'));
    }
    
    setClause.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const result = await db.query(`
      UPDATE categories 
      SET ${setClause.join(', ')}
      WHERE id = $${paramCount} AND is_active = true
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json(createApiResponse(false, undefined, null, 'Category not found'));
    }
    
    logger.info('Category updated', { categoryId: id, name: result.rows[0].name });
    
    res.json(createApiResponse(true, result.rows[0], 'Category updated successfully'));
  } catch (error) {
    logger.error('Update category error:', error);
    res.status(500).json(createApiResponse(false, undefined, null, 'Failed to update category'));
  }
});

// Delete category (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  
  try {
    const { id } = req.params;
    
    // Check if category has items
    const itemCheck = await db.query('SELECT COUNT(*) as count FROM jewelry_items WHERE category_id = $1 AND is_available = true', [id]);
    
    if (parseInt(itemCheck.rows[0].count) > 0) {
      return res.status(400).json(createApiResponse(false, undefined, null, 'Cannot delete category with existing items'));
    }
    
    const result = await db.query(`
      UPDATE categories 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING name
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(createApiResponse(false, undefined, null, 'Category not found'));
    }
    
    logger.info('Category deleted', { categoryId: id, name: result.rows[0].name });
    
    res.json(createApiResponse(true, null, 'Category deleted successfully'));
  } catch (error) {
    logger.error('Delete category error:', error);
    res.status(500).json(createApiResponse(false, undefined, null, 'Failed to delete category'));
  }
});

// Get category hierarchy (tree structure)
router.get('/hierarchy/tree', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  
  try {
    const result = await db.query(`
      WITH RECURSIVE category_tree AS (
        -- Base case: top-level categories
        SELECT id, name, name_hi, name_kn, parent_id, 0 as level,
               ARRAY[name] as path
        FROM categories 
        WHERE parent_id IS NULL AND is_active = true
        
        UNION ALL
        
        -- Recursive case: child categories
        SELECT c.id, c.name, c.name_hi, c.name_kn, c.parent_id, ct.level + 1,
               ct.path || c.name
        FROM categories c
        JOIN category_tree ct ON c.parent_id = ct.id
        WHERE c.is_active = true
      )
      SELECT ct.*, 
             COUNT(ji.id) as item_count
      FROM category_tree ct
      LEFT JOIN jewelry_items ji ON ct.id = ji.category_id AND ji.is_available = true
      GROUP BY ct.id, ct.name, ct.name_hi, ct.name_kn, ct.parent_id, ct.level, ct.path
      ORDER BY ct.path
    `);
    
    res.json(createApiResponse(true, result.rows, 'Category hierarchy retrieved successfully'));
  } catch (error) {
    logger.error('Get category hierarchy error:', error);
    res.status(500).json(createApiResponse(false, undefined, null, 'Failed to retrieve category hierarchy'));
  }
});

export { router as categoryRoutes };