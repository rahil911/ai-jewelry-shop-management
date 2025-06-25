import { Pool } from 'pg';
import axios from 'axios';
import { 
  ReturnRequest, 
  CreateReturnRequest,
  ReturnStatus,
  ReturnType,
  ReturnStatusHistory,
  ReturnItem,
  ExchangeItem
} from '@jewelry-shop/shared';
import { logger } from '../utils/logger';
import { NotificationIntegration } from './NotificationIntegration';

export class ReturnService {
  private notificationIntegration: NotificationIntegration;

  constructor(private db: Pool) {
    this.notificationIntegration = new NotificationIntegration(db);
  }

  // Create new return request
  async createReturnRequest(returnData: CreateReturnRequest, requestedBy: number): Promise<ReturnRequest> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Validate that the order exists and is eligible for return
      await this.validateOrderForReturn(returnData.order_id);

      // Calculate return amount
      const returnAmount = await this.calculateReturnAmount(returnData.order_id, returnData.items_to_return);
      
      // Calculate exchange amount difference if it's an exchange
      let exchangeAmountDifference = 0;
      if (returnData.return_type === ReturnType.EXCHANGE && returnData.exchange_items) {
        const exchangeAmount = await this.calculateExchangeAmount(returnData.exchange_items);
        exchangeAmountDifference = exchangeAmount - returnAmount;
      }

