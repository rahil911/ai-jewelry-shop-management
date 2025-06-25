import { Request, Response } from 'express';
import { Pool } from 'pg';
import { RepairService } from '../services/RepairService';
import { logger } from '../utils/logger';
import { 
  CreateRepairRequest, 
  UpdateRepairRequest,
  RepairStatus,
  RepairType
} from '@jewelry-shop/shared';

export class RepairController {
  private repairService: RepairService;

  constructor(db: Pool) {
    this.repairService = new RepairService(db);
  }

  // Get all repair requests with filtering
  async getRepairs(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        technician_id,
        customer_id,
        repair_type,
        date_from,
        date_to
      } = req.query;

      // Create clean filters object with only defined values
      const filters: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };
      
      if (status) filters.status = status as RepairStatus;
      if (technician_id) filters.technician_id = parseInt(technician_id as string);
      if (customer_id) filters.customer_id = parseInt(customer_id as string);
      if (repair_type) filters.repair_type = repair_type as RepairType;
      if (date_from) filters.date_from = date_from as string;
      if (date_to) filters.date_to = date_to as string;

      const result = await this.repairService.getRepairs(filters);

      res.json({
        success: true,
        data: result.repairs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit as string))
        }
      });
    } catch (error) {
      logger.error('Error fetching repairs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch repairs',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get single repair by ID
  async getRepairById(req: Request, res: Response): Promise<void> {
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

      const repair = await this.repairService.getRepairById(repairId);

      if (!repair) {
        res.status(404).json({
          success: false,
          error: 'Repair not found'
        });
        return;
      }

      res.json({
        success: true,
        data: repair
      });
    } catch (error) {
      logger.error('Error fetching repair:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch repair',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Create new repair request
  async createRepair(req: Request, res: Response): Promise<void> {
    try {
      const repairData = req.body as CreateRepairRequest;
      const userId = (req as any).user.id;

      const repair = await this.repairService.createRepair(repairData, userId);

      logger.info(`Repair request created: ${repair.id} for order ${repairData.order_id} by user ${userId}`);

      res.status(201).json({
        success: true,
        data: repair,
        message: 'Repair request created successfully'
      });
    } catch (error) {
      logger.error('Error creating repair request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create repair request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update repair details
  async updateRepair(req: Request, res: Response): Promise<void> {
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
      const updateData = req.body as UpdateRepairRequest;
      const userId = (req as any).user.id;

      if (isNaN(repairId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid repair ID'
        });
        return;
      }

      const updatedRepair = await this.repairService.updateRepair(repairId, updateData, userId);

      if (!updatedRepair) {
        res.status(404).json({
          success: false,
          error: 'Repair not found'
        });
        return;
      }

      logger.info(`Repair updated: ${repairId} by user ${userId}`);

      res.json({
        success: true,
        data: updatedRepair,
        message: 'Repair updated successfully'
      });
    } catch (error) {
      logger.error('Error updating repair:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update repair',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update repair status
  async updateRepairStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Repair ID is required'
        });
        return;
      }
      
      const repairId = parseInt(id);
      const userId = (req as any).user.id;

      if (isNaN(repairId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid repair ID'
        });
        return;
      }

      if (!status || !Object.values(RepairStatus).includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Valid status is required'
        });
        return;
      }

      const updatedRepair = await this.repairService.updateRepairStatus(repairId, status, notes || '', userId);

      if (!updatedRepair) {
        res.status(404).json({
          success: false,
          error: 'Repair not found'
        });
        return;
      }

      logger.info(`Repair status updated: ${repairId} -> ${status} by user ${userId}`);

      res.json({
        success: true,
        data: updatedRepair,
        message: 'Repair status updated successfully'
      });
    } catch (error) {
      logger.error('Error updating repair status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update repair status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Upload repair photos
  async uploadRepairPhotos(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { photos, photo_type } = req.body;
      
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

      if (!photos || !Array.isArray(photos)) {
        res.status(400).json({
          success: false,
          error: 'Photos array is required'
        });
        return;
      }

      if (!photo_type || !['before', 'after'].includes(photo_type)) {
        res.status(400).json({
          success: false,
          error: 'Valid photo_type (before/after) is required'
        });
        return;
      }

      await this.repairService.uploadRepairPhotos(repairId, photos, photo_type);

      logger.info(`${photo_type} photos uploaded for repair ${repairId}`);

      res.json({
        success: true,
        message: `${photo_type} photos uploaded successfully`
      });
    } catch (error) {
      logger.error('Error uploading repair photos:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload repair photos',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get repair photos
  async getRepairPhotos(req: Request, res: Response): Promise<void> {
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

      const photos = await this.repairService.getRepairPhotos(repairId);

      res.json({
        success: true,
        data: photos
      });
    } catch (error) {
      logger.error('Error fetching repair photos:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch repair photos',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get repair status history
  async getRepairStatusHistory(req: Request, res: Response): Promise<void> {
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

      const history = await this.repairService.getRepairStatusHistory(repairId);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Error fetching repair status history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch repair status history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get repair queue for technicians
  async getRepairQueue(req: Request, res: Response): Promise<void> {
    try {
      const { technician_id } = req.query;
      
      const technicianId = technician_id ? parseInt(technician_id as string) : undefined;

      const queue = await this.repairService.getRepairQueue(technicianId);

      res.json({
        success: true,
        data: queue
      });
    } catch (error) {
      logger.error('Error fetching repair queue:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch repair queue',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update repair assessment
  async updateRepairAssessment(req: Request, res: Response): Promise<void> {
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
      const userId = (req as any).user.id;

      if (isNaN(repairId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid repair ID'
        });
        return;
      }

      const updateData = {
        estimated_cost: req.body.estimated_cost,
        estimated_completion: req.body.estimated_completion,
        repair_notes: req.body.repair_notes,
        customer_approval_required: req.body.customer_approval_required
      };

      const updatedRepair = await this.repairService.updateRepair(repairId, updateData, userId);

      if (!updatedRepair) {
        res.status(404).json({
          success: false,
          error: 'Repair not found'
        });
        return;
      }

      // Update status to assessed if it was received
      if (updatedRepair.repair_status === RepairStatus.RECEIVED) {
        await this.repairService.updateRepairStatus(repairId, RepairStatus.ASSESSED, 'Repair assessed', userId);
      }

      logger.info(`Repair assessment updated: ${repairId} by user ${userId}`);

      res.json({
        success: true,
        data: updatedRepair,
        message: 'Repair assessment updated successfully'
      });
    } catch (error) {
      logger.error('Error updating repair assessment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update repair assessment',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Customer approval for repair
  async approveRepair(req: Request, res: Response): Promise<void> {
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
      const userId = (req as any).user.id;

      if (isNaN(repairId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid repair ID'
        });
        return;
      }

      const updateData = {
        customer_approved: true
      };

      const updatedRepair = await this.repairService.updateRepair(repairId, updateData, userId);

      if (!updatedRepair) {
        res.status(404).json({
          success: false,
          error: 'Repair not found'
        });
        return;
      }

      // Update status to approved
      await this.repairService.updateRepairStatus(repairId, RepairStatus.APPROVED, 'Repair approved by customer', userId);

      logger.info(`Repair approved: ${repairId} by user ${userId}`);

      res.json({
        success: true,
        data: updatedRepair,
        message: 'Repair approved successfully'
      });
    } catch (error) {
      logger.error('Error approving repair:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to approve repair',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}