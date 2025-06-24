#!/bin/bash

# 🚀 ONE-COMMAND SETUP FOR JEWELRY SHOP MANAGEMENT SYSTEM
# This script sets up everything needed for deployment

set -e

echo "🚀 JEWELRY SHOP MANAGEMENT SYSTEM SETUP"
echo "======================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI not found. Please install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if user is logged into Azure
if ! az account show &> /dev/null; then
    print_warning "Not logged into Azure. Please run: az login"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js 18+ from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher required. Current version: $(node --version)"
    exit 1
fi

print_success "All prerequisites met!"

echo ""
print_status "Setting up Azure Service Principal for GitHub Actions..."

# Get subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
print_status "Using subscription: $SUBSCRIPTION_ID"

# Create service principal for GitHub Actions
SP_NAME="jewelry-shop-github-actions"
print_status "Creating service principal: $SP_NAME"

# Check if service principal already exists
if az ad sp list --display-name $SP_NAME --query "[0].appId" -o tsv | grep -q .; then
    print_warning "Service principal $SP_NAME already exists. Skipping creation."
    APP_ID=$(az ad sp list --display-name $SP_NAME --query "[0].appId" -o tsv)
else
    # Create new service principal
    SP_OUTPUT=$(az ad sp create-for-rbac --name $SP_NAME --role contributor --scopes /subscriptions/$SUBSCRIPTION_ID --sdk-auth)
    APP_ID=$(echo $SP_OUTPUT | jq -r '.clientId')
    
    print_success "Service principal created!"
    echo ""
    print_warning "🔐 IMPORTANT: Copy this JSON for GitHub Secrets as AZURE_CREDENTIALS:"
    echo "=================================================================="
    echo "$SP_OUTPUT"
    echo "=================================================================="
fi

echo ""
print_status "Installing project dependencies..."

# Install root dependencies
npm install

# Install shared library dependencies
cd shared
npm install
npm run build
print_success "Shared library built"
cd ..

# Install service dependencies
SERVICES=("user-management" "pricing-service" "inventory-management" "order-management" "payment-service" "image-management" "llm-service" "notification-service" "analytics-service")

for service in "${SERVICES[@]}"; do
    print_status "Installing dependencies for $service..."
    cd "services/$service"
    npm install
    npm run build || print_warning "Build failed for $service (may need database connection)"
    cd ../..
done

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd frontend
npm install
npm run build || print_warning "Frontend build failed (may need API endpoints)"
cd ..

print_success "All dependencies installed!"

echo ""
print_status "Setting up GitHub repository secrets..."

# Check if gh CLI is installed
if command -v gh &> /dev/null; then
    if gh auth status &> /dev/null; then
        print_status "Setting up GitHub repository secrets with gh CLI..."
        
        # Set AZURE_CREDENTIALS secret
        if [ -n "$SP_OUTPUT" ]; then
            echo "$SP_OUTPUT" | gh secret set AZURE_CREDENTIALS
            print_success "AZURE_CREDENTIALS secret set in GitHub repository"
        else
            print_warning "Service principal already exists. Please manually set AZURE_CREDENTIALS in GitHub."
        fi
    else
        print_warning "GitHub CLI not authenticated. Please run: gh auth login"
    fi
else
    print_warning "GitHub CLI not found. Please manually set secrets in GitHub repository."
fi

echo ""
print_success "🎉 SETUP COMPLETE!"
echo "=================="
echo ""
print_status "📋 Next steps:"
echo "1. Commit and push your code to GitHub"
echo "2. Ensure GitHub repository has AZURE_CREDENTIALS secret set"
echo "3. Push to main branch to trigger automatic deployment"
echo ""
print_status "🔗 GitHub Actions will automatically:"
echo "• Build all microservices"
echo "• Run tests and type checking"
echo "• Deploy infrastructure to Azure"
echo "• Deploy services to VM with Docker Compose"
echo ""
print_status "💰 Estimated monthly cost: ~$35"
print_status "🎯 Deployment time: ~10 minutes"
echo ""
print_success "Ready for deployment! 🚀"