import { Request, Response } from 'express';
import { Pool } from 'pg';
import { createApiResponse, createPaginatedResponse, ServiceError } from '@jewelry-shop/shared';
import { logger } from '../utils/logger';

export class UserController {
  async getAllUsers(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const role = req.query.role as string;
      
      let query = `
        SELECT id, email, first_name, last_name, role, phone, 
               preferred_language, is_active, created_at, updated_at
        FROM users 
        WHERE 1=1
      `;
      const params: any[] = [];
      
      if (role) {
        query += ` AND role = $${params.length + 1}`;
        params.push(role);
      }
      
      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as total FROM users WHERE 1=1 ${role ? 'AND role = $1' : ''}`,
        role ? [role] : []
      );
      const total = parseInt(countResult.rows[0].total);
      
      // Get paginated results
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      const result = await db.query(query, params);
      
      res.json(createPaginatedResponse(result.rows, page, limit, total));
      
    } catch (error) {
      logger.error('Get all users error:', error);
      res.status(500).json(createApiResponse(false, null, null, 'Internal server error'));
    }
  }
  
  async getUserById(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const { id } = req.params;
      const currentUserId = req.user?.userId;
      const currentUserRole = req.user?.role;
      
      // Users can only view their own profile unless they're admin/manager
      if (id !== currentUserId && !['owner', 'manager'].includes(currentUserRole)) {
        throw new ServiceError('Access denied', 'ACCESS_DENIED', 403);
      }
      
      const result = await db.query(
        `SELECT id, email, first_name, last_name, role, phone, 
                preferred_language, is_active, created_at, updated_at
         FROM users WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        throw new ServiceError('User not found', 'USER_NOT_FOUND', 404);
      }
      
      res.json(createApiResponse(true, result.rows[0]));
      
    } catch (error) {
      logger.error('Get user by ID error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, null, null, error.message));
      }
      
      res.status(500).json(createApiResponse(false, null, null, 'Internal server error'));
    }
  }
  
  async updateUser(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const { id } = req.params;
      const currentUserId = req.user?.userId;
      const currentUserRole = req.user?.role;
      const updates = req.body;
      
      // Users can only update their own profile unless they're admin/manager
      if (id !== currentUserId && !['owner', 'manager'].includes(currentUserRole)) {
        throw new ServiceError('Access denied', 'ACCESS_DENIED', 403);
      }
      
      // Only owners can change roles
      if (updates.role && currentUserRole !== 'owner') {
        throw new ServiceError('Only owners can change user roles', 'INSUFFICIENT_PERMISSIONS', 403);
      }
      
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
      
      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);
      
      const query = `
        UPDATE users 
        SET ${setClause.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, email, first_name, last_name, role, phone, 
                 preferred_language, is_active, created_at, updated_at
      `;
      
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        throw new ServiceError('User not found', 'USER_NOT_FOUND', 404);
      }
      
      logger.info(`User updated: ${result.rows[0].email}`, { userId: id, updatedBy: currentUserId });
      
      res.json(createApiResponse(true, result.rows[0], 'User updated successfully'));
      
    } catch (error) {
      logger.error('Update user error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, null, null, error.message));
      }
      
      res.status(500).json(createApiResponse(false, null, null, 'Internal server error'));
    }
  }
  
  async deactivateUser(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const { id } = req.params;
      const currentUserId = req.user?.userId;
      
      // Prevent self-deactivation
      if (id === currentUserId) {
        throw new ServiceError('Cannot deactivate your own account', 'INVALID_OPERATION', 400);
      }
      
      const result = await db.query(
        `UPDATE users 
         SET is_active = false, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING email`,
        [id]
      );
      
      if (result.rows.length === 0) {
        throw new ServiceError('User not found', 'USER_NOT_FOUND', 404);
      }
      
      logger.info(`User deactivated: ${result.rows[0].email}`, { userId: id, deactivatedBy: currentUserId });
      
      res.json(createApiResponse(true, null, 'User deactivated successfully'));
      
    } catch (error) {
      logger.error('Deactivate user error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, null, null, error.message));
      }
      
      res.status(500).json(createApiResponse(false, null, null, 'Internal server error'));
    }
  }
  
  async getUserCustomers(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const { id } = req.params;
      
      const result = await db.query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.phone,
                c.loyalty_points, c.total_purchases, c.created_at as customer_since
         FROM users u
         JOIN customers c ON u.id = c.user_id
         WHERE u.role = 'customer' AND u.is_active = true
         ORDER BY c.total_purchases DESC`,
        []
      );
      
      res.json(createApiResponse(true, result.rows));
      
    } catch (error) {
      logger.error('Get user customers error:', error);
      res.status(500).json(createApiResponse(false, null, null, 'Internal server error'));
    }
  }
}