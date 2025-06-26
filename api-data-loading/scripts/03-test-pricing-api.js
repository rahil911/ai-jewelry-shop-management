#!/usr/bin/env node

const chalk = require('chalk');
const APIClient = require('../utils/api-client');

console.log(chalk.blue.bold('\n💰 Testing Pricing Service API\n'));

async function testPricing() {
  const api = new APIClient();
  
  try {
    console.log('🔍 Testing pricing service...');
    
    // Test current gold rates
    console.log('\n📈 Current Gold Rates:');
    try {
      const goldRates = await api.getCurrentGoldRates();
      console.log(chalk.green('✅ Gold rates retrieved successfully:'));
      Object.entries(goldRates).forEach(([purity, rate]) => {
        console.log(`   ${purity}: ₹${rate} per gram`);
      });
    } catch (error) {
      console.log(chalk.red(`❌ Gold rates failed: ${error.message}`));
    }

    // Test historical rates
    console.log('\n📊 Historical Gold Rates (7 days):');
    try {
      const history = await api.getGoldRateHistory(7);
      console.log(chalk.green('✅ Historical data retrieved successfully'));
      if (history.data && history.data.length > 0) {
        console.log(`   Records found: ${history.data.length}`);
        console.log(`   Latest entry: ${history.data[0]?.date || 'N/A'}`);
      }
    } catch (error) {
      console.log(chalk.red(`❌ Historical rates failed: ${error.message}`));
    }

    // Test making charges
    console.log('\n🔧 Making Charges Configuration:');
    try {
      const makingCharges = await api.getMakingCharges();
      console.log(chalk.green('✅ Making charges retrieved successfully'));
      if (makingCharges.success && makingCharges.data) {
        console.log(`   Configuration entries: ${makingCharges.data.length || 'N/A'}`);
      }
    } catch (error) {
      console.log(chalk.red(`❌ Making charges failed: ${error.message}`));
    }

    // Test price calculations
    console.log('\n🧮 Price Calculations:');
    
    const testCalculations = [
      { description: '10g 22K Gold Ring (12% making charges)', weight: 10, purity: '22K', making_charge_percentage: 12 },
      { description: '25g 18K Gold Necklace (15% making charges)', weight: 25, purity: '18K', making_charge_percentage: 15 },
      { description: '5g 14K Gold Earrings (20% making charges)', weight: 5, purity: '14K', making_charge_percentage: 20 },
      { description: '50g 22K Gold Bangle (10% making charges)', weight: 50, purity: '22K', making_charge_percentage: 10 },
      { description: '2.5g 18K Gold Pendant (18% making charges)', weight: 2.5, purity: '18K', making_charge_percentage: 18 }
    ];

    let successfulCalculations = 0;
    const calculationResults = [];

    for (const calc of testCalculations) {
      try {
        const result = await api.calculateItemPrice({
          weight: calc.weight,
          purity: calc.purity,
          making_charge_percentage: calc.making_charge_percentage
        });
        
        if (result.success && result.total_price) {
          successfulCalculations++;
          calculationResults.push({
            description: calc.description,
            totalPrice: result.total_price,
            breakdown: result.breakdown || result
          });
          console.log(chalk.green(`   ✅ ${calc.description}: ₹${result.total_price.toLocaleString()}`));
        } else {
          console.log(chalk.red(`   ❌ ${calc.description}: Invalid response`));
        }
      } catch (error) {
        console.log(chalk.red(`   ❌ ${calc.description}: ${error.message}`));
      }
    }

    // Test edge cases
    console.log('\n🧪 Edge Case Testing:');
    
    const edgeCases = [
      { description: 'Very small weight (0.5g)', weight: 0.5, purity: '22K', making_charge_percentage: 15 },
      { description: 'Large weight (100g)', weight: 100, purity: '22K', making_charge_percentage: 8 },
      { description: 'High making charges (25%)', weight: 10, purity: '18K', making_charge_percentage: 25 }
    ];

    let successfulEdgeCases = 0;
    for (const edgeCase of edgeCases) {
      try {
        const result = await api.calculateItemPrice({
          weight: edgeCase.weight,
          purity: edgeCase.purity,
          making_charge_percentage: edgeCase.making_charge_percentage
        });
        
        if (result.success && result.total_price) {
          successfulEdgeCases++;
          console.log(chalk.green(`   ✅ ${edgeCase.description}: ₹${result.total_price.toLocaleString()}`));
        }
      } catch (error) {
        console.log(chalk.red(`   ❌ ${edgeCase.description}: ${error.message}`));
      }
    }

    // Test error handling
    console.log('\n⚠️ Error Handling Tests:');
    
    const errorTests = [
      { description: 'Missing weight parameter', data: { purity: '22K', making_charge_percentage: 12 } },
      { description: 'Missing purity parameter', data: { weight: 10, making_charge_percentage: 12 } },
      { description: 'Invalid purity', data: { weight: 10, purity: '25K', making_charge_percentage: 12 } },
      { description: 'Negative weight', data: { weight: -5, purity: '22K', making_charge_percentage: 12 } }
    ];

    let properErrorHandling = 0;
    for (const test of errorTests) {
      try {
        const result = await api.calculateItemPrice(test.data);
        if (!result.success || result.error) {
          properErrorHandling++;
          console.log(chalk.green(`   ✅ ${test.description}: Properly handled`));
        } else {
          console.log(chalk.yellow(`   ⚠️ ${test.description}: Should have failed`));
        }
      } catch (error) {
        properErrorHandling++;
        console.log(chalk.green(`   ✅ ${test.description}: Error caught (${error.response?.status || 'Network'})`));
      }
    }

    // Summary
    const summary = {
      goldRatesTest: 'completed',
      historicalRatesTest: 'completed',
      makingChargesTest: 'completed',
      calculationsSuccessful: successfulCalculations,
      totalCalculations: testCalculations.length,
      edgeCasesSuccessful: successfulEdgeCases,
      totalEdgeCases: edgeCases.length,
      errorHandlingSuccessful: properErrorHandling,
      totalErrorTests: errorTests.length,
      sampleResults: calculationResults.slice(0, 3)
    };

    console.log('\n📊 Pricing Service Test Summary:');
    console.log(`   Price calculations: ${summary.calculationsSuccessful}/${summary.totalCalculations} successful`);
    console.log(`   Edge case handling: ${summary.edgeCasesSuccessful}/${summary.totalEdgeCases} successful`);
    console.log(`   Error handling: ${summary.errorHandlingSuccessful}/${summary.totalErrorTests} proper`);
    
    if (calculationResults.length > 0) {
      console.log('\n💰 Sample Price Calculations:');
      calculationResults.slice(0, 3).forEach(result => {
        console.log(`   ${result.description}: ₹${result.totalPrice.toLocaleString()}`);
      });
    }

    const totalTests = summary.totalCalculations + summary.totalEdgeCases + summary.totalErrorTests;
    const totalSuccess = summary.calculationsSuccessful + summary.edgeCasesSuccessful + summary.errorHandlingSuccessful;
    const successRate = Math.round((totalSuccess / totalTests) * 100);
    
    console.log(`\n🎯 Overall Success Rate: ${successRate}% (${totalSuccess}/${totalTests})`);

    console.log(chalk.green.bold('\n✅ Pricing service testing completed!\n'));

    return {
      success: true,
      summary
    };

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error testing pricing service:'), error.message);
    return { success: false, error: error.message };
  }
}

// Run the script if called directly
if (require.main === module) {
  testPricing()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('❌ Unexpected error:'), error);
      process.exit(1);
    });
}

module.exports = testPricing;