      const query = `
        INSERT INTO return_requests (
          order_id, return_type, reason, reason_details, requested_by,
          items_to_return, return_amount, exchange_items, exchange_amount_difference,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        returnData.order_id,
        returnData.return_type,
        returnData.reason,
        returnData.reason_details,
        requestedBy,
        JSON.stringify(returnData.items_to_return),
        returnAmount,
        returnData.exchange_items ? JSON.stringify(returnData.exchange_items) : null,
        exchangeAmountDifference,
        ReturnStatus.REQUESTED
      ];

      const result = await client.query(query, values);
      const returnRequest = result.rows[0];

      await client.query('COMMIT');

      // Send notification to customer
      await this.notificationIntegration.sendReturnUpdate(
        returnRequest.id,
        'requested',
        `Your return request has been submitted and is under review.`
      );

      logger.info(`Return request created: ${returnRequest.id} for order ${returnData.order_id}`);
      return await this.getReturnById(returnRequest.id) as ReturnRequest;

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating return request:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get return by ID with complete details
  async getReturnById(returnId: number): Promise<ReturnRequest | null> {
    const query = `
      SELECT 
        r.*,
        o.order_number,
        o.customer_id,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.email as customer_email,
        c.phone as customer_phone,
        req.first_name as requester_first_name,
        req.last_name as requester_last_name,
        proc.first_name as processor_first_name,
        proc.last_name as processor_last_name
      FROM return_requests r
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN users req ON r.requested_by = req.id
      LEFT JOIN users proc ON r.processed_by = proc.id
      WHERE r.id = $1
    `;

    const result = await this.db.query(query, [returnId]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      order_id: row.order_id,
      return_type: row.return_type,
      reason: row.reason,
      reason_details: row.reason_details,
      requested_by: row.requested_by,
      items_to_return: row.items_to_return || [],
      return_amount: parseFloat(row.return_amount),
      exchange_items: row.exchange_items || [],
      exchange_amount_difference: row.exchange_amount_difference ? parseFloat(row.exchange_amount_difference) : undefined,
      status: row.status,
      processed_by: row.processed_by,
      refund_method: row.refund_method,
      refund_reference: row.refund_reference,
      created_at: row.created_at,
      processed_at: row.processed_at,
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
      requester: {
        first_name: row.requester_first_name,
        last_name: row.requester_last_name
      },
      processor: row.processed_by ? {
        first_name: row.processor_first_name,
        last_name: row.processor_last_name
      } : undefined
    } as ReturnRequest;
  }

  // Get all return requests with filtering
  async getReturnRequests(filters: {
    status?: ReturnStatus;
    return_type?: ReturnType;
    customer_id?: number;
    requested_by?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ returns: ReturnRequest[]; total: number }> {
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
        req.first_name as requester_first_name,
        req.last_name as requester_last_name,
        COUNT(*) OVER() as total_count
      FROM return_requests r
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN users req ON r.requested_by = req.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND r.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.return_type) {
      query += ` AND r.return_type = $${paramIndex}`;
      params.push(filters.return_type);
      paramIndex++;
    }

    if (filters.customer_id) {
      query += ` AND o.customer_id = $${paramIndex}`;
      params.push(filters.customer_id);
      paramIndex++;
    }

    if (filters.requested_by) {
      query += ` AND r.requested_by = $${paramIndex}`;
      params.push(filters.requested_by);
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

    const returns = result.rows.map(row => ({
      id: row.id,
      order_id: row.order_id,
      return_type: row.return_type,
      reason: row.reason,
      reason_details: row.reason_details,
      requested_by: row.requested_by,
      items_to_return: row.items_to_return || [],
      return_amount: parseFloat(row.return_amount),
      exchange_items: row.exchange_items || [],
      exchange_amount_difference: row.exchange_amount_difference ? parseFloat(row.exchange_amount_difference) : undefined,
      status: row.status,
      processed_by: row.processed_by,
      refund_method: row.refund_method,
      refund_reference: row.refund_reference,
      created_at: row.created_at,
      processed_at: row.processed_at,
      order: {
        order_number: row.order_number,
        customer_id: row.customer_id,
        customer: {
          first_name: row.customer_first_name,
          last_name: row.customer_last_name
        }
      },
      requester: {
        first_name: row.requester_first_name,
        last_name: row.requester_last_name
      }
    })) as ReturnRequest[];

    return { returns, total };
  }

  // Approve return request
  async approveReturn(returnId: number, approvedBy: number, notes?: string): Promise<ReturnRequest | null> {
    return await this.updateReturnStatus(returnId, ReturnStatus.APPROVED, approvedBy, notes);
  }

  // Reject return request
  async rejectReturn(returnId: number, rejectedBy: number, reason: string): Promise<ReturnRequest | null> {
    return await this.updateReturnStatus(returnId, ReturnStatus.REJECTED, rejectedBy, reason);
  }

  // Process return (handle refund and inventory)
  async processReturn(returnId: number, processedBy: number, refundMethod: string): Promise<ReturnRequest | null> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      const returnRequest = await this.getReturnById(returnId);
      if (!returnRequest) {
        throw new Error('Return request not found');
      }

      if (returnRequest.status !== ReturnStatus.APPROVED) {
        throw new Error('Return request must be approved before processing');
      }

      // Process refund via Payment Service
      let refundReference = '';
      if (returnRequest.return_amount > 0) {
        refundReference = await this.processRefund(
          returnRequest.order_id, 
          returnRequest.return_amount,
          refundMethod
        );
      }

      // Restore inventory for returned items
      await this.restoreInventory(returnRequest.items_to_return);

      // Process exchange items if it's an exchange
      if (returnRequest.return_type === ReturnType.EXCHANGE && returnRequest.exchange_items) {
        await this.processExchangeItems(returnRequest.exchange_items);
      }

      // Update return status to processed
      const query = `
        UPDATE return_requests 
        SET status = $1, processed_by = $2, processed_at = CURRENT_TIMESTAMP,
            refund_method = $3, refund_reference = $4
        WHERE id = $5
        RETURNING *
      `;

      await client.query(query, [
        ReturnStatus.PROCESSED,
        processedBy,
        refundMethod,
        refundReference,
        returnId
      ]);

      // Create status history entry
      await this.createStatusHistoryEntry(
        returnId, 
        ReturnStatus.PROCESSED, 
        `Return processed. Refund: ${refundMethod}. Reference: ${refundReference}`,
        processedBy
      );

      await client.query('COMMIT');

      // Send notification to customer
      await this.notificationIntegration.sendReturnUpdate(
        returnId,
        'processed',
        `Your return has been processed. Refund will be credited via ${refundMethod}.`
      );

      logger.info(`Return ${returnId} processed by user ${processedBy}`);
      return await this.getReturnById(returnId);

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error processing return:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Update return status
  async updateReturnStatus(returnId: number, newStatus: ReturnStatus, updatedBy: number, notes?: string): Promise<ReturnRequest | null> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      const returnRequest = await this.getReturnById(returnId);
      if (!returnRequest) {
        return null;
      }

      // Validate status transition
      if (!this.isValidStatusTransition(returnRequest.status, newStatus)) {
        throw new Error(`Invalid status transition from ${returnRequest.status} to ${newStatus}`);
      }

      // Update return status
      const query = `
        UPDATE return_requests 
        SET status = $1, processed_by = $2
        WHERE id = $3
        RETURNING *
      `;

      await client.query(query, [newStatus, updatedBy, returnId]);

      // Create status history entry
      await this.createStatusHistoryEntry(returnId, newStatus, notes || '', updatedBy);

      await client.query('COMMIT');

      // Send notification to customer
      await this.notificationIntegration.sendReturnUpdate(returnId, newStatus, notes);

      logger.info(`Return ${returnId} status updated to ${newStatus} by user ${updatedBy}`);
      return await this.getReturnById(returnId);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get return status history
  async getReturnStatusHistory(returnId: number): Promise<ReturnStatusHistory[]> {
    const query = `
      SELECT 
        rsh.*,
        u.first_name as changed_by_first_name,
        u.last_name as changed_by_last_name
      FROM return_status_history rsh
      LEFT JOIN users u ON rsh.changed_by = u.id
      WHERE rsh.return_id = $1
      ORDER BY rsh.changed_at DESC
    `;

    const result = await this.db.query(query, [returnId]);
    return result.rows.map(row => ({
      id: row.id,
      return_id: row.return_id,
      status: row.status,
      notes: row.notes,
      changed_by: row.changed_by,
      changed_at: row.changed_at,
      changed_by_name: `${row.changed_by_first_name} ${row.changed_by_last_name}`
    })) as ReturnStatusHistory[];
  }

  // Private helper methods
  private async validateOrderForReturn(orderId: number): Promise<void> {
    const query = `
      SELECT id, status, created_at 
      FROM orders 
      WHERE id = $1
    `;
    const result = await this.db.query(query, [orderId]);
    
    if (result.rows.length === 0) {
      throw new Error('Order not found');
    }

    const order = result.rows[0];
    
    // Check if order is in a valid state for returns
    const validStatuses = ['completed', 'delivered'];
    if (!validStatuses.includes(order.status)) {
      throw new Error('Order must be completed or delivered to initiate a return');
    }

    // Check return window (example: 30 days)
    const orderDate = new Date(order.created_at);
    const now = new Date();
    const daysDifference = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference > 30) {
      throw new Error('Return window has expired (30 days)');
    }
  }

  private async calculateReturnAmount(orderId: number, itemsToReturn: ReturnItem[]): Promise<number> {
    // Get order items and calculate return amount based on items being returned
    const query = `
      SELECT oi.*, ji.name 
      FROM order_items oi
      LEFT JOIN jewelry_items ji ON oi.jewelry_item_id = ji.id
      WHERE oi.order_id = $1
    `;
    
    const result = await this.db.query(query, [orderId]);
    const orderItems = result.rows;

    let totalReturnAmount = 0;

    for (const returnItem of itemsToReturn) {
      const orderItem = orderItems.find(item => item.id === returnItem.order_item_id);
      if (orderItem) {
        const returnQuantity = Math.min(returnItem.quantity, orderItem.quantity);
        const unitPrice = parseFloat(orderItem.unit_price);
        totalReturnAmount += unitPrice * returnQuantity;
      }
    }

    return totalReturnAmount;
  }

  private async calculateExchangeAmount(exchangeItems: ExchangeItem[]): Promise<number> {
    let totalExchangeAmount = 0;

    for (const item of exchangeItems) {
      totalExchangeAmount += item.unit_price * item.quantity;
    }

    return totalExchangeAmount;
  }

  private async processRefund(orderId: number, amount: number, refundMethod: string): Promise<string> {
    try {
      const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3006';
      
      const response = await axios.post(`${paymentServiceUrl}/api/payments/refund`, {
        order_id: orderId,
        amount: amount,
        refund_method: refundMethod,
        reason: 'Product return'
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data.data.refund_reference || 'REF' + Date.now();
    } catch (error) {
      logger.error('Error processing refund via Payment Service:', error);
      // Return a manual reference for staff to process manually
      return 'MANUAL_REF_' + Date.now();
    }
  }

  private async restoreInventory(itemsToReturn: ReturnItem[]): Promise<void> {
    try {
      const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://inventory-management:3002';

      for (const item of itemsToReturn) {
        // Get the jewelry item ID from order item
        const orderItemQuery = `SELECT jewelry_item_id FROM order_items WHERE id = $1`;
        const result = await this.db.query(orderItemQuery, [item.order_item_id]);
        
        if (result.rows.length > 0) {
          const jewelryItemId = result.rows[0].jewelry_item_id;
          
          await axios.put(`${inventoryServiceUrl}/api/inventory/${jewelryItemId}/stock`, {
            quantity_change: item.quantity
          }, {
            timeout: 5000,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
      }

      logger.info('Inventory restored for returned items');
    } catch (error) {
      logger.error('Error restoring inventory:', error);
      // In a real implementation, you might want to queue this for manual processing
    }
  }

  private async processExchangeItems(exchangeItems: ExchangeItem[]): Promise<void> {
    // Process new items for exchange (reduce inventory)
    try {
      const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://inventory-management:3002';

      for (const item of exchangeItems) {
        await axios.put(`${inventoryServiceUrl}/api/inventory/${item.jewelry_item_id}/stock`, {
          quantity_change: -item.quantity
        }, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      logger.info('Exchange items processed');
    } catch (error) {
      logger.error('Error processing exchange items:', error);
    }
  }

  private async createStatusHistoryEntry(returnId: number, status: ReturnStatus, notes: string, changedBy: number): Promise<void> {
    const query = `
      INSERT INTO return_status_history (return_id, status, notes, changed_by)
      VALUES ($1, $2, $3, $4)
    `;

    await this.db.query(query, [returnId, status, notes, changedBy]);
  }

  private isValidStatusTransition(currentStatus: ReturnStatus, newStatus: ReturnStatus): boolean {
    const validTransitions: { [key in ReturnStatus]: ReturnStatus[] } = {
      [ReturnStatus.REQUESTED]: [ReturnStatus.APPROVED, ReturnStatus.REJECTED, ReturnStatus.CANCELLED],
      [ReturnStatus.APPROVED]: [ReturnStatus.PROCESSED, ReturnStatus.CANCELLED],
      [ReturnStatus.REJECTED]: [ReturnStatus.REQUESTED], // Allow re-requesting after rejection
      [ReturnStatus.PROCESSED]: [ReturnStatus.COMPLETED],
      [ReturnStatus.COMPLETED]: [],
      [ReturnStatus.CANCELLED]: []
    };

    return validTransitions[currentStatus].includes(newStatus);
  }
}