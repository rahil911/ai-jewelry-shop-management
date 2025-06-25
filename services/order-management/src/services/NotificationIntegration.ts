import { Pool } from 'pg';
import axios from 'axios';
import { 
  NotificationRequest, 
  NotificationTemplateData, 
  NotificationType, 
  NotificationChannel,
  OrderNotification,
  JewelryOrder,
  RepairRequest,
  ReturnRequest
} from '@jewelry-shop/shared';
import { logger } from '../utils/logger';

export class NotificationIntegration {
  constructor(private db: Pool) {}

  // Send order status change notification
  async sendOrderStatusUpdate(orderId: number, newStatus: string, customMessage?: string): Promise<void> {
    try {
      // Get order details
      const order = await this.getOrderDetails(orderId);
      if (!order) {
        logger.error(`Order not found for notification: ${orderId}`);
        return;
      }

      const templateData: NotificationTemplateData = {
        order_number: order.order_number,
        status: newStatus,
        customer_name: `${order.customer?.first_name} ${order.customer?.last_name}`,
        total_amount: order.total_amount
      };
      
      // Add optional fields only if they exist
      if (order.estimated_completion) {
        templateData.estimated_completion = new Date(order.estimated_completion).toLocaleDateString();
      }
      if (customMessage) {
        templateData.custom_message = customMessage;
      }

      await this.sendNotification({
        customer_id: order.customer_id,
        order_id: orderId,
        notification_type: NotificationType.STATUS_CHANGE,
        channels: [NotificationChannel.WHATSAPP, NotificationChannel.SMS],
        template_data: templateData
      });

      logger.info(`Order status notification sent for order ${order.order_number}`);
    } catch (error) {
      logger.error('Error sending order status notification:', error);
    }
  }

  // Send order creation notification
  async sendOrderCreatedNotification(orderId: number): Promise<void> {
    try {
      const order = await this.getOrderDetails(orderId);
      if (!order) return;

      const templateData: NotificationTemplateData = {
        order_number: order.order_number,
        customer_name: `${order.customer?.first_name} ${order.customer?.last_name}`,
        total_amount: order.total_amount
      };
      
      // Add optional fields only if they exist
      if (order.estimated_completion) {
        templateData.estimated_completion = new Date(order.estimated_completion).toLocaleDateString();
      }

      await this.sendNotification({
        customer_id: order.customer_id,
        order_id: orderId,
        notification_type: NotificationType.ORDER_CREATED,
        channels: [NotificationChannel.WHATSAPP, NotificationChannel.SMS, NotificationChannel.EMAIL],
        template_data: templateData
      });

      logger.info(`Order creation notification sent for order ${order.order_number}`);
    } catch (error) {
      logger.error('Error sending order creation notification:', error);
    }
  }

  // Send repair update notification
  async sendRepairUpdate(repairId: number, status: string, customMessage?: string): Promise<void> {
    try {
      const repair = await this.getRepairDetails(repairId);
      if (!repair) return;

      const order = await this.getOrderDetails(repair.order_id);
      if (!order) return;

      const templateData: NotificationTemplateData = {
        order_number: order.order_number,
        status: status,
        repair_type: repair.repair_type,
        customer_name: `${order.customer?.first_name} ${order.customer?.last_name}`
      };
      
      // Add optional fields only if they exist
      if (customMessage) {
        templateData.custom_message = customMessage;
      }

      await this.sendNotification({
        customer_id: order.customer_id,
        repair_id: repairId,
        notification_type: NotificationType.REPAIR_UPDATE,
        channels: [NotificationChannel.WHATSAPP, NotificationChannel.SMS],
        template_data: templateData
      });

      logger.info(`Repair update notification sent for repair ${repairId}`);
    } catch (error) {
      logger.error('Error sending repair update notification:', error);
    }
  }

  // Send return update notification
  async sendReturnUpdate(returnId: number, status: string, customMessage?: string): Promise<void> {
    try {
      const returnRequest = await this.getReturnDetails(returnId);
      if (!returnRequest) return;

      const order = await this.getOrderDetails(returnRequest.order_id);
      if (!order) return;

      const templateData: NotificationTemplateData = {
        order_number: order.order_number,
        status: status,
        return_reason: returnRequest.reason,
        customer_name: `${order.customer?.first_name} ${order.customer?.last_name}`
      };
      
      // Add optional fields only if they exist
      if (customMessage) {
        templateData.custom_message = customMessage;
      }

      await this.sendNotification({
        customer_id: order.customer_id,
        return_id: returnId,
        notification_type: NotificationType.RETURN_UPDATE,
        channels: [NotificationChannel.WHATSAPP, NotificationChannel.SMS, NotificationChannel.EMAIL],
        template_data: templateData
      });

      logger.info(`Return update notification sent for return ${returnId}`);
    } catch (error) {
      logger.error('Error sending return update notification:', error);
    }
  }

  // Send custom notification
  async sendCustomNotification(
    customerId: number, 
    message: string, 
    channels: NotificationChannel[],
    orderId?: number
  ): Promise<void> {
    try {
      let customerName = 'Customer';
      
      // Get customer name if we have an order
      if (orderId) {
        const order = await this.getOrderDetails(orderId);
        if (order?.customer) {
          customerName = `${order.customer.first_name} ${order.customer.last_name}`;
        }
      }

      const templateData: NotificationTemplateData = {
        customer_name: customerName,
        custom_message: message
      };

      const notificationRequest: any = {
        customer_id: customerId,
        notification_type: NotificationType.CUSTOM_MESSAGE,
        channels: channels,
        template_data: templateData
      };
      
      // Add order_id only if it exists
      if (orderId) {
        notificationRequest.order_id = orderId;
      }
      
      await this.sendNotification(notificationRequest);

      logger.info(`Custom notification sent to customer ${customerId}`);
    } catch (error) {
      logger.error('Error sending custom notification:', error);
    }
  }

