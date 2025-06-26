#!/usr/bin/env node

const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const ProgressBar = require('progress');

const db = require('../config/database');
const settings = require('../config/settings');

console.log(chalk.blue.bold('\n📊 Loading Analytics and Reporting Data\n'));

async function loadAnalytics() {
  try {
    console.log('🔍 Testing database connection...');
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Generate daily analytics for the last 6 months
    const analyticsData = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    const totalDays = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
    
    console.log(`📈 Creating analytics data for ${totalDays} days...`);

    for (let dayOffset = 0; dayOffset <= totalDays; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + dayOffset);
      
      // Skip weekends
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        continue;
      }
      
      // Generate realistic daily sales data
      const baseSales = 150000 + Math.random() * 200000; // ₹1.5L to ₹3.5L daily
      const seasonalFactor = 1 + Math.sin((dayOffset / 365) * 2 * Math.PI + Math.PI) * 0.3; // Seasonal variation
      const weeklyFactor = 1 + Math.sin((dayOffset / 7) * 2 * Math.PI) * 0.1; // Weekly pattern
      const randomFactor = 0.7 + Math.random() * 0.6; // Daily variation
      
      const totalSales = baseSales * seasonalFactor * weeklyFactor * randomFactor;
      const totalOrders = Math.floor(totalSales / (25000 + Math.random() * 30000)); // Avg order ₹25K-₹55K
      const avgOrderValue = totalSales / totalOrders;
      
      const newCustomers = Math.floor(totalOrders * (0.3 + Math.random() * 0.4)); // 30-70% new customers
      const returningCustomers = totalOrders - newCustomers;
      
      const goldRate = 6500 + Math.sin(dayOffset / 30) * 200 + (Math.random() - 0.5) * 100; // Fluctuating gold rate
      const profitMargin = 18 + Math.random() * 12; // 18-30% profit margin

      const analytics = {
        id: uuidv4(),
        date: currentDate.toISOString().split('T')[0],
        total_sales: parseFloat(totalSales.toFixed(2)),
        total_orders: totalOrders,
        average_order_value: parseFloat(avgOrderValue.toFixed(2)),
        top_category_id: null, // Will be set randomly
        top_metal_type_id: null, // Will be set randomly
        new_customers: newCustomers,
        returning_customers: returningCustomers,
        gold_rate_avg: parseFloat(goldRate.toFixed(2)),
        profit_margin: parseFloat(profitMargin.toFixed(2)),
        created_at: currentDate,
      };
      
      analyticsData.push(analytics);
    }

    // Link to categories and metal types
    const categories = await db.query('SELECT id FROM categories ORDER BY created_at');
    const metalTypes = await db.query('SELECT id FROM metal_types ORDER BY created_at');
    
    if (categories.rows.length > 0 && metalTypes.rows.length > 0) {
      analyticsData.forEach(analytics => {
        analytics.top_category_id = categories.rows[Math.floor(Math.random() * categories.rows.length)].id;
        analytics.top_metal_type_id = metalTypes.rows[Math.floor(Math.random() * metalTypes.rows.length)].id;
      });
    }

    // Insert analytics data
    console.log('\n📥 Inserting analytics data...');
    const analyticsResult = await db.bulkInsert('sales_analytics', analyticsData, ['date'], ['total_sales', 'total_orders', 'average_order_value']);

    console.log('\n✅ Verifying data...');
    const finalCount = await db.getRowCount('sales_analytics');
    console.log(`   Analytics records: ${finalCount}`);

    // Display summary statistics
    const summaryStats = await db.query(`
      SELECT 
        COUNT(*) as days_with_data,
        SUM(total_sales) as total_revenue,
        AVG(total_sales) as avg_daily_sales,
        SUM(total_orders) as total_orders,
        AVG(average_order_value) as avg_order_value,
        AVG(profit_margin) as avg_profit_margin
      FROM sales_analytics
    `);
    
    console.log('\n📊 Analytics summary:');
    const stats = summaryStats.rows[0];
    console.log(`   Days with data: ${stats.days_with_data}`);
    console.log(`   Total revenue: ₹${Math.round(stats.total_revenue).toLocaleString()}`);
    console.log(`   Avg daily sales: ₹${Math.round(stats.avg_daily_sales).toLocaleString()}`);
    console.log(`   Total orders: ${stats.total_orders}`);
    console.log(`   Avg order value: ₹${Math.round(stats.avg_order_value).toLocaleString()}`);
    console.log(`   Avg profit margin: ${parseFloat(stats.avg_profit_margin).toFixed(1)}%`);

    console.log(chalk.green.bold('\n✅ Analytics data loading completed successfully!\n'));

    return {
      success: true,
      analyticsLoaded: finalCount,
    };

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error loading analytics data:'), error.message);
    return { success: false, error: error.message };
  }
}

// Run the script if called directly
if (require.main === module) {
  loadAnalytics()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('❌ Unexpected error:'), error);
      process.exit(1);
    });
}

module.exports = loadAnalytics;