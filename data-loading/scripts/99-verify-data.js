#!/usr/bin/env node

const chalk = require('chalk');
const db = require('../config/database');

console.log(chalk.blue.bold('\n🔍 Data Verification and Integrity Check\n'));

async function verifyData() {
  try {
    console.log('🔍 Testing database connection...');
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    console.log('\n📊 Running comprehensive data verification...\n');

    // Table counts verification
    console.log(chalk.blue('1. Table Counts Verification'));
    console.log(chalk.gray('─'.repeat(40)));
    
    const tables = [
      { name: 'users', expected: 130, description: 'Users (customers + staff)' },
      { name: 'customers', expected: 120, description: 'Customer profiles' },
      { name: 'metal_types', expected: 3, description: 'Metal types (Gold, Silver, Platinum)' },
      { name: 'purities', expected: 7, description: 'Metal purities' },
      { name: 'categories', expected: 7, description: 'Jewelry categories' },
      { name: 'suppliers', expected: 4, description: 'Suppliers' },
      { name: 'jewelry_items', expected: 200, description: 'Jewelry inventory' },
      { name: 'gold_rates_history', expected: 400, description: 'Historical gold rates' },
      { name: 'making_charges_config', expected: 24, description: 'Making charges configuration' },
      { name: 'pricing_rules', expected: 7, description: 'Pricing rules' },
      { name: 'orders', expected: 85, description: 'Customer orders' },
      { name: 'order_items', expected: 150, description: 'Order line items' },
      { name: 'customizations', expected: 30, description: 'Customization requests' },
      { name: 'repair_services', expected: 17, description: 'Repair services' },
      { name: 'payments', expected: 70, description: 'Payment records' },
      { name: 'invoices', expected: 70, description: 'Generated invoices' },
      { name: 'images', expected: 400, description: 'Product images' },
      { name: 'certificates', expected: 50, description: 'Quality certificates' },
      { name: 'sales_analytics', expected: 130, description: 'Daily analytics' },
      { name: 'notifications', expected: 200, description: 'User notifications' },
      { name: 'ai_conversations', expected: 150, description: 'AI chat conversations' },
    ];

    let passedTables = 0;
    let totalRecords = 0;

    for (const table of tables) {
      try {
        const count = await db.getRowCount(table.name);
        totalRecords += count;
        
        const status = count >= (table.expected * 0.8) ? 
          chalk.green('✓ PASS') : 
          count > 0 ? chalk.yellow('⚠ PARTIAL') : chalk.red('✗ FAIL');
        
        if (count >= (table.expected * 0.8)) passedTables++;
        
        console.log(`${status} ${table.name.padEnd(20)} ${count.toString().padStart(6)} / ${table.expected.toString().padStart(6)} ${table.description}`);
      } catch (error) {
        console.log(`${chalk.red('✗ ERROR')} ${table.name.padEnd(20)} ${chalk.red('FAILED')} ${table.description}`);
      }
    }

    console.log(chalk.gray('─'.repeat(40)));
    console.log(chalk.blue(`📈 Table Verification: ${passedTables}/${tables.length} passed`));
    console.log(chalk.blue(`📊 Total Records: ${totalRecords.toLocaleString()}`));

    // Data integrity checks
    console.log(chalk.blue('\n2. Data Integrity Checks'));
    console.log(chalk.gray('─'.repeat(40)));

    const integrityChecks = [
      {
        name: 'User Roles Distribution',
        query: `
          SELECT role, COUNT(*) as count 
          FROM users 
          GROUP BY role 
          ORDER BY count DESC
        `,
        validator: (rows) => {
          const customers = rows.find(r => r.role === 'customer')?.count || 0;
          const staff = rows.find(r => r.role === 'staff')?.count || 0;
          return customers > 100 && staff > 4;
        }
      },
      {
        name: 'Order Status Distribution', 
        query: `
          SELECT status, COUNT(*) as count 
          FROM orders 
          GROUP BY status 
          ORDER BY count DESC
        `,
        validator: (rows) => {
          const completed = rows.find(r => r.status === 'completed')?.count || 0;
          return completed > 40;
        }
      },
      {
        name: 'Inventory Value Calculation',
        query: `
          SELECT 
            COUNT(*) as item_count,
            SUM(selling_price * stock_quantity) as total_value,
            AVG(selling_price) as avg_price
          FROM jewelry_items
        `,
        validator: (rows) => {
          const totalValue = parseFloat(rows[0].total_value) || 0;
          const avgPrice = parseFloat(rows[0].avg_price) || 0;
          return totalValue > 10000000 && avgPrice > 20000; // ₹1Cr+ inventory, ₹20K+ avg price
        }
      },
      {
        name: 'Payment Status Consistency',
        query: `
          SELECT 
            o.payment_status,
            COUNT(*) as order_count,
            COUNT(p.id) as payment_count
          FROM orders o
          LEFT JOIN payments p ON o.id = p.order_id
          GROUP BY o.payment_status
        `,
        validator: (rows) => {
          const paidOrders = rows.find(r => r.payment_status === 'paid');
          return paidOrders && paidOrders.order_count === paidOrders.payment_count;
        }
      },
      {
        name: 'Foreign Key Relationships',
        query: `
          SELECT 
            'order_items_to_orders' as relationship,
            COUNT(DISTINCT oi.order_id) as linked_orders,
            (SELECT COUNT(*) FROM orders) as total_orders
          FROM order_items oi
          UNION ALL
          SELECT 
            'customers_to_users' as relationship,
            COUNT(DISTINCT c.user_id) as linked_users,
            (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers
          FROM customers c
        `,
        validator: (rows) => {
          return rows.every(row => 
            parseFloat(row.linked_orders || row.linked_users) / parseFloat(row.total_orders || row.total_customers) > 0.8
          );
        }
      }
    ];

    let passedChecks = 0;

    for (const check of integrityChecks) {
      try {
        const result = await db.query(check.query);
        const isValid = check.validator(result.rows);
        
        const status = isValid ? chalk.green('✓ PASS') : chalk.red('✗ FAIL');
        console.log(`${status} ${check.name}`);
        
        if (isValid) passedChecks++;
        
        // Display some results for context
        if (result.rows.length > 0) {
          result.rows.slice(0, 3).forEach(row => {
            const values = Object.values(row).slice(0, 3).map(v => 
              typeof v === 'number' ? v.toLocaleString() : v
            ).join(', ');
            console.log(`       ${chalk.gray(values)}`);
          });
        }
      } catch (error) {
        console.log(`${chalk.red('✗ ERROR')} ${check.name}: ${error.message}`);
      }
    }

    console.log(chalk.gray('─'.repeat(40)));
    console.log(chalk.blue(`🔍 Integrity Checks: ${passedChecks}/${integrityChecks.length} passed`));

    // Business logic verification
    console.log(chalk.blue('\n3. Business Logic Verification'));
    console.log(chalk.gray('─'.repeat(40)));

    try {
      // Verify pricing calculations
      const pricingCheck = await db.query(`
        SELECT 
          AVG(selling_price / base_price) as avg_markup,
          COUNT(*) as items_with_markup
        FROM jewelry_items 
        WHERE base_price > 0 AND selling_price > base_price
      `);
      
      const avgMarkup = parseFloat(pricingCheck.rows[0].avg_markup);
      const markupStatus = avgMarkup > 1.1 && avgMarkup < 1.5 ? 
        chalk.green('✓ PASS') : chalk.yellow('⚠ REVIEW');
      console.log(`${markupStatus} Pricing Markup (avg: ${(avgMarkup * 100 - 100).toFixed(1)}%)`);

      // Verify order amounts
      const orderCheck = await db.query(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as avg_order_value
        FROM orders 
        WHERE status = 'completed'
      `);
      
      const totalRevenue = parseFloat(orderCheck.rows[0].total_revenue) || 0;
      const avgOrderValue = parseFloat(orderCheck.rows[0].avg_order_value) || 0;
      const revenueStatus = totalRevenue > 5000000 && avgOrderValue > 40000 ? 
        chalk.green('✓ PASS') : chalk.yellow('⚠ REVIEW');
      console.log(`${revenueStatus} Revenue Metrics (₹${(totalRevenue / 1000000).toFixed(1)}M total, ₹${(avgOrderValue / 1000).toFixed(0)}K avg)`);

      // Verify gold rates trend
      const ratesCheck = await db.query(`
        SELECT 
          MIN(rate_per_gram) as min_rate,
          MAX(rate_per_gram) as max_rate,
          AVG(rate_per_gram) as avg_rate
        FROM gold_rates_history 
        WHERE metal_type_id = (SELECT id FROM metal_types WHERE symbol = 'AU')
      `);
      
      const minRate = parseFloat(ratesCheck.rows[0].min_rate);
      const maxRate = parseFloat(ratesCheck.rows[0].max_rate);
      const rateVariation = (maxRate - minRate) / minRate;
      const ratesStatus = rateVariation > 0.05 && rateVariation < 0.25 ? 
        chalk.green('✓ PASS') : chalk.yellow('⚠ REVIEW');
      console.log(`${ratesStatus} Gold Rate Variation (${(rateVariation * 100).toFixed(1)}% range)`);

    } catch (error) {
      console.log(`${chalk.red('✗ ERROR')} Business Logic Check: ${error.message}`);
    }

    // Demo readiness check
    console.log(chalk.blue('\n4. Demo Readiness Assessment'));
    console.log(chalk.gray('─'.repeat(40)));

    const demoChecks = [
      { name: 'Sample customers with orders', check: async () => {
        const result = await db.query(`
          SELECT COUNT(DISTINCT o.customer_id) as customers_with_orders
          FROM orders o
        `);
        return result.rows[0].customers_with_orders >= 30;
      }},
      { name: 'Recent activity (last 30 days)', check: async () => {
        const result = await db.query(`
          SELECT COUNT(*) as recent_orders
          FROM orders 
          WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
        `);
        return result.rows[0].recent_orders >= 20;
      }},
      { name: 'Multilingual data present', check: async () => {
        const result = await db.query(`
          SELECT COUNT(*) as multilingual_items
          FROM jewelry_items 
          WHERE name_hi IS NOT NULL AND name_kn IS NOT NULL
        `);
        return result.rows[0].multilingual_items >= 100;
      }},
      { name: 'AI conversation data', check: async () => {
        const result = await db.query(`
          SELECT COUNT(DISTINCT language) as languages
          FROM ai_conversations
        `);
        return result.rows[0].languages >= 2;
      }},
      { name: 'Complete order workflow data', check: async () => {
        const result = await db.query(`
          SELECT COUNT(DISTINCT status) as order_statuses
          FROM orders
        `);
        return result.rows[0].order_statuses >= 4;
      }},
    ];

    let demoReadyChecks = 0;

    for (const check of demoChecks) {
      try {
        const isReady = await check.check();
        const status = isReady ? chalk.green('✓ READY') : chalk.red('✗ NOT READY');
        console.log(`${status} ${check.name}`);
        if (isReady) demoReadyChecks++;
      } catch (error) {
        console.log(`${chalk.red('✗ ERROR')} ${check.name}: ${error.message}`);
      }
    }

    console.log(chalk.gray('─'.repeat(40)));
    console.log(chalk.blue(`🎯 Demo Readiness: ${demoReadyChecks}/${demoChecks.length} criteria met`));

    // Final assessment
    console.log(chalk.blue.bold('\n📋 FINAL VERIFICATION REPORT'));
    console.log(chalk.gray('═'.repeat(50)));
    
    const overallScore = (
      (passedTables / tables.length) * 0.4 +
      (passedChecks / integrityChecks.length) * 0.3 +
      (demoReadyChecks / demoChecks.length) * 0.3
    ) * 100;

    let overallStatus;
    let statusColor;
    
    if (overallScore >= 90) {
      overallStatus = 'EXCELLENT - DEMO READY';
      statusColor = chalk.green.bold;
    } else if (overallScore >= 75) {
      overallStatus = 'GOOD - MINOR ISSUES';
      statusColor = chalk.yellow.bold;
    } else if (overallScore >= 60) {
      overallStatus = 'FAIR - NEEDS ATTENTION';
      statusColor = chalk.yellow;
    } else {
      overallStatus = 'POOR - CRITICAL ISSUES';
      statusColor = chalk.red.bold;
    }

    console.log(statusColor(`📊 Overall Score: ${overallScore.toFixed(1)}% - ${overallStatus}`));
    console.log(chalk.blue(`📈 Table Coverage: ${((passedTables / tables.length) * 100).toFixed(1)}%`));
    console.log(chalk.blue(`🔍 Data Integrity: ${((passedChecks / integrityChecks.length) * 100).toFixed(1)}%`));
    console.log(chalk.blue(`🎯 Demo Readiness: ${((demoReadyChecks / demoChecks.length) * 100).toFixed(1)}%`));
    console.log(chalk.blue(`📊 Total Records: ${totalRecords.toLocaleString()}`));

    if (overallScore >= 75) {
      console.log(chalk.green.bold('\n✅ VERIFICATION PASSED - SYSTEM READY FOR DEMO!'));
      console.log(chalk.green('   Your jewelry shop management system has comprehensive demo data.'));
      console.log(chalk.blue('\n🎯 Ready for client presentation with confidence!'));
    } else {
      console.log(chalk.yellow.bold('\n⚠️  VERIFICATION COMPLETED WITH ISSUES'));
      console.log(chalk.yellow('   Some components may need attention before client demo.'));
      console.log(chalk.blue('\n💡 Consider running individual data loading scripts to address gaps.'));
    }

    console.log(chalk.gray('\n' + '═'.repeat(50)));

    return {
      success: true,
      overallScore,
      passedTables,
      totalTables: tables.length,
      passedChecks,
      totalChecks: integrityChecks.length,
      demoReadyChecks,
      totalDemoChecks: demoChecks.length,
      totalRecords,
    };

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Verification failed:'), error.message);
    console.error(error.stack);
    return { success: false, error: error.message };
  } finally {
    await db.closePool();
  }
}

// Run verification if called directly
if (require.main === module) {
  verifyData()
    .then(result => {
      if (result.success && result.overallScore >= 75) {
        console.log(chalk.green('\n✅ Verification script completed successfully'));
        process.exit(0);
      } else {
        console.log(chalk.yellow('\n⚠️  Verification completed with issues'));
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(chalk.red('\n❌ Unexpected error:'), error);
      process.exit(1);
    });
}

module.exports = verifyData;