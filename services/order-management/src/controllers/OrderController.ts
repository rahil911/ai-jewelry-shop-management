import { Request, Response } from 'express';
import { Pool } from 'pg';
import { OrderService } from '../services/OrderService';
import { InvoiceService } from '../services/InvoiceService';
import { logger } from '../utils/logger';
import { 
  CreateOrderRequest, 
  UpdateOrderRequest, 
  OrderStatus, 
  OrderType,
  JewelryOrder,
  OrderItem,
  CustomizationRequest
} from '@jewelry-shop/shared';

export class OrderController {
  private orderService: OrderService;
  private invoiceService: InvoiceService;

  constructor(db: Pool) {
    this.orderService = new OrderService(db);
    this.invoiceService = new InvoiceService(db);
  }

  // Get all orders with filtering and pagination
  async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        customer_id,
        staff_id,
        order_type,
        date_from,
        date_to,
        search
      } = req.query;

      // Create clean filters object with only defined values
      const filters: any = {};
      
      if (status) filters.status = status as OrderStatus;
      if (customer_id) filters.customer_id = parseInt(customer_id as string);
      if (staff_id) filters.staff_id = parseInt(staff_id as string);
      if (order_type) filters.order_type = order_type as OrderType;
      if (date_from) filters.date_from = date_from as string;
      if (date_to) filters.date_to = date_to as string;
      if (search) filters.search = search as string;

      const result = await this.orderService.getOrders(
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );

      res.json({
        success: true,
        data: result.orders,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit as string))
        }
      });
    } catch (error) {
      logger.error('Error fetching orders:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch orders',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get single order by ID
  async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
        return;
      }
      
      const orderId = parseInt(id);

      if (isNaN(orderId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        });
        return;
      }

      const order = await this.orderService.getOrderById(orderId);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Order not found'
        });
        return;
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      logger.error('Error fetching order:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch order',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Create new order
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderData = req.body as CreateOrderRequest;
      const userId = (req as any).user.id;

      // Validate order data
      if (!orderData.customer_id || !orderData.items || orderData.items.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Customer ID and order items are required'
        });
        return;
      }

      // Set staff_id from authenticated user
      orderData.staff_id = userId;

      const order = await this.orderService.createOrder(orderData);

      logger.info(`Order created: ${order.order_number} by user ${userId}`);

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully'
      });
    } catch (error) {
      logger.error('Error creating order:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create order',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update existing order
  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
        return;
      }
      
      const orderId = parseInt(id);
      const updateData = req.body as UpdateOrderRequest;
      const userId = (req as any).user.id;

      if (isNaN(orderId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        });
        return;
      }

      const updatedOrder = await this.orderService.updateOrder(orderId, updateData, userId);

      if (!updatedOrder) {
        res.status(404).json({
          success: false,
          error: 'Order not found'
        });
        return;
      }

      logger.info(`Order updated: ${updatedOrder.order_number} by user ${userId}`);

      res.json({
        success: true,
        data: updatedOrder,
        message: 'Order updated successfully'
      });
    } catch (error) {
      logger.error('Error updating order:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update order',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update order status
  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
        return;
      }
      
      const orderId = parseInt(id);
      const userId = (req as any).user.id;

      if (isNaN(orderId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        });
        return;
      }

      if (!status || !Object.values(OrderStatus).includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Valid status is required'
        });
        return;
      }

      const updatedOrder = await this.orderService.updateOrderStatus(orderId, status, notes, userId);

      if (!updatedOrder) {
        res.status(404).json({
          success: false,
          error: 'Order not found'
        });
        return;
      }

      logger.info(`Order status updated: ${updatedOrder.order_number} -> ${status} by user ${userId}`);

      res.json({
        success: true,
        data: updatedOrder,
        message: 'Order status updated successfully'
      });
    } catch (error) {
      logger.error('Error updating order status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update order status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Add customization request to order
  async addCustomization(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const customizationData = req.body as CustomizationRequest;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
        return;
      }
      
      const orderId = parseInt(id);
      const userId = (req as any).user.id;

      if (isNaN(orderId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        });
        return;
      }

      const customization = await this.orderService.addCustomization(orderId, customizationData, userId);

      logger.info(`Customization added to order ${orderId} by user ${userId}`);

      res.status(201).json({
        success: true,
        data: customization,
        message: 'Customization request added successfully'
      });
    } catch (error) {
      logger.error('Error adding customization:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add customization',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Generate invoice for order
  async generateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
        return;
      }
      
      const orderId = parseInt(id);

      if (isNaN(orderId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        });
        return;
      }

      const order = await this.orderService.getOrderById(orderId);
      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Order not found'
        });
        return;
      }

      const invoicePdf = await this.invoiceService.generateInvoice(order);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.order_number}.pdf`);
      res.send(invoicePdf);

      logger.info(`Invoice generated for order: ${order.order_number}`);
    } catch (error) {
      logger.error('Error generating invoice:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate invoice',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get order statistics
  async getOrderStats(req: Request, res: Response): Promise<void> {
    try {
      const { date_from, date_to } = req.query;

      const stats = await this.orderService.getOrderStats(
        date_from as string,
        date_to as string
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching order stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch order statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Cancel order
  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
        return;
      }
      
      const orderId = parseInt(id);
      const userId = (req as any).user.id;

      if (isNaN(orderId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        });
        return;
      }

      const cancelledOrder = await this.orderService.cancelOrder(orderId, reason, userId);

      if (!cancelledOrder) {
        res.status(404).json({
          success: false,
          error: 'Order not found or cannot be cancelled'
        });
        return;
      }

      logger.info(`Order cancelled: ${cancelledOrder.order_number} by user ${userId}`);

      res.json({
        success: true,
        data: cancelledOrder,
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      logger.error('Error cancelling order:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel order',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}