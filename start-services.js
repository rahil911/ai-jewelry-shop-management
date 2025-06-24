#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting Jewelry Shop Management System Services...\n');

// List of services to start
const services = [
  { name: 'User Management', path: 'services/user-management', port: 3001 },
  { name: 'Pricing Service', path: 'services/pricing-service', port: 3003 },
  { name: 'Inventory Management', path: 'services/inventory-management', port: 3002 },
  { name: 'LLM Service', path: 'services/llm-service', port: 3007 }
];

// Function to start a service
function startService(service) {
  console.log(`📦 Starting ${service.name} on port ${service.port}...`);
  
  const servicePath = path.join(__dirname, service.path);
  
  // Start the service with proper error handling
  const child = spawn('npm', ['run', 'dev'], {
    cwd: servicePath,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: service.port }
  });

  child.stdout.on('data', (data) => {
    console.log(`[${service.name}] ${data.toString().trim()}`);
  });

  child.stderr.on('data', (data) => {
    const error = data.toString().trim();
    if (error.includes('EADDRINUSE')) {
      console.log(`⚠️  Port ${service.port} already in use for ${service.name}`);
    } else if (error.includes('listening') || error.includes('Server running')) {
      console.log(`✅ ${service.name} started successfully on port ${service.port}`);
    } else if (!error.includes('DeprecationWarning')) {
      console.log(`[${service.name} ERROR] ${error}`);
    }
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log(`✅ ${service.name} started successfully`);
    } else {
      console.log(`❌ ${service.name} failed to start (exit code: ${code})`);
    }
  });

  return child;
}

// Kill any existing processes on our ports
console.log('🧹 Cleaning up existing processes...');
exec('lsof -ti:3001,3002,3003,3007 | xargs -r kill -9', (error) => {
  if (error && !error.message.includes('No such process')) {
    console.log('⚠️  Some processes may still be running');
  }
  
  // Wait a moment then start services
  setTimeout(() => {
    console.log('\n🎯 Starting services...\n');
    
    // Start each service with a small delay
    services.forEach((service, index) => {
      setTimeout(() => {
        startService(service);
      }, index * 2000); // 2 second delay between services
    });
    
    // Show status after all services should be started
    setTimeout(() => {
      console.log('\n📊 Service Status:');
      console.log('Frontend: http://localhost:3001 (Next.js)');
      console.log('User Management: http://localhost:3001');
      console.log('Inventory Management: http://localhost:3002');
      console.log('Pricing Service: http://localhost:3003');
      console.log('LLM Service: http://localhost:3007');
      console.log('\n🎉 All services should be starting up!');
      console.log('Check individual service logs above for any errors.');
    }, 10000);
    
  }, 2000);
});

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down services...');
  process.exit(0);
});