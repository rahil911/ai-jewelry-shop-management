const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

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
      service: 'test-service',
      dependencies: {
        database: 'connected',
        redis: 'connected'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Test endpoint to check database schema
app.get('/test/schema', async (req, res) => {
  try {
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    res.json({
      success: true,
      tables: tables.rows.map(row => row.table_name)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to check users table
app.get('/test/users', async (req, res) => {
  try {
    const users = await db.query('SELECT id, email, first_name, last_name, role FROM users LIMIT 5');
    
    res.json({
      success: true,
      data: users.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test gold rates
app.get('/test/gold-rates', async (req, res) => {
  try {
    const rates = await db.query('SELECT * FROM gold_rates_history ORDER BY recorded_at DESC LIMIT 5');
    
    res.json({
      success: true,
      data: rates.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test inventory
app.get('/test/inventory', async (req, res) => {
  try {
    const inventory = await db.query(`
      SELECT ji.id, ji.sku, ji.name, ji.gross_weight, ji.selling_price, 
             mt.name as metal_name, p.purity_name, c.name as category_name
      FROM jewelry_items ji
      LEFT JOIN metal_types mt ON ji.metal_type_id = mt.id
      LEFT JOIN purities p ON ji.purity_id = p.id
      LEFT JOIN categories c ON ji.category_id = c.id
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: inventory.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Test service running on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await db.end();
  await redisClient.quit();
  process.exit(0);
});