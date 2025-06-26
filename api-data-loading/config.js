// API Configuration for Jewelry Shop Demo Data Loading
const config = {
  // Azure Backend Base URL
  baseURL: 'http://4.236.132.147',
  
  // Service Endpoints
  endpoints: {
    userManagement: 'http://4.236.132.147:3001',
    inventoryManagement: 'http://4.236.132.147:3002', 
    pricingService: 'http://4.236.132.147:3003',
    orderManagement: 'http://4.236.132.147:3004',
    health: 'http://4.236.132.147/health'
  },
  
  // Request Configuration
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 2000, // 2 seconds
  
  // Batch Processing
  batchSize: 10,
  batchDelay: 1000, // 1 second between batches
  
  // Demo Admin Token (for data loading)
  adminToken: 'demo-admin-token-for-data-loading',
  
  // Sample Data Configuration
  dataConfig: {
    users: {
      total: 50,
      customers: 40,
      staff: 8,
      admins: 2
    },
    inventory: {
      total: 100,
      categories: ['rings', 'necklaces', 'earrings', 'bracelets', 'pendants'],
      metalTypes: ['gold', 'silver', 'platinum'],
      purities: ['22K', '18K', '14K', '925']
    },
    orders: {
      total: 30,
      statusDistribution: {
        'pending': 5,
        'confirmed': 8,
        'in_progress': 10,
        'completed': 15,
        'cancelled': 2
      }
    }
  }
};

module.exports = config;