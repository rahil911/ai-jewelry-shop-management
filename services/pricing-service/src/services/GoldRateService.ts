import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import axios from 'axios';
import { retry, generateCacheKey } from '@jewelry-shop/shared';
import { logger } from '../utils/logger';

interface GoldRateResponse {
  success: boolean;
  data: {
    gold: number;
    silver: number;
    platinum?: number;
  };
  source: string;
  timestamp: string;
}

export class GoldRateService {
  private db: Pool;
  private redis: RedisClientType;
  private goldApiKey: string;
  private metalPriceApiKey: string;
  
  constructor(db: Pool, redis: RedisClientType) {
    this.db = db;
    this.redis = redis;
    this.goldApiKey = process.env.GOLD_API_KEY || '';
    this.metalPriceApiKey = process.env.METAL_PRICE_API_KEY || '';
  }
  
  async updateGoldRates(): Promise<void> {
    try {
      logger.info('Starting gold rate update from external APIs');
      
      // Try multiple sources for reliability
      const rates = await this.fetchGoldRatesFromMultipleSources();
      
      if (!rates) {
        throw new Error('Failed to fetch gold rates from all sources');
      }
      
      // Update database
      await this.updateRatesInDatabase(rates);
      
      // Cache the rates in Redis
      await this.cacheRates(rates);
      
      logger.info('Gold rates updated successfully', rates);
      
    } catch (error) {
      logger.error('Failed to update gold rates:', error);
      throw error;
    }
  }
  
  private async fetchGoldRatesFromMultipleSources(): Promise<GoldRateResponse | null> {
    const sources = [
      () => this.fetchFromGoldAPI(),
      () => this.fetchFromMetalPriceAPI(),
      () => this.fetchFromFallbackAPI()
    ];
    
    for (const source of sources) {
      try {
        const rates = await retry(source, 3, 1000);
        if (rates) {
          return rates;
        }
      } catch (error) {
        logger.warn('Failed to fetch from source:', error);
        continue;
      }
    }
    
    return null;
  }
  
  private async fetchFromGoldAPI(): Promise<GoldRateResponse> {
    if (!this.goldApiKey) {
      throw new Error('GoldAPI key not configured');
    }
    
    const response = await axios.get('https://api.goldapi.io/api/XAU/INR', {
      headers: {
        'x-access-token': this.goldApiKey
      },
      timeout: 10000
    });
    
    const goldRatePerOunce = response.data.price;
    const goldRatePerGram = goldRatePerOunce / 31.1035; // Convert from ounce to gram
    
    return {
      success: true,
      data: {
        gold: Math.round(goldRatePerGram * 100) / 100,
        silver: 0, // Will be fetched separately
        platinum: 0
      },
      source: 'GoldAPI',
      timestamp: new Date().toISOString()
    };
  }
  
  private async fetchFromMetalPriceAPI(): Promise<GoldRateResponse> {
    if (!this.metalPriceApiKey) {
      throw new Error('MetalPrice API key not configured');
    }
    
    const response = await axios.get(`https://api.metalpriceapi.com/v1/latest?api_key=${this.metalPriceApiKey}&base=INR&currencies=XAU,XAG,XPT`, {
      timeout: 10000
    });
    
    const rates = response.data.rates;
    
    return {
      success: true,
      data: {
        gold: Math.round((1 / rates.XAU) / 31.1035 * 100) / 100, // Convert to per gram
        silver: Math.round((1 / rates.XAG) / 31.1035 * 100) / 100,
        platinum: Math.round((1 / rates.XPT) / 31.1035 * 100) / 100
      },
      source: 'MetalPriceAPI',
      timestamp: new Date().toISOString()
    };
  }
  
  private async fetchFromFallbackAPI(): Promise<GoldRateResponse> {
    // Fallback to a free API or manual rates
    logger.warn('Using fallback gold rates - update with real API');
    
    return {
      success: true,
      data: {
        gold: 6500.00, // Default fallback rate
        silver: 85.00,
        platinum: 3200.00
      },
      source: 'Fallback',
      timestamp: new Date().toISOString()
    };
  }
  
