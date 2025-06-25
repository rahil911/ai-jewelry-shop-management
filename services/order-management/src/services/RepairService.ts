import { Pool } from 'pg';
import axios from 'axios';
import { 
  RepairRequest, 
  CreateRepairRequest, 
  UpdateRepairRequest,
  RepairStatus,
  RepairType,
  RepairStatusHistory
} from '@jewelry-shop/shared';
import { logger } from '../utils/logger';
import { NotificationIntegration } from './NotificationIntegration';

export class RepairService {
  private notificationIntegration: NotificationIntegration;

  constructor(private db: Pool) {
    this.notificationIntegration = new NotificationIntegration(db);
  }

  // Create new repair request
  async createRepair(repairData: CreateRepairRequest, createdBy: number): Promise<RepairRequest> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Validate that the order exists and is valid for repair
      await this.validateOrderForRepair(repairData.order_id);

      const query = `
        INSERT INTO repair_requests (
          order_id, item_description, problem_description, repair_type,
          estimated_cost, estimated_completion, customer_approval_required,
          technician_id, repair_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const values = [
        repairData.order_id,
        repairData.item_description,
        repairData.problem_description,
        repairData.repair_type,
        repairData.estimated_cost,
        repairData.estimated_completion,
        repairData.customer_approval_required || false,
        repairData.technician_id,
        RepairStatus.RECEIVED
      ];

      const result = await client.query(query, values);
      const repair = result.rows[0];

      // Create initial status history entry
      await this.createStatusHistoryEntry(repair.id, RepairStatus.RECEIVED, 'Repair request received', createdBy);

      await client.query('COMMIT');

      // Send notification to customer
      await this.notificationIntegration.sendRepairUpdate(
        repair.id, 
        'received', 
        `Your jewelry repair request has been received and is being assessed.`
      );

      logger.info(`Repair request created: ${repair.id} for order ${repairData.order_id}`);
      return await this.getRepairById(repair.id) as RepairRequest;

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating repair request:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get repair by ID with complete details
  async getRepairById(repairId: number): Promise<RepairRequest | null> {
    const query = `
      SELECT 
        r.*,
        o.order_number,
        o.customer_id,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.email as customer_email,
        c.phone as customer_phone,
        t.first_name as technician_first_name,
        t.last_name as technician_last_name
      FROM repair_requests r
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN users t ON r.technician_id = t.id
      WHERE r.id = $1
    `;

    const result = await this.db.query(query, [repairId]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      order_id: row.order_id,
      item_description: row.item_description,
      problem_description: row.problem_description,
      repair_type: row.repair_type,
      estimated_cost: parseFloat(row.estimated_cost),
      estimated_completion: row.estimated_completion,
      actual_cost: row.actual_cost ? parseFloat(row.actual_cost) : undefined,
      repair_notes: row.repair_notes,
      customer_approval_required: row.customer_approval_required,
      customer_approved: row.customer_approved,
      before_photos: row.before_photos || [],
      after_photos: row.after_photos || [],
      repair_status: row.repair_status,
      technician_id: row.technician_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      order: {
        order_number: row.order_number,
        customer_id: row.customer_id,
        customer: {
          first_name: row.customer_first_name,
          last_name: row.customer_last_name,
          email: row.customer_email,
          phone: row.customer_phone
        }
      },
      technician: row.technician_id ? {
        first_name: row.technician_first_name,
        last_name: row.technician_last_name
      } : undefined
    } as RepairRequest;
  }

  // Get all repairs with filtering
  async getRepairs(filters: {
    status?: RepairStatus;
    technician_id?: number;
    customer_id?: number;
    repair_type?: RepairType;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ repairs: RepairRequest[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        r.*,
        o.order_number,
        o.customer_id,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        t.first_name as technician_first_name,
        t.last_name as technician_last_name,
        COUNT(*) OVER() as total_count
      FROM repair_requests r
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN users t ON r.technician_id = t.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND r.repair_status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.technician_id) {
      query += ` AND r.technician_id = $${paramIndex}`;
      params.push(filters.technician_id);
      paramIndex++;
    }

    if (filters.customer_id) {
      query += ` AND o.customer_id = $${paramIndex}`;
      params.push(filters.customer_id);
      paramIndex++;
    }

    if (filters.repair_type) {
      query += ` AND r.repair_type = $${paramIndex}`;
      params.push(filters.repair_type);
      paramIndex++;
    }

    if (filters.date_from) {
      query += ` AND r.created_at >= $${paramIndex}`;
      params.push(filters.date_from);
      paramIndex++;
    }

    if (filters.date_to) {
      query += ` AND r.created_at <= $${paramIndex}`;
      params.push(filters.date_to + ' 23:59:59');
      paramIndex++;
    }

    query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

    const repairs = result.rows.map(row => ({
      id: row.id,
      order_id: row.order_id,
      item_description: row.item_description,
      problem_description: row.problem_description,
      repair_type: row.repair_type,
      estimated_cost: parseFloat(row.estimated_cost),
      estimated_completion: row.estimated_completion,
      actual_cost: row.actual_cost ? parseFloat(row.actual_cost) : undefined,
      repair_notes: row.repair_notes,
      customer_approval_required: row.customer_approval_required,
      customer_approved: row.customer_approved,
      before_photos: row.before_photos || [],
      after_photos: row.after_photos || [],
      repair_status: row.repair_status,
      technician_id: row.technician_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      order: {
        order_number: row.order_number,
        customer_id: row.customer_id,
        customer: {
          first_name: row.customer_first_name,
          last_name: row.customer_last_name
        }
      },
      technician: row.technician_id ? {
        first_name: row.technician_first_name,
        last_name: row.technician_last_name
      } : undefined
    })) as RepairRequest[];

    return { repairs, total };
  }

  // Update repair details
  async updateRepair(repairId: number, updateData: UpdateRepairRequest, updatedBy: number): Promise<RepairRequest | null> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Check if repair exists
      const currentRepair = await this.getRepairById(repairId);
      if (!currentRepair) {
        return null;
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updateData.repair_type !== undefined) {
        updateFields.push(`repair_type = $${paramIndex}`);
        values.push(updateData.repair_type);
        paramIndex++;
      }

      if (updateData.estimated_cost !== undefined) {
        updateFields.push(`estimated_cost = $${paramIndex}`);
        values.push(updateData.estimated_cost);
        paramIndex++;
      }

      if (updateData.estimated_completion !== undefined) {
        updateFields.push(`estimated_completion = $${paramIndex}`);
        values.push(updateData.estimated_completion);
        paramIndex++;
      }

      if (updateData.actual_cost !== undefined) {
        updateFields.push(`actual_cost = $${paramIndex}`);
        values.push(updateData.actual_cost);
        paramIndex++;
      }

      if (updateData.repair_notes !== undefined) {
        updateFields.push(`repair_notes = $${paramIndex}`);
        values.push(updateData.repair_notes);
        paramIndex++;
      }

      if (updateData.customer_approved !== undefined) {
        updateFields.push(`customer_approved = $${paramIndex}`);
        values.push(updateData.customer_approved);
        paramIndex++;
      }

      if (updateData.technician_id !== undefined) {
        updateFields.push(`technician_id = $${paramIndex}`);
        values.push(updateData.technician_id);
        paramIndex++;
      }

      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        
        const query = `
          UPDATE repair_requests 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;
        values.push(repairId);

