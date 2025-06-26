#!/usr/bin/env node

const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const ProgressBar = require('progress');

const db = require('../config/database');
const settings = require('../config/settings');

console.log(chalk.blue.bold('\n🏺 Loading Inventory and Jewelry Items\n'));

// Generate jewelry inventory data with realistic Indian jewelry
function generateInventoryData() {
  console.log('🎯 Generating comprehensive jewelry inventory...');
  
  const metalTypes = [];
  const purities = [];
  const categories = [];
  const suppliers = [];
  const jewelryItems = [];

  // 1. Metal Types
  settings.jewelry.metalTypes.forEach(metal => {
    metalTypes.push({
      id: uuidv4(),
      name: metal.name,
      symbol: metal.symbol,
      current_rate: metal.currentRate,
      rate_per: 'gram',
      rate_source: metal.rateSource,
      is_active: true,
      created_at: new Date(),
    });
  });

  // 2. Purities
  settings.jewelry.purities.forEach(purity => {
    const metalType = metalTypes.find(m => m.symbol === purity.metalSymbol);
    if (metalType) {
      purities.push({
        id: uuidv4(),
        metal_type_id: metalType.id,
        purity_name: purity.name,
        purity_percentage: purity.percentage,
        making_charge_rate: purity.makingChargeRate,
        is_active: true,
        created_at: new Date(),
      });
    }
  });

  // 3. Categories with multilingual names
  settings.jewelry.categories.forEach((category, index) => {
    categories.push({
      id: uuidv4(),
      name: category.name,
      name_hi: category.nameHi,
      name_kn: category.nameKn,
      description: `Premium ${category.name.toLowerCase()} collection with traditional and modern designs`,
      parent_id: null,
      making_charge_percentage: category.makingChargePercentage,
      image_url: `https://images.jewelryshop.com/categories/${category.name.toLowerCase()}.jpg`,
      sort_order: index + 1,
      is_active: true,
      created_at: new Date(),
    });
  });

  // 4. Suppliers
  const supplierData = [
    {
      name: 'Mumbai Gold Suppliers Pvt Ltd',
      contact_person: 'Raj Patel',
      email: 'raj@mumbaiGold.com',
      phone: '+91-9876543210',
      gst_number: '27ABCDE1234F1Z5',
      address: '123 Zaveri Bazaar, Mumbai, Maharashtra 400002',
    },
    {
      name: 'Bangalore Jewelry Manufacturers',
      contact_person: 'Priya Sharma',
      email: 'priya@bangalorejewelry.com',
      phone: '+91-9876543211',
      gst_number: '29FGHIJ5678K2M6',
      address: '456 Chickpet, Bangalore, Karnataka 560053',
    },
    {
      name: 'Chennai Silver Works',
      contact_person: 'Suresh Kumar',
      email: 'suresh@chennaisilver.com',
      phone: '+91-9876543212',
      gst_number: '33LMNOP9012N3P4',
      address: '789 T.Nagar, Chennai, Tamil Nadu 600017',
    },
    {
      name: 'Delhi Diamond House',
      contact_person: 'Anita Gupta',
      email: 'anita@delhidiamond.com',
      phone: '+91-9876543213',
      gst_number: '07QRSTU3456Q4R5',
      address: '321 Karol Bagh, New Delhi, Delhi 110005',
    },
  ];

  supplierData.forEach(supplier => {
    suppliers.push({
      id: uuidv4(),
      name: supplier.name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      gst_number: supplier.gst_number,
      address: supplier.address,
      payment_terms: '30 days credit',
      credit_limit: 50000000, // 50 lakh credit limit
      is_active: true,
      created_at: new Date(),
    });
  });

  // 5. Generate Jewelry Items
  console.log('💎 Generating jewelry items for each category...');
  
  categories.forEach(category => {
    const categoryName = category.name.toLowerCase();
    const itemNames = settings.jewelryNames[categoryName] || [`${category.name} Item`];
    const itemCount = settings.dataGeneration.inventory[categoryName] || 20;
    
    console.log(`   Creating ${itemCount} ${category.name.toLowerCase()}...`);
    
    for (let i = 0; i < itemCount; i++) {
      const itemName = itemNames[Math.floor(Math.random() * itemNames.length)];
      const metalType = metalTypes[Math.floor(Math.random() * metalTypes.length)];
      const relevantPurities = purities.filter(p => p.metal_type_id === metalType.id);
      const purity = relevantPurities[Math.floor(Math.random() * relevantPurities.length)];
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      
      // Generate realistic jewelry specifications
      const baseWeight = generateWeightForCategory(categoryName);
      const stoneWeight = Math.random() > 0.7 ? parseFloat((Math.random() * 2).toFixed(3)) : 0; // 30% have stones
      const netWeight = parseFloat((baseWeight - stoneWeight).toFixed(3));
      const grossWeight = baseWeight;
      
      // Calculate pricing
      const metalRate = metalType.current_rate;
      const makingChargePercentage = category.making_charge_percentage;
      const makingCharges = parseFloat(((netWeight * metalRate * makingChargePercentage) / 100).toFixed(2));
      const stoneCharges = stoneWeight > 0 ? parseFloat((stoneWeight * 5000 + Math.random() * 10000).toFixed(2)) : 0; // Stones cost 5K-15K per gram
      const wastagePercentage = 2.0 + Math.random() * 1.5; // 2-3.5% wastage
      const wastageAmount = parseFloat(((netWeight * metalRate * wastagePercentage) / 100).toFixed(2));
      const otherCharges = parseFloat((Math.random() * 500).toFixed(2)); // Small misc charges
      
      const basePrice = parseFloat((netWeight * metalRate).toFixed(2));
      const totalCost = basePrice + makingCharges + stoneCharges + wastageAmount + otherCharges;
      const sellingPrice = parseFloat((totalCost * (1.15 + Math.random() * 0.25)).toFixed(2)); // 15-40% markup
      const costPrice = parseFloat((totalCost * 0.85).toFixed(2)); // Cost includes supplier margin
      const mrp = parseFloat((sellingPrice * 1.1).toFixed(2)); // MRP is 10% above selling price
      
      // Generate SKU
      const categoryCode = category.name.substring(0, 2).toUpperCase();
      const metalCode = metalType.symbol;
      const purityCode = purity.purity_name.replace('K', '').replace('925', 'S925').replace('950', 'P950');
      const itemNumber = String(i + 1).padStart(3, '0');
      const sku = `${categoryCode}${metalCode}${purityCode}${itemNumber}`;
      
      // Generate barcode (EAN-13 format)
      const barcode = `${890}${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`;
      
      // Realistic stock quantities
      const stockQuantity = Math.floor(Math.random() * 15) + 1; // 1-15 pieces
      const minStockLevel = Math.floor(stockQuantity * 0.3); // 30% of current stock as minimum
      
      // Generate multilingual names
      const nameVariations = generateMultilingualNames(itemName, metalType.name, purity.purity_name);
      
      // Generate realistic attributes
      const colors = ['Gold', 'Rose Gold', 'White Gold', 'Silver', 'Platinum', 'Yellow Gold'];
      const sizes = ['XS', 'S', 'M', 'L', 'XL', 'Free Size'];
      const occasions = ['Daily Wear', 'Wedding', 'Festival', 'Party', 'Office', 'Casual', 'Traditional', 'Modern'];
      const styles = ['Traditional', 'Modern', 'Antique', 'Contemporary', 'Designer', 'Vintage', 'Ethnic', 'Fusion'];
      const genders = ['unisex', 'female', 'male'];
      const ageGroups = ['adult', 'kids', 'senior'];
      
      // Generate care instructions
      const careInstructions = generateCareInstructions(metalType.name, stoneWeight > 0);
      
      // Generate tags for search
      const tags = [
        category.name.toLowerCase(),
        metalType.name.toLowerCase(),
        purity.purity_name.toLowerCase(),
        itemName.toLowerCase().replace(/\s+/g, '-'),
        'jewelry',
        'handcrafted',
        'indian',
        'premium'
      ];
      
      // Generate image URLs
      const imageCount = 1 + Math.floor(Math.random() * 4); // 1-4 images per item
      const images = [];
      for (let j = 0; j < imageCount; j++) {
        images.push(`https://images.jewelryshop.com/items/${sku.toLowerCase()}_${j + 1}.jpg`);
      }
      
      // Generate certifications (for premium items)
      const certifications = [];
      if (sellingPrice > 50000) { // Premium items get certifications
        certifications.push(`BIS${Math.floor(Math.random() * 1000000)}`);
        if (stoneWeight > 0 && Math.random() > 0.5) {
          certifications.push(`GIA${Math.floor(Math.random() * 1000000)}`);
        }
      }
      
      const jewelryItem = {
        id: uuidv4(),
        sku: sku,
        barcode: barcode,
        name: itemName,
        name_hi: nameVariations.hindi,
        name_kn: nameVariations.kannada,
        description: generateDescription(itemName, metalType.name, purity.purity_name, grossWeight, stoneWeight > 0),
        category_id: category.id,
        metal_type_id: metalType.id,
        purity_id: purity.id,
        gross_weight: grossWeight,
        net_weight: netWeight,
        stone_weight: stoneWeight,
        making_charges: makingCharges,
        wastage_percentage: parseFloat(wastagePercentage.toFixed(2)),
        stone_charges: stoneCharges,
        other_charges: otherCharges,
        base_price: basePrice,
        selling_price: sellingPrice,
        cost_price: costPrice,
        mrp: mrp,
        stock_quantity: stockQuantity,
        min_stock_level: minStockLevel,
        size: Math.random() > 0.7 ? sizes[Math.floor(Math.random() * sizes.length)] : null,
        color: colors[Math.floor(Math.random() * colors.length)],
        occasion: occasions[Math.floor(Math.random() * occasions.length)],
        gender: genders[Math.floor(Math.random() * genders.length)],
        age_group: ageGroups[Math.floor(Math.random() * ageGroups.length)],
        style: styles[Math.floor(Math.random() * styles.length)],
        images: images,
        certifications: certifications,
        tags: tags,
        is_customizable: Math.random() > 0.6, // 40% customizable
        is_available: Math.random() > 0.05, // 95% available
        is_featured: Math.random() > 0.8, // 20% featured
        location: `${['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]}${Math.floor(Math.random() * 20) + 1}`, // Storage location
        supplier_id: supplier.id,
        purchase_date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000), // Purchased within last 6 months
        warranty_months: metalType.name === 'Gold' ? 12 : metalType.name === 'Silver' ? 6 : 24,
        care_instructions: careInstructions,
        created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Added within last 3 months
      };
      
      jewelryItems.push(jewelryItem);
    }
  });

  console.log(`✅ Generated ${jewelryItems.length} jewelry items across ${categories.length} categories`);
  
  return {
    metalTypes,
    purities,
    categories,
    suppliers,
    jewelryItems,
  };
}

