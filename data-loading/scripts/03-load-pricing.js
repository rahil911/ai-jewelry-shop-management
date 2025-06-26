#!/usr/bin/env node

const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const ProgressBar = require('progress');

const db = require('../config/database');
const settings = require('../config/settings');

console.log(chalk.blue.bold('\n💰 Loading Pricing and Gold Rates Data\n'));

// Generate pricing and gold rates data
function generatePricingData() {
  console.log('📈 Generating comprehensive pricing data...');
  
  const goldRatesHistory = [];
  const makingChargesConfig = [];
  const pricingRules = [];

  // 1. Generate Gold Rates History (last 6 months of daily rates)
  console.log('   Creating historical gold rates...');
  
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6); // 6 months ago
  
  // Base rates for different metals
  const baseRates = {
    'Gold': 6500,
    'Silver': 80,
    'Platinum': 3100,
  };
  
  // Generate daily rates for the last 6 months
  const totalDays = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
  
  for (let dayOffset = 0; dayOffset <= totalDays; dayOffset++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + dayOffset);
    
    // Skip weekends for more realistic market data
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      continue;
    }
    
    Object.entries(baseRates).forEach(([metalName, baseRate]) => {
      // Simulate market fluctuations
      const volatility = metalName === 'Gold' ? 0.02 : metalName === 'Silver' ? 0.03 : 0.015; // Different volatility for different metals
      const daysSinceStart = dayOffset;
      const trendFactor = 1 + (daysSinceStart / totalDays) * 0.15; // 15% upward trend over 6 months
      const randomFactor = 1 + (Math.random() - 0.5) * volatility * 2; // Daily volatility
      const weeklyFactor = 1 + Math.sin(dayOffset / 7) * 0.005; // Weekly patterns
      
      const adjustedRate = baseRate * trendFactor * randomFactor * weeklyFactor;
      const ratePerGram = parseFloat(adjustedRate.toFixed(2));
      const ratePerTola = parseFloat((ratePerGram * 11.664).toFixed(2)); // 1 tola = 11.664 grams
      
      // Rate sources vary for realism
      const sources = [
        'Mumbai Gold Market',
        'Delhi Bullion Market',
        'International Gold Exchange',
        'London Metal Exchange',
        'Multi Commodity Exchange',
      ];
      const rateSource = sources[Math.floor(Math.random() * sources.length)];
      
      goldRatesHistory.push({
        id: uuidv4(),
        metal_type_id: null, // Will be set when we have metal_type IDs
        metal_name: metalName, // Temporary field for lookup
        rate_per_gram: ratePerGram,
        rate_per_tola: ratePerTola,
        rate_source: rateSource,
        recorded_at: currentDate,
      });
    });
  }

  console.log(`   Generated ${goldRatesHistory.length} historical rate records`);

  // 2. Making Charges Configuration
  console.log('   Creating making charges configuration...');
  
  const makingChargesData = [
    // Gold making charges by category
    { category: 'Rings', metal: 'Gold', purity: '22K', chargeType: 'percentage', rate: 12.0, minCharge: 500, maxCharge: 5000 },
    { category: 'Rings', metal: 'Gold', purity: '18K', chargeType: 'percentage', rate: 10.0, minCharge: 400, maxCharge: 4000 },
    { category: 'Rings', metal: 'Gold', purity: '14K', chargeType: 'percentage', rate: 8.0, minCharge: 300, maxCharge: 3000 },
    
    { category: 'Necklaces', metal: 'Gold', purity: '22K', chargeType: 'percentage', rate: 10.0, minCharge: 1000, maxCharge: 15000 },
    { category: 'Necklaces', metal: 'Gold', purity: '18K', chargeType: 'percentage', rate: 8.0, minCharge: 800, maxCharge: 12000 },
    { category: 'Necklaces', metal: 'Gold', purity: '14K', chargeType: 'percentage', rate: 7.0, minCharge: 600, maxCharge: 10000 },
    
    { category: 'Earrings', metal: 'Gold', purity: '22K', chargeType: 'percentage', rate: 15.0, minCharge: 300, maxCharge: 3000 },
    { category: 'Earrings', metal: 'Gold', purity: '18K', chargeType: 'percentage', rate: 12.0, minCharge: 250, maxCharge: 2500 },
    { category: 'Earrings', metal: 'Gold', purity: '14K', chargeType: 'percentage', rate: 10.0, minCharge: 200, maxCharge: 2000 },
    
    { category: 'Bangles', metal: 'Gold', purity: '22K', chargeType: 'percentage', rate: 8.0, minCharge: 800, maxCharge: 8000 },
    { category: 'Bangles', metal: 'Gold', purity: '18K', chargeType: 'percentage', rate: 7.0, minCharge: 600, maxCharge: 6000 },
    { category: 'Bangles', metal: 'Gold', purity: '14K', chargeType: 'percentage', rate: 6.0, minCharge: 500, maxCharge: 5000 },
    
    { category: 'Chains', metal: 'Gold', purity: '22K', chargeType: 'percentage', rate: 6.0, minCharge: 400, maxCharge: 4000 },
    { category: 'Chains', metal: 'Gold', purity: '18K', chargeType: 'percentage', rate: 5.0, minCharge: 300, maxCharge: 3000 },
    { category: 'Chains', metal: 'Gold', purity: '14K', chargeType: 'percentage', rate: 4.0, minCharge: 250, maxCharge: 2500 },
    
    { category: 'Pendants', metal: 'Gold', purity: '22K', chargeType: 'percentage', rate: 18.0, minCharge: 200, maxCharge: 2000 },
    { category: 'Pendants', metal: 'Gold', purity: '18K', chargeType: 'percentage', rate: 15.0, minCharge: 180, maxCharge: 1800 },
    { category: 'Pendants', metal: 'Gold', purity: '14K', chargeType: 'percentage', rate: 12.0, minCharge: 150, maxCharge: 1500 },
    
    // Silver making charges
    { category: 'Rings', metal: 'Silver', purity: '925', chargeType: 'percentage', rate: 20.0, minCharge: 50, maxCharge: 500 },
    { category: 'Necklaces', metal: 'Silver', purity: '925', chargeType: 'percentage', rate: 18.0, minCharge: 100, maxCharge: 1000 },
    { category: 'Earrings', metal: 'Silver', purity: '925', chargeType: 'percentage', rate: 25.0, minCharge: 40, maxCharge: 400 },
    { category: 'Bangles', metal: 'Silver', purity: '925', chargeType: 'percentage', rate: 15.0, minCharge: 80, maxCharge: 800 },
    { category: 'Chains', metal: 'Silver', purity: '925', chargeType: 'percentage', rate: 12.0, minCharge: 60, maxCharge: 600 },
    { category: 'Pendants', metal: 'Silver', purity: '925', chargeType: 'percentage', rate: 30.0, minCharge: 30, maxCharge: 300 },
    
    // Platinum making charges
    { category: 'Rings', metal: 'Platinum', purity: '950', chargeType: 'percentage', rate: 15.0, minCharge: 800, maxCharge: 8000 },
    { category: 'Necklaces', metal: 'Platinum', purity: '950', chargeType: 'percentage', rate: 12.0, minCharge: 1500, maxCharge: 20000 },
    { category: 'Earrings', metal: 'Platinum', purity: '950', chargeType: 'percentage', rate: 18.0, minCharge: 500, maxCharge: 5000 },
    { category: 'Bangles', metal: 'Platinum', purity: '950', chargeType: 'percentage', rate: 10.0, minCharge: 1200, maxCharge: 12000 },
    { category: 'Chains', metal: 'Platinum', purity: '950', chargeType: 'percentage', rate: 8.0, minCharge: 800, maxCharge: 8000 },
    { category: 'Pendants', metal: 'Platinum', purity: '950', chargeType: 'percentage', rate: 20.0, minCharge: 400, maxCharge: 4000 },
  ];

  makingChargesData.forEach(charge => {
    const isPercentage = charge.chargeType === 'percentage';
    
    makingChargesConfig.push({
      id: uuidv4(),
      category_id: null, // Will be set during insertion
      purity_id: null, // Will be set during insertion
      category_name: charge.category, // Temporary for lookup
      metal_name: charge.metal, // Temporary for lookup
      purity_name: charge.purity, // Temporary for lookup
      charge_type: charge.chargeType,
      rate_value: charge.rate,
      minimum_charge: charge.minCharge,
      maximum_charge: charge.maxCharge,
      weight_range_min: 0,
      weight_range_max: null,
      location_id: null,
      effective_from: new Date(),
      effective_to: null,
      is_active: true,
      created_at: new Date(),
    });
  });

  console.log(`   Generated ${makingChargesConfig.length} making charges configurations`);

  // 3. Pricing Rules (Discounts and Offers)
  console.log('   Creating pricing rules and offers...');
  
  const pricingRulesData = [
    {
      ruleName: 'Bulk Purchase Discount',
      ruleType: 'quantity_discount',
      conditions: { minimum_quantity: 5 },
      discountType: 'percentage',
      discountValue: 5.0,
      minimumAmount: 50000,
      maxDiscount: 10000,
      validDays: 365,
    },
    {
      ruleName: 'Wedding Collection Offer',
      ruleType: 'category_discount',
      conditions: { categories: ['Necklaces', 'Earrings', 'Bangles'] },
      discountType: 'percentage',
      discountValue: 8.0,
      minimumAmount: 100000,
      maxDiscount: 15000,
      validDays: 90,
    },
    {
      ruleName: 'Loyalty Customer Discount',
      ruleType: 'loyalty_discount',
      conditions: { minimum_loyalty_points: 1000 },
      discountType: 'percentage',
      discountValue: 3.0,
      minimumAmount: 10000,
      maxDiscount: 5000,
      validDays: 365,
    },
    {
      ruleName: 'Festival Special Offer',
      ruleType: 'seasonal_offer',
      conditions: { festival_season: true },
      discountType: 'percentage',
      discountValue: 10.0,
      minimumAmount: 25000,
      maxDiscount: 8000,
      validDays: 30,
    },
    {
      ruleName: 'First Time Customer',
      ruleType: 'customer_discount',
      conditions: { first_purchase: true },
      discountType: 'fixed_amount',
      discountValue: 1000,
      minimumAmount: 15000,
      maxDiscount: 1000,
      validDays: 60,
    },
    {
      ruleName: 'Senior Citizen Discount',
      ruleType: 'customer_discount',
      conditions: { customer_age: { min: 60 } },
      discountType: 'percentage',
      discountValue: 5.0,
      minimumAmount: 20000,
      maxDiscount: 5000,
      validDays: 365,
    },
    {
      ruleName: 'Gold Exchange Bonus',
      ruleType: 'category_discount',
      conditions: { exchange_item: true, categories: ['Rings', 'Necklaces'] },
      discountType: 'percentage',
      discountValue: 3.0,
      minimumAmount: 30000,
      maxDiscount: 3000,
      validDays: 180,
    },
  ];

  pricingRulesData.forEach(rule => {
    const validFrom = new Date();
    const validTo = new Date();
    validTo.setDate(validFrom.getDate() + rule.validDays);
    
    pricingRules.push({
      id: uuidv4(),
      rule_name: rule.ruleName,
      rule_type: rule.ruleType,
      conditions: rule.conditions,
      discount_type: rule.discountType,
      discount_value: rule.discountValue,
      minimum_amount: rule.minimumAmount,
      maximum_discount: rule.maxDiscount,
      valid_from: validFrom,
      valid_to: validTo,
      usage_limit: null,
      usage_count: Math.floor(Math.random() * 20), // Some rules have been used
      is_active: true,
      created_at: new Date(),
    });
  });

  console.log(`   Generated ${pricingRules.length} pricing rules`);

  return {
    goldRatesHistory,
    makingChargesConfig,
    pricingRules,
  };
}