        await client.query(query, values);
      }

      await client.query('COMMIT');

      // Send notification if significant changes were made
      if (updateData.estimated_cost || updateData.estimated_completion || updateData.customer_approved !== undefined) {
        await this.notificationIntegration.sendRepairUpdate(
          repairId,
          currentRepair.repair_status,
          'Your repair request has been updated with new information.'
        );
      }

      return await this.getRepairById(repairId);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Update repair status
  async updateRepairStatus(repairId: number, newStatus: RepairStatus, notes: string, updatedBy: number): Promise<RepairRequest | null> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      const repair = await this.getRepairById(repairId);
      if (!repair) {
        return null;
      }

      // Validate status transition
      if (!this.isValidStatusTransition(repair.repair_status, newStatus)) {
        throw new Error(`Invalid status transition from ${repair.repair_status} to ${newStatus}`);
      }

      // Update repair status
      const query = `
        UPDATE repair_requests 
        SET repair_status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      await client.query(query, [newStatus, repairId]);

      // Create status history entry
      await this.createStatusHistoryEntry(repairId, newStatus, notes, updatedBy);

      await client.query('COMMIT');

      // Send notification to customer
      await this.notificationIntegration.sendRepairUpdate(repairId, newStatus, notes);

      logger.info(`Repair ${repairId} status updated to ${newStatus} by user ${updatedBy}`);
      return await this.getRepairById(repairId);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Upload repair photos
  async uploadRepairPhotos(repairId: number, photos: string[], photoType: 'before' | 'after'): Promise<void> {
    const field = photoType === 'before' ? 'before_photos' : 'after_photos';
    
    const query = `
      UPDATE repair_requests 
      SET ${field} = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    await this.db.query(query, [JSON.stringify(photos), repairId]);

    logger.info(`${photoType} photos uploaded for repair ${repairId}`);
  }

  // Get repair photos
  async getRepairPhotos(repairId: number): Promise<{ before_photos: string[]; after_photos: string[] }> {
    const query = `SELECT before_photos, after_photos FROM repair_requests WHERE id = $1`;
    const result = await this.db.query(query, [repairId]);
    
    if (result.rows.length === 0) {
      return { before_photos: [], after_photos: [] };
    }

    const row = result.rows[0];
    return {
      before_photos: row.before_photos || [],
      after_photos: row.after_photos || []
    };
  }

  // Get repair status history
  async getRepairStatusHistory(repairId: number): Promise<RepairStatusHistory[]> {
    const query = `
      SELECT 
        rsh.*,
        u.first_name as changed_by_first_name,
        u.last_name as changed_by_last_name
      FROM repair_status_history rsh
      LEFT JOIN users u ON rsh.changed_by = u.id
      WHERE rsh.repair_id = $1
      ORDER BY rsh.changed_at DESC
    `;

    const result = await this.db.query(query, [repairId]);
    return result.rows.map(row => ({
      id: row.id,
      repair_id: row.repair_id,
      status: row.status,
      notes: row.notes,
      photos: row.photos || [],
      changed_by: row.changed_by,
      changed_at: row.changed_at,
      changed_by_name: `${row.changed_by_first_name} ${row.changed_by_last_name}`
    })) as RepairStatusHistory[];
  }

  // Get repair queue for technicians
  async getRepairQueue(technicianId?: number): Promise<RepairRequest[]> {
    let query = `
      SELECT 
        r.*,
        o.order_number,
        o.customer_id,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name
      FROM repair_requests r
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN users c ON o.customer_id = c.id
      WHERE r.repair_status IN ('received', 'assessed', 'approved', 'in_progress')
    `;

    const params: any[] = [];
    if (technicianId) {
      query += ` AND r.technician_id = $1`;
      params.push(technicianId);
    }

    query += ` ORDER BY r.estimated_completion ASC, r.created_at ASC`;

    const result = await this.db.query(query, params);
    return result.rows.map(row => ({
      id: row.id,
      order_id: row.order_id,
      item_description: row.item_description,
      problem_description: row.problem_description,
      repair_type: row.repair_type,
      estimated_cost: parseFloat(row.estimated_cost),
      estimated_completion: row.estimated_completion,
      actual_cost: row.actual_cost ? parseFloat(row.actual_cost) : undefined,
      repair_notes: row.repair_notes,
      customer_approval_required: row.customer_approval_required,
      customer_approved: row.customer_approved,
      before_photos: row.before_photos || [],
      after_photos: row.after_photos || [],
      repair_status: row.repair_status,
      technician_id: row.technician_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      order: {
        order_number: row.order_number,
        customer_id: row.customer_id,
        customer: {
          first_name: row.customer_first_name,
          last_name: row.customer_last_name
        }
      }
    })) as RepairRequest[];
  }

  // Private helper methods
  private async validateOrderForRepair(orderId: number): Promise<void> {
    const query = `SELECT id, status FROM orders WHERE id = $1`;
    const result = await this.db.query(query, [orderId]);
    
    if (result.rows.length === 0) {
      throw new Error('Order not found');
    }

    // Add any business rules for valid repair orders here
    // For example, only allow repairs for completed orders
  }

  private async createStatusHistoryEntry(repairId: number, status: RepairStatus, notes: string, changedBy: number): Promise<void> {
    const query = `
      INSERT INTO repair_status_history (repair_id, status, notes, changed_by)
      VALUES ($1, $2, $3, $4)
    `;

    await this.db.query(query, [repairId, status, notes, changedBy]);
  }

  private isValidStatusTransition(currentStatus: RepairStatus, newStatus: RepairStatus): boolean {
    const validTransitions: { [key in RepairStatus]: RepairStatus[] } = {
      [RepairStatus.RECEIVED]: [RepairStatus.ASSESSED, RepairStatus.CANCELLED],
      [RepairStatus.ASSESSED]: [RepairStatus.APPROVED, RepairStatus.CANCELLED],
      [RepairStatus.APPROVED]: [RepairStatus.IN_PROGRESS, RepairStatus.CANCELLED],
      [RepairStatus.IN_PROGRESS]: [RepairStatus.COMPLETED, RepairStatus.CANCELLED],
      [RepairStatus.COMPLETED]: [RepairStatus.READY_FOR_PICKUP],
      [RepairStatus.READY_FOR_PICKUP]: [RepairStatus.DELIVERED],
      [RepairStatus.DELIVERED]: [],
      [RepairStatus.CANCELLED]: []
    };

    return validTransitions[currentStatus].includes(newStatus);
  }
}