  private async updateRatesInDatabase(rates: GoldRateResponse): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update metal types table
      await client.query(
        'UPDATE metal_types SET current_rate = $1, last_updated = CURRENT_TIMESTAMP, rate_source = $2 WHERE symbol = $3',
        [rates.data.gold, rates.source, 'AU']
      );
      
      if (rates.data.silver > 0) {
        await client.query(
          'UPDATE metal_types SET current_rate = $1, last_updated = CURRENT_TIMESTAMP, rate_source = $2 WHERE symbol = $3',
          [rates.data.silver, rates.source, 'AG']
        );
      }
      
      if (rates.data.platinum && rates.data.platinum > 0) {
        await client.query(
          'UPDATE metal_types SET current_rate = $1, last_updated = CURRENT_TIMESTAMP, rate_source = $2 WHERE symbol = $3',
          [rates.data.platinum, rates.source, 'PT']
        );
      }
      
      // Insert history record
      const goldMetalType = await client.query('SELECT id FROM metal_types WHERE symbol = $1', ['AU']);
      if (goldMetalType.rows.length > 0) {
        await client.query(
          'INSERT INTO gold_rates_history (metal_type_id, rate_per_gram, rate_source) VALUES ($1, $2, $3)',
          [goldMetalType.rows[0].id, rates.data.gold, rates.source]
        );
      }
      
      await client.query('COMMIT');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  private async cacheRates(rates: GoldRateResponse): Promise<void> {
    const cacheKey = generateCacheKey('gold_rates', 'current');
    await this.redis.setEx(cacheKey, 300, JSON.stringify(rates)); // Cache for 5 minutes
  }
  
  async getCurrentRates(): Promise<any> {
    // First try cache
    const cacheKey = generateCacheKey('gold_rates', 'current');
    const cachedRates = await this.redis.get(cacheKey);
    
    if (cachedRates) {
      return JSON.parse(cachedRates);
    }
    
    // Fallback to database
    const result = await this.db.query('SELECT * FROM metal_types WHERE is_active = true ORDER BY name');
    return result.rows;
  }
  
  async getGoldRateHistory(days = 30): Promise<any[]> {
    const result = await this.db.query(
      `SELECT grh.*, mt.name as metal_name, mt.symbol 
       FROM gold_rates_history grh
       JOIN metal_types mt ON grh.metal_type_id = mt.id
       WHERE grh.recorded_at >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY grh.recorded_at DESC`,
      []
    );
    
    return result.rows;
  }
  
  async calculateItemPrice(metalTypeId: string, weight: number, purityPercentage: number, makingCharges: number): Promise<number> {
    // Get current metal rate
    const metalResult = await this.db.query('SELECT current_rate FROM metal_types WHERE id = $1', [metalTypeId]);
    
    if (metalResult.rows.length === 0) {
      throw new Error('Metal type not found');
    }
    
    const currentRate = metalResult.rows[0].current_rate;
    
    // Calculate price: (weight * purity% * current_rate) + making_charges
    const metalValue = weight * (purityPercentage / 100) * currentRate;
    const totalPrice = metalValue + makingCharges;
    
    return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
  }
  
  async getLastUpdateTime(): Promise<string | null> {
    const result = await this.db.query(
      'SELECT MAX(last_updated) as last_update FROM metal_types WHERE is_active = true'
    );
    
    return result.rows[0]?.last_update || null;
  }
  
  async getMakingCharges(categoryId?: string, purityId?: string): Promise<any> {
    const result = await this.db.query(
      `SELECT * FROM making_charges_config 
       WHERE is_active = true 
       AND (category_id = $1 OR category_id IS NULL)
       AND (purity_id = $2 OR purity_id IS NULL)
       AND (effective_from <= CURRENT_DATE)
       AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
       ORDER BY category_id NULLS LAST, purity_id NULLS LAST
       LIMIT 1`,
      [categoryId, purityId]
    );
    
    return result.rows[0] || null;
  }
}