#!/usr/bin/env node

const chalk = require('chalk');
const APIClient = require('../utils/api-client');
const config = require('../config');

console.log(chalk.blue.bold('\n📦 Loading Inventory via API\n'));

async function loadInventory() {
  const api = new APIClient();
  
  try {
    console.log('🔍 Testing API connection...');
    await api.checkSystemHealth();
    console.log(chalk.green('✅ API connection successful\n'));

    // Check current gold rates for realistic pricing
    console.log('💰 Getting current gold rates...');
    let goldRates;
    try {
      goldRates = await api.getCurrentGoldRates();
      console.log(chalk.green(`   Current 22K gold rate: ₹${goldRates['22K'] || 6800} per gram`));
    } catch (error) {
      console.log(chalk.yellow('   Using default gold rates (API not available)'));
      goldRates = { '22K': 6800, '18K': 5600, '14K': 4200 };
    }

    // Generate realistic jewelry inventory
    const items = [];
    
    // Rings
    const rings = [
      { name: 'Classic Gold Ring', weight: 3.5, purity: '22K', category: 'rings', base_price: 23800 },
      { name: 'Diamond Engagement Ring', weight: 5.2, purity: '18K', category: 'rings', base_price: 85000 },
      { name: 'Antique Design Ring', weight: 4.8, purity: '22K', category: 'rings', base_price: 32640 },
      { name: 'Contemporary Gold Band', weight: 2.8, purity: '18K', category: 'rings', base_price: 15680 },
      { name: 'Traditional South Indian Ring', weight: 6.1, purity: '22K', category: 'rings', base_price: 41480 },
      { name: 'Platinum Ring with Diamonds', weight: 4.5, purity: 'platinum', category: 'rings', base_price: 125000 },
      { name: 'Rose Gold Designer Ring', weight: 3.8, purity: '18K', category: 'rings', base_price: 21280 },
      { name: 'Emerald Stone Ring', weight: 5.5, purity: '22K', category: 'rings', base_price: 37400 }
    ];

    // Necklaces
    const necklaces = [
      { name: 'Traditional Gold Chain', weight: 15.5, purity: '22K', category: 'necklaces', base_price: 105400 },
      { name: 'Designer Diamond Necklace', weight: 25.8, purity: '18K', category: 'necklaces', base_price: 385000 },
      { name: 'Mangalsutra Chain', weight: 12.3, purity: '22K', category: 'necklaces', base_price: 83640 },
      { name: 'Temple Jewelry Necklace', weight: 35.6, purity: '22K', category: 'necklaces', base_price: 242080 },
      { name: 'Pearl & Gold Necklace', weight: 18.9, purity: '18K', category: 'necklaces', base_price: 105840 },
      { name: 'Choker Style Necklace', weight: 8.7, purity: '22K', category: 'necklaces', base_price: 59160 },
      { name: 'Long Chain with Pendant', weight: 22.4, purity: '18K', category: 'necklaces', base_price: 125440 },
      { name: 'Bridal Necklace Set', weight: 45.2, purity: '22K', category: 'necklaces', base_price: 307360 }
    ];

    // Earrings
    const earrings = [
      { name: 'Gold Stud Earrings', weight: 2.8, purity: '22K', category: 'earrings', base_price: 19040 },
      { name: 'Jhumka Earrings', weight: 6.5, purity: '22K', category: 'earrings', base_price: 44200 },
      { name: 'Diamond Drop Earrings', weight: 4.2, purity: '18K', category: 'earrings', base_price: 95000 },
      { name: 'Chandbali Earrings', weight: 8.9, purity: '22K', category: 'earrings', base_price: 60520 },
      { name: 'Hoop Earrings', weight: 3.6, purity: '18K', category: 'earrings', base_price: 20160 },
      { name: 'Traditional Ear Chains', weight: 5.8, purity: '22K', category: 'earrings', base_price: 39440 },
      { name: 'Pearl Drop Earrings', weight: 4.5, purity: '18K', category: 'earrings', base_price: 25200 },
      { name: 'Temple Style Earrings', weight: 12.3, purity: '22K', category: 'earrings', base_price: 83640 }
    ];

    // Bracelets
    const bracelets = [
      { name: 'Gold Bangle Set', weight: 25.6, purity: '22K', category: 'bracelets', base_price: 174080 },
      { name: 'Designer Bracelet', weight: 8.9, purity: '18K', category: 'bracelets', base_price: 49840 },
      { name: 'Traditional Kada', weight: 35.8, purity: '22K', category: 'bracelets', base_price: 243440 },
      { name: 'Chain Bracelet', weight: 6.7, purity: '22K', category: 'bracelets', base_price: 45560 },
      { name: 'Diamond Tennis Bracelet', weight: 12.5, purity: '18K', category: 'bracelets', base_price: 185000 },
      { name: 'Antique Bangle', weight: 42.3, purity: '22K', category: 'bracelets', base_price: 287640 },
      { name: 'Flexible Gold Bracelet', weight: 15.8, purity: '18K', category: 'bracelets', base_price: 88480 },
      { name: 'Children Bracelet', weight: 4.2, purity: '22K', category: 'bracelets', base_price: 28560 }
    ];

    // Pendants
    const pendants = [
      { name: 'Om Pendant', weight: 3.8, purity: '22K', category: 'pendants', base_price: 25840 },
      { name: 'Ganesha Pendant', weight: 5.2, purity: '22K', category: 'pendants', base_price: 35360 },
      { name: 'Diamond Solitaire Pendant', weight: 2.5, purity: '18K', category: 'pendants', base_price: 75000 },
      { name: 'Heart Shaped Pendant', weight: 4.1, purity: '18K', category: 'pendants', base_price: 22960 },
      { name: 'Flower Design Pendant', weight: 6.8, purity: '22K', category: 'pendants', base_price: 46240 },
      { name: 'Religious Symbol Pendant', weight: 7.2, purity: '22K', category: 'pendants', base_price: 48960 },
      { name: 'Modern Geometric Pendant', weight: 3.2, purity: '18K', category: 'pendants', base_price: 17920 },
      { name: 'Vintage Locket Pendant', weight: 8.5, purity: '22K', category: 'pendants', base_price: 57800 }
    ];

    // Combine all items
    items.push(...rings, ...necklaces, ...earrings, ...bracelets, ...pendants);

    // Add SKUs and additional details
    items.forEach((item, index) => {
      const categoryCode = item.category.substring(0, 2).toUpperCase();
      item.sku = `${categoryCode}${String(index + 1).padStart(3, '0')}`;
      item.stock_quantity = Math.floor(Math.random() * 8) + 2; // 2-10 pieces
      item.metal_type = item.purity === 'platinum' ? 'platinum' : 'gold';
      
      // Calculate more realistic prices based on current rates
      if (item.metal_type === 'gold') {
        const ratePerGram = goldRates[item.purity] || 6800;
        const metalValue = item.weight * ratePerGram;
        const makingCharges = metalValue * 0.12; // 12% making charges
        item.base_price = Math.round(metalValue + makingCharges);
      }
    });

    console.log(`📝 Generated ${items.length} jewelry items across ${config.dataConfig.inventory.categories.length} categories`);
    console.log(`   Categories: ${items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {})}`);

    // Add items to inventory
    console.log('\n📤 Adding items to inventory...');
    const { results, errors } = await api.processBatch(items, async (item) => {
      const result = await api.createInventoryItem(item);
      if (result.success || result.message === 'Item already exists') {
        console.log(chalk.green(`   ✅ ${item.sku}: ${item.name} (₹${item.base_price.toLocaleString()})`));
      }
      return result;
    });

    console.log('\n✅ Verifying inventory...');
    
    // Get inventory summary
    try {
      const allItems = await api.getInventoryItems();
      const valuation = await api.getInventoryValuation();
      
      console.log(`   Total items in inventory: ${allItems.items?.length || 'N/A'}`);
      console.log(`   Total inventory value: ₹${valuation.total_value?.toLocaleString() || 'N/A'}`);
      
      // Test category filtering
      const rings = await api.getInventoryItems({ category: 'rings' });
      console.log(`   Rings in inventory: ${rings.items?.length || 'N/A'}`);
      
    } catch (error) {
      console.log(chalk.yellow(`   ⚠️ Inventory verification failed: ${error.message}`));
    }

    const summary = {
      totalItems: items.length,
      successful: results.length,
      errors: errors.length,
      categories: {
        rings: rings.length,
        necklaces: necklaces.length,
        earrings: earrings.length,
        bracelets: bracelets.length,
        pendants: pendants.length
      },
      totalValue: items.reduce((sum, item) => sum + (item.base_price * item.stock_quantity), 0)
    };

    console.log('\n📊 Inventory Loading Summary:');
    console.log(`   Total items: ${summary.totalItems}`);
    console.log(`   Successfully added: ${summary.successful}`);
    console.log(`   Errors: ${summary.errors}`);
    console.log(`   Total inventory value: ₹${summary.totalValue.toLocaleString()}`);
    console.log(`   Category breakdown:`, summary.categories);

    if (errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      errors.slice(0, 5).forEach(error => {
        console.log(`   ${error.item.sku}: ${error.error}`);
      });
    }

    console.log(chalk.green.bold('\n✅ Inventory data loading completed successfully!\n'));

    return {
      success: true,
      summary
    };

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error loading inventory data:'), error.message);
    return { success: false, error: error.message };
  }
}

// Run the script if called directly
if (require.main === module) {
  loadInventory()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('❌ Unexpected error:'), error);
      process.exit(1);
    });
}

module.exports = loadInventory;