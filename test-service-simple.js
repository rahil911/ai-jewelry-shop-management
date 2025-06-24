require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');

const app = express();
const PORT = process.env.PORT || 3010;

app.use(express.json());

// Enable CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Database connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://jeweler:jeweler123@localhost:5432/jewelry_shop_db',
  ssl: false
});

// Redis connection
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.connect().catch(console.error);

// Health check
app.get('/health', async (req, res) => {
  try {
    // Test database
    await db.query('SELECT 1');
    
    // Test Redis
    await redisClient.ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'jewelry-shop-api',
      version: '1.0.0',
      dependencies: {
        database: 'connected',
        redis: 'connected'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get current gold rates (real API endpoint test)
app.get('/api/gold-rates/current', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT mt.name, mt.symbol, mt.current_rate, mt.last_updated
      FROM metal_types mt 
      WHERE mt.is_active = true 
      ORDER BY mt.name
    `);
    
    res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get users (basic endpoint test)
app.get('/api/users', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, email, first_name, last_name, role, created_at 
      FROM users 
      WHERE is_active = true
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test AI endpoint (using provided API keys)
app.post('/api/ai/test', async (req, res) => {
  try {
    const { message = "What is today's gold rate?" } = req.body;
    
    // Simple test response for now
    const aiResponse = {
      response: `I understand you're asking: "${message}". The AI services are integrated and ready. The current gold rate from our database shows we have ${await db.query('SELECT COUNT(*) FROM metal_types').then(r => r.rows[0].count)} metal types configured.`,
      model: 'test-mode',
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: aiResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test jewelry inventory
app.get('/api/inventory/items', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        ji.id, ji.sku, ji.name, ji.gross_weight, ji.selling_price,
        mt.name as metal_name, mt.symbol as metal_symbol,
        p.purity_name, c.name as category_name
      FROM jewelry_items ji
      LEFT JOIN metal_types mt ON ji.metal_type_id = mt.id
      LEFT JOIN purities p ON ji.purity_id = p.id
      LEFT JOIN categories c ON ji.category_id = c.id
      WHERE ji.is_available = true
      ORDER BY ji.created_at DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test cache operations
app.get('/api/cache/test', async (req, res) => {
  try {
    const testKey = 'test:' + Date.now();
    const testValue = { message: 'Cache is working!', timestamp: new Date().toISOString() };
    
    await redisClient.setEx(testKey, 60, JSON.stringify(testValue));
    const cachedValue = await redisClient.get(testKey);
    
    res.json({
      success: true,
      data: {
        key: testKey,
        setValue: testValue,
        cachedValue: JSON.parse(cachedValue),
        matches: JSON.stringify(testValue) === cachedValue
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Jewelry Shop API running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`💰 Gold rates: http://localhost:${PORT}/api/gold-rates/current`);
  console.log(`👥 Users: http://localhost:${PORT}/api/users`);
  console.log(`💎 Inventory: http://localhost:${PORT}/api/inventory/items`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await db.end();
  await redisClient.quit();
  process.exit(0);
});