// Helper functions
function generateWeightForCategory(category) {
  const weights = {
    rings: () => 3 + Math.random() * 8, // 3-11 grams
    necklaces: () => 15 + Math.random() * 40, // 15-55 grams
    earrings: () => 2 + Math.random() * 6, // 2-8 grams
    bangles: () => 8 + Math.random() * 25, // 8-33 grams
    chains: () => 5 + Math.random() * 20, // 5-25 grams
    pendants: () => 2 + Math.random() * 5, // 2-7 grams
  };
  
  const weightFunc = weights[category] || (() => 5 + Math.random() * 10);
  return parseFloat(weightFunc().toFixed(3));
}

function generateMultilingualNames(englishName, metalName, purity) {
  // Simple translation patterns (in a real app, use proper translation service)
  const translations = {
    hindi: {
      'Ring': 'अंगूठी',
      'Necklace': 'हार',
      'Earrings': 'कानरी',
      'Bangles': 'कंगन',
      'Chain': 'चेन',
      'Pendant': 'लकेट',
      'Gold': 'सोना',
      'Silver': 'चांदी',
      'Diamond': 'हीरा',
      'Traditional': 'पारंपरिक',
      'Temple': 'मंदिर',
    },
    kannada: {
      'Ring': 'ಉಂಗುರ',
      'Necklace': 'ಹಾರ',
      'Earrings': 'ಕಿವಿಯೋಲೆ',
      'Bangles': 'ಕಂಕಣ',
      'Chain': 'ಚೈನ್',
      'Pendant': 'ಪೆಂಡೆಂಟ್',
      'Gold': 'ಚಿನ್ನ',
      'Silver': 'ಬೆಳ್ಳಿ',
      'Diamond': 'ವಜ್ರ',
      'Traditional': 'ಸಾಂಪ್ರದಾಯಿಕ',
      'Temple': 'ದೇವಸ್ಥಾನ',
    },
  };
  
  let hindiName = englishName;
  let kannadaName = englishName;
  
  // Replace known words
  Object.keys(translations.hindi).forEach(word => {
    const regex = new RegExp(word, 'gi');
    hindiName = hindiName.replace(regex, translations.hindi[word]);
    kannadaName = kannadaName.replace(regex, translations.kannada[word]);
  });
  
  return {
    hindi: hindiName,
    kannada: kannadaName,
  };
}

