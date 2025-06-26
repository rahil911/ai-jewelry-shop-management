const jwt = require('jsonwebtoken');

// JWT secret from the Order Management Service
const JWT_SECRET = 'jewelry-shop-jwt-secret-key-2024';

// Create a test user payload that matches the backend expectations
const testUser = {
  id: 1,
  email: 'manager@jewelryshop.com',
  first_name: 'Test',
  last_name: 'Manager',
  role: 'manager'
};

// Generate JWT token
const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '24h' });

console.log('Generated JWT Token:');
console.log(token);
console.log('\nToken Payload:', jwt.decode(token));