// Link foreign keys
async function linkForeignKeys(data) {
  console.log('🔗 Linking foreign key relationships...');
  
  // Get metal types, purities, and categories from database
  const metalTypes = await db.query('SELECT id, name, symbol FROM metal_types');
  const purities = await db.query('SELECT id, metal_type_id, purity_name FROM purities');
  const categories = await db.query('SELECT id, name FROM categories');
  
  const metalTypesMap = {};
  metalTypes.rows.forEach(mt => {
    metalTypesMap[mt.name] = mt.id;
  });
  
  const puritiesMap = {};
  purities.rows.forEach(p => {
    puritiesMap[p.purity_name] = p.id;
  });
  
  const categoriesMap = {};
  categories.rows.forEach(c => {
    categoriesMap[c.name] = c.id;
  });
  
  // Link gold rates history
  data.goldRatesHistory.forEach(rate => {
    rate.metal_type_id = metalTypesMap[rate.metal_name];
    delete rate.metal_name; // Remove temporary field
  });
  
  // Link making charges config
  data.makingChargesConfig.forEach(config => {
    config.category_id = categoriesMap[config.category_name];
    config.purity_id = puritiesMap[config.purity_name];
    delete config.category_name;
    delete config.metal_name;
    delete config.purity_name;
  });
  
  // Filter out records that couldn't be linked
  data.goldRatesHistory = data.goldRatesHistory.filter(rate => rate.metal_type_id);
  data.makingChargesConfig = data.makingChargesConfig.filter(config => config.category_id && config.purity_id);
  
  console.log(`   Linked ${data.goldRatesHistory.length} gold rates`);
  console.log(`   Linked ${data.makingChargesConfig.length} making charges`);
}