  // Core notification sending method
  private async sendNotification(request: NotificationRequest): Promise<void> {
    try {
      // Store notification record
      const notificationId = await this.storeNotification(request);

      // Get notification templates for each channel
      const templates = await this.getNotificationTemplates(
        request.notification_type, 
        request.channels
      );

      // Send to notification service
      const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3008';
      
      for (const channel of request.channels) {
        try {
          const template = templates.find(t => t.channel === channel);
          if (!template) {
            logger.warn(`No template found for ${request.notification_type} on ${channel}`);
            continue;
          }

          const payload = {
            customer_id: request.customer_id,
            channel: channel,
            template: template.template,
            subject: template.subject,
            template_data: request.template_data,
            notification_id: notificationId
          };

          const response = await axios.post(`${notificationServiceUrl}/api/notifications/send`, payload, {
            timeout: 5000,
            headers: {
              'Content-Type': 'application/json'
            }
          });

          // Update delivery status
          await this.updateDeliveryStatus(notificationId, channel, 'sent');
          
          logger.info(`Notification sent via ${channel} for customer ${request.customer_id}`);
        } catch (channelError) {
          logger.error(`Failed to send notification via ${channel}:`, channelError);
          await this.updateDeliveryStatus(notificationId, channel, 'failed');
        }
      }

      // Mark notification as sent
      await this.markNotificationSent(notificationId);

    } catch (error) {
      logger.error('Error in sendNotification:', error);
      throw error;
    }
  }

  // Store notification record in database
  private async storeNotification(request: NotificationRequest): Promise<number> {
    const query = `
      INSERT INTO order_notifications (
        order_id, repair_id, return_id, customer_id, notification_type, 
        channels, template_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await this.db.query(query, [
      request.order_id,
      request.repair_id,
      request.return_id,
      request.customer_id,
      request.notification_type,
      request.channels,
      JSON.stringify(request.template_data)
    ]);

    return result.rows[0].id;
  }

  // Get notification templates from database
  private async getNotificationTemplates(type: NotificationType, channels: NotificationChannel[]) {
    const query = `
      SELECT * FROM notification_templates 
      WHERE notification_type = $1 AND channel = ANY($2) AND is_active = true
    `;

    const result = await this.db.query(query, [type, channels]);
    return result.rows;
  }

  // Update delivery status for a specific channel
  private async updateDeliveryStatus(notificationId: number, channel: NotificationChannel, status: string): Promise<void> {
    const query = `
      UPDATE order_notifications 
      SET delivery_status = delivery_status || $1
      WHERE id = $2
    `;

    const statusUpdate = JSON.stringify({ [channel]: status });
    await this.db.query(query, [statusUpdate, notificationId]);
  }

  // Mark notification as sent
  private async markNotificationSent(notificationId: number): Promise<void> {
    const query = `
      UPDATE order_notifications 
      SET sent_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await this.db.query(query, [notificationId]);
  }

  // Get order details for notifications
  private async getOrderDetails(orderId: number): Promise<JewelryOrder | null> {
    const query = `
      SELECT 
        o.*,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.email as customer_email,
        c.phone as customer_phone
      FROM orders o
      LEFT JOIN users c ON o.customer_id = c.id
      WHERE o.id = $1
    `;

    const result = await this.db.query(query, [orderId]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      ...row,
      customer: {
        first_name: row.customer_first_name,
        last_name: row.customer_last_name,
        email: row.customer_email,
        phone: row.customer_phone
      }
    } as JewelryOrder;
  }

  // Get repair details for notifications
  private async getRepairDetails(repairId: number): Promise<RepairRequest | null> {
    const query = `SELECT * FROM repair_requests WHERE id = $1`;
    const result = await this.db.query(query, [repairId]);
    return result.rows.length > 0 ? result.rows[0] as RepairRequest : null;
  }

  // Get return details for notifications
  private async getReturnDetails(returnId: number): Promise<ReturnRequest | null> {
    const query = `SELECT * FROM return_requests WHERE id = $1`;
    const result = await this.db.query(query, [returnId]);
    return result.rows.length > 0 ? result.rows[0] as ReturnRequest : null;
  }

  // Get notification history for an order
  async getNotificationHistory(orderId: number): Promise<OrderNotification[]> {
    const query = `
      SELECT * FROM order_notifications 
      WHERE order_id = $1 
      ORDER BY created_at DESC
    `;

    const result = await this.db.query(query, [orderId]);
    return result.rows as OrderNotification[];
  }

  // Get notification history for a repair
  async getRepairNotificationHistory(repairId: number): Promise<OrderNotification[]> {
    const query = `
      SELECT * FROM order_notifications 
      WHERE repair_id = $1 
      ORDER BY created_at DESC
    `;

    const result = await this.db.query(query, [repairId]);
    return result.rows as OrderNotification[];
  }

  // Get notification history for a return
  async getReturnNotificationHistory(returnId: number): Promise<OrderNotification[]> {
    const query = `
      SELECT * FROM order_notifications 
      WHERE return_id = $1 
      ORDER BY created_at DESC
    `;

    const result = await this.db.query(query, [returnId]);
    return result.rows as OrderNotification[];
  }
}