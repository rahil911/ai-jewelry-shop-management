import { Request, Response } from 'express';
import { Pool } from 'pg';
import { createApiResponse, ServiceError } from '@jewelry-shop/shared';
import { logger } from '../utils/logger';

export class MakingChargesController {
  async getMakingCharges(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const result = await db.query(`
        SELECT mcc.*, 
               c.name as category_name,
               p.purity_name,
               mt.name as metal_name
        FROM making_charges_config mcc
        LEFT JOIN categories c ON mcc.category_id = c.id
        LEFT JOIN purities p ON mcc.purity_id = p.id
        LEFT JOIN metal_types mt ON p.metal_type_id = mt.id
        WHERE mcc.is_active = true
        ORDER BY c.name, p.purity_name
      `);
      
      res.json(createApiResponse(true, result.rows, 'Making charges retrieved successfully'));
      
    } catch (error) {
      logger.error('Get making charges error:', error);
      res.status(500).json(createApiResponse(false, null, null, 'Failed to retrieve making charges'));
    }
  }
  
  async getMakingChargesByCategory(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const { categoryId } = req.params;
      
      const result = await db.query(`
        SELECT * FROM making_charges_config
        WHERE category_id = $1 AND is_active = true
        ORDER BY purity_id
      `, [categoryId]);
      
      res.json(createApiResponse(true, result.rows));
      
    } catch (error) {
      logger.error('Get making charges by category error:', error);
      res.status(500).json(createApiResponse(false, null, null, 'Failed to retrieve making charges'));
    }
  }
  
  async getMakingChargesByPurity(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const { purityId } = req.params;
      
      const result = await db.query(`
        SELECT * FROM making_charges_config
        WHERE purity_id = $1 AND is_active = true
        ORDER BY category_id
      `, [purityId]);
      
      res.json(createApiResponse(true, result.rows));
      
    } catch (error) {
      logger.error('Get making charges by purity error:', error);
      res.status(500).json(createApiResponse(false, null, null, 'Failed to retrieve making charges'));
    }
  }
  
  async createMakingChargesConfig(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const {
        categoryId,
        purityId,
        chargeType,
        rateValue,
        minimumCharge,
        maximumCharge,
        weightRangeMin,
        weightRangeMax,
        effectiveFrom,
        effectiveTo
      } = req.body;
      
      const result = await db.query(`
        INSERT INTO making_charges_config 
        (category_id, purity_id, charge_type, rate_value, minimum_charge, 
         maximum_charge, weight_range_min, weight_range_max, effective_from, effective_to)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        categoryId, purityId, chargeType, rateValue, minimumCharge,
        maximumCharge, weightRangeMin, weightRangeMax, effectiveFrom, effectiveTo
      ]);
      
      logger.info('Making charges configuration created', { configId: result.rows[0].id });
      res.status(201).json(createApiResponse(true, result.rows[0], 'Making charges configuration created'));
      
    } catch (error) {
      logger.error('Create making charges config error:', error);
      res.status(500).json(createApiResponse(false, null, null, 'Failed to create making charges configuration'));
    }
  }
  
  async updateMakingChargesConfig(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const setClause = [];
      const values = [];
      let paramCount = 1;
      
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && key !== 'id') {
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
        UPDATE making_charges_config 
        SET ${setClause.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        throw new ServiceError('Making charges configuration not found', 'NOT_FOUND', 404);
      }
      
      logger.info('Making charges configuration updated', { configId: id });
      res.json(createApiResponse(true, result.rows[0], 'Making charges configuration updated'));
      
    } catch (error) {
      logger.error('Update making charges config error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, null, null, error.message));
      }
      
      res.status(500).json(createApiResponse(false, null, null, 'Failed to update making charges configuration'));
    }
  }
  
  async deleteMakingChargesConfig(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const { id } = req.params;
      
      const result = await db.query(`
        UPDATE making_charges_config 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
      `, [id]);
      
      if (result.rows.length === 0) {
        throw new ServiceError('Making charges configuration not found', 'NOT_FOUND', 404);
      }
      
      logger.info('Making charges configuration deleted', { configId: id });
      res.json(createApiResponse(true, null, 'Making charges configuration deleted'));
      
    } catch (error) {
      logger.error('Delete making charges config error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, null, null, error.message));
      }
      
      res.status(500).json(createApiResponse(false, null, null, 'Failed to delete making charges configuration'));
    }
  }
}