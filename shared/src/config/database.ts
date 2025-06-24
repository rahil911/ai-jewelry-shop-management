import { Pool, PoolConfig } from 'pg';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

// PostgreSQL connection
export const createDatabasePool = (config?: Partial<PoolConfig>): Pool => {
  const defaultConfig: PoolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'jewelry_shop_db',
    user: process.env.DB_USER || 'jeweler',
    password: process.env.DB_PASSWORD || 'jeweler123',
    max: parseInt(process.env.DB_POOL_SIZE || '20'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };

  return new Pool({ ...defaultConfig, ...config });
};

// Redis connection
export const createRedisClient = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  const client = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
    }
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    console.log('Redis Client Connected');
  });

  return client;
};

// Database health check
export const checkDatabaseHealth = async (pool: Pool): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

// Redis health check
export const checkRedisHealth = async (client: any): Promise<boolean> => {
  try {
    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
};

// Database migration utilities
export const runMigration = async (pool: Pool, sql: string): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Common queries
export const queries = {
  // User queries
  findUserByEmail: 'SELECT * FROM users WHERE email = $1 AND is_active = true',
  findUserById: 'SELECT * FROM users WHERE id = $1 AND is_active = true',
  createUser: `
    INSERT INTO users (email, password_hash, first_name, last_name, role, preferred_language, phone)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `,
  updateUserLastLogin: 'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',

  // Gold rates queries
  getCurrentGoldRates: 'SELECT * FROM metal_types WHERE is_active = true ORDER BY name',
  updateGoldRate: 'UPDATE metal_types SET current_rate = $1, last_updated = CURRENT_TIMESTAMP WHERE id = $2',
  insertGoldRateHistory: `
    INSERT INTO gold_rates_history (metal_type_id, rate_per_gram, rate_per_tola, rate_source)
    VALUES ($1, $2, $3, $4)
  `,

  // Inventory queries
  findJewelryItems: `
    SELECT ji.*, c.name as category_name, mt.name as metal_name, p.purity_name
    FROM jewelry_items ji
    LEFT JOIN categories c ON ji.category_id = c.id
    LEFT JOIN metal_types mt ON ji.metal_type_id = mt.id
    LEFT JOIN purities p ON ji.purity_id = p.id
    WHERE ji.is_available = true
    ORDER BY ji.created_at DESC
    LIMIT $1 OFFSET $2
  `,
  findItemBySKU: 'SELECT * FROM jewelry_items WHERE sku = $1 AND is_available = true',
  updateItemStock: 'UPDATE jewelry_items SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',

  // Order queries
  createOrder: `
    INSERT INTO orders (order_number, customer_id, staff_id, order_type, subtotal, total_amount)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `,
  updateOrderStatus: 'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
  findOrdersByCustomer: 'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',

  // Making charges queries
  getMakingCharges: `
    SELECT * FROM making_charges_config 
    WHERE is_active = true 
    AND (category_id = $1 OR category_id IS NULL)
    AND (purity_id = $2 OR purity_id IS NULL)
    ORDER BY category_id NULLS LAST, purity_id NULLS LAST
    LIMIT 1
  `
};