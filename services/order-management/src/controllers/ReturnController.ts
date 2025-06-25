import { Request, Response } from 'express';
import { Pool } from 'pg';
import { ReturnService } from '../services/ReturnService';
import { logger } from '../utils/logger';
import { 
  CreateReturnRequest,
  ReturnStatus,
  ReturnType
} from '@jewelry-shop/shared';

export class ReturnController {
  private returnService: ReturnService;

  constructor(db: Pool) {
    this.returnService = new ReturnService(db);
  }

  // Get all return requests with filtering
  async getReturnRequests(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        return_type,
        customer_id,
        requested_by,
        date_from,
        date_to
      } = req.query;

      // Create clean filters object with only defined values
      const filters: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };
      
      if (status) filters.status = status as ReturnStatus;
      if (return_type) filters.return_type = return_type as ReturnType;
      if (customer_id) filters.customer_id = parseInt(customer_id as string);
      if (requested_by) filters.requested_by = parseInt(requested_by as string);
      if (date_from) filters.date_from = date_from as string;
      if (date_to) filters.date_to = date_to as string;

      const result = await this.returnService.getReturnRequests(filters);

      res.json({
        success: true,
        data: result.returns,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit as string))
        }
      });
    } catch (error) {
      logger.error('Error fetching return requests:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch return requests',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get single return by ID
  async getReturnById(req: Request, res: Response): Promise<void> {
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

      const returnRequest = await this.returnService.getReturnById(returnId);

      if (!returnRequest) {
        res.status(404).json({
          success: false,
          error: 'Return request not found'
        });
        return;
      }

      res.json({
        success: true,
        data: returnRequest
      });
    } catch (error) {
      logger.error('Error fetching return request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch return request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Create new return request
  async createReturnRequest(req: Request, res: Response): Promise<void> {
    try {
      const returnData = req.body as CreateReturnRequest;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
        return;
      }

      const returnRequest = await this.returnService.createReturnRequest(returnData, userId);

      logger.info(`Return request created: ${returnRequest.id} for order ${returnData.order_id} by user ${userId}`);

      res.status(201).json({
        success: true,
        data: returnRequest,
        message: 'Return request created successfully'
      });
    } catch (error) {
      logger.error('Error creating return request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create return request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Approve return request
  async approveReturn(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Return ID is required'
        });
        return;
      }
      
      const returnId = parseInt(id);
      const userId = (req as any).user?.id;

      if (isNaN(returnId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid return ID'
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
        return;
      }

      const updatedReturn = await this.returnService.approveReturn(returnId, userId, notes);

      if (!updatedReturn) {
        res.status(404).json({
          success: false,
          error: 'Return request not found'
        });
        return;
      }

      logger.info(`Return approved: ${returnId} by user ${userId}`);

      res.json({
        success: true,
        data: updatedReturn,
        message: 'Return request approved successfully'
      });
    } catch (error) {
      logger.error('Error approving return request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to approve return request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Reject return request
  async rejectReturn(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Return ID is required'
        });
        return;
      }
      
      const returnId = parseInt(id);
      const userId = (req as any).user?.id;

      if (isNaN(returnId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid return ID'
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
        return;
      }

      if (!reason) {
        res.status(400).json({
          success: false,
          error: 'Rejection reason is required'
        });
        return;
      }

      const updatedReturn = await this.returnService.rejectReturn(returnId, userId, reason);

      if (!updatedReturn) {
        res.status(404).json({
          success: false,
          error: 'Return request not found'
        });
        return;
      }

      logger.info(`Return rejected: ${returnId} by user ${userId}`);

      res.json({
        success: true,
        data: updatedReturn,
        message: 'Return request rejected successfully'
      });
    } catch (error) {
      logger.error('Error rejecting return request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reject return request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Process return
  async processReturn(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { refund_method } = req.body;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Return ID is required'
        });
        return;
      }
      
      const returnId = parseInt(id);
      const userId = (req as any).user?.id;

      if (isNaN(returnId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid return ID'
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
        return;
      }

      if (!refund_method) {
        res.status(400).json({
          success: false,
          error: 'Refund method is required'
        });
        return;
      }

      const processedReturn = await this.returnService.processReturn(returnId, userId, refund_method);

      if (!processedReturn) {
        res.status(404).json({
          success: false,
          error: 'Return request not found or cannot be processed'
        });
        return;
      }

      logger.info(`Return processed: ${returnId} by user ${userId}`);

      res.json({
        success: true,
        data: processedReturn,
        message: 'Return processed successfully'
      });
    } catch (error) {
      logger.error('Error processing return:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process return',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update return status
  async updateReturnStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Return ID is required'
        });
        return;
      }
      
      const returnId = parseInt(id);
      const userId = (req as any).user?.id;

      if (isNaN(returnId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid return ID'
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
        return;
      }

      if (!status || !Object.values(ReturnStatus).includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Valid status is required'
        });
        return;
      }

      const updatedReturn = await this.returnService.updateReturnStatus(returnId, status, userId, notes);

      if (!updatedReturn) {
        res.status(404).json({
          success: false,
          error: 'Return request not found'
        });
        return;
      }

      logger.info(`Return status updated: ${returnId} -> ${status} by user ${userId}`);

      res.json({
        success: true,
        data: updatedReturn,
        message: 'Return status updated successfully'
      });
    } catch (error) {
      logger.error('Error updating return status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update return status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get return status history
  async getReturnStatusHistory(req: Request, res: Response): Promise<void> {
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

      const history = await this.returnService.getReturnStatusHistory(returnId);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Error fetching return status history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch return status history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}