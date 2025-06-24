import { Request, Response } from 'express';
import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import { 
  createApiResponse, 
  ServiceError,
  GoldRate,
  MakingCharge,
  PricingCalculation
} from '@jewelry-shop/shared';
import { logger } from '../utils/logger';
import axios from 'axios';

export class PricingController {
  
  // Get current gold rates
  async getCurrentGoldRates(req: Request, res: Response) {
    const redis: RedisClientType = req.app.locals.redis;
    
    try {
      // Check Redis cache first
      const cachedRates = await redis.get('gold_rates:current');
      if (cachedRates) {
        const rates = JSON.parse(cachedRates);
        return res.json(createApiResponse(true, rates, 'Current gold rates retrieved from cache'));
      }
      
      // Fetch from external APIs if not in cache
      const goldRates = await this.fetchGoldRatesFromAPIs();
      
      // Cache for 5 minutes
      await redis.setEx('gold_rates:current', 300, JSON.stringify(goldRates));
      
      logger.info('Gold rates fetched and cached successfully');
      res.json(createApiResponse(true, goldRates, 'Current gold rates retrieved'));
      
    } catch (error) {
      logger.error('Error fetching gold rates:', error);
      res.status(500).json(createApiResponse(false, undefined, 'Failed to fetch gold rates'));
    }
  }
  
