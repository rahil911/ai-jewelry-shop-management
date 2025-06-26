const { Pool } = require('pg');
require('dotenv').config();

// Database configuration for data loading
const config = {
  connectionString: process.env.DATABASE_URL || 'postgresql://jeweler:jeweler123@localhost:5432/jewelry_shop_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return error if connection takes longer than 10 seconds
};

// Create connection pool
const pool = new Pool(config);

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connected successfully');
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL: ${result.rows[0].pg_version.split(' ')[1]}`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Execute query with error handling
async function query(text, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`   Query executed in ${duration}ms, ${result.rowCount} rows affected`);
    return result;
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('   Query:', text.substring(0, 100) + '...');
    throw error;
  }
}

// Execute multiple queries in a transaction
async function transaction(queries) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('📁 Transaction started');
    
    const results = [];
    for (let i = 0; i < queries.length; i++) {
      const { text, params } = queries[i];
      console.log(`   Executing query ${i + 1}/${queries.length}`);
      const result = await client.query(text, params);
      results.push(result);
    }
    
    await client.query('COMMIT');
    console.log('✅ Transaction committed successfully');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Transaction rolled back:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Get table information
async function getTableInfo(tableName) {
  const result = await query(`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_name = $1 
    ORDER BY ordinal_position
  `, [tableName]);
  
  return result.rows;
}

// Check if table exists
async function tableExists(tableName) {
  const result = await query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = $1
    )
  `, [tableName]);
  
  return result.rows[0].exists;
}

// Get row count for a table
async function getRowCount(tableName) {
  try {
    const result = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error(`❌ Error counting rows in ${tableName}:`, error.message);
    return 0;
  }
}

// Clear table data (for cleanup)
async function clearTable(tableName, cascade = false) {
  try {
    const cascadeStr = cascade ? 'CASCADE' : '';
    await query(`TRUNCATE TABLE ${tableName} ${cascadeStr}`);
    console.log(`🗑️ Cleared table: ${tableName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error clearing table ${tableName}:`, error.message);
    return false;
  }
}

// Get next sequence value
async function getNextSequenceValue(sequenceName) {
  try {
    const result = await query(`SELECT nextval('${sequenceName}') as next_val`);
    return result.rows[0].next_val;
  } catch (error) {
    console.error(`❌ Error getting sequence value for ${sequenceName}:`, error.message);
    return null;
  }
}

// Reset sequence to specific value
async function resetSequence(sequenceName, value = 1) {
  try {
    await query(`SELECT setval('${sequenceName}', $1, false)`, [value]);
    console.log(`🔄 Reset sequence ${sequenceName} to ${value}`);
    return true;
  } catch (error) {
    console.error(`❌ Error resetting sequence ${sequenceName}:`, error.message);
    return false;
  }
}

// Bulk insert with conflict resolution
async function bulkInsert(tableName, data, conflictColumns = [], updateColumns = []) {
  if (!data || data.length === 0) {
    console.log(`ℹ️ No data to insert into ${tableName}`);
    return { inserted: 0, updated: 0 };
  }

  const columns = Object.keys(data[0]);
  const placeholders = data.map((_, index) => 
    `(${columns.map((_, colIndex) => `$${index * columns.length + colIndex + 1}`).join(', ')})`
  ).join(', ');
  
  const values = data.flatMap(row => columns.map(col => row[col]));
  
  let query_text = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${placeholders}`;
  
  // Add conflict resolution if specified
  if (conflictColumns.length > 0) {
    query_text += ` ON CONFLICT (${conflictColumns.join(', ')})`;
    
    if (updateColumns.length > 0) {
      const updateSet = updateColumns.map(col => `${col} = EXCLUDED.${col}`).join(', ');
      query_text += ` DO UPDATE SET ${updateSet}`;
    } else {
      query_text += ` DO NOTHING`;
    }
  }
  
  try {
    const result = await query(query_text, values);
    console.log(`✅ Bulk inserted ${result.rowCount} rows into ${tableName}`);
    return { inserted: result.rowCount, updated: 0 };
  } catch (error) {
    console.error(`❌ Bulk insert failed for ${tableName}:`, error.message);
    throw error;
  }
}

// Close pool (for cleanup)
async function closePool() {
  try {
    await pool.end();
    console.log('👋 Database pool closed');
  } catch (error) {
    console.error('❌ Error closing pool:', error.message);
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  getTableInfo,
  tableExists,
  getRowCount,
  clearTable,
  getNextSequenceValue,
  resetSequence,
  bulkInsert,
  closePool
};