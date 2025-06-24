require('dotenv').config();
const { Pool } = require('pg');
const redis = require('redis');

async function testConnectivity() {
  console.log('🔍 Testing Database and Redis Connectivity...\n');
  
  // Test PostgreSQL
  try {
    console.log('📊 Testing PostgreSQL connection...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://jeweler:jeweler123@localhost:5432/jewelry_shop_db',
      ssl: false
    });
    
    const client = await pool.connect();
    await client.query('SELECT 1 as test');
    console.log('✅ PostgreSQL: Connected successfully');
    
    // Test database schema
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log(`📋 Found ${tables.rows.length} tables in database`);
    
    // Test sample data
    const users = await client.query('SELECT COUNT(*) as count FROM users');
    const goldRates = await client.query('SELECT COUNT(*) as count FROM metal_types');
    console.log(`👥 Users: ${users.rows[0].count}`);
    console.log(`💰 Metal types: ${goldRates.rows[0].count}`);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ PostgreSQL: Connection failed:', error.message);
  }
  
  // Test Redis
  try {
    console.log('\n🔥 Testing Redis connection...');
    const redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await redisClient.connect();
    await redisClient.ping();
    console.log('✅ Redis: Connected successfully');
    
    // Test cache operations
    await redisClient.set('test:connectivity', 'working');
    const testValue = await redisClient.get('test:connectivity');
    console.log(`💾 Redis test: ${testValue}`);
    
    await redisClient.del('test:connectivity');
    await redisClient.quit();
    
  } catch (error) {
    console.error('❌ Redis: Connection failed:', error.message);
  }
  
  console.log('\n🏁 Connectivity test completed!');
}

testConnectivity().catch(console.error);