  // Get historical gold rates
  async getGoldRatesHistory(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const { days = 30 } = req.query;
      
      const query = `
        SELECT * FROM gold_rates_history 
        WHERE recorded_at >= NOW() - INTERVAL '${days} days'
        ORDER BY recorded_at DESC
      `;
      
      const result = await db.query(query);
      
      res.json(createApiResponse(true, result.rows, 'Historical gold rates retrieved'));
      
    } catch (error) {
      logger.error('Error fetching gold rates history:', error);
      res.status(500).json(createApiResponse(false, undefined, 'Failed to fetch gold rates history'));
    }
  }
  
  // Calculate item price
  async calculateItemPrice(req: Request, res: Response) {
    try {
      const { 
        metalType, 
        purity, 
        weight, 
        category, 
        makingChargeType = 'percentage',
        makingChargeValue = 10,
        wastagePercentage = 2,
        gstRate = 3
      } = req.body;
      
      if (!metalType || !purity || !weight) {
        return res.status(400).json(
          createApiResponse(false, undefined, 'Metal type, purity, and weight are required')
        );
      }
      
      // Get current gold rate
      const currentRates = await this.getCurrentGoldRateFromCache();
      const baseRate = currentRates.gold_24k; // Use 24K as base
      
      // Calculate purity factor
      const purityFactor = this.getPurityFactor(purity);
      const adjustedRate = baseRate * purityFactor;
      
      // Calculate base price
      const basePrice = adjustedRate * weight;
      
      // Calculate making charges
      let makingCharges = 0;
      if (makingChargeType === 'percentage') {
        makingCharges = basePrice * (makingChargeValue / 100);
      } else {
        makingCharges = makingChargeValue * weight;
      }
      
      // Calculate wastage
      const wastageAmount = basePrice * (wastagePercentage / 100);
      
      // Calculate subtotal
      const subtotal = basePrice + makingCharges + wastageAmount;
      
      // Calculate GST
      const gstAmount = subtotal * (gstRate / 100);
      
      // Calculate total
      const totalPrice = subtotal + gstAmount;
      
      const calculation: PricingCalculation = {
        metalType,
        purity,
        weight,
        baseRate: adjustedRate,
        basePrice,
        makingCharges,
        wastageAmount,
        subtotal,
        gstAmount,
        totalPrice,
        breakdown: {
          basePrice,
          makingCharges,
          wastageAmount,
          gstAmount
        }
      };
      
      logger.info('Price calculated successfully', { calculation });
      res.json(createApiResponse(true, calculation, 'Price calculated successfully'));
      
    } catch (error) {
      logger.error('Error calculating item price:', error);
      res.status(500).json(createApiResponse(false, undefined, 'Failed to calculate item price'));
    }
  }
  
  // Get making charges configuration
  async getMakingCharges(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const query = `
        SELECT mc.*, c.name as category_name, p.purity_name
        FROM making_charges_config mc
        LEFT JOIN categories c ON mc.category_id = c.id
        LEFT JOIN purities p ON mc.purity_id = p.id
        ORDER BY c.name, p.purity_name
      `;
      
      const result = await db.query(query);
      
      res.json(createApiResponse(true, result.rows, 'Making charges retrieved'));
      
    } catch (error) {
      logger.error('Error fetching making charges:', error);
      res.status(500).json(createApiResponse(false, undefined, 'Failed to fetch making charges'));
    }
  }
  
  // Update making charges
  async updateMakingCharges(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const { categoryId, purityId, chargeType, rateValue } = req.body;
      
      const query = `
        INSERT INTO making_charges_config (category_id, purity_id, charge_type, rate_value, is_percentage)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (category_id, purity_id) 
        DO UPDATE SET 
          charge_type = $3,
          rate_value = $4,
          is_percentage = $5,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      const isPercentage = chargeType === 'percentage';
      const result = await db.query(query, [categoryId, purityId, chargeType, rateValue, isPercentage]);
      
      logger.info('Making charges updated', { categoryId, purityId, chargeType, rateValue });
      res.json(createApiResponse(true, result.rows[0], 'Making charges updated successfully'));
      
    } catch (error) {
      logger.error('Error updating making charges:', error);
      res.status(500).json(createApiResponse(false, undefined, 'Failed to update making charges'));
    }
  }
  
  // Calculate order total (for order management service)
  async calculateOrderTotal(req: Request, res: Response) {
    try {
      const { items } = req.body;
      
      if (!items || !Array.isArray(items)) {
        return res.status(400).json(
          createApiResponse(false, undefined, 'Items array is required')
        );
      }
      
      let subtotal = 0;
      let totalMakingCharges = 0;
      let totalWastageAmount = 0;
      
      // Calculate totals for all items
      for (const item of items) {
        const itemTotal = item.quantity * item.unit_price;
        subtotal += itemTotal;
        
        // Add making charges and wastage if provided
        if (item.making_charges) {
          totalMakingCharges += item.making_charges;
        }
        if (item.wastage_amount) {
          totalWastageAmount += item.wastage_amount;
        }
      }
      
      // Calculate GST (3% on total)
      const beforeGst = subtotal + totalMakingCharges + totalWastageAmount;
      const gstAmount = beforeGst * 0.03;
      const totalAmount = beforeGst + gstAmount;
      
      const orderTotal = {
        subtotal,
        making_charges: totalMakingCharges,
        wastage_amount: totalWastageAmount,
        gst_amount: gstAmount,
        total_amount: totalAmount
      };
      
      res.json(createApiResponse(true, orderTotal, 'Order total calculated successfully'));
      
    } catch (error) {
      logger.error('Error calculating order total:', error);
      res.status(500).json(createApiResponse(false, undefined, 'Failed to calculate order total'));
    }
  }
  
  // Private helper methods
  private async fetchGoldRatesFromAPIs(): Promise<GoldRate> {
    try {
      // Mock gold rates for now - in production, call actual APIs
      const goldRates: GoldRate = {
        gold_24k: 6800,
        gold_22k: 6200,
        gold_18k: 5100,
        silver: 85,
        platinum: 3200,
        source: 'API_AGGREGATE',
        timestamp: new Date(),
        currency: 'INR',
        unit: 'per_gram'
      };
      
      return goldRates;
    } catch (error) {
      logger.error('Error fetching from external APIs:', error);
      throw new ServiceError('Failed to fetch gold rates from external APIs', 'API_ERROR', 503);
    }
  }
  
  private async getCurrentGoldRateFromCache(): Promise<any> {
    // For now, return mock rates - in production, get from Redis
    return {
      gold_24k: 6800,
      gold_22k: 6200,
      gold_18k: 5100
    };
  }
  
  private getPurityFactor(purity: string): number {
    const purityMap: { [key: string]: number } = {
      '24K': 1.0,
      '22K': 0.916,
      '18K': 0.75,
      '14K': 0.583,
      '10K': 0.417
    };
    
    return purityMap[purity] || 0.916; // Default to 22K
  }
}