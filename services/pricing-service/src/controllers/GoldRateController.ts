import { Request, Response } from 'express';
import { GoldRateService } from '../services/GoldRateService';
import { createApiResponse, ServiceError } from '@jewelry-shop/shared';
import { logger } from '../utils/logger';

export class GoldRateController {
  async getCurrentRates(req: Request, res: Response) {
    try {
      const goldRateService: GoldRateService = req.app.locals.goldRateService;
      const rates = await goldRateService.getCurrentRates();
      
      res.json(createApiResponse(true, rates, 'Current gold rates retrieved successfully'));
      
    } catch (error) {
      logger.error('Get current rates error:', error);
      res.status(500).json(createApiResponse(false, undefined, null, 'Failed to retrieve current rates'));
    }
  }
  
  async getGoldRateHistory(req: Request, res: Response) {
    try {
      const goldRateService: GoldRateService = req.app.locals.goldRateService;
      const days = parseInt(req.query.days as string) || 30;
      
      const history = await goldRateService.getGoldRateHistory(days);
      
      res.json(createApiResponse(true, history, `Gold rate history for ${days} days retrieved successfully`));
      
    } catch (error) {
      logger.error('Get gold rate history error:', error);
      res.status(500).json(createApiResponse(false, undefined, null, 'Failed to retrieve gold rate history'));
    }
  }
  
  async updateGoldRates(req: Request, res: Response) {
    try {
      const goldRateService: GoldRateService = req.app.locals.goldRateService;
      
      await goldRateService.updateGoldRates();
      
      logger.info('Gold rates updated via API call');
      res.json(createApiResponse(true, null, 'Gold rates updated successfully'));
      
    } catch (error) {
      logger.error('Update gold rates error:', error);
      
      if (error.message.includes('Failed to fetch')) {
        return res.status(503).json(createApiResponse(false, undefined, null, 'External gold rate API unavailable'));
      }
      
      res.status(500).json(createApiResponse(false, undefined, null, 'Failed to update gold rates'));
    }
  }
  
  async manualRateUpdate(req: Request, res: Response) {
    try {
      const { metalType, ratePerGram, source } = req.body;
      
      if (!metalType || !ratePerGram || !source) {
        throw new ServiceError('Metal type, rate per gram, and source are required', 'VALIDATION_ERROR', 400);
      }
      
      const goldRateService: GoldRateService = req.app.locals.goldRateService;
      const db = req.app.locals.db;
      
      // Update the rate manually
      await db.query(
        'UPDATE metal_types SET current_rate = $1, rate_source = $2, last_updated = CURRENT_TIMESTAMP WHERE symbol = $3',
        [ratePerGram, source, metalType]
      );
      
      // Add to history
      const metalTypeResult = await db.query('SELECT id FROM metal_types WHERE symbol = $1', [metalType]);
      if (metalTypeResult.rows.length > 0) {
        await db.query(
          'INSERT INTO gold_rates_history (metal_type_id, rate_per_gram, rate_source) VALUES ($1, $2, $3)',
          [metalTypeResult.rows[0].id, ratePerGram, `Manual - ${source}`]
        );
      }
      
      logger.info(`Manual rate update: ${metalType} = ${ratePerGram} from ${source}`);
      res.json(createApiResponse(true, null, 'Rate updated manually'));
      
    } catch (error) {
      logger.error('Manual rate update error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, undefined, null, error.message));
      }
      
      res.status(500).json(createApiResponse(false, undefined, null, 'Failed to update rate manually'));
    }
  }
}