# Jewelry Shop API Data Loading System

## Overview
This system populates the Azure-deployed Jewelry Shop Management System with comprehensive demo data using API calls. It's designed to provide realistic data for client demonstrations and system testing.

## Features
- **API-Based Data Loading**: Uses REST API endpoints instead of direct database access
- **Azure Backend Integration**: Targets live Azure services at `http://4.236.132.147`
- **Realistic Demo Data**: Indian jewelry business-specific data with authentic names and pricing
- **Comprehensive Testing**: Health checks, business scenarios, and performance validation
- **Error Handling**: Robust retry mechanisms and graceful failure handling
- **Progress Tracking**: Real-time feedback on data loading progress

## System Architecture

### Target Services
- **User Management** (Port 3001): Authentication and user registration
- **Inventory Management** (Port 3002): Jewelry items and stock management
- **Pricing Service** (Port 3003): Gold rates and price calculations
- **Order Management** (Port 3004): Order processing (if available)

### Data Categories
- **Users**: 50+ users (customers, staff, admins) with Indian names
- **Inventory**: 40+ jewelry items across 5 categories with realistic pricing
- **Pricing**: Live gold rate testing and calculation verification
- **Business Scenarios**: Real-world jewelry shop workflows

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Access to Azure backend services at `http://4.236.132.147`
- Internet connection for API calls

### Installation
```bash
cd api-data-loading
npm install
```

### Usage

#### Run Complete Data Loading
```bash
npm run load-all
# or
node run-all-api.js
```

#### Run Individual Scripts
```bash
# Load users only
npm run load-users

# Load inventory only  
npm run load-inventory

# Test pricing service
node scripts/03-test-pricing-api.js

# Verify system status
npm run verify
```

## Scripts Overview

### 1. User Registration (`01-load-users-api.js`)
- Creates 50+ users with realistic Indian names
- 2 admin users, 6 staff members, 40+ customers
- Tests authentication by verifying login functionality
- Handles duplicate email conflicts gracefully

**Sample Users:**
```javascript
// Admin
admin@jewelryshop.com / admin123
manager@jewelryshop.com / manager123

// Staff  
staff1@jewelryshop.com / staff123
staff2@jewelryshop.com / staff123

// Customers
arun.k@gmail.com / customer123
lakshmi.iyer@gmail.com / customer123
```

### 2. Inventory Population (`02-load-inventory-api.js`)
- Adds 40+ jewelry items across 5 categories
- Realistic weights, purities, and pricing based on current gold rates
- Categories: rings, necklaces, earrings, bracelets, pendants
- SKU generation and stock quantity assignment

**Sample Items:**
```javascript
{
  sku: "RI001",
  name: "Classic Gold Ring", 
  weight: 3.5,
  purity: "22K",
  category: "rings",
  base_price: 23800,
  stock_quantity: 5
}
```

### 3. Pricing Service Testing (`03-test-pricing-api.js`)
- Tests current gold rate retrieval
- Validates price calculation endpoints
- Tests edge cases and error handling
- Performance and accuracy verification

**Test Scenarios:**
- 10g 22K Gold Ring (12% making charges)
- 25g 18K Gold Necklace (15% making charges)
- Edge cases: 0.5g items, 100g items, high making charges
- Error handling: missing parameters, invalid values

### 4. System Verification (`99-verify-api.js`)
- Comprehensive health check across all services
- Business scenario testing
- API performance measurement
- Demo readiness assessment

**Verification Areas:**
- Service health and connectivity
- User authentication functionality
- Inventory data availability and search
- Pricing calculations and gold rates
- Business workflow testing

## Configuration

### API Configuration (`config.js`)
```javascript
{
  baseURL: 'http://4.236.132.147',
  timeout: 30000,
  retries: 3,
  batchSize: 10,
  batchDelay: 1000
}
```

### Data Configuration
```javascript
dataConfig: {
  users: { total: 50, customers: 40, staff: 8, admins: 2 },
  inventory: { total: 100, categories: 5 },
  orders: { total: 30, statusDistribution: {...} }
}
```

## API Client Features

### Retry Mechanism
- Automatic retry on failure (3 attempts)
- Exponential backoff with 2-second delays
- Graceful handling of network issues

### Batch Processing
- Processes items in configurable batches (default: 10)
- Rate limiting to avoid overwhelming servers
- Progress tracking and error collection

### Error Handling
- Handles HTTP error codes appropriately
- Manages duplicate data conflicts (409 responses)
- Continues processing despite individual failures