// Main function to load pricing data
async function loadPricing() {
  try {
    console.log('🔍 Testing database connection...');
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    console.log('📊 Checking existing data...');
    const existingCounts = {
      goldRatesHistory: await db.getRowCount('gold_rates_history'),
      makingChargesConfig: await db.getRowCount('making_charges_config'),
      pricingRules: await db.getRowCount('pricing_rules'),
    };
    
    console.log('   Current data:');
    Object.entries(existingCounts).forEach(([table, count]) => {
      console.log(`     ${table}: ${count}`);
    });

    console.log('🎲 Generating pricing data...');
    const pricingData = generatePricingData();
    
    // Link foreign keys
    await linkForeignKeys(pricingData);
    
    // Insert data in order
    const tables = [
      { name: 'gold_rates_history', data: pricingData.goldRatesHistory, displayName: 'Gold Rates History' },
      { name: 'making_charges_config', data: pricingData.makingChargesConfig, displayName: 'Making Charges Config' },
      { name: 'pricing_rules', data: pricingData.pricingRules, displayName: 'Pricing Rules' },
    ];

    const results = {};

    for (const table of tables) {
      console.log(`\n📥 Inserting ${table.displayName}...`);
      
      if (table.data.length === 0) {
        console.log(`   No ${table.displayName.toLowerCase()} to insert`);
        continue;
      }

      const progressBar = new ProgressBar(`   ${table.displayName} [:bar] :current/:total (:percent) :etas`, {
        complete: '█',
        incomplete: '░',
        width: 30,
        total: table.data.length
      });

      const batchSize = settings.performance.batchSize;
      let totalInserted = 0;

      for (let i = 0; i < table.data.length; i += batchSize) {
        const batch = table.data.slice(i, i + batchSize);
        
        try {
          // Different conflict resolution for different tables
          const conflictColumns = getConflictColumns(table.name);
          const updateColumns = getUpdateColumns(table.name);
          
          const result = await db.bulkInsert(table.name, batch, conflictColumns, updateColumns);
          totalInserted += result.inserted;
          progressBar.tick(batch.length);
        } catch (error) {
          console.error(`\n❌ Error inserting ${table.name} batch ${i}-${i + batch.length}:`, error.message);
          progressBar.tick(batch.length);
        }
      }

      results[table.name] = totalInserted;
      console.log(`   ✅ Inserted ${totalInserted} ${table.displayName.toLowerCase()}`);
    }

    // Update current metal rates in metal_types table
    console.log('\n💱 Updating current metal rates...');
    const latestRates = await db.query(`
      SELECT DISTINCT ON (metal_type_id) 
        metal_type_id, 
        rate_per_gram 
      FROM gold_rates_history 
      ORDER BY metal_type_id, recorded_at DESC
    `);
    
    for (const rate of latestRates.rows) {
      await db.query(
        'UPDATE metal_types SET current_rate = $1, last_updated = CURRENT_TIMESTAMP WHERE id = $2',
        [rate.rate_per_gram, rate.metal_type_id]
      );
    }
    console.log(`   Updated current rates for ${latestRates.rows.length} metals`);

    // Verify final counts
    console.log('\n✅ Verifying data...');
    const finalCounts = {
      goldRatesHistory: await db.getRowCount('gold_rates_history'),
      makingChargesConfig: await db.getRowCount('making_charges_config'),
      pricingRules: await db.getRowCount('pricing_rules'),
    };
    
    console.log('   Final counts:');
    Object.entries(finalCounts).forEach(([table, count]) => {
      console.log(`     ${table}: ${count}`);
    });

    // Display current rates
    console.log('\n📋 Current metal rates:');
    const currentRates = await db.query(`
      SELECT 
        mt.name,
        mt.symbol,
        mt.current_rate,
        mt.rate_source,
        mt.last_updated
      FROM metal_types mt
      WHERE mt.is_active = true
      ORDER BY mt.current_rate DESC
    `);
    
    currentRates.rows.forEach(rate => {
      console.log(`   ${rate.symbol.padEnd(4)} ${rate.name.padEnd(10)} ₹${rate.current_rate.toString().padStart(8)}/g (${rate.rate_source})`);
    });

    // Display making charges summary
    console.log('\n📋 Making charges summary:');
    const makingChargesSummary = await db.query(`
      SELECT 
        c.name as category,
        p.purity_name,
        mcc.charge_type,
        mcc.rate_value,
        mcc.minimum_charge,
        mcc.maximum_charge
      FROM making_charges_config mcc
      JOIN categories c ON mcc.category_id = c.id
      JOIN purities p ON mcc.purity_id = p.id
      ORDER BY c.name, p.purity_name
      LIMIT 12
    `);
    
    makingChargesSummary.rows.forEach(charge => {
      const rateDisplay = charge.charge_type === 'percentage' ? `${charge.rate_value}%` : `₹${charge.rate_value}`;
      console.log(`   ${charge.category.padEnd(12)} ${charge.purity_name.padEnd(6)} ${rateDisplay.padEnd(8)} (₹${charge.minimum_charge}-₹${charge.maximum_charge})`);
    });

    // Display active pricing rules
    console.log('\n📋 Active pricing rules:');
    const activePricingRules = await db.query(`
      SELECT 
        rule_name,
        rule_type,
        discount_type,
        discount_value,
        minimum_amount,
        maximum_discount,
        usage_count
      FROM pricing_rules
      WHERE is_active = true AND valid_to > CURRENT_DATE
      ORDER BY discount_value DESC
      LIMIT 8
    `);
    
    activePricingRules.rows.forEach(rule => {
      const discountDisplay = rule.discount_type === 'percentage' ? `${rule.discount_value}%` : `₹${rule.discount_value}`;
      console.log(`   ${rule.rule_name.substring(0, 25).padEnd(25)} ${discountDisplay.padEnd(8)} (min ₹${rule.minimum_amount.toLocaleString()}, max ₹${rule.maximum_discount.toLocaleString()}) - used ${rule.usage_count} times`);
    });

    console.log(chalk.green.bold('\n✅ Pricing data loading completed successfully!\n'));

    return {
      success: true,
      results: finalCounts,
    };

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error loading pricing data:'), error.message);
    console.error(error.stack);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Helper functions for conflict resolution
function getConflictColumns(tableName) {
  const conflicts = {
    gold_rates_history: ['metal_type_id', 'recorded_at'],
    making_charges_config: ['category_id', 'purity_id', 'charge_type'],
    pricing_rules: ['rule_name'],
  };
  return conflicts[tableName] || [];
}

function getUpdateColumns(tableName) {
  const updates = {
    gold_rates_history: ['rate_per_gram', 'rate_per_tola', 'rate_source'],
    making_charges_config: ['rate_value', 'minimum_charge', 'maximum_charge'],
    pricing_rules: ['discount_value', 'minimum_amount', 'maximum_discount', 'usage_count'],
  };
  return updates[tableName] || [];
}

// Run the script if called directly
if (require.main === module) {
  loadPricing()
    .then(result => {
      if (result.success) {
        console.log(chalk.green('✅ Script completed successfully'));
        process.exit(0);
      } else {
        console.log(chalk.red('❌ Script failed'));
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(chalk.red('❌ Unexpected error:'), error);
      process.exit(1);
    });
}

module.exports = loadPricing;