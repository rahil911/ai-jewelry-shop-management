module.exports = {
  apps: [{
    name: 'order-management',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3004,
      DATABASE_URL: 'postgresql://jeweler:jeweler123@localhost:5432/jewelry_shop_db',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'jewelry-shop-jwt-secret-key-2024',
      PRICING_SERVICE_URL: 'http://localhost:3003',
      INVENTORY_SERVICE_URL: 'http://localhost:3002',
      USER_MANAGEMENT_SERVICE_URL: 'http://localhost:3001',
      NOTIFICATION_SERVICE_URL: 'http://localhost:3008',
      BUSINESS_NAME: 'Premium Jewelry Shop',
      BUSINESS_ADDRESS: '123 Main Street, City, State 12345',
      BUSINESS_PHONE: '+91-9876543210',
      BUSINESS_EMAIL: 'info@jewelryshop.com',
      BUSINESS_GST_NUMBER: '22AAAAA0000A1Z5',
      RATE_LIMIT_WINDOW_MS: 900000,
      RATE_LIMIT_MAX_REQUESTS: 100,
      FRONTEND_URL: 'http://localhost:3000'
    }
  }]
};