## Business Scenarios Tested

### 1. Customer Price Inquiry
**Scenario**: Customer asks for price of 15g 22K gold necklace
```javascript
const result = await api.calculateItemPrice({
  weight: 15,
  purity: '22K', 
  making_charge_percentage: 12
});
// Expected: ₹1,14,240 (based on ₹6,800/g rate)
```

### 2. Inventory Management
**Scenario**: Shop owner checks ring inventory
```javascript
const rings = await api.getInventoryItems({ category: 'rings' });
// Expected: List of available rings with stock levels
```

### 3. Shop Valuation
**Scenario**: Calculate total inventory worth
```javascript
const valuation = await api.getInventoryValuation();
// Expected: Total value of all inventory items
```

## Demo Data Characteristics

### Indian Business Context
- Authentic Indian names and locations
- Traditional jewelry categories (Jhumka, Chandbali, Mangalsutra)
- Regional preferences and styling
- Currency in Indian Rupees (₹)

### Realistic Pricing
- Based on live gold rates (₹6,800/g for 22K)
- Appropriate making charges (8-25%)
- Market-realistic weights and measurements
- GST-compliant pricing structure

### Professional Quality
- Unique SKUs and barcodes
- Proper stock management
- Category-based organization
- Search and filter compatibility

## Performance Metrics

### Expected Response Times
- Health checks: < 1 second
- User registration: < 2 seconds per user
- Inventory creation: < 3 seconds per item
- Price calculations: < 1 second
- Data verification: < 5 seconds

### Success Criteria
- **95%+ API success rate**
- **75%+ overall system score**
- **All core business scenarios working**
- **Authentication and authorization functional**

## Troubleshooting

### Common Issues

#### Service Unavailable
```bash
Error: connect ECONNREFUSED 4.236.132.147:3001
```
**Solution**: Verify Azure backend services are running
```bash
curl http://4.236.132.147/health
```

#### Authentication Errors  
```bash
Error: 401 Unauthorized
```
**Solution**: Check if authentication is required for endpoints

#### Rate Limiting
```bash
Error: 429 Too Many Requests
```
**Solution**: Increase batch delays in configuration

#### Duplicate Data
```bash
Error: 409 Conflict - User already exists
```
**Solution**: This is handled gracefully - duplicates are skipped

### Debugging Commands
```bash
# Test individual service health
curl http://4.236.132.147:3001/health
curl http://4.236.132.147:3002/health  
curl http://4.236.132.147:3003/health

# Test specific endpoints
curl http://4.236.132.147/api/gold-rates/current
curl http://4.236.132.147/api/inventory/items?limit=5

# Run with verbose logging
DEBUG=1 node run-all-api.js
```

## Integration with Existing Tests

### Compatibility with Existing Test Scripts
This API data loading system works alongside existing test scripts:
- `test-hosted-apis.sh` - Basic API functionality testing
- `test-business-scenarios.sh` - Business workflow validation
- `final-backend-test.sh` - Comprehensive backend validation

### Enhanced Testing Workflow
1. **Data Loading**: `npm run load-all` (populate demo data)
2. **API Testing**: `./test-hosted-apis.sh` (validate endpoints)
3. **Business Testing**: `./test-business-scenarios.sh` (test workflows)
4. **Final Validation**: `./final-backend-test.sh` (comprehensive check)

## Future Enhancements

### Planned Features
- **Order Creation**: Generate sample orders using created users and inventory
- **Payment Simulation**: Create payment records for completed orders
- **Analytics Data**: Generate historical sales and performance data
- **Multilingual Support**: Add Hindi and Kannada product names
- **Image Integration**: Add product image URLs and metadata

### Advanced Scenarios
- **Repair Service Workflows**: If Order Management v2.0 is available
- **Return Processing**: Test return and exchange scenarios  
- **AI Chat Integration**: Populate conversation history
- **Notification Testing**: Verify communication channels

## Support

### Documentation
- API endpoints documented in existing test scripts
- Business logic in CLAUDE.md files
- Deployment guides in service directories

### Monitoring
- Real-time progress tracking during execution
- Comprehensive error reporting and logging
- Performance metrics and success rates
- Demo readiness assessment scoring

---

**Created by**: Claude Code AI Assistant  
**Version**: 1.0.0  
**Last Updated**: June 25, 2025  
**Target Environment**: Azure Production (http://4.236.132.147)