import { Pool } from 'pg';
import axios from 'axios';
import { 
  JewelryOrder, 
  OrderItem, 
  CreateOrderRequest, 
  UpdateOrderRequest, 
  OrderStatus, 
  OrderType,
  CustomizationRequest,
  OrderFilters,
  OrderStats
} from '@jewelry-shop/shared';
import { logger } from '../utils/logger';
import { NotificationIntegration } from './NotificationIntegration';

export class OrderService {
  private notificationIntegration: NotificationIntegration;

  constructor(private db: Pool) {
    this.notificationIntegration = new NotificationIntegration(db);
  }

  // Generate unique order number
  private generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-6);
    return `ORD${year}${month}${day}${timestamp}`;
  }

  // Get orders with filtering and pagination
  async getOrders(
    page: number, 
    limit: number, 
    filters: OrderFilters
  ): Promise<{ orders: JewelryOrder[]; total: number }> {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        o.*,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.email as customer_email,
        c.phone as customer_phone,
        u.first_name as staff_first_name,
        u.last_name as staff_last_name,
        COUNT(*) OVER() as total_count
      FROM orders o
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN users u ON o.staff_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters.status) {
      query += ` AND o.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.customer_id) {
      query += ` AND o.customer_id = $${paramIndex}`;
      params.push(filters.customer_id);
      paramIndex++;
    }

    if (filters.staff_id) {
      query += ` AND o.staff_id = $${paramIndex}`;
      params.push(filters.staff_id);
      paramIndex++;
    }

    if (filters.order_type) {
      query += ` AND o.order_type = $${paramIndex}`;
      params.push(filters.order_type);
      paramIndex++;
    }

    if (filters.date_from) {
      query += ` AND o.created_at >= $${paramIndex}`;
      params.push(filters.date_from);
      paramIndex++;
    }

    if (filters.date_to) {
      query += ` AND o.created_at <= $${paramIndex}`;
      params.push(filters.date_to + ' 23:59:59');
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (
        o.order_number ILIKE $${paramIndex} OR
        c.first_name ILIKE $${paramIndex} OR
        c.last_name ILIKE $${paramIndex} OR
        c.email ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

    // Get order items for each order
    const orders: JewelryOrder[] = [];
    for (const row of result.rows) {
      const orderItems = await this.getOrderItems(row.id);
      const order: JewelryOrder = {
        id: row.id,
        order_number: row.order_number,
        customer_id: row.customer_id,
        staff_id: row.staff_id,
        status: row.status,
        order_type: row.order_type,
        subtotal: parseFloat(row.subtotal),
        making_charges: parseFloat(row.making_charges),
        wastage_amount: parseFloat(row.wastage_amount),
        gst_amount: parseFloat(row.gst_amount),
        total_amount: parseFloat(row.total_amount),
        special_instructions: row.special_instructions,
        estimated_completion: row.estimated_completion,
        created_at: row.created_at,
        updated_at: row.updated_at,
        items: orderItems,
        customer: {
          first_name: row.customer_first_name,
          last_name: row.customer_last_name,
          email: row.customer_email,
          phone: row.customer_phone
        },
        staff: {
          first_name: row.staff_first_name,
          last_name: row.staff_last_name
        }
      };
      orders.push(order);
    }

    return { orders, total };
  }

  // Get single order by ID
  async getOrderById(orderId: number): Promise<JewelryOrder | null> {
    const query = `
      SELECT 
        o.*,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        u.first_name as staff_first_name,
        u.last_name as staff_last_name
      FROM orders o
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN users u ON o.staff_id = u.id
      WHERE o.id = $1
    `;

    const result = await this.db.query(query, [orderId]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const orderItems = await this.getOrderItems(orderId);

    return {
      id: row.id,
      order_number: row.order_number,
      customer_id: row.customer_id,
      staff_id: row.staff_id,
      status: row.status,
      order_type: row.order_type,
      subtotal: parseFloat(row.subtotal),
      making_charges: parseFloat(row.making_charges),
      wastage_amount: parseFloat(row.wastage_amount),
      gst_amount: parseFloat(row.gst_amount),
      total_amount: parseFloat(row.total_amount),
      special_instructions: row.special_instructions,
      estimated_completion: row.estimated_completion,
      created_at: row.created_at,
      updated_at: row.updated_at,
      items: orderItems,
      customer: {
        first_name: row.customer_first_name,
        last_name: row.customer_last_name,
        email: row.customer_email,
        phone: row.customer_phone,
        address: row.customer_address
      },
      staff: {
        first_name: row.staff_first_name,
        last_name: row.staff_last_name
      }
    };
  }

  // Get order items for an order
  private async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const query = `
      SELECT 
        oi.*,
        ji.name as item_name,
        ji.sku as item_sku,
        ji.images as item_images,
        mt.name as metal_name,
        p.purity_name,
        c.name as category_name
      FROM order_items oi
      LEFT JOIN jewelry_items ji ON oi.jewelry_item_id = ji.id
      LEFT JOIN metal_types mt ON ji.metal_type_id = mt.id
      LEFT JOIN purities p ON ji.purity_id = p.id
      LEFT JOIN categories c ON ji.category_id = c.id
      WHERE oi.order_id = $1
      ORDER BY oi.id
    `;

    const result = await this.db.query(query, [orderId]);
    return result.rows.map(row => ({
      id: row.id,
      order_id: row.order_id,
      jewelry_item_id: row.jewelry_item_id,
      quantity: row.quantity,
      unit_price: parseFloat(row.unit_price),
      customization_details: row.customization_details,
      total_price: parseFloat(row.total_price),
      item: {
        name: row.item_name,
        sku: row.item_sku,
        images: row.item_images,
        metal_name: row.metal_name,
        purity_name: row.purity_name,
        category_name: row.category_name
      }
    }));
  }

  // Create new order
  async createOrder(orderData: CreateOrderRequest): Promise<JewelryOrder> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Generate order number
      const orderNumber = this.generateOrderNumber();

      // Calculate order totals by calling pricing service
      const orderTotals = await this.calculateOrderTotals(orderData.items);

      // Insert order
      const orderQuery = `
        INSERT INTO orders (
          order_number, customer_id, staff_id, status, order_type,
          subtotal, making_charges, wastage_amount, gst_amount, total_amount,
          special_instructions, estimated_completion
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const orderValues = [
        orderNumber,
        orderData.customer_id,
        orderData.staff_id,
        OrderStatus.PENDING,
        orderData.order_type || OrderType.SALE,
        orderTotals.subtotal,
        orderTotals.making_charges,
        orderTotals.wastage_amount,
        orderTotals.gst_amount,
        orderTotals.total_amount,
        orderData.special_instructions,
        orderData.estimated_completion
      ];

      const orderResult = await client.query(orderQuery, orderValues);
      const order = orderResult.rows[0];

      // Insert order items
      for (const item of orderData.items) {
        const itemQuery = `
          INSERT INTO order_items (
            order_id, jewelry_item_id, quantity, unit_price, 
            customization_details, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `;

        const itemTotal = item.quantity * item.unit_price;
        await client.query(itemQuery, [
          order.id,
          item.jewelry_item_id,
          item.quantity,
          item.unit_price,
          item.customization_details,
          itemTotal
        ]);

        // Update inventory stock
        await this.updateInventoryStock(item.jewelry_item_id, -item.quantity);
      }

      await client.query('COMMIT');

      // Send order creation notification
      await this.notificationIntegration.sendOrderCreatedNotification(order.id);

      // Return complete order details
      return await this.getOrderById(order.id) as JewelryOrder;

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating order:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Calculate order totals using pricing service
  private async calculateOrderTotals(items: OrderItem[]): Promise<{
    subtotal: number;
    making_charges: number;
    wastage_amount: number;
    gst_amount: number;
    total_amount: number;
  }> {
    try {
      const pricingServiceUrl = process.env.PRICING_SERVICE_URL || 'http://pricing-service:3003';
      const response = await axios.post(`${pricingServiceUrl}/api/pricing/calculate-order-total`, {
        items
      });

      return response.data.data;
    } catch (error) {
      logger.error('Error calculating order totals:', error);
      // Fallback calculation
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const making_charges = subtotal * 0.10; // 10% making charges
      const wastage_amount = subtotal * 0.02; // 2% wastage
      const gst_amount = (subtotal + making_charges + wastage_amount) * 0.03; // 3% GST
      const total_amount = subtotal + making_charges + wastage_amount + gst_amount;

      return {
        subtotal,
        making_charges,
        wastage_amount,
        gst_amount,
        total_amount
      };
    }
  }

  // Update inventory stock
  private async updateInventoryStock(jewelryItemId: number, quantityChange: number): Promise<void> {
    try {
      const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://inventory-management:3002';
      await axios.put(`${inventoryServiceUrl}/api/inventory/${jewelryItemId}/stock`, {
        quantity_change: quantityChange
      });
    } catch (error) {
      logger.error('Error updating inventory stock:', error);
      // In a real implementation, you might want to handle this differently
      // For now, we'll log the error but not fail the order creation
    }
  }

  // Update order
  async updateOrder(orderId: number, updateData: UpdateOrderRequest, userId: number): Promise<JewelryOrder | null> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Check if order exists and can be updated
      const checkQuery = 'SELECT * FROM orders WHERE id = $1';
      const checkResult = await client.query(checkQuery, [orderId]);
      
      if (checkResult.rows.length === 0) {
        return null;
      }

      const currentOrder = checkResult.rows[0];
      
      // Only allow updates if order is in pending or confirmed status
      if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(currentOrder.status)) {
        throw new Error('Order cannot be updated in current status');
      }

      // Update order
      const updateQuery = `
        UPDATE orders SET
          special_instructions = COALESCE($1, special_instructions),
          estimated_completion = COALESCE($2, estimated_completion),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;

      await client.query(updateQuery, [
        updateData.special_instructions,
        updateData.estimated_completion,
        orderId
      ]);

      await client.query('COMMIT');

      return await this.getOrderById(orderId);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Update order status
  async updateOrderStatus(orderId: number, status: OrderStatus, notes: string, userId: number): Promise<JewelryOrder | null> {
    const query = `
      UPDATE orders SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await this.db.query(query, [status, orderId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    // Log status change
    const logQuery = `
      INSERT INTO order_status_history (order_id, status, notes, changed_by, changed_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    `;
    
    await this.db.query(logQuery, [orderId, status, notes, userId]);

    // Send status change notification
    await this.notificationIntegration.sendOrderStatusUpdate(orderId, status, notes);

    return await this.getOrderById(orderId);
  }

  // Add customization request
  async addCustomization(orderId: number, customizationData: CustomizationRequest, userId: number): Promise<any> {
    const query = `
      INSERT INTO customizations (
        order_item_id, customization_type, details, additional_cost, created_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await this.db.query(query, [
      customizationData.order_item_id,
      customizationData.customization_type,
      customizationData.details,
      customizationData.additional_cost || 0,
      userId
    ]);

    return result.rows[0];
  }

  // Get order statistics
  async getOrderStats(dateFrom?: string, dateTo?: string): Promise<OrderStats> {
    const conditions = [];
    const params: any[] = [];

    if (dateFrom) {
      conditions.push(`created_at >= $${params.length + 1}`);
      params.push(dateFrom);
    }

    if (dateTo) {
      conditions.push(`created_at <= $${params.length + 1}`);
      params.push(dateTo + ' 23:59:59');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_order_value
      FROM orders ${whereClause}
    `;

    const result = await this.db.query(query, params);
    const row = result.rows[0];

    return {
      total_orders: parseInt(row.total_orders),
      pending_orders: parseInt(row.pending_orders),
      confirmed_orders: parseInt(row.confirmed_orders),
      in_progress_orders: parseInt(row.in_progress_orders),
      completed_orders: parseInt(row.completed_orders),
      cancelled_orders: parseInt(row.cancelled_orders),
      total_revenue: parseFloat(row.total_revenue),
      average_order_value: parseFloat(row.average_order_value)
    };
  }

  // Cancel order
  async cancelOrder(orderId: number, reason: string, userId: number): Promise<JewelryOrder | null> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Check if order can be cancelled
      const checkQuery = 'SELECT * FROM orders WHERE id = $1';
      const checkResult = await client.query(checkQuery, [orderId]);
      
      if (checkResult.rows.length === 0) {
        return null;
      }

      const order = checkResult.rows[0];
      
      // Only allow cancellation if order is pending or confirmed
      if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
        throw new Error('Order cannot be cancelled in current status');
      }

      // Update order status
      const updateQuery = `
        UPDATE orders SET
          status = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;

      await client.query(updateQuery, [OrderStatus.CANCELLED, orderId]);

      // Log cancellation
      const logQuery = `
        INSERT INTO order_status_history (order_id, status, notes, changed_by, changed_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `;
      
      await client.query(logQuery, [orderId, OrderStatus.CANCELLED, reason, userId]);

      // Restore inventory stock
      const itemsQuery = 'SELECT jewelry_item_id, quantity FROM order_items WHERE order_id = $1';
      const itemsResult = await client.query(itemsQuery, [orderId]);
      
      for (const item of itemsResult.rows) {
        await this.updateInventoryStock(item.jewelry_item_id, item.quantity);
      }

      await client.query('COMMIT');

      return await this.getOrderById(orderId);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}