const axios = require('axios');
const chalk = require('chalk');
const config = require('../config');

class APIClient {
  constructor() {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.retries = config.retries;
    this.retryDelay = config.retryDelay;
  }

  // Create axios instance with default configuration
  createClient(serviceURL = this.baseURL) {
    return axios.create({
      baseURL: serviceURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Retry mechanism for failed requests
  async retryRequest(requestFn, retries = this.retries) {
    for (let i = 0; i <= retries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        if (i === retries) {
          throw error;
        }
        console.log(chalk.yellow(`   Retry ${i + 1}/${retries} after ${this.retryDelay}ms...`));
        await this.delay(this.retryDelay);
      }
    }
  }

  // Delay utility
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check for all services
  async checkServicesHealth() {
    console.log(chalk.blue('🔍 Checking service health...'));
    
    const services = [
      { name: 'Main Health', url: `${this.baseURL}/health` },
      { name: 'User Management', url: `${this.baseURL}:3001/health` },
      { name: 'Inventory Management', url: `${this.baseURL}:3002/health` },
      { name: 'Pricing Service', url: `${this.baseURL}:3003/health` }
    ];

    const results = {};
    
    for (const service of services) {
      try {
        const client = axios.create({ timeout: 10000 });
        const response = await client.get(service.url);
        results[service.name] = {
          status: 'healthy',
          response: response.status === 200 ? 'OK' : response.status
        };
        console.log(chalk.green(`✅ ${service.name}: Healthy`));
      } catch (error) {
        results[service.name] = {
          status: 'unhealthy',
          error: error.message
        };
        console.log(chalk.red(`❌ ${service.name}: ${error.message}`));
      }
    }
    
    return results;
  }

  // Generic GET request
  async get(endpoint, params = {}) {
    const client = this.createClient();
    return await this.retryRequest(async () => {
      const response = await client.get(endpoint, { params });
      return response.data;
    });
  }

  // Generic POST request
  async post(endpoint, data) {
    const client = this.createClient();
    return await this.retryRequest(async () => {
      const response = await client.post(endpoint, data);
      return response.data;
    });
  }

  // Batch processing utility
  async processBatch(items, processFn, batchSize = config.batchSize) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      console.log(`   Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(items.length/batchSize)}: ${batch.length} items`);
      
      for (const item of batch) {
        try {
          const result = await processFn(item);
          results.push(result);
        } catch (error) {
          console.error(chalk.red(`   Failed to process item: ${error.message}`));
          errors.push({ item, error: error.message });
        }
        
        // Small delay between items to avoid overwhelming the server
        await this.delay(100);
      }
      
      // Delay between batches
      if (i + batchSize < items.length) {
        await this.delay(config.batchDelay);
      }
    }
    
    return { results, errors };
  }

  // User Management API methods
  async registerUser(userData) {
    try {
      return await this.post('/api/auth/register', userData);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        // User already exists, that's okay for demo data
        return { success: true, message: 'User already exists', email: userData.email };
      }
      throw error;
    }
  }

  async loginUser(credentials) {
    return await this.post('/api/auth/login', credentials);
  }

  async getUsers(params = {}) {
    return await this.get('/api/users', params);
  }

  // Inventory Management API methods
  async createInventoryItem(itemData) {
    try {
      return await this.post('/api/inventory/items', itemData);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        // Item already exists, that's okay for demo data
        return { success: true, message: 'Item already exists', sku: itemData.sku };
      }
      throw error;
    }
  }

  async getInventoryItems(params = {}) {
    return await this.get('/api/inventory/items', params);
  }

  async getInventoryValuation() {
    return await this.get('/api/inventory/valuation');
  }

  // Pricing Service API methods
  async getCurrentGoldRates() {
    return await this.get('/api/gold-rates/current');
  }

  async getGoldRateHistory(days = 7) {
    return await this.get('/api/gold-rates/history', { days });
  }

  async calculateItemPrice(priceData) {
    return await this.post('/api/pricing/calculate-item-price', priceData);
  }

  async getMakingCharges() {
    return await this.get('/api/making-charges');
  }

  // Order Management API methods (if available)
  async createOrder(orderData) {
    return await this.post('/api/orders', orderData);
  }

  async getOrders(params = {}) {
    return await this.get('/api/orders', params);
  }

  // System health check
  async checkSystemHealth() {
    return await this.get('/health');
  }
}

module.exports = APIClient;