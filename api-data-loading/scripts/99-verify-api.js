#!/usr/bin/env node

const chalk = require('chalk');
const APIClient = require('../utils/api-client');

console.log(chalk.blue.bold('\n🔍 API Data Verification & System Health Check\n'));

async function verifyAPI() {
  const api = new APIClient();
  
  try {
    console.log('🔍 Performing comprehensive API verification...\n');

    // 1. System Health Check
    console.log(chalk.blue('1. System Health Check'));
    console.log(chalk.gray('─'.repeat(40)));
    
    const healthResults = await api.checkServicesHealth();
    const healthyServices = Object.values(healthResults).filter(r => r.status === 'healthy').length;
    const totalServices = Object.keys(healthResults).length;
    
    console.log(`📊 Services Health: ${healthyServices}/${totalServices} healthy\n`);

    // 2. User Management Verification
    console.log(chalk.blue('2. User Management Verification'));
    console.log(chalk.gray('─'.repeat(40)));
    
    let userResults = { total: 0, loginTest: false };
    try {
      // Try to get users (may require authentication)
      const users = await api.getUsers();
      userResults.total = users.data?.length || users.length || 'N/A';
      console.log(chalk.green(`✅ Users endpoint accessible: ${userResults.total} users`));
      
      // Test sample login
      try {
        const loginResult = await api.loginUser({ email: 'admin@jewelryshop.com', password: 'admin123' });
        userResults.loginTest = !!(loginResult.success || loginResult.token);
        console.log(chalk.green(`✅ User authentication: ${userResults.loginTest ? 'Working' : 'Failed'}`));
      } catch (error) {
        console.log(chalk.yellow(`⚠️ Login test: ${error.response?.status || 'Failed'} (${error.message})`));
      }
    } catch (error) {
      console.log(chalk.red(`❌ User management: ${error.message}`));
    }

    // 3. Inventory Verification
    console.log('\n' + chalk.blue('3. Inventory Management Verification'));
    console.log(chalk.gray('─'.repeat(40)));
    
    let inventoryResults = { items: 0, categories: [], totalValue: 0 };
    try {
      const inventory = await api.getInventoryItems();
      inventoryResults.items = inventory.items?.length || 0;
      
      if (inventory.items && inventory.items.length > 0) {
        inventoryResults.categories = [...new Set(inventory.items.map(item => item.category))];
        console.log(chalk.green(`✅ Inventory items: ${inventoryResults.items}`));
        console.log(chalk.green(`✅ Categories: ${inventoryResults.categories.join(', ')}`));
        
        // Get inventory valuation
        try {
          const valuation = await api.getInventoryValuation();
          inventoryResults.totalValue = valuation.total_value || 0;
          console.log(chalk.green(`✅ Total inventory value: ₹${inventoryResults.totalValue.toLocaleString()}`));
        } catch (error) {
          console.log(chalk.yellow(`⚠️ Valuation: ${error.message}`));
        }
        
        // Test category filtering
        try {
          const rings = await api.getInventoryItems({ category: 'rings' });
          const ringCount = rings.items?.length || 0;
          console.log(chalk.green(`✅ Category filtering (rings): ${ringCount} items`));
        } catch (error) {
          console.log(chalk.yellow(`⚠️ Category filtering: ${error.message}`));
        }
      } else {
        console.log(chalk.yellow(`⚠️ No inventory items found`));
      }
    } catch (error) {
      console.log(chalk.red(`❌ Inventory management: ${error.message}`));
    }

    // 4. Pricing Service Verification
    console.log('\n' + chalk.blue('4. Pricing Service Verification'));
    console.log(chalk.gray('─'.repeat(40)));
    
    let pricingResults = { goldRates: {}, calculations: 0, makingCharges: false };
    try {
      // Test gold rates
      const goldRates = await api.getCurrentGoldRates();
      pricingResults.goldRates = goldRates;
      console.log(chalk.green('✅ Current gold rates:'));
      Object.entries(goldRates).forEach(([purity, rate]) => {
        console.log(`   ${purity}: ₹${rate} per gram`);
      });
      
      // Test price calculation
      try {
        const priceCalc = await api.calculateItemPrice({
          weight: 10,
          purity: '22K',
          making_charge_percentage: 12
        });
        
        if (priceCalc.success && priceCalc.total_price) {
          pricingResults.calculations = 1;
          console.log(chalk.green(`✅ Price calculation: ₹${priceCalc.total_price.toLocaleString()} (10g 22K ring)`));
        }
      } catch (error) {
        console.log(chalk.yellow(`⚠️ Price calculation: ${error.message}`));
      }
      
      // Test making charges
      try {
        const makingCharges = await api.getMakingCharges();
        pricingResults.makingCharges = !!(makingCharges.success || makingCharges.data);
        console.log(chalk.green(`✅ Making charges: ${pricingResults.makingCharges ? 'Available' : 'Not available'}`));
      } catch (error) {
        console.log(chalk.yellow(`⚠️ Making charges: ${error.message}`));
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Pricing service: ${error.message}`));
    }

    // 5. Business Scenario Testing
    console.log('\n' + chalk.blue('5. Business Scenario Testing'));
    console.log(chalk.gray('─'.repeat(40)));
    
    let businessResults = { scenarios: 0, totalScenarios: 3 };
    
    // Scenario 1: Customer price inquiry
    try {
      const scenario1 = await api.calculateItemPrice({ weight: 15, purity: '22K', making_charge_percentage: 12 });
      if (scenario1.success && scenario1.total_price) {
        businessResults.scenarios++;
        console.log(chalk.green(`✅ Customer inquiry: 15g 22K necklace = ₹${scenario1.total_price.toLocaleString()}`));
      }
    } catch (error) {
      console.log(chalk.red(`❌ Customer inquiry scenario failed`));
    }
    
    // Scenario 2: Inventory lookup
    try {
      const rings = await api.getInventoryItems({ category: 'rings' });
      if (rings.items && rings.items.length > 0) {
        businessResults.scenarios++;
        console.log(chalk.green(`✅ Inventory lookup: ${rings.items.length} rings available`));
      }
    } catch (error) {
      console.log(chalk.red(`❌ Inventory lookup scenario failed`));
    }
    
    // Scenario 3: Shop valuation
    try {
      const valuation = await api.getInventoryValuation();
      if (valuation.total_value) {
        businessResults.scenarios++;
        console.log(chalk.green(`✅ Shop valuation: ₹${valuation.total_value.toLocaleString()} total inventory`));
      }
    } catch (error) {
      console.log(chalk.red(`❌ Shop valuation scenario failed`));
    }

    // 6. API Performance Testing
    console.log('\n' + chalk.blue('6. API Performance Testing'));
    console.log(chalk.gray('─'.repeat(40)));
    
    const performanceTests = [];
    
    // Test response times for key endpoints
    const testEndpoints = [
      { name: 'Health Check', fn: () => api.checkSystemHealth() },
      { name: 'Gold Rates', fn: () => api.getCurrentGoldRates() },
      { name: 'Inventory List', fn: () => api.getInventoryItems({ limit: 10 }) },
      { name: 'Price Calculation', fn: () => api.calculateItemPrice({ weight: 5, purity: '22K', making_charge_percentage: 10 }) }
    ];
    
    for (const test of testEndpoints) {
      try {
        const startTime = Date.now();
        await test.fn();
        const responseTime = Date.now() - startTime;
        performanceTests.push({ name: test.name, responseTime });
        
        const status = responseTime < 2000 ? 'Fast' : responseTime < 5000 ? 'Acceptable' : 'Slow';
        const color = responseTime < 2000 ? chalk.green : responseTime < 5000 ? chalk.yellow : chalk.red;
        console.log(color(`✅ ${test.name}: ${responseTime}ms (${status})`));
      } catch (error) {
        console.log(chalk.red(`❌ ${test.name}: Failed (${error.message})`));
        performanceTests.push({ name: test.name, responseTime: -1 });
      }
    }

    // Final Assessment
    console.log('\n' + chalk.blue.bold('📋 FINAL VERIFICATION REPORT'));
    console.log(chalk.gray('═'.repeat(50)));
    
    const overallScore = calculateOverallScore({
      healthyServices,
      totalServices,
      userResults,
      inventoryResults,
      pricingResults,
      businessResults,
      performanceTests
    });

    let overallStatus, statusColor;
    if (overallScore >= 90) {
      overallStatus = 'EXCELLENT - READY FOR DEMO';
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
    console.log(chalk.blue(`🏥 Service Health: ${healthyServices}/${totalServices} services`));
    console.log(chalk.blue(`👥 User Management: ${userResults.loginTest ? 'Working' : 'Issues'}`));
    console.log(chalk.blue(`📦 Inventory: ${inventoryResults.items} items, ₹${inventoryResults.totalValue.toLocaleString()}`));
    console.log(chalk.blue(`💰 Pricing: ${Object.keys(pricingResults.goldRates).length} rates, ${pricingResults.calculations} calculations`));
    console.log(chalk.blue(`🎯 Business Scenarios: ${businessResults.scenarios}/${businessResults.totalScenarios} working`));
    
    const avgResponseTime = performanceTests
      .filter(t => t.responseTime > 0)
      .reduce((sum, t) => sum + t.responseTime, 0) / performanceTests.filter(t => t.responseTime > 0).length;
    console.log(chalk.blue(`⚡ Avg Response Time: ${avgResponseTime.toFixed(0)}ms`));

    if (overallScore >= 75) {
      console.log(chalk.green.bold('\n✅ SYSTEM READY FOR CLIENT DEMO!'));
      console.log(chalk.green('   Your jewelry shop management system has comprehensive demo data.'));
      console.log(chalk.blue('\n🎯 Ready for client presentation with confidence!'));
    } else {
      console.log(chalk.yellow.bold('\n⚠️  SYSTEM NEEDS ATTENTION'));
      console.log(chalk.yellow('   Some components may need attention before client demo.'));
      console.log(chalk.blue('\n💡 Consider running data loading scripts to populate more demo data.'));
    }

    console.log(chalk.gray('\n' + '═'.repeat(50)));

    return {
      success: true,
      overallScore,
      results: {
        health: healthResults,
        users: userResults,
        inventory: inventoryResults,
        pricing: pricingResults,
        business: businessResults,
        performance: performanceTests
      }
    };

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Verification failed:'), error.message);
    return { success: false, error: error.message };
  }
}

function calculateOverallScore(data) {
  let score = 0;
  
  // Service health (25%)
  score += (data.healthyServices / data.totalServices) * 25;
  
  // User management (20%)
  score += (data.userResults.loginTest ? 20 : 0);
  
  // Inventory (25%)
  score += (data.inventoryResults.items > 0 ? 15 : 0);
  score += (data.inventoryResults.totalValue > 0 ? 10 : 0);
  
  // Pricing (20%)
  score += (Object.keys(data.pricingResults.goldRates).length > 0 ? 10 : 0);
  score += (data.pricingResults.calculations > 0 ? 10 : 0);
  
  // Business scenarios (10%)
  score += (data.businessResults.scenarios / data.businessResults.totalScenarios) * 10;
  
  return Math.min(100, score);
}

// Run the script if called directly
if (require.main === module) {
  verifyAPI()
    .then(result => {
      if (result.success && result.overallScore >= 75) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(chalk.red('\n❌ Unexpected error:'), error);
      process.exit(1);
    });
}

module.exports = verifyAPI;