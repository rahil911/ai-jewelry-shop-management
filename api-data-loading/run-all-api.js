#!/usr/bin/env node

const chalk = require('chalk');
const path = require('path');

// Import all loading scripts
const loadUsers = require('./scripts/01-load-users-api');
const loadInventory = require('./scripts/02-load-inventory-api');
const testPricing = require('./scripts/03-test-pricing-api');
const verifyAPI = require('./scripts/99-verify-api');

const APIClient = require('./utils/api-client');

console.log(chalk.blue.bold('\n🚀 Jewelry Shop Management System - API Data Loading\n'));
console.log(chalk.gray('This script will populate the Azure backend services with comprehensive demo data via API calls.\n'));

// Main execution function
async function runAllAPILoading() {
  const startTime = Date.now();
  const results = {};
  
  console.log(chalk.yellow('📋 API Data Loading Sequence:'));
  console.log('   1. System Health Check');
  console.log('   2. User Registration (Staff + Customers)');
  console.log('   3. Inventory Population (Jewelry Items)');
  console.log('   4. Pricing Service Testing');
  console.log('   5. Final Verification & Demo Readiness');
  console.log('');

  try {
    // Test API connectivity first
    console.log(chalk.blue('🔍 Testing API connectivity...'));
    const api = new APIClient();
    const healthResults = await api.checkServicesHealth();
    
    const healthyServices = Object.values(healthResults).filter(r => r.status === 'healthy').length;
    const totalServices = Object.keys(healthResults).length;
    
    if (healthyServices === 0) {
      throw new Error('No services are accessible. Please check Azure backend deployment.');
    }
    
    console.log(chalk.green(`✅ API connectivity verified: ${healthyServices}/${totalServices} services healthy\n`));

    // Execute loading scripts in sequence
    const scripts = [
      { name: 'User Registration', func: loadUsers, step: 1 },
      { name: 'Inventory Population', func: loadInventory, step: 2 },
      { name: 'Pricing Service Testing', func: testPricing, step: 3 },
      { name: 'Final Verification', func: verifyAPI, step: 4 }
    ];

    for (const script of scripts) {
      console.log(chalk.blue.bold(`\n📦 Step ${script.step}: ${script.name}...`));
      console.log(chalk.gray('─'.repeat(60)));
      
      try {
        const result = await script.func();
        results[script.name] = result;
        
        if (result.success) {
          console.log(chalk.green(`✅ ${script.name} completed successfully`));
          
          // Display summary if available
          if (result.summary) {
            console.log(chalk.blue('   Summary:'));
            if (script.name === 'User Registration') {
              console.log(`     Users created: ${result.summary.successful}/${result.summary.totalUsers}`);
              console.log(`     Breakdown: ${result.summary.breakdown.customers} customers, ${result.summary.breakdown.staff} staff, ${result.summary.breakdown.admins} admins`);
            } else if (script.name === 'Inventory Population') {
              console.log(`     Items added: ${result.summary.successful}/${result.summary.totalItems}`);
              console.log(`     Total value: ₹${result.summary.totalValue.toLocaleString()}`);
            } else if (script.name === 'Final Verification') {
              console.log(`     Overall score: ${result.overallScore.toFixed(1)}%`);
              console.log(`     Demo ready: ${result.overallScore >= 75 ? 'Yes' : 'Needs attention'}`);
            }
          }
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
    console.log(chalk.blue.bold('\n📊 API DATA LOADING SUMMARY REPORT'));
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
    
    // Final system status check
    console.log(chalk.blue.bold('\n🎯 FINAL SYSTEM STATUS'));
    console.log(chalk.gray('─'.repeat(50)));
    
    try {
      const finalHealth = await api.checkServicesHealth();
      const finalHealthyServices = Object.values(finalHealth).filter(r => r.status === 'healthy').length;
      
      // Quick data verification
      const quickChecks = {};
      
      try {
        const inventory = await api.getInventoryItems({ limit: 1 });
        quickChecks.inventory = inventory.items?.length > 0;
      } catch (error) {
        quickChecks.inventory = false;
      }
      
      try {
        const goldRates = await api.getCurrentGoldRates();
        quickChecks.pricing = Object.keys(goldRates).length > 0;
      } catch (error) {
        quickChecks.pricing = false;
      }
      
      console.log(chalk.cyan(`🏥 Services Online: ${finalHealthyServices}/${totalServices}`));
      console.log(chalk.cyan(`📦 Inventory Data: ${quickChecks.inventory ? 'Available' : 'Not Available'}`));
      console.log(chalk.cyan(`💰 Pricing Data: ${quickChecks.pricing ? 'Available' : 'Not Available'}`));
      
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not verify final system status'));
    }
    
    // Calculate execution time
    const executionTime = Math.round((Date.now() - startTime) / 1000);
    console.log(chalk.blue(`⏱️  Total Execution Time: ${executionTime} seconds`));
    
    // Generate demo readiness assessment
    console.log(chalk.blue.bold('\n🎯 DEMO READINESS ASSESSMENT'));
    console.log(chalk.gray('═'.repeat(50)));
    
    const finalVerification = results['Final Verification'];
    if (finalVerification && finalVerification.success && finalVerification.overallScore >= 75) {
      console.log(chalk.green.bold('🎉 SYSTEM IS DEMO READY!'));
      console.log(chalk.green('   Your jewelry shop management system is populated with demo data.'));
      console.log(chalk.blue('\n💡 Demo capabilities:'));
      console.log('   ✅ Real-time gold rate inquiries');
      console.log('   ✅ Jewelry price calculations');
      console.log('   ✅ Inventory browsing and search');
      console.log('   ✅ User authentication and management');
      console.log('   ✅ Business scenario demonstrations');
      console.log(chalk.blue('\n🚀 Ready for client presentation! 🎯\n'));
      return { success: true, results };
    } else {
      console.log(chalk.yellow.bold('⚠️  SYSTEM PARTIALLY READY'));
      console.log(chalk.yellow(`   Some components may need attention.`));
      console.log(chalk.blue('\n💡 Available features:'));
      Object.entries(results).forEach(([scriptName, result]) => {
        if (result.success) {
          console.log(`   ✅ ${scriptName}`);
        } else {
          console.log(`   ❌ ${scriptName}`);
        }
      });
      console.log(chalk.blue('\n🔧 Consider addressing failed components before demo.\n'));
      return { success: false, results };
    }
    
  } catch (error) {
    console.error(chalk.red.bold('\n❌ CRITICAL ERROR DURING API DATA LOADING'));
    console.error(chalk.red(error.message));
    console.error(chalk.gray(error.stack));
    return { success: false, error: error.message };
  }
}

// Run the master script
if (require.main === module) {
  console.log(chalk.blue('🎯 Starting API-based data loading process...\n'));
  
  runAllAPILoading()
    .then(result => {
      if (result.success) {
        console.log(chalk.green('✅ Master API loading script completed successfully'));
        process.exit(0);
      } else {
        console.log(chalk.red('❌ Master API loading script completed with errors'));
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(chalk.red('❌ Unexpected error in master API script:'), error);
      process.exit(1);
    });
}

module.exports = runAllAPILoading;