function generateDescription(name, metal, purity, weight, hasStones) {
  const descriptions = [
    `Exquisite ${name.toLowerCase()} crafted in premium ${purity} ${metal.toLowerCase()}`,
    `Beautiful handcrafted ${name.toLowerCase()} with intricate detailing`,
    `Traditional ${name.toLowerCase()} featuring authentic Indian craftsmanship`,
    `Designer ${name.toLowerCase()} perfect for special occasions`,
    `Elegant ${name.toLowerCase()} with contemporary styling`,
  ];
  
  let description = descriptions[Math.floor(Math.random() * descriptions.length)];
  description += `. Weighing ${weight}g, this piece combines traditional artistry with modern appeal.`;
  
  if (hasStones) {
    description += ' Enhanced with carefully selected gemstones for added brilliance.';
  }
  
  description += ' Perfect for gifting or personal collection. Comes with quality assurance and warranty.';
  
  return description;
}

function generateCareInstructions(metalType, hasStones) {
  const baseInstructions = {
    Gold: 'Clean with mild soap and warm water. Store in a dry place away from harsh chemicals.',
    Silver: 'Clean with silver polish cloth. Store in anti-tarnish bags to prevent oxidation.',
    Platinum: 'Clean with jewelry cleaner or mild soap. Professional cleaning recommended annually.',
  };
  
  let instructions = baseInstructions[metalType] || baseInstructions.Gold;
  
  if (hasStones) {
    instructions += ' Handle gemstones carefully and avoid ultrasonic cleaning unless recommended.';
  }
  
  instructions += ' Avoid contact with perfumes, lotions, and cleaning products.';
  
  return instructions;
}

// Main function to load inventory data
async function loadInventory() {
  try {
    console.log('🔍 Testing database connection...');
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    console.log('📊 Checking existing data...');
    const existingCounts = {
      metalTypes: await db.getRowCount('metal_types'),
      purities: await db.getRowCount('purities'),
      categories: await db.getRowCount('categories'),
      suppliers: await db.getRowCount('suppliers'),
      jewelryItems: await db.getRowCount('jewelry_items'),
    };
    
    console.log('   Current data:');
    Object.entries(existingCounts).forEach(([table, count]) => {
      console.log(`     ${table}: ${count}`);
    });

    console.log('🎲 Generating inventory data...');
    const inventoryData = generateInventoryData();
    
    // Insert data in dependency order
    const tables = [
      { name: 'metal_types', data: inventoryData.metalTypes, displayName: 'Metal Types' },
      { name: 'purities', data: inventoryData.purities, displayName: 'Purities' },
      { name: 'categories', data: inventoryData.categories, displayName: 'Categories' },
      { name: 'suppliers', data: inventoryData.suppliers, displayName: 'Suppliers' },
      { name: 'jewelry_items', data: inventoryData.jewelryItems, displayName: 'Jewelry Items' },
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

      const batchSize = table.name === 'jewelry_items' ? 50 : settings.performance.batchSize;
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

    // Verify final counts
    console.log('\n✅ Verifying data...');
    const finalCounts = {
      metalTypes: await db.getRowCount('metal_types'),
      purities: await db.getRowCount('purities'),
      categories: await db.getRowCount('categories'),
      suppliers: await db.getRowCount('suppliers'),
      jewelryItems: await db.getRowCount('jewelry_items'),
    };
    
    console.log('   Final counts:');
    Object.entries(finalCounts).forEach(([table, count]) => {
      console.log(`     ${table}: ${count}`);
    });

    // Display sample inventory
    console.log('\n📋 Sample inventory items:');
    const sampleItems = await db.query(`
      SELECT 
        ji.sku,
        ji.name,
        c.name as category,
        mt.symbol as metal,
        p.purity_name as purity,
        ji.gross_weight,
        ji.selling_price,
        ji.stock_quantity
      FROM jewelry_items ji
      JOIN categories c ON ji.category_id = c.id
      JOIN metal_types mt ON ji.metal_type_id = mt.id
      JOIN purities p ON ji.purity_id = p.id
      ORDER BY ji.selling_price DESC
      LIMIT 8
    `);
    
    sampleItems.rows.forEach(item => {
      console.log(`   ${item.sku.padEnd(12)} ${item.name.substring(0, 25).padEnd(25)} ${item.category.padEnd(10)} ${item.metal}${item.purity.padEnd(6)} ${item.gross_weight}g ₹${item.selling_price.toLocaleString().padStart(8)} (${item.stock_quantity} in stock)`);
    });

    // Display inventory statistics
    console.log('\n📊 Inventory statistics:');
    const stats = await db.query(`
      SELECT 
        c.name as category,
        COUNT(*) as items,
        SUM(ji.stock_quantity) as total_quantity,
        AVG(ji.selling_price) as avg_price,
        SUM(ji.selling_price * ji.stock_quantity) as total_value
      FROM jewelry_items ji
      JOIN categories c ON ji.category_id = c.id
      GROUP BY c.name
      ORDER BY total_value DESC
    `);
    
    stats.rows.forEach(stat => {
      console.log(`   ${stat.category.padEnd(12)} ${stat.items.toString().padEnd(6)} items, ${stat.total_quantity.toString().padEnd(6)} pieces, avg ₹${Math.round(stat.avg_price).toLocaleString().padStart(8)}, total ₹${Math.round(stat.total_value).toLocaleString().padStart(10)}`);
    });

    console.log(chalk.green.bold('\n✅ Inventory data loading completed successfully!\n'));

    return {
      success: true,
      results: finalCounts,
    };

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error loading inventory data:'), error.message);
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
    metal_types: ['symbol'],
    purities: ['metal_type_id', 'purity_name'],
    categories: ['name'],
    suppliers: ['name'],
    jewelry_items: ['sku'],
  };
  return conflicts[tableName] || [];
}

function getUpdateColumns(tableName) {
  const updates = {
    metal_types: ['current_rate', 'rate_source', 'last_updated'],
    purities: ['purity_percentage', 'making_charge_rate'],
    categories: ['description', 'making_charge_percentage'],
    suppliers: ['contact_person', 'email', 'phone'],
    jewelry_items: ['selling_price', 'stock_quantity', 'is_available'],
  };
  return updates[tableName] || [];
}

// Run the script if called directly
if (require.main === module) {
  loadInventory()
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

module.exports = loadInventory;