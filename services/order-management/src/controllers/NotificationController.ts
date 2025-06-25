import { Request, Response } from 'express';
import { Pool } from 'pg';
import { NotificationIntegration } from '../services/NotificationIntegration';
import { logger } from '../utils/logger';
import { NotificationChannel } from '@jewelry-shop/shared';

export class NotificationController {
  private notificationIntegration: NotificationIntegration;

  constructor(db: Pool) {
    this.notificationIntegration = new NotificationIntegration(db);
  }

  // Send custom notification
  async sendCustomNotification(req: Request, res: Response): Promise<void> {
    try {
      const { customer_id, order_id, message, channels } = req.body;

      if (!customer_id || !message || !channels || !Array.isArray(channels)) {
        res.status(400).json({
          success: false,
          error: 'customer_id, message, and channels array are required'
        });
        return;
      }

      // Validate channels
      const validChannels = channels.filter(channel => 
        Object.values(NotificationChannel).includes(channel)
      );

      if (validChannels.length === 0) {
        res.status(400).json({
          success: false,
          error: 'At least one valid channel is required'
        });
        return;
      }

      await this.notificationIntegration.sendCustomNotification(
        customer_id, 
        message, 
        validChannels, 
        order_id
      );

      logger.info(`Custom notification sent to customer ${customer_id} via ${validChannels.join(', ')}`);

      res.json({
        success: true,
        message: 'Notification sent successfully'
      });
    } catch (error) {
      logger.error('Error sending custom notification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send notification',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get order notification history
  async getOrderNotificationHistory(req: Request, res: Response): Promise<void> {
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

      const history = await this.notificationIntegration.getNotificationHistory(orderId);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Error fetching order notification history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notification history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get repair notification history
  async getRepairNotificationHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Repair ID is required'
        });
        return;
      }
      
      const repairId = parseInt(id);

      if (isNaN(repairId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid repair ID'
        });
        return;
      }

      const history = await this.notificationIntegration.getRepairNotificationHistory(repairId);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Error fetching repair notification history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notification history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get return notification history
  async getReturnNotificationHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Return ID is required'
        });
        return;
      }
      
      const returnId = parseInt(id);

      if (isNaN(returnId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid return ID'
        });
        return;
      }

      const history = await this.notificationIntegration.getReturnNotificationHistory(returnId);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Error fetching return notification history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notification history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get notification templates
  async getNotificationTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { notification_type, channel, language } = req.query;

      let query = `
        SELECT * FROM notification_templates 
        WHERE is_active = true
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (notification_type) {
        query += ` AND notification_type = $${paramIndex}`;
        params.push(notification_type);
        paramIndex++;
      }

      if (channel) {
        query += ` AND channel = $${paramIndex}`;
        params.push(channel);
        paramIndex++;
      }

      if (language) {
        query += ` AND language = $${paramIndex}`;
        params.push(language);
        paramIndex++;
      }

      query += ` ORDER BY notification_type, channel, language`;

      const result = await this.notificationIntegration['db'].query(query, params);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      logger.error('Error fetching notification templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notification templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update notification template
  async updateNotificationTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Template ID is required'
        });
        return;
      }
      
      const templateId = parseInt(id);
      const { subject, template, is_active } = req.body;

      if (isNaN(templateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid template ID'
        });
        return;
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (subject !== undefined) {
        updateFields.push(`subject = $${paramIndex}`);
        values.push(subject);
        paramIndex++;
      }

      if (template !== undefined) {
        updateFields.push(`template = $${paramIndex}`);
        values.push(template);
        paramIndex++;
      }

      if (is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`);
        values.push(is_active);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No fields to update'
        });
        return;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const query = `
        UPDATE notification_templates 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      values.push(templateId);

      const result = await this.notificationIntegration['db'].query(query, values);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Template not found'
        });
        return;
      }

      logger.info(`Notification template updated: ${templateId}`);

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Template updated successfully'
      });
    } catch (error) {
      logger.error('Error updating notification template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update template',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}