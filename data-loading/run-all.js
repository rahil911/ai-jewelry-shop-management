#!/usr/bin/env node

const chalk = require('chalk');
const path = require('path');

// Import all loading scripts
const loadUsers = require('./scripts/01-load-users');
const loadInventory = require('./scripts/02-load-inventory');
const loadPricing = require('./scripts/03-load-pricing');
const loadOrders = require('./scripts/04-load-orders');
const loadPayments = require('./scripts/05-load-payments');
const loadImages = require('./scripts/06-load-images');
const loadAnalytics = require('./scripts/07-load-analytics');
const loadNotifications = require('./scripts/08-load-notifications');

const db = require('./config/database');

console.log(chalk.blue.bold('\n🚀 Jewelry Shop Management System - Complete Data Loading\n'));
console.log(chalk.gray('This script will populate the database with comprehensive demo data for client presentation.\n'));

// Main execution function
async function runAllDataLoading() {
  const startTime = Date.now();
  const results = {};
  
  console.log(chalk.yellow('📋 Data Loading Sequence:'));
  console.log('   1. Users and Customers');
  console.log('   2. Inventory and Jewelry Items');
  console.log('   3. Pricing and Gold Rates');
  console.log('   4. Orders and Transactions');
  console.log('   5. Payments and Invoices');
  console.log('   6. Images and Certificates');
  console.log('   7. Analytics and Reports');
  console.log('   8. Notifications and AI Conversations');
  console.log('');

  try {
    // Test database connection first
    console.log(chalk.blue('🔍 Testing database connection...'));
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('Database connection failed. Please check your configuration.');
    }
    console.log(chalk.green('✅ Database connection successful\n'));

    // Execute loading scripts in sequence
    const scripts = [
      { name: 'Users & Customers', func: loadUsers, step: 1 },
      { name: 'Inventory & Jewelry', func: loadInventory, step: 2 },
      { name: 'Pricing & Gold Rates', func: loadPricing, step: 3 },
      { name: 'Orders & Transactions', func: loadOrders, step: 4 },
      { name: 'Payments & Invoices', func: loadPayments, step: 5 },
      { name: 'Images & Certificates', func: loadImages, step: 6 },
      { name: 'Analytics & Reports', func: loadAnalytics, step: 7 },
      { name: 'Notifications & AI', func: loadNotifications, step: 8 },
    ];

    for (const script of scripts) {
      console.log(chalk.blue.bold(`\n📦 Step ${script.step}: Loading ${script.name}...`));
      console.log(chalk.gray('─'.repeat(60)));
      
      try {
        const result = await script.func();
        results[script.name] = result;
        
        if (result.success) {
          console.log(chalk.green(`✅ ${script.name} loaded successfully`));
        } else {
          console.log(chalk.red(`❌ ${script.name} failed: ${result.error}`));
          // Continue with other scripts even if one fails
        }
      } catch (error) {
        console.error(chalk.red(`❌ Error in ${script.name}:`, error.message));
        results[script.name] = { success: false, error: error.message };
        // Continue with other scripts
      }
      
      // Brief pause between scripts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Generate summary report
    console.log(chalk.blue.bold('\n📊 DATA LOADING SUMMARY REPORT'));
    console.log(chalk.gray('═'.repeat(70)));
    
    let successCount = 0;
    let failureCount = 0;
    
    Object.entries(results).forEach(([scriptName, result]) => {
      if (result.success) {
        successCount++;
        console.log(chalk.green(`✅ ${scriptName.padEnd(25)} SUCCESS`));
      } else {
        failureCount++;
        console.log(chalk.red(`❌ ${scriptName.padEnd(25)} FAILED - ${result.error}`));
      }
    });
    
    console.log(chalk.gray('─'.repeat(70)));
    console.log(chalk.blue(`📈 Success Rate: ${successCount}/${successCount + failureCount} (${Math.round((successCount / (successCount + failureCount)) * 100)}%)`));
    
    // Final database verification
    console.log(chalk.blue.bold('\n🔍 Final Database Verification'));
    console.log(chalk.gray('─'.repeat(50)));
    
    const tables = [
      'users', 'customers', 'metal_types', 'purities', 'categories', 
      'jewelry_items', 'suppliers', 'gold_rates_history', 'making_charges_config',
      'pricing_rules', 'orders', 'order_items', 'customizations', 'repair_services',
      'payments', 'invoices', 'images', 'certificates', 'sales_analytics', 
      'notifications', 'ai_conversations'
    ];
    
    let totalRecords = 0;
    
    for (const table of tables) {
      try {
        const count = await db.getRowCount(table);
        totalRecords += count;
        const status = count > 0 ? chalk.green('✓') : chalk.yellow('⚠');
        console.log(`${status} ${table.padEnd(25)} ${count.toString().padStart(8)} records`);
      } catch (error) {
        console.log(`${chalk.red('✗')} ${table.padEnd(25)} ${chalk.red('ERROR')}`);
      }
    }
    
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.blue.bold(`📊 Total Records Created: ${totalRecords.toLocaleString()}`));
    
    // Calculate execution time
    const executionTime = Math.round((Date.now() - startTime) / 1000);
    console.log(chalk.blue(`⏱️  Total Execution Time: ${executionTime} seconds`));
    
    // Generate business summary
    console.log(chalk.blue.bold('\n💼 BUSINESS DATA SUMMARY'));
    console.log(chalk.gray('═'.repeat(50)));
    
    try {
      // Get key business metrics
      const userCount = await db.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['customer']);
      const staffCount = await db.query('SELECT COUNT(*) as count FROM users WHERE role != $1', ['customer']);
      const itemCount = await db.query('SELECT COUNT(*) as count FROM jewelry_items');
      const orderCount = await db.query('SELECT COUNT(*) as count FROM orders');
      const totalRevenue = await db.query('SELECT SUM(total_amount) as revenue FROM orders WHERE status = $1', ['completed']);
      const avgOrderValue = await db.query('SELECT AVG(total_amount) as avg_value FROM orders');
      
      console.log(chalk.cyan(`👥 Customers: ${userCount.rows[0].count}`));
      console.log(chalk.cyan(`👨‍💼 Staff Members: ${staffCount.rows[0].count}`));
      console.log(chalk.cyan(`💎 Jewelry Items: ${itemCount.rows[0].count}`));
      console.log(chalk.cyan(`📋 Total Orders: ${orderCount.rows[0].count}`));
      console.log(chalk.cyan(`💰 Total Revenue: ₹${Math.round(totalRevenue.rows[0].revenue || 0).toLocaleString()}`));
      console.log(chalk.cyan(`📊 Avg Order Value: ₹${Math.round(avgOrderValue.rows[0].avg_value || 0).toLocaleString()}`));
      
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not generate business summary'));
    }
    
    if (successCount === scripts.length) {
      console.log(chalk.green.bold('\n🎉 ALL DATA LOADING COMPLETED SUCCESSFULLY!'));
      console.log(chalk.green('   Your jewelry shop management system is now ready for client demonstration.'));
      console.log(chalk.blue('\n💡 Next Steps:'));
      console.log('   1. Start the frontend application: npm run dev');
      console.log('   2. Verify Azure backend services are running');
      console.log('   3. Test all functionality with the demo data');
      console.log('   4. Present to client with confidence! 🚀\n');
      return { success: true, results };
    } else {
      console.log(chalk.yellow.bold('\n⚠️  DATA LOADING COMPLETED WITH SOME ISSUES'));
      console.log(chalk.yellow(`   ${successCount} out of ${scripts.length} scripts completed successfully.`));
      console.log(chalk.blue('\n💡 Recommendations:'));
      console.log('   1. Review failed scripts and resolve issues');
      console.log('   2. Re-run individual scripts if needed');
      console.log('   3. Verify database permissions and connections');
      console.log('   4. Check the log output for specific error details\n');
      return { success: false, results };
    }
    
  } catch (error) {
    console.error(chalk.red.bold('\n❌ CRITICAL ERROR DURING DATA LOADING'));
    console.error(chalk.red(error.message));
    console.error(chalk.gray(error.stack));
    return { success: false, error: error.message };
  } finally {
    // Close database connection
    await db.closePool();
  }
}

// Run the master script
if (require.main === module) {
  console.log(chalk.blue('🎯 Starting comprehensive data loading process...\n'));
  
  runAllDataLoading()
    .then(result => {
      if (result.success) {
        console.log(chalk.green('✅ Master script completed successfully'));
        process.exit(0);
      } else {
        console.log(chalk.red('❌ Master script completed with errors'));
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(chalk.red('❌ Unexpected error in master script:'), error);
      process.exit(1);
    });
}

module.exports = runAllDataLoading;