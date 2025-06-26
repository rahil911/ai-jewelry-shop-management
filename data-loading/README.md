# Jewelry Shop Management System - Data Loading Scripts

## Overview
This directory contains comprehensive data loading scripts to populate the jewelry shop management system with realistic demo data for client presentations.

## Structure
```
data-loading/
├── README.md                     # This file
├── config/
│   ├── database.js              # Database connection configuration
│   └── settings.js              # Data loading settings and constants
├── data/
│   ├── images/                  # High-quality jewelry images
│   ├── users.json              # User and customer data
│   ├── inventory.json          # Jewelry items and categories
│   ├── orders.json             # Sample orders and transactions
│   └── templates/              # Invoice and notification templates
├── scripts/
│   ├── 01-load-users.js        # Load users and customer data
│   ├── 02-load-inventory.js    # Load jewelry items and categories
│   ├── 03-load-pricing.js      # Load pricing and gold rates
│   ├── 04-load-orders.js       # Load orders and transactions
│   ├── 05-load-payments.js     # Load payment records
│   ├── 06-load-images.js       # Load and process images
│   ├── 07-load-analytics.js    # Load analytics and reports data
│   ├── 08-load-notifications.js # Load notification templates
│   └── 99-verify-data.js       # Verify all data loaded correctly
├── run-all.js                  # Master script to run all loading scripts
└── clear-all.js               # Script to clear all demo data
```

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- Azure backend services operational
- Environment variables configured

## Environment Setup
Create a `.env` file in the data-loading directory:
```env
DATABASE_URL=postgresql://username:password@host:5432/jewelry_shop
AZURE_BACKEND_URL=http://4.236.132.147
JWT_SECRET=your_jwt_secret
BUSINESS_NAME=Sri Lakshmi Jewellers
BUSINESS_PHONE=+91-9876543210
BUSINESS_EMAIL=info@srilakshmijewellers.com
```

## Usage

### Load All Demo Data
```bash
# Install dependencies
npm install

# Load all demo data
node run-all.js

# Verify data loading
node scripts/99-verify-data.js
```

### Load Individual Components
```bash
# Load users and customers
node scripts/01-load-users.js

# Load inventory items
node scripts/02-load-inventory.js

# Load pricing data
node scripts/03-load-pricing.js

# And so on...
```

### Clear Demo Data
```bash
# Remove all demo data (keeps schema)
node clear-all.js
```

## Data Sets

### Users & Customers (150+ records)
- **Staff Members**: Owner, Managers, Sales Staff, Technicians
- **Customer Profiles**: Diverse Indian names, realistic preferences
- **Loyalty Data**: Points, purchase history, communication preferences
- **Multilingual Support**: Names in English, Hindi, Kannada

### Jewelry Inventory (200+ items)
- **Traditional Categories**: Rings, Necklaces, Earrings, Bangles, Chains, Pendants
- **Metal Types**: Gold (22K, 18K, 14K), Silver (925), Platinum
- **Realistic Pricing**: Based on current gold rates and making charges
- **High-Quality Images**: Professional jewelry photography
- **Detailed Specifications**: Weight, purity, dimensions, descriptions

### Orders & Transactions (100+ orders)
- **Order Types**: Sales, Repairs, Customizations, Exchanges
- **Order Statuses**: Complete workflow from pending to delivered
- **Payment Records**: Multiple payment methods and gateways
- **Customer Interactions**: Realistic order patterns and preferences

### Business Analytics
- **Sales Trends**: Daily, weekly, monthly revenue patterns
- **Inventory Analytics**: Stock levels, turnover rates, low-stock alerts
- **Customer Insights**: Purchase patterns, loyalty metrics, segments
- **Financial Reports**: Profit margins, expense tracking, tax calculations

## Features

### Realistic Data Generation
- **Indian Market Focus**: Names, preferences, and business patterns
- **Business Logic Compliance**: Proper pricing, inventory, and workflow
- **Relationship Integrity**: Proper foreign key relationships and constraints
- **Date Consistency**: Realistic timelines and business hours

### Image Management
- **High-Quality Photos**: Professional jewelry photography
- **Optimized Formats**: Multiple sizes and formats for web/print
- **Azure Integration**: Automated upload to Azure Blob Storage
- **SEO Optimization**: Proper alt text and metadata

### Demo Scenarios
- **Customer Journey**: Complete purchase workflows
- **Staff Workflows**: Order processing, inventory management
- **Business Reports**: Analytics and insights demonstration
- **Multi-language Support**: Content in English, Hindi, Kannada

### Data Verification
- **Integrity Checks**: Verify all relationships and constraints
- **Business Rules**: Ensure pricing and inventory consistency
- **Performance Testing**: Validate query performance with full data
- **API Endpoint Testing**: Verify all services work with demo data

## Technical Details

### Database Support
- **PostgreSQL Primary**: Full schema support with UUID keys
- **Transaction Safety**: All data loading in transactions
- **Conflict Resolution**: Handles existing data gracefully
- **Performance Optimization**: Bulk inserts and efficient queries

### Service Integration
- **Azure Backend**: Direct API calls to populate services
- **Authentication**: Proper JWT token handling
- **Error Handling**: Graceful handling of service failures
- **Retry Logic**: Automatic retry for transient failures

### Monitoring & Logging
- **Progress Tracking**: Real-time loading progress
- **Error Reporting**: Detailed error logs and solutions
- **Performance Metrics**: Loading time and efficiency tracking
- **Data Validation**: Comprehensive validation reports

## Maintenance

### Regular Updates
- **Price Updates**: Monthly gold rate adjustments
- **Inventory Refresh**: Seasonal collection updates
- **Customer Activity**: Periodic order and interaction updates
- **Image Refresh**: New product photography uploads

### Data Quality
- **Validation Scripts**: Regular data integrity checks
- **Cleanup Utilities**: Remove stale or inconsistent data
- **Performance Optimization**: Query optimization and indexing
- **Backup Procedures**: Regular backup and restore procedures

## Support

### Troubleshooting
- Check database connectivity and permissions
- Verify environment variables are set correctly
- Ensure Azure backend services are running
- Review log files for specific error details

### Common Issues
- **Connection Timeouts**: Increase connection timeout settings
- **Memory Issues**: Use streaming for large data sets
- **Permission Errors**: Verify database and file system permissions
- **Service Failures**: Check Azure service health and retry

---

**Last Updated**: December 26, 2024  
**Version**: 1.0.0  
**Maintainer**: Jewelry Shop Development Team