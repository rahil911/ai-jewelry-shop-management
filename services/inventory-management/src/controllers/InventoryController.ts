import { Request, Response } from 'express';
import { Pool } from 'pg';
import { 
  createApiResponse, 
  createPaginatedResponse, 
  ServiceError, 
  generateSKU,
  calculateSellingPrice,
  generateId
} from '@jewelry-shop/shared';
import { logger } from '../utils/logger';
import { BarcodeService } from '../services/BarcodeService';

export class InventoryController {
  private barcodeService: BarcodeService;
  
  constructor() {
    this.barcodeService = new BarcodeService();
  }
  
  async getAllItems(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const search = req.query.search as string;
      const category = req.query.category as string;
      const metalType = req.query.metalType as string;
      const purity = req.query.purity as string;
      const isAvailable = req.query.isAvailable as string;
      const lowStock = req.query.lowStock as string;
      
      let query = `
        SELECT ji.*, 
               c.name as category_name,
               c.name_hi as category_name_hi,
               c.name_kn as category_name_kn,
               mt.name as metal_name,
               mt.symbol as metal_symbol,
               mt.current_rate as current_metal_rate,
               p.purity_name,
               p.purity_percentage,
               s.name as supplier_name
        FROM jewelry_items ji
        LEFT JOIN categories c ON ji.category_id = c.id
        LEFT JOIN metal_types mt ON ji.metal_type_id = mt.id
        LEFT JOIN purities p ON ji.purity_id = p.id
        LEFT JOIN suppliers s ON ji.supplier_id = s.id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramCount = 0;
      
      if (search) {
        paramCount++;
        const searchParam = paramCount;
        paramCount++;
        const searchParam2 = paramCount;
        paramCount++;
        const searchParam3 = paramCount;
        query += ` AND (ji.name ILIKE $${searchParam} OR ji.sku ILIKE $${searchParam2} OR ji.barcode ILIKE $${searchParam3})`;
        const searchTerm = `%${search.toLowerCase()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      if (category) {
        paramCount++;
        query += ` AND ji.category_id = $${paramCount}`;
        params.push(category);
      }
      
      if (metalType) {
        paramCount++;
        query += ` AND ji.metal_type_id = $${paramCount}`;
        params.push(metalType);
      }
      
      if (purity) {
        paramCount++;
        query += ` AND ji.purity_id = $${paramCount}`;
        params.push(purity);
      }
      
      if (isAvailable !== undefined) {
        paramCount++;
        query += ` AND ji.is_available = $${paramCount}`;
        params.push(isAvailable === 'true');
      }
      
      if (lowStock === 'true') {
        query += ` AND ji.stock_quantity <= ji.min_stock_level`;
      }
      
      // Get total count
      const countQuery = query.replace(
        'SELECT ji.*, c.name as category_name, c.name_hi as category_name_hi, c.name_kn as category_name_kn, mt.name as metal_name, mt.symbol as metal_symbol, mt.current_rate as current_metal_rate, p.purity_name, p.purity_percentage, s.name as supplier_name',
        'SELECT COUNT(*)'
      );
      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);
      
      // Get paginated results
      query += ` ORDER BY ji.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);
      
      const result = await db.query(query, params);
      
      // Calculate current selling prices with live gold rates
      const itemsWithCurrentPrices = result.rows.map(item => {
        if (item.current_metal_rate && item.net_weight && item.purity_percentage) {
          const currentSellingPrice = calculateSellingPrice(
            item.net_weight,
            item.current_metal_rate,
            item.making_charges,
            item.stone_charges,
            item.other_charges
          );
          
          return {
            ...item,
            current_selling_price: currentSellingPrice,
            price_difference: currentSellingPrice - item.selling_price
          };
        }
        return item;
      });
      
      res.json(createPaginatedResponse(itemsWithCurrentPrices, page, limit, total));
      
    } catch (error) {
      logger.error('Get all items error:', error);
      res.status(500).json(createApiResponse(false, undefined, null, 'Failed to retrieve inventory items'));
    }
  }
  
  async getItemById(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const { id } = req.params;
      
      const result = await db.query(`
        SELECT ji.*, 
               c.name as category_name,
               c.name_hi as category_name_hi,
               c.name_kn as category_name_kn,
               mt.name as metal_name,
               mt.symbol as metal_symbol,
               mt.current_rate as current_metal_rate,
               p.purity_name,
               p.purity_percentage,
               s.name as supplier_name,
               array_agg(DISTINCT img.cdn_url) FILTER (WHERE img.cdn_url IS NOT NULL) as image_urls
        FROM jewelry_items ji
        LEFT JOIN categories c ON ji.category_id = c.id
        LEFT JOIN metal_types mt ON ji.metal_type_id = mt.id
        LEFT JOIN purities p ON ji.purity_id = p.id
        LEFT JOIN suppliers s ON ji.supplier_id = s.id
        LEFT JOIN images img ON ji.id = img.jewelry_item_id
        WHERE ji.id = $1
        GROUP BY ji.id, c.id, mt.id, p.id, s.id
      `, [id]);
      
      if (result.rows.length === 0) {
        throw new ServiceError('Item not found', 'ITEM_NOT_FOUND', 404);
      }
      
      const item = result.rows[0];
      
      // Calculate current selling price
      if (item.current_metal_rate && item.net_weight && item.purity_percentage) {
        item.current_selling_price = calculateSellingPrice(
          item.net_weight,
          item.current_metal_rate,
          item.making_charges,
          item.stone_charges,
          item.other_charges
        );
        item.price_difference = item.current_selling_price - item.selling_price;
      }
      
      res.json(createApiResponse(true, item));
      
    } catch (error) {
      logger.error('Get item by ID error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, undefined, null, error.message));
      }
      
      res.status(500).json(createApiResponse(false, undefined, null, 'Failed to retrieve item'));
    }
  }
  
  async createItem(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const itemData = req.body;
      
      // Generate SKU if not provided
      if (!itemData.sku) {
        // Get category and metal type for SKU generation
        const categoryResult = await db.query('SELECT name FROM categories WHERE id = $1', [itemData.categoryId]);
        const metalResult = await db.query('SELECT symbol FROM metal_types WHERE id = $1', [itemData.metalTypeId]);
        
        if (categoryResult.rows.length === 0 || metalResult.rows.length === 0) {
          throw new ServiceError('Invalid category or metal type', 'INVALID_REFERENCE', 400);
        }
        
        // Get next sequence number
        const sequenceResult = await db.query('SELECT COUNT(*) + 1 as next_seq FROM jewelry_items');
        const sequence = parseInt(sequenceResult.rows[0].next_seq);
        
        itemData.sku = generateSKU(
          categoryResult.rows[0].name,
          metalResult.rows[0].symbol,
          sequence
        );
      }
      
      // Generate barcode
      if (!itemData.barcode) {
        itemData.barcode = await this.barcodeService.generateBarcode(itemData.sku);
      }
      
      // Calculate selling price based on current metal rates
      const metalRateResult = await db.query('SELECT current_rate FROM metal_types WHERE id = $1', [itemData.metalTypeId]);
      if (metalRateResult.rows.length > 0) {
        const currentRate = metalRateResult.rows[0].current_rate;
        itemData.sellingPrice = calculateSellingPrice(
          itemData.netWeight,
          currentRate,
          itemData.makingCharges,
          itemData.stoneCharges || 0,
          itemData.otherCharges || 0
        );
      }
      
      // Insert item
      const result = await db.query(`
        INSERT INTO jewelry_items (
          sku, barcode, name, name_hi, name_kn, description,
          category_id, metal_type_id, purity_id,
          gross_weight, net_weight, stone_weight,
          making_charges, wastage_percentage, stone_charges, other_charges,
          base_price, selling_price, cost_price, mrp,
          stock_quantity, min_stock_level,
          size, color, occasion, gender, age_group, style,
          images, certifications, tags,
          is_customizable, is_featured,
          location, supplier_id, warranty_months, care_instructions
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37
        )
        RETURNING *
      `, [
        itemData.sku, itemData.barcode, itemData.name, itemData.nameHi, itemData.nameKn,
        itemData.description, itemData.categoryId, itemData.metalTypeId, itemData.purityId,
        itemData.grossWeight, itemData.netWeight, itemData.stoneWeight || 0,
        itemData.makingCharges, itemData.wastagePercentage || 0, itemData.stoneCharges || 0,
        itemData.otherCharges || 0, itemData.basePrice || itemData.sellingPrice,
        itemData.sellingPrice, itemData.costPrice, itemData.mrp,
        itemData.stockQuantity || 1, itemData.minStockLevel || 0,
        itemData.size, itemData.color, itemData.occasion, itemData.gender,
        itemData.ageGroup, itemData.style, itemData.images || [], itemData.certifications || [],
        itemData.tags || [], itemData.isCustomizable || false, itemData.isFeatured || false,
        itemData.location, itemData.supplierId, itemData.warrantyMonths || 12,
        itemData.careInstructions
      ]);
      
      logger.info('Jewelry item created', { itemId: result.rows[0].id, sku: result.rows[0].sku });
      
      res.status(201).json(createApiResponse(true, result.rows[0], 'Item created successfully'));
      
    } catch (error) {
      logger.error('Create item error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, undefined, null, error.message));
      }
      
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json(createApiResponse(false, undefined, null, 'SKU or barcode already exists'));
      }
      
      res.status(500).json(createApiResponse(false, undefined, null, 'Failed to create item'));
    }
  }
  
  async updateItem(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Remove id from updates to prevent accidental modification
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
        throw new ServiceError('No valid fields to update', 'INVALID_UPDATE', 400);
      }
      
      setClause.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const result = await db.query(`
        UPDATE jewelry_items 
        SET ${setClause.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        throw new ServiceError('Item not found', 'ITEM_NOT_FOUND', 404);
      }
      
      logger.info('Jewelry item updated', { itemId: id, sku: result.rows[0].sku });
      
      res.json(createApiResponse(true, result.rows[0], 'Item updated successfully'));
      
    } catch (error) {
      logger.error('Update item error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, undefined, null, error.message));
      }
      
      res.status(500).json(createApiResponse(false, undefined, null, 'Failed to update item'));
    }
  }
  
  async deleteItem(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const { id } = req.params;
      const { permanent } = req.query;
      
      let result;
      
      if (permanent === 'true') {
        // Permanent deletion (admin only)
        result = await db.query('DELETE FROM jewelry_items WHERE id = $1 RETURNING sku', [id]);
      } else {
        // Soft deletion
        result = await db.query(`
          UPDATE jewelry_items 
          SET is_available = false, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING sku
        `, [id]);
      }
      
      if (result.rows.length === 0) {
        throw new ServiceError('Item not found', 'ITEM_NOT_FOUND', 404);
      }
      
      logger.info('Jewelry item deleted', { 
        itemId: id, 
        sku: result.rows[0].sku, 
        permanent: permanent === 'true' 
      });
      
      res.json(createApiResponse(true, null, 'Item deleted successfully'));
      
    } catch (error) {
      logger.error('Delete item error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, undefined, null, error.message));
      }
      
      res.status(500).json(createApiResponse(false, undefined, null, 'Failed to delete item'));
    }
  }
  
  async updateStock(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const { id } = req.params;
      const { quantity, operation, reason } = req.body;
      
      if (!['add', 'subtract', 'set'].includes(operation)) {
        throw new ServiceError('Invalid operation. Use add, subtract, or set', 'INVALID_OPERATION', 400);
      }
      
      if (typeof quantity !== 'number' || quantity < 0) {
        throw new ServiceError('Quantity must be a non-negative number', 'INVALID_QUANTITY', 400);
      }
      
      // Get current stock
      const currentResult = await db.query('SELECT stock_quantity, sku FROM jewelry_items WHERE id = $1', [id]);
      
      if (currentResult.rows.length === 0) {
        throw new ServiceError('Item not found', 'ITEM_NOT_FOUND', 404);
      }
      
      const currentStock = currentResult.rows[0].stock_quantity;
      const sku = currentResult.rows[0].sku;
      let newStock;
      
      switch (operation) {
        case 'add':
          newStock = currentStock + quantity;
          break;
        case 'subtract':
          newStock = Math.max(0, currentStock - quantity);
          break;
        case 'set':
          newStock = quantity;
          break;
      }
      
      // Update stock
      const result = await db.query(`
        UPDATE jewelry_items 
        SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [newStock, id]);
      
      // Log stock movement (you might want to create a stock_movements table)
      logger.info('Stock updated', {
        itemId: id,
        sku,
        operation,
        quantity,
        oldStock: currentStock,
        newStock,
        reason
      });
      
      res.json(createApiResponse(true, result.rows[0], 'Stock updated successfully'));
      
    } catch (error) {
      logger.error('Update stock error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, undefined, null, error.message));
      }
      
      res.status(500).json(createApiResponse(false, undefined, null, 'Failed to update stock'));
    }
  }
  
  async getInventoryValuation(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const result = await db.query(`
        SELECT 
          mt.name as metal_name,
          mt.symbol as metal_symbol,
          COUNT(ji.id) as item_count,
          SUM(ji.net_weight * ji.stock_quantity) as total_weight,
          SUM(ji.selling_price * ji.stock_quantity) as total_selling_value,
          SUM(ji.cost_price * ji.stock_quantity) as total_cost_value,
          AVG(mt.current_rate) as current_rate
        FROM jewelry_items ji
        JOIN metal_types mt ON ji.metal_type_id = mt.id
        WHERE ji.is_available = true AND ji.stock_quantity > 0
        GROUP BY mt.id, mt.name, mt.symbol
        ORDER BY total_selling_value DESC
      `);
      
      const totalValuation = await db.query(`
        SELECT 
          COUNT(*) as total_items,
          SUM(ji.selling_price * ji.stock_quantity) as total_selling_value,
          SUM(ji.cost_price * ji.stock_quantity) as total_cost_value,
          SUM(CASE WHEN ji.stock_quantity <= ji.min_stock_level THEN 1 ELSE 0 END) as low_stock_items
        FROM jewelry_items ji
        WHERE ji.is_available = true
      `);
      
      const valuation = {
        summary: totalValuation.rows[0],
        byMetal: result.rows
      };
      
      res.json(createApiResponse(true, valuation, 'Inventory valuation retrieved successfully'));
      
    } catch (error) {
      logger.error('Get inventory valuation error:', error);
      res.status(500).json(createApiResponse(false, undefined, null, 'Failed to get inventory valuation'));
    }
  }
  
  async getLowStockItems(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const result = await db.query(`
        SELECT ji.*, 
               c.name as category_name,
               mt.name as metal_name,
               p.purity_name
        FROM jewelry_items ji
        LEFT JOIN categories c ON ji.category_id = c.id
        LEFT JOIN metal_types mt ON ji.metal_type_id = mt.id
        LEFT JOIN purities p ON ji.purity_id = p.id
        WHERE ji.is_available = true 
        AND ji.stock_quantity <= ji.min_stock_level
        ORDER BY ji.stock_quantity ASC, ji.min_stock_level DESC
      `);
      
      res.json(createApiResponse(true, result.rows, 'Low stock items retrieved successfully'));
      
    } catch (error) {
      logger.error('Get low stock items error:', error);
      res.status(500).json(createApiResponse(false, undefined, null, 'Failed to get low stock items'));
    }
  }
}