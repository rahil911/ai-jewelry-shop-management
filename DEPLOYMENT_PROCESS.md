# 🚀 Service Enhancement Deployment Process

## Overview
This document records the exact steps to deploy enhanced microservices to Azure VM for the Jewelry Shop Management System.

## Current Production Setup
- **Azure VM**: 4.236.132.147 (azureuser)
- **Process Manager**: PM2
- **Services Running**: analytics, image-management, llm-service, notification-service, payment-service
- **Deployment Method**: Manual file transfer + PM2 restart

## Enhancement Deployment Steps

### Step 1: Prepare Enhanced Service Locally
```bash
# Build shared library
cd shared
npm run build

# Build the enhanced service with all dependencies
cd ../services/order-management
npm install  # Install all dependencies including dev deps for build
npm run build

# Important: Check package.json to ensure all runtime dependencies are listed
```

### Step 2: Create Deployment Package
```bash
# Create tar.gz with enhanced service code
tar -czf order-management-v2.tar.gz \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=shared-dist \
  src/ \
  migrations/ \
  package.json \
  tsconfig.json \
  server.js
```

### Step 3: Upload Enhanced Code to Azure VM
```bash
# Upload the enhanced service package
scp order-management-v2.tar.gz azureuser@4.236.132.147:~/

# Upload shared library
cd ../../shared
tar -czf shared-v2.tar.gz dist/
scp shared-v2.tar.gz azureuser@4.236.132.147:~/
```

### Step 4: Deploy on Azure VM
```bash
ssh azureuser@4.236.132.147 << 'EOF'
  # Stop existing service
  pm2 delete order-management 2>/dev/null || true
  
  # Backup existing service
  mv order-management order-management-backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
  
  # Extract enhanced service
  mkdir order-management
  cd order-management
  tar -xzf ../order-management-v2.tar.gz
  
  # Install ALL dependencies (not just production)
  npm install
  
  # Extract updated shared library
  cd ../
  tar -xzf shared-v2.tar.gz -C order-management/node_modules/@jewelry-shop/shared/
  
  # Extract pre-built JavaScript files
  tar -xzf order-management-dist.tar.gz -C order-management/
  
  # Start enhanced service with PM2
  cd order-management
  pm2 start dist/index.js --name order-management
  
  # Verify deployment
  sleep 15
  pm2 list | grep order-management
  curl -f http://localhost:3004/health
EOF
```

### Step 5: Test Enhanced Features
```bash
# Test new v2.0 endpoints
curl -H "Authorization: Bearer test-token" http://4.236.132.147:3004/api/repairs
curl -H "Authorization: Bearer test-token" http://4.236.132.147:3004/api/returns
curl -H "Authorization: Bearer test-token" http://4.236.132.147:3004/api/notifications
```

### Step 6: Run Database Migrations (if needed)
```bash
ssh azureuser@4.236.132.147 << 'EOF'
  cd order-management
  # Apply database migrations for new features
  for migration in migrations/*.sql; do
    echo "Applying $migration..."
    # Apply to production database
  done
EOF
```

## Automation Template for Future Services

For any service enhancement (user-management, pricing-service, etc.):

1. **Local Build**: `npm run build` in service directory
2. **Package**: Create tar.gz excluding node_modules/dist
3. **Upload**: SCP package to Azure VM
4. **Deploy**: Extract, npm install, PM2 restart
5. **Test**: Verify endpoints work
6. **Migrate**: Apply any database changes

## Notes
- Always backup existing service before deploying
- Use PM2 for process management (same as existing services)
- Shared library updates require extraction to node_modules
- Test endpoints with proper authentication headers
- Database migrations should be applied carefully in production

## Success Criteria
- ✅ Service shows in `pm2 list` as online
- ✅ Health endpoint returns 200
- ✅ New feature endpoints return auth errors (not 404)
- ✅ Existing functionality still works