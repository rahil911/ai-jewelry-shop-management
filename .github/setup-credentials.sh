#!/bin/bash

# Setup script for migrating credentials from EpilogueIQ to Jewelry Shop
# This script helps configure GitHub repository secrets and variables

set -e

echo "🔧 Setting up GitHub Credentials for Jewelry Shop CI/CD"
echo "======================================================"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Please install it first: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "🔐 Please authenticate with GitHub first:"
    gh auth login
fi

echo "✅ GitHub CLI is ready"

# Repository information
REPO="rahil911/ai-jewelry-shop-management"
SOURCE_REPO="rahil911/EpilogueIQ"

echo "📋 Configuring repository: $REPO"
echo "📋 Source repository: $SOURCE_REPO"

# Function to set repository variable
set_variable() {
    local name=$1
    local value=$2
    echo "Setting variable: $name"
    echo "$value" | gh variable set "$name" --repo "$REPO"
}

# Function to set repository secret
set_secret() {
    local name=$1
    local value=$2
    echo "Setting secret: $name"
    echo "$value" | gh secret set "$name" --repo "$REPO"
}

echo ""
echo "🎯 Step 1: Azure Configuration"
echo "=============================="

# Get Azure tenant and subscription info
echo "Getting Azure configuration..."
TENANT_ID=$(az account show --query tenantId -o tsv 2>/dev/null || echo "")
SUBSCRIPTION_ID=$(az account show --query id -o tsv 2>/dev/null || echo "")

if [ -z "$TENANT_ID" ] || [ -z "$SUBSCRIPTION_ID" ]; then
    echo "⚠️ Azure CLI not configured. Please run 'az login' first."
    echo "For now, you'll need to set these manually:"
    echo "- AZURE_TENANT_ID"
    echo "- AZURE_SUBSCRIPTION_ID"
else
    echo "✅ Found Azure configuration"
    set_variable "AZURE_TENANT_ID" "$TENANT_ID"
    set_variable "AZURE_SUBSCRIPTION_ID" "$SUBSCRIPTION_ID"
fi

echo ""
echo "🔑 Step 2: Manual Configuration Required"
echo "======================================="

echo "Please create an Azure AD App Registration for OIDC:"
echo "1. Go to Azure Portal → Azure Active Directory → App registrations"
echo "2. Create new app: 'jewelry-shop-github-actions'"
echo "3. Copy the Application (client) ID"
echo ""

read -p "Enter Azure Client ID: " CLIENT_ID
if [ ! -z "$CLIENT_ID" ]; then
    set_variable "AZURE_CLIENT_ID" "$CLIENT_ID"
    echo "✅ Azure Client ID configured"
fi

echo ""
echo "🖥️ Step 3: VM Configuration"
echo "==========================="

# Set VM configuration
set_variable "AZURE_VM_HOST" "4.236.132.147"
set_variable "AZURE_VM_USER" "azureuser"

echo ""
echo "🔐 Step 4: SSH Key Configuration"
echo "==============================="

echo "For VM deployment, we need an SSH private key."
echo "Options:"
echo "1. Use existing SSH key"
echo "2. Generate new SSH key"
echo ""

read -p "Choose option (1 or 2): " SSH_OPTION

case $SSH_OPTION in
    1)
        echo "Available SSH keys:"
        ls -la ~/.ssh/*.pub 2>/dev/null || echo "No SSH keys found"
        echo ""
        read -p "Enter path to private key (e.g., ~/.ssh/id_rsa): " SSH_KEY_PATH
        
        if [ -f "$SSH_KEY_PATH" ]; then
            SSH_KEY_CONTENT=$(cat "$SSH_KEY_PATH")
            set_secret "AZURE_VM_SSH_KEY" "$SSH_KEY_CONTENT"
            echo "✅ SSH key configured"
            echo "📝 Make sure the public key is added to the VM:"
            echo "   ssh-copy-id -i ${SSH_KEY_PATH}.pub azureuser@4.236.132.147"
        else
            echo "❌ SSH key file not found: $SSH_KEY_PATH"
        fi
        ;;
    2)
        echo "Generating new SSH key..."
        SSH_KEY_PATH="$HOME/.ssh/jewelry-shop-vm"
        ssh-keygen -t rsa -b 4096 -f "$SSH_KEY_PATH" -N ""
        
        SSH_KEY_CONTENT=$(cat "$SSH_KEY_PATH")
        set_secret "AZURE_VM_SSH_KEY" "$SSH_KEY_CONTENT"
        
        echo "✅ New SSH key generated and configured"
        echo "📝 Add the public key to your VM:"
        echo "   ssh-copy-id -i ${SSH_KEY_PATH}.pub azureuser@4.236.132.147"
        echo ""
        echo "Public key content:"
        cat "${SSH_KEY_PATH}.pub"
        ;;
    *)
        echo "❌ Invalid option"
        ;;
esac

echo ""
echo "🗄️ Step 5: Database Configuration"
echo "================================"

read -p "Enter database password: " -s DB_PASSWORD
echo ""
if [ ! -z "$DB_PASSWORD" ]; then
    set_secret "DB_PASSWORD" "$DB_PASSWORD"
    echo "✅ Database password configured"
fi

echo ""
echo "🎯 Step 6: Copy from EpilogueIQ (Optional)"
echo "========================================="

echo "Would you like to copy any secrets from EpilogueIQ repository?"
echo "This can help if you have similar Azure configurations."
echo ""

read -p "Copy from EpilogueIQ? (y/n): " COPY_EPILOGUE

if [ "$COPY_EPILOGUE" = "y" ] || [ "$COPY_EPILOGUE" = "Y" ]; then
    echo "⚠️ Note: You'll need to adapt these manually as the architecture is different"
    echo "Common secrets to consider copying:"
    echo "- Any Azure service principal information"
    echo "- Database connection strings"
    echo "- API keys for external services"
    echo ""
    echo "Use: gh secret list --repo $SOURCE_REPO"
    echo "Then: gh secret set SECRET_NAME --repo $REPO"
fi

echo ""
echo "✅ Setup Complete!"
echo "=================="

echo "📋 Summary of configured items:"
echo "Variables:"
gh variable list --repo "$REPO" 2>/dev/null || echo "No variables set"

echo ""
echo "Secrets:"
gh secret list --repo "$REPO" 2>/dev/null || echo "No secrets set"

echo ""
echo "🚀 Next Steps:"
echo "1. Complete OIDC federation setup (see .github/OIDC_SETUP.md)"
echo "2. Test the pipeline with a small change"
echo "3. Monitor the first deployment"
echo ""
echo "📚 Documentation:"
echo "- OIDC Setup: .github/OIDC_SETUP.md"
echo "- CI/CD Guide: .github/CI_CD_GUIDE.md"
echo ""
echo "🎉 Your CI/CD pipeline is ready to deploy the jewelry shop!"