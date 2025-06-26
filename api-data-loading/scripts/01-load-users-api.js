#!/usr/bin/env node

const chalk = require('chalk');
const APIClient = require('../utils/api-client');
const config = require('../config');

console.log(chalk.blue.bold('\n👥 Loading Users via API\n'));

async function loadUsers() {
  const api = new APIClient();
  
  try {
    console.log('🔍 Testing API connection...');
    const health = await api.checkSystemHealth();
    console.log(chalk.green('✅ API connection successful\n'));

    // Generate sample users data
    const users = [];
    
    // Admin users
    users.push({
      email: 'admin@jewelryshop.com',
      password: 'admin123',
      name: 'Shop Admin',
      role: 'admin'
    });
    
    users.push({
      email: 'manager@jewelryshop.com', 
      password: 'manager123',
      name: 'Shop Manager',
      role: 'manager'
    });

    // Staff users
    const staffNames = [
      'Ravi Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy',
      'Kiran Singh', 'Meera Gupta'
    ];
    
    staffNames.forEach((name, index) => {
      users.push({
        email: `staff${index + 1}@jewelryshop.com`,
        password: 'staff123',
        name: name,
        role: 'staff'
      });
    });

    // Customer users
    const customerData = [
      { name: 'Arun Krishnan', email: 'arun.k@gmail.com' },
      { name: 'Lakshmi Iyer', email: 'lakshmi.iyer@gmail.com' },
      { name: 'Rajesh Nair', email: 'rajesh.nair@yahoo.com' },
      { name: 'Divya Menon', email: 'divya.menon@gmail.com' },
      { name: 'Suresh Babu', email: 'suresh.babu@hotmail.com' },
      { name: 'Kavitha Pillai', email: 'kavitha.pillai@gmail.com' },
      { name: 'Manoj Kumar', email: 'manoj.kumar@gmail.com' },
      { name: 'Sita Devi', email: 'sita.devi@gmail.com' },
      { name: 'Arjun Reddy', email: 'arjun.reddy@gmail.com' },
      { name: 'Pooja Shetty', email: 'pooja.shetty@gmail.com' },
      { name: 'Vinod Rao', email: 'vinod.rao@gmail.com' },
      { name: 'Sunita Bhat', email: 'sunita.bhat@gmail.com' },
      { name: 'Ramesh Gowda', email: 'ramesh.gowda@gmail.com' },
      { name: 'Anjali Nair', email: 'anjali.nair@gmail.com' },
      { name: 'Krishna Murthy', email: 'krishna.murthy@gmail.com' },
      { name: 'Usha Rani', email: 'usha.rani@gmail.com' },
      { name: 'Deepak Joshi', email: 'deepak.joshi@gmail.com' },
      { name: 'Rekha Kumari', email: 'rekha.kumari@gmail.com' },
      { name: 'Sanjay Patil', email: 'sanjay.patil@gmail.com' },
      { name: 'Geetha Raman', email: 'geetha.raman@gmail.com' }
    ];
    
    customerData.forEach(customer => {
      users.push({
        email: customer.email,
        password: 'customer123',
        name: customer.name,
        role: 'customer'
      });
    });

    console.log(`📝 Generated ${users.length} users (${customerData.length} customers, ${staffNames.length} staff, 2 admins)`);

    // Register users in batches
    console.log('\n📤 Registering users...');
    const { results, errors } = await api.processBatch(users, async (user) => {
      const result = await api.registerUser(user);
      if (result.success || result.message === 'User already exists') {
        console.log(chalk.green(`   ✅ ${user.email} (${user.role})`));
      }
      return result;
    });

    console.log('\n✅ Verifying registration...');
    
    // Try to login a few sample users to verify they were created
    const testLogins = [
      { email: 'admin@jewelryshop.com', password: 'admin123' },
      { email: 'staff1@jewelryshop.com', password: 'staff123' },
      { email: 'arun.k@gmail.com', password: 'customer123' }
    ];

    let successfulLogins = 0;
    for (const login of testLogins) {
      try {
        const loginResult = await api.loginUser(login);
        if (loginResult.success || loginResult.token) {
          successfulLogins++;
          console.log(chalk.green(`   ✅ Login verified: ${login.email}`));
        }
      } catch (error) {
        console.log(chalk.yellow(`   ⚠️ Login test failed for ${login.email}: ${error.message}`));
      }
    }

    const summary = {
      totalUsers: users.length,
      successful: results.length,
      errors: errors.length,
      loginTests: successfulLogins,
      breakdown: {
        admins: 2,
        staff: staffNames.length,
        customers: customerData.length
      }
    };

    console.log('\n📊 User Registration Summary:');
    console.log(`   Total users: ${summary.totalUsers}`);
    console.log(`   Successfully processed: ${summary.successful}`);
    console.log(`   Errors: ${summary.errors}`);
    console.log(`   Login tests passed: ${summary.loginTests}/${testLogins.length}`);
    console.log(`   Breakdown: ${summary.breakdown.admins} admins, ${summary.breakdown.staff} staff, ${summary.breakdown.customers} customers`);

    if (errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      errors.slice(0, 5).forEach(error => {
        console.log(`   ${error.item.email}: ${error.error}`);
      });
    }

    console.log(chalk.green.bold('\n✅ User data loading completed successfully!\n'));

    return {
      success: true,
      summary
    };

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error loading user data:'), error.message);
    return { success: false, error: error.message };
  }
}

// Run the script if called directly
if (require.main === module) {
  loadUsers()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('❌ Unexpected error:'), error);
      process.exit(1);
    });
}

module.exports = loadUsers;