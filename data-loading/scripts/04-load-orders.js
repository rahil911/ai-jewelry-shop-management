#!/usr/bin/env node

const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const ProgressBar = require('progress');

const db = require('../config/database');
const settings = require('../config/settings');

console.log(chalk.blue.bold('\n🛒 Loading Orders and Transactions Data\n'));

// Generate orders and related data
function generateOrdersData() {
  console.log('📋 Generating comprehensive orders data...');
  
  const orders = [];
  const orderItems = [];
  const customizations = [];
  const repairServices = [];

  // Order configuration
  const orderTypes = ['purchase', 'repair', 'customization', 'exchange'];
  const orderStatuses = ['pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled'];
  const deliveryTypes = ['pickup', 'home_delivery', 'courier'];
  
  const totalOrders = settings.dataGeneration.orders.total;
  console.log(`   Creating ${totalOrders} orders...`);

  // Generate orders over the last 12 months
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);

  for (let i = 0; i < totalOrders; i++) {
    const orderId = uuidv4();
    
    // Generate realistic order date (weighted towards recent months)
    const daysAgo = Math.floor(Math.pow(Math.random(), 0.3) * 365); // More recent orders more likely
    const orderDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Generate order number
    const orderNumber = `ORD${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}${String(i + 1).padStart(4, '0')}`;
    
    // Determine order status based on age
    let status;
    if (daysAgo < 7) {
      // Recent orders - mix of statuses
      status = ['pending', 'confirmed', 'processing'][Math.floor(Math.random() * 3)];
    } else if (daysAgo < 30) {
      // Last month - mostly completed or ready
      status = Math.random() > 0.1 ? 'completed' : 'ready';
    } else {
      // Older orders - mostly completed, some cancelled
      status = Math.random() > 0.15 ? 'completed' : 'cancelled';
    }
    
    // Order type distribution
    const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
    const deliveryType = deliveryTypes[Math.floor(Math.random() * deliveryTypes.length)];
    
    // Calculate estimated completion based on order type
    let estimatedCompletion = new Date(orderDate);
    if (orderType === 'repair') {
      estimatedCompletion.setDate(estimatedCompletion.getDate() + 7 + Math.floor(Math.random() * 14)); // 7-21 days
    } else if (orderType === 'customization') {
      estimatedCompletion.setDate(estimatedCompletion.getDate() + 14 + Math.floor(Math.random() * 21)); // 14-35 days
    } else {
      estimatedCompletion.setDate(estimatedCompletion.getDate() + 1 + Math.floor(Math.random() * 7)); // 1-7 days
    }
    
    // Generate special instructions
    const instructions = [
      'Rush order for wedding ceremony',
      'Please handle with extra care',
      'Custom engraving required',
      'Gift wrapping needed',
      'Delivery before festival',
      'Size adjustment may be needed',
      'Customer prefers morning delivery',
      'Fragile item - special packaging',
      'VIP customer - priority handling',
      null, null, null // 30% orders have no special instructions
    ];
    const specialInstructions = instructions[Math.floor(Math.random() * instructions.length)];
    
    // Generate delivery address (for home delivery)
    const addresses = [
      '123 MG Road, Bangalore, Karnataka 560001',
      '456 Brigade Road, Bangalore, Karnataka 560025',
      '789 Commercial Street, Bangalore, Karnataka 560001',
      '321 Koramangala, Bangalore, Karnataka 560034',
      '654 Indiranagar, Bangalore, Karnataka 560038',
      '987 Jayanagar, Bangalore, Karnataka 560011',
      '147 Malleswaram, Bangalore, Karnataka 560003',
      '258 Whitefield, Bangalore, Karnataka 560066',
      '369 Electronic City, Bangalore, Karnataka 560100',
      '741 Hebbal, Bangalore, Karnataka 560024',
    ];
    
    const deliveryAddress = deliveryType === 'home_delivery' ? 
      addresses[Math.floor(Math.random() * addresses.length)] : null;
    
    // Calculate delivery date
    const deliveryDate = estimatedCompletion;
    if (status === 'completed' && deliveryType !== 'pickup') {
      deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 3)); // Delivered within 3 days of completion
    }
    
    // Determine completion date
    const completedAt = (status === 'completed' || status === 'cancelled') ? 
      new Date(orderDate.getTime() + Math.random() * (Date.now() - orderDate.getTime())) : null;

    const order = {
      id: orderId,
      order_number: orderNumber,
      customer_id: null, // Will be set during insertion
      staff_id: null, // Will be set during insertion
      order_type: orderType,
      status: status,
      priority: Math.random() > 0.8 ? 'high' : Math.random() > 0.6 ? 'urgent' : 'normal',
      subtotal: 0, // Will be calculated from items
      making_charges_total: 0,
      stone_charges_total: 0,
      wastage_total: 0,
      discount_amount: 0,
      discount_type: null,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 0,
      total_amount: 0,
      advance_paid: 0,
      balance_amount: 0,
      payment_status: 'pending',
      delivery_type: deliveryType,
      delivery_address: deliveryAddress,
      delivery_date: status === 'completed' ? deliveryDate : null,
      special_instructions: specialInstructions,
      estimated_completion: estimatedCompletion,
      completed_at: completedAt,
      created_at: orderDate,
      updated_at: completedAt || orderDate,
    };

    orders.push(order);

    // Generate order items (1-4 items per order)
    const itemCount = 1 + Math.floor(Math.random() * 4);
    let orderSubtotal = 0;
    let orderMakingCharges = 0;
    let orderStoneCharges = 0;
    let orderWastage = 0;

    for (let j = 0; j < itemCount; j++) {
      const itemId = uuidv4();
      
      // Generate realistic pricing for item
      const basePrice = 10000 + Math.random() * 200000; // ₹10K to ₹2L
      const quantity = Math.random() > 0.8 ? 2 : 1; // 20% chance of quantity 2
      const unitPrice = parseFloat(basePrice.toFixed(2));
      const makingCharges = parseFloat((basePrice * 0.1 * (1 + Math.random())).toFixed(2)); // 10-20% making charges
      const stoneCharges = Math.random() > 0.7 ? parseFloat((Math.random() * 5000).toFixed(2)) : 0; // 30% have stone charges
      const wastageCharges = parseFloat((basePrice * 0.02).toFixed(2)); // 2% wastage
      const totalPrice = parseFloat(((unitPrice + makingCharges + stoneCharges + wastageCharges) * quantity).toFixed(2));
      
      // Update order totals
      orderSubtotal += unitPrice * quantity;
      orderMakingCharges += makingCharges * quantity;
      orderStoneCharges += stoneCharges * quantity;
      orderWastage += wastageCharges * quantity;
      
      // Generate customization details
      const customizationDetails = generateCustomizationDetails();
      
      const orderItem = {
        id: itemId,
        order_id: orderId,
        jewelry_item_id: null, // Will be set during insertion
        quantity: quantity,
        unit_price: unitPrice,
        making_charges: makingCharges,
        stone_charges: stoneCharges,
        wastage_charges: wastageCharges,
        total_price: totalPrice,
        gold_rate_at_time: 6500 + Math.random() * 600, // Gold rate at time of order
        customization_details: customizationDetails.details,
        special_instructions: customizationDetails.instructions,
        is_gift: Math.random() > 0.8, // 20% are gifts
        gift_message: Math.random() > 0.8 ? generateGiftMessage() : null,
        created_at: orderDate,
      };

      orderItems.push(orderItem);

      // Generate customizations if needed
      if (customizationDetails.hasCustomization) {
        const customization = {
          id: uuidv4(),
          order_item_id: itemId,
          customization_type: customizationDetails.type,
          description: customizationDetails.description,
          additional_cost: customizationDetails.cost,
          additional_weight: customizationDetails.weight,
          estimated_days: customizationDetails.days,
          status: getCustomizationStatus(status),
          completed_at: status === 'completed' ? completedAt : null,
          created_at: orderDate,
        };
        customizations.push(customization);
      }
    }

    // Calculate final order amounts
    const discountAmount = Math.random() > 0.7 ? parseFloat((orderSubtotal * (0.02 + Math.random() * 0.08)).toFixed(2)) : 0; // 30% get discount
    const discountType = discountAmount > 0 ? (Math.random() > 0.5 ? 'percentage' : 'fixed') : null;
    
    const totalBeforeTax = orderSubtotal + orderMakingCharges + orderStoneCharges + orderWastage - discountAmount;
    const gstRate = 0.03; // 3% GST for jewelry
    const gstAmount = parseFloat((totalBeforeTax * gstRate).toFixed(2));
    const totalAmount = parseFloat((totalBeforeTax + gstAmount).toFixed(2));
    
    // Payment status based on order status
    let paymentStatus = 'pending';
    let advancePaid = 0;
    let balanceAmount = totalAmount;
    
    if (status === 'confirmed' || status === 'processing') {
      paymentStatus = 'partial';
      advancePaid = parseFloat((totalAmount * (0.3 + Math.random() * 0.4)).toFixed(2)); // 30-70% advance
      balanceAmount = parseFloat((totalAmount - advancePaid).toFixed(2));
    } else if (status === 'completed') {
      paymentStatus = 'paid';
      advancePaid = totalAmount;
      balanceAmount = 0;
    } else if (status === 'cancelled') {
      paymentStatus = advancePaid > 0 ? 'refunded' : 'pending';
      balanceAmount = totalAmount;
    }

    // Update order with calculated amounts
    order.subtotal = parseFloat(orderSubtotal.toFixed(2));
    order.making_charges_total = parseFloat(orderMakingCharges.toFixed(2));
    order.stone_charges_total = parseFloat(orderStoneCharges.toFixed(2));
    order.wastage_total = parseFloat(orderWastage.toFixed(2));
    order.discount_amount = discountAmount;
    order.discount_type = discountType;
    order.cgst_amount = parseFloat((gstAmount / 2).toFixed(2)); // CGST is half of total GST
    order.sgst_amount = parseFloat((gstAmount / 2).toFixed(2)); // SGST is half of total GST
    order.igst_amount = 0; // IGST only for interstate transactions
    order.total_amount = totalAmount;
    order.advance_paid = advancePaid;
    order.balance_amount = balanceAmount;
    order.payment_status = paymentStatus;
  }

  // Generate repair services (separate from orders)
  console.log('   Creating repair service requests...');
  const repairCount = Math.floor(totalOrders * 0.2); // 20% of total orders are repairs
  
  for (let i = 0; i < repairCount; i++) {
    const repairId = uuidv4();
    const repairDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000); // Last 6 months
    
    const repairStatuses = ['received', 'diagnosed', 'in_progress', 'completed', 'ready_for_pickup', 'delivered'];
    const repairTypes = ['cleaning', 'polishing', 'stone_setting', 'size_adjustment', 'chain_repair', 'clasp_replacement'];
    
    const repairNumber = `REP${repairDate.getFullYear()}${String(repairDate.getMonth() + 1).padStart(2, '0')}${String(i + 1).padStart(4, '0')}`;
    const repairType = repairTypes[Math.floor(Math.random() * repairTypes.length)];
    const status = repairStatuses[Math.floor(Math.random() * repairStatuses.length)];
    
    const estimatedCost = 500 + Math.random() * 4500; // ₹500 to ₹5000
    const actualCost = status === 'completed' || status === 'delivered' ? 
      estimatedCost * (0.8 + Math.random() * 0.4) : null; // 80-120% of estimated
    
    const estimatedDays = 3 + Math.floor(Math.random() * 14); // 3-17 days
    const completionDate = status === 'completed' || status === 'delivered' ? 
      new Date(repairDate.getTime() + estimatedDays * 24 * 60 * 60 * 1000) : null;

    const repairService = {
      id: repairId,
      customer_id: null, // Will be set during insertion
      staff_id: null, // Will be set during insertion
      repair_number: repairNumber,
      item_description: generateRepairItemDescription(),
      issue_description: generateRepairIssueDescription(repairType),
      estimated_cost: parseFloat(estimatedCost.toFixed(2)),
      actual_cost: actualCost ? parseFloat(actualCost.toFixed(2)) : null,
      estimated_days: estimatedDays,
      status: status,
      received_date: repairDate.toISOString().split('T')[0],
      completion_date: completionDate ? completionDate.toISOString().split('T')[0] : null,
      images: generateRepairImages(),
      parts_used: generatePartsUsed(repairType),
      labor_charges: parseFloat((estimatedCost * 0.6).toFixed(2)), // 60% labor
      material_charges: parseFloat((estimatedCost * 0.4).toFixed(2)), // 40% material
      warranty_days: 90,
      created_at: repairDate,
      updated_at: completionDate || repairDate,
    };

    repairServices.push(repairService);
  }

  console.log(`✅ Generated ${orders.length} orders with ${orderItems.length} items`);
  console.log(`✅ Generated ${customizations.length} customizations`);
  console.log(`✅ Generated ${repairServices.length} repair services`);

  return {
    orders,
    orderItems,
    customizations,
    repairServices,
  };
}

// Helper functions
function generateCustomizationDetails() {
  const customizationTypes = [
    { type: 'engraving', prob: 0.15 },
    { type: 'size_change', prob: 0.12 },
    { type: 'design_modification', prob: 0.08 },
    { type: 'stone_setting', prob: 0.06 },
    { type: 'chain_length', prob: 0.05 },
  ];

  const hasCustomization = Math.random() < 0.25; // 25% have customizations
  
  if (!hasCustomization) {
    return { hasCustomization: false, details: null };
  }

  const customType = customizationTypes.find(ct => Math.random() < ct.prob) || customizationTypes[0];
  
  const details = {
    engraving: () => ({
      description: `Engrave "${generateEngravingText()}" on ${Math.random() > 0.5 ? 'inside' : 'back'}`,
      cost: 200 + Math.random() * 800,
      weight: 0,
      days: 2 + Math.floor(Math.random() * 3),
      instructions: 'Use elegant script font',
    }),
    size_change: () => ({
      description: `Resize from current to ${generateSize()}`,
      cost: 300 + Math.random() * 700,
      weight: Math.random() * 0.5,
      days: 1 + Math.floor(Math.random() * 2),
      instructions: 'Maintain original design proportions',
    }),
    design_modification: () => ({
      description: 'Modify design as per customer sketch',
      cost: 1000 + Math.random() * 3000,
      weight: Math.random() * 2,
      days: 7 + Math.floor(Math.random() * 14),
      instructions: 'Customer will provide detailed specifications',
    }),
    stone_setting: () => ({
      description: `Set ${generateStoneType()} stones as per design`,
      cost: 500 + Math.random() * 2000,
      weight: Math.random() * 1,
      days: 3 + Math.floor(Math.random() * 5),
      instructions: 'Use secure prong setting',
    }),
    chain_length: () => ({
      description: `Adjust chain length to ${16 + Math.floor(Math.random() * 8)} inches`,
      cost: 200 + Math.random() * 500,
      weight: Math.random() * 3,
      days: 1,
      instructions: 'Maintain chain pattern consistency',
    }),
  };

  const customDetail = details[customType.type]();
  
  return {
    hasCustomization: true,
    type: customType.type,
    description: customDetail.description,
    cost: parseFloat(customDetail.cost.toFixed(2)),
    weight: parseFloat(customDetail.weight.toFixed(3)),
    days: customDetail.days,
    instructions: customDetail.instructions,
    details: {
      type: customType.type,
      description: customDetail.description,
      specifications: customDetail.instructions,
    },
  };
}

function generateEngravingText() {
  const texts = [
    'Love Always', 'Forever Yours', 'JS ❤️ MP', 'Together Forever',
    'Happy Anniversary', 'My Beloved', 'सदा खुश रहो', 'ಪ್ರೀತಿ',
    '25.12.2024', 'Wedding Day', 'Blessed', 'Divine Grace'
  ];
  return texts[Math.floor(Math.random() * texts.length)];
}

function generateSize() {
  const sizes = ['XS', 'S', 'M', 'L', 'XL', '14', '16', '18', '20', '22'];
  return sizes[Math.floor(Math.random() * sizes.length)];
}

function generateStoneType() {
  const stones = ['diamond', 'ruby', 'emerald', 'sapphire', 'pearl', 'cubic zirconia'];
  return stones[Math.floor(Math.random() * stones.length)];
}

function generateGiftMessage() {
  const messages = [
    'Happy Birthday! With all my love.',
    'Congratulations on your special day!',
    'Wishing you happiness and prosperity.',
    'A token of my appreciation.',
    'May this bring you joy and good fortune.',
    'For the most special person in my life.',
    'Happy Anniversary, my dear!',
    'Celebrating your achievements!',
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function getCustomizationStatus(orderStatus) {
  const statusMapping = {
    pending: 'pending',
    confirmed: 'pending',
    processing: 'in_progress',
    ready: 'completed',
    completed: 'completed',
    cancelled: 'cancelled',
  };
  return statusMapping[orderStatus] || 'pending';
}

function generateRepairItemDescription() {
  const items = [
    '22K Gold Chain with broken clasp',
    '18K Gold Ring with loose stone',
    'Silver Bracelet needing polish',
    'Gold Earrings missing backing',
    'Platinum Ring requiring resize',
    'Gold Necklace with damaged link',
    'Diamond Ring needing prong tightening',
    'Silver Pendant with tarnishing',
    'Gold Bangle with dents',
    'Pearl Necklace with broken string',
  ];
  return items[Math.floor(Math.random() * items.length)];
}

function generateRepairIssueDescription(repairType) {
  const issues = {
    cleaning: 'Item has lost its shine and needs professional cleaning',
    polishing: 'Surface scratches and dullness require polishing',
    stone_setting: 'Stone is loose and needs to be reset securely',
    size_adjustment: 'Ring size needs to be increased by 2 sizes',
    chain_repair: 'Chain link is broken and needs welding',
    clasp_replacement: 'Clasp is damaged and needs replacement',
  };
  return issues[repairType] || 'General repair and maintenance required';
}

function generateRepairImages() {
  const imageCount = 1 + Math.floor(Math.random() * 3); // 1-3 images
  const images = [];
  for (let i = 0; i < imageCount; i++) {
    images.push(`https://images.jewelryshop.com/repairs/repair_${Date.now()}_${i + 1}.jpg`);
  }
  return images;
}

function generatePartsUsed(repairType) {
  const parts = {
    cleaning: { cleaning_solution: 1, polishing_cloth: 1 },
    polishing: { polishing_compound: 1, buffing_wheel: 1 },
    stone_setting: { prongs: 2, setting_compound: 1 },
    size_adjustment: { gold_material: '0.5g', soldering_wire: 1 },
    chain_repair: { solder: 1, chain_links: 2 },
    clasp_replacement: { clasp: 1, jump_rings: 2 },
  };
  return parts[repairType] || {};
}

// Link foreign keys for orders
async function linkOrderForeignKeys(data) {
  console.log('🔗 Linking order foreign key relationships...');
  
  // Get customers and staff
  const customers = await db.query('SELECT id FROM users WHERE role = $1 ORDER BY created_at', ['customer']);
  const staff = await db.query('SELECT id FROM users WHERE role != $1 ORDER BY created_at', ['customer']);
  const jewelryItems = await db.query('SELECT id FROM jewelry_items ORDER BY created_at');
  
  if (customers.rows.length === 0 || staff.rows.length === 0 || jewelryItems.rows.length === 0) {
    throw new Error('Required data not found. Please run user and inventory loading scripts first.');
  }
  
  // Link orders
  data.orders.forEach(order => {
    order.customer_id = customers.rows[Math.floor(Math.random() * customers.rows.length)].id;
    order.staff_id = staff.rows[Math.floor(Math.random() * staff.rows.length)].id;
  });
  
  // Link order items
  data.orderItems.forEach(item => {
    item.jewelry_item_id = jewelryItems.rows[Math.floor(Math.random() * jewelryItems.rows.length)].id;
  });
  
  // Link repair services
  data.repairServices.forEach(repair => {
    repair.customer_id = customers.rows[Math.floor(Math.random() * customers.rows.length)].id;
    repair.staff_id = staff.rows[Math.floor(Math.random() * staff.rows.length)].id;
  });
  
  console.log(`   Linked ${data.orders.length} orders to customers and staff`);
  console.log(`   Linked ${data.orderItems.length} order items to jewelry items`);
  console.log(`   Linked ${data.repairServices.length} repair services to customers and staff`);
}

// Main function to load orders data
async function loadOrders() {
  try {
    console.log('🔍 Testing database connection...');
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    console.log('📊 Checking existing data...');
    const existingCounts = {
      orders: await db.getRowCount('orders'),
      orderItems: await db.getRowCount('order_items'),
      customizations: await db.getRowCount('customizations'),
      repairServices: await db.getRowCount('repair_services'),
    };
    
    console.log('   Current data:');
    Object.entries(existingCounts).forEach(([table, count]) => {
      console.log(`     ${table}: ${count}`);
    });

    console.log('🎲 Generating orders data...');
    const ordersData = generateOrdersData();
    
    // Link foreign keys
    await linkOrderForeignKeys(ordersData);
    
    // Insert data in dependency order
    const tables = [
      { name: 'orders', data: ordersData.orders, displayName: 'Orders' },
      { name: 'order_items', data: ordersData.orderItems, displayName: 'Order Items' },
      { name: 'customizations', data: ordersData.customizations, displayName: 'Customizations' },
      { name: 'repair_services', data: ordersData.repairServices, displayName: 'Repair Services' },
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

      const batchSize = table.name === 'orders' ? 25 : settings.performance.batchSize;
      let totalInserted = 0;

      for (let i = 0; i < table.data.length; i += batchSize) {
        const batch = table.data.slice(i, i + batchSize);
        
        try {
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
      orders: await db.getRowCount('orders'),
      orderItems: await db.getRowCount('order_items'),
      customizations: await db.getRowCount('customizations'),
      repairServices: await db.getRowCount('repair_services'),
    };
    
    console.log('   Final counts:');
    Object.entries(finalCounts).forEach(([table, count]) => {
      console.log(`     ${table}: ${count}`);
    });

    // Display order statistics
    console.log('\n📊 Order statistics:');
    const orderStats = await db.query(`
      SELECT 
        status,
        COUNT(*) as count,
        AVG(total_amount) as avg_amount,
        SUM(total_amount) as total_revenue
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `);
    
    orderStats.rows.forEach(stat => {
      console.log(`   ${stat.status.padEnd(12)} ${stat.count.toString().padEnd(6)} orders, avg ₹${Math.round(stat.avg_amount).toLocaleString().padStart(8)}, total ₹${Math.round(stat.total_revenue).toLocaleString().padStart(10)}`);
    });

    // Display recent orders
    console.log('\n📋 Recent orders:');
    const recentOrders = await db.query(`
      SELECT 
        o.order_number,
        o.status,
        o.total_amount,
        u.first_name || ' ' || u.last_name as customer_name,
        o.created_at
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 8
    `);
    
    recentOrders.rows.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString();
      console.log(`   ${order.order_number.padEnd(15)} ${order.status.padEnd(12)} ₹${order.total_amount.toLocaleString().padStart(8)} ${order.customer_name.substring(0, 20).padEnd(20)} ${date}`);
    });

    console.log(chalk.green.bold('\n✅ Orders data loading completed successfully!\n'));

    return {
      success: true,
      results: finalCounts,
    };

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error loading orders data:'), error.message);
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
    orders: ['order_number'],
    order_items: [],
    customizations: [],
    repair_services: ['repair_number'],
  };
  return conflicts[tableName] || [];
}

function getUpdateColumns(tableName) {
  const updates = {
    orders: ['status', 'total_amount', 'payment_status', 'updated_at'],
    order_items: ['total_price'],
    customizations: ['status', 'completed_at'],
    repair_services: ['status', 'actual_cost', 'completion_date', 'updated_at'],
  };
  return updates[tableName] || [];
}

// Run the script if called directly
if (require.main === module) {
  loadOrders()
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

module.exports = loadOrders;