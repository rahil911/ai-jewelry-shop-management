#!/usr/bin/env node

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const ProgressBar = require('progress');

const db = require('../config/database');
const settings = require('../config/settings');

console.log(chalk.blue.bold('\n🚀 Loading Users and Customer Data\n'));

// Generate realistic Indian user data
function generateUserData() {
  const users = [];
  const customers = [];
  
  // Add business staff first
  const staffData = [
    {
      email: 'owner@jewelryshop.com',
      first_name: 'Ramesh',
      last_name: 'Sharma',
      role: 'owner',
      phone: '+91-9876543210',
      preferred_language: 'en',
      address: '123 MG Road, Bangalore, Karnataka 560001',
    },
    {
      email: 'manager@jewelryshop.com',
      first_name: 'Priya',
      last_name: 'Patel',
      role: 'manager',
      phone: '+91-9876543211',
      preferred_language: 'hi',
      address: '456 Brigade Road, Bangalore, Karnataka 560001',
    },
    {
      email: 'manager2@jewelryshop.com',
      first_name: 'Suresh',
      last_name: 'Kumar',
      role: 'manager',
      phone: '+91-9876543212',
      preferred_language: 'kn',
      address: '789 Commercial Street, Bangalore, Karnataka 560001',
    },
    // Sales staff
    {
      email: 'staff1@jewelryshop.com',
      first_name: 'Anita',
      last_name: 'Reddy',
      role: 'staff',
      phone: '+91-9876543213',
      preferred_language: 'en',
      address: '321 Koramangala, Bangalore, Karnataka 560034',
    },
    {
      email: 'staff2@jewelryshop.com',
      first_name: 'Vikram',
      last_name: 'Iyer',
      role: 'staff',
      phone: '+91-9876543214',
      preferred_language: 'kn',
      address: '654 Indiranagar, Bangalore, Karnataka 560038',
    },
    {
      email: 'staff3@jewelryshop.com',
      first_name: 'Kavita',
      last_name: 'Joshi',
      role: 'staff',
      phone: '+91-9876543215',
      preferred_language: 'hi',
      address: '987 Jayanagar, Bangalore, Karnataka 560011',
    },
    {
      email: 'staff4@jewelryshop.com',
      first_name: 'Rajesh',
      last_name: 'Nair',
      role: 'staff',
      phone: '+91-9876543216',
      preferred_language: 'en',
      address: '147 Malleswaram, Bangalore, Karnataka 560003',
    },
    {
      email: 'staff5@jewelryshop.com',
      first_name: 'Meera',
      last_name: 'Singh',
      role: 'staff',
      phone: '+91-9876543217',
      preferred_language: 'hi',
      address: '258 Whitefield, Bangalore, Karnataka 560066',
    },
  ];

  // Add staff users
  staffData.forEach((staff, index) => {
    const userId = uuidv4();
    users.push({
      id: userId,
      email: staff.email,
      password_hash: bcrypt.hashSync('password123', 12),
      first_name: staff.first_name,
      last_name: staff.last_name,
      role: staff.role,
      phone: staff.phone,
      preferred_language: staff.preferred_language,
      address: staff.address,
      is_active: true,
      email_verified: true,
      phone_verified: true,
      last_login_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random login in last week
      created_at: new Date(Date.now() - (30 + index) * 24 * 60 * 60 * 1000), // Created 30+ days ago
    });
  });

  // Generate customer data
  const { indianNames } = settings;
  const customerCount = settings.dataGeneration.users.customers;
  
  console.log(`📝 Generating ${customerCount} customer records...`);
  
  for (let i = 0; i < customerCount; i++) {
    const isFemaleName = Math.random() > 0.5;
    const firstName = isFemaleName ? 
      indianNames.female.first[Math.floor(Math.random() * indianNames.female.first.length)] :
      indianNames.male.first[Math.floor(Math.random() * indianNames.male.first.length)];
    
    const lastName = isFemaleName ?
      indianNames.female.last[Math.floor(Math.random() * indianNames.female.last.length)] :
      indianNames.male.last[Math.floor(Math.random() * indianNames.male.last.length)];

    const emailPrefix = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}`;
    const userId = uuidv4();
    
    // Indian cities for realistic addresses
    const cities = [
      'Bangalore, Karnataka 560001',
      'Mumbai, Maharashtra 400001',
      'Delhi, Delhi 110001',
      'Chennai, Tamil Nadu 600001',
      'Hyderabad, Telangana 500001',
      'Pune, Maharashtra 411001',
      'Kolkata, West Bengal 700001',
      'Ahmedabad, Gujarat 380001',
      'Jaipur, Rajasthan 302001',
      'Surat, Gujarat 395001',
      'Lucknow, Uttar Pradesh 226001',
      'Kanpur, Uttar Pradesh 208001',
      'Nagpur, Maharashtra 440001',
      'Indore, Madhya Pradesh 452001',
      'Thane, Maharashtra 400601',
      'Bhopal, Madhya Pradesh 462001',
      'Visakhapatnam, Andhra Pradesh 530001',
      'Pimpri, Maharashtra 411018',
      'Patna, Bihar 800001',
      'Vadodara, Gujarat 390001'
    ];

    const phoneNumber = `+91-${9000000000 + Math.floor(Math.random() * 999999999)}`;
    const city = cities[Math.floor(Math.random() * cities.length)];
    const streetNumber = Math.floor(Math.random() * 999) + 1;
    const streetNames = ['MG Road', 'Brigade Road', 'Commercial Street', 'Main Road', 'High Street', 'Market Road', 'Gandhi Road', 'Nehru Street'];
    const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
    
    const createdDaysAgo = Math.floor(Math.random() * 365) + 1; // Customer created within last year
    const lastLoginDaysAgo = Math.floor(Math.random() * 30) + 1; // Last login within last month

    const user = {
      id: userId,
      email: `${emailPrefix}@gmail.com`,
      password_hash: bcrypt.hashSync('customer123', 12),
      first_name: firstName,
      last_name: lastName,
      role: 'customer',
      phone: phoneNumber,
      preferred_language: ['en', 'hi', 'kn'][Math.floor(Math.random() * 3)],
      address: `${streetNumber} ${streetName}, ${city}`,
      is_active: Math.random() > 0.05, // 95% active customers
      email_verified: Math.random() > 0.1, // 90% verified emails
      phone_verified: Math.random() > 0.2, // 80% verified phones
      last_login_at: new Date(Date.now() - lastLoginDaysAgo * 24 * 60 * 60 * 1000),
      created_at: new Date(Date.now() - createdDaysAgo * 24 * 60 * 60 * 1000),
    };

    users.push(user);

    // Generate customer profile data
    const loyaltyPoints = Math.floor(Math.random() * 5000);
    const totalPurchases = loyaltyPoints * (50 + Math.random() * 200); // Rough correlation between points and purchases
    
    // Birth date (between 20-70 years old)
    const age = 20 + Math.floor(Math.random() * 50);
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - age);
    birthDate.setMonth(Math.floor(Math.random() * 12));
    birthDate.setDate(Math.floor(Math.random() * 28) + 1);

    // Anniversary date (random date in last 25 years for married customers)
    let anniversaryDate = null;
    if (Math.random() > 0.4) { // 60% married
      anniversaryDate = new Date();
      anniversaryDate.setFullYear(anniversaryDate.getFullYear() - Math.floor(Math.random() * 25));
      anniversaryDate.setMonth(Math.floor(Math.random() * 12));
      anniversaryDate.setDate(Math.floor(Math.random() * 28) + 1);
    }

    // Preferred categories based on demographics
    const allCategories = ['Rings', 'Necklaces', 'Earrings', 'Bangles', 'Chains', 'Pendants'];
    const preferredCategories = [];
    const numPreferred = 1 + Math.floor(Math.random() * 3); // 1-3 preferred categories
    
    for (let j = 0; j < numPreferred; j++) {
      const category = allCategories[Math.floor(Math.random() * allCategories.length)];
      if (!preferredCategories.includes(category)) {
        preferredCategories.push(category);
      }
    }

    const customer = {
      user_id: userId,
      loyalty_points: loyaltyPoints,
      total_purchases: totalPurchases,
      communication_preferences: {
        email: Math.random() > 0.1, // 90% prefer email
        sms: Math.random() > 0.3,   // 70% prefer SMS
        whatsapp: Math.random() > 0.4 // 60% prefer WhatsApp
      },
      birth_date: birthDate.toISOString().split('T')[0],
      anniversary_date: anniversaryDate ? anniversaryDate.toISOString().split('T')[0] : null,
      preferred_categories: preferredCategories,
      created_at: user.created_at,
    };

    customers.push(customer);
  }

  return { users, customers };
}

// Main function to load user data
async function loadUsers() {
  try {
    console.log('🔍 Testing database connection...');
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    console.log('📊 Checking existing data...');
    const existingUsers = await db.getRowCount('users');
    const existingCustomers = await db.getRowCount('customers');
    
    console.log(`   Current users: ${existingUsers}`);
    console.log(`   Current customers: ${existingCustomers}`);

    console.log('🎲 Generating user data...');
    const { users, customers } = generateUserData();
    
    console.log(`   Generated ${users.length} users`);
    console.log(`   Generated ${customers.length} customer profiles`);

    // Load users in batches
    console.log('\n📥 Inserting users...');
    const userBar = new ProgressBar('   Users [:bar] :current/:total (:percent) :etas', {
      complete: '█',
      incomplete: '░',
      width: 30,
      total: users.length
    });

    const batchSize = settings.performance.batchSize;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      try {
        await db.bulkInsert('users', batch, ['email'], ['first_name', 'last_name', 'phone', 'preferred_language', 'address', 'last_login_at']);
        userBar.tick(batch.length);
      } catch (error) {
        console.error(`\n❌ Error inserting user batch ${i}-${i + batch.length}:`, error.message);
        // Continue with next batch
        userBar.tick(batch.length);
      }
    }

    // Load customers in batches
    console.log('\n📥 Inserting customer profiles...');
    const customerBar = new ProgressBar('   Customers [:bar] :current/:total (:percent) :etas', {
      complete: '█',
      incomplete: '░',
      width: 30,
      total: customers.length
    });

    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize);
      
      try {
        await db.bulkInsert('customers', batch, ['user_id'], ['loyalty_points', 'total_purchases', 'communication_preferences', 'birth_date', 'anniversary_date', 'preferred_categories']);
        customerBar.tick(batch.length);
      } catch (error) {
        console.error(`\n❌ Error inserting customer batch ${i}-${i + batch.length}:`, error.message);
        // Continue with next batch
        customerBar.tick(batch.length);
      }
    }

    // Verify data loading
    console.log('\n✅ Verifying data...');
    const finalUsers = await db.getRowCount('users');
    const finalCustomers = await db.getRowCount('customers');
    
    console.log(`   Total users loaded: ${finalUsers}`);
    console.log(`   Total customer profiles: ${finalCustomers}`);

    // Display some sample data
    console.log('\n📋 Sample user data:');
    const sampleUsers = await db.query(`
      SELECT first_name, last_name, role, preferred_language 
      FROM users 
      WHERE role != 'customer' 
      ORDER BY role, first_name 
      LIMIT 10
    `);
    
    sampleUsers.rows.forEach(user => {
      const roleColor = user.role === 'owner' ? chalk.red : user.role === 'manager' ? chalk.yellow : chalk.green;
      console.log(`   ${roleColor(user.role.padEnd(8))} ${user.first_name} ${user.last_name} (${user.preferred_language})`);
    });

    console.log('\n📋 Customer statistics:');
    const customerStats = await db.query(`
      SELECT 
        preferred_language,
        COUNT(*) as count,
        AVG(loyalty_points) as avg_points,
        AVG(total_purchases) as avg_purchases
      FROM users u
      JOIN customers c ON u.id = c.user_id
      WHERE u.role = 'customer'
      GROUP BY preferred_language
      ORDER BY count DESC
    `);
    
    customerStats.rows.forEach(stat => {
      const langName = stat.preferred_language === 'en' ? 'English' : 
                      stat.preferred_language === 'hi' ? 'Hindi' : 'Kannada';
      console.log(`   ${langName.padEnd(10)} ${stat.count.toString().padEnd(6)} customers, avg ${Math.round(stat.avg_points)} points, ₹${Math.round(stat.avg_purchases).toLocaleString()} purchases`);
    });

    console.log(chalk.green.bold('\n✅ User data loading completed successfully!\n'));

    return {
      success: true,
      usersLoaded: finalUsers,
      customersLoaded: finalCustomers,
    };

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error loading user data:'), error.message);
    console.error(error.stack);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run the script if called directly
if (require.main === module) {
  loadUsers()
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

module.exports = loadUsers;