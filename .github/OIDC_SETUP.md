# Azure OIDC Federation Setup for GitHub Actions

This document provides step-by-step instructions to set up OpenID Connect (OIDC) federation between GitHub Actions and Azure, eliminating the need for long-lived secrets.

## Overview

OIDC federation allows GitHub Actions to authenticate to Azure using short-lived tokens instead of storing permanent credentials. This is more secure and eliminates the risk of credential leakage.

## Prerequisites

- Azure subscription with Owner or Contributor + User Access Administrator roles
- GitHub repository with Actions enabled
- Azure CLI installed (for setup)

## Step 1: Create Azure AD Application

```bash
# 1. Create Azure AD application
az ad app create \
  --display-name "jewelry-shop-github-actions" \
  --sign-in-audience AzureADMyOrg

# Note the appId from the output - this will be your AZURE_CLIENT_ID
export APP_ID="<appId-from-previous-command>"

# 2. Create service principal
az ad sp create --id $APP_ID

# Note the objectId from the output
export OBJECT_ID="<objectId-from-previous-command>"
```

## Step 2: Configure Federated Credentials

```bash
# Create federated credential for main branch
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "jewelry-shop-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:rahil911/ai-jewelry-shop-management:ref:refs/heads/main",
    "description": "GitHub Actions main branch",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# Create federated credential for pull requests
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "jewelry-shop-pr",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:rahil911/ai-jewelry-shop-management:pull_request",
    "description": "GitHub Actions pull requests",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

## Step 3: Assign Azure Permissions

```bash
# Get your subscription ID
export SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Assign Contributor role for the resource group
az role assignment create \
  --assignee $OBJECT_ID \
  --role Contributor \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/jewelry-shop-rg"

# Assign AcrPush role for container registry
az role assignment create \
  --assignee $OBJECT_ID \
  --role AcrPush \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/jewelry-shop-rg/providers/Microsoft.ContainerRegistry/registries/jewelryshopacr01280"
```

## Step 4: Configure GitHub Repository Variables

Go to your GitHub repository → Settings → Secrets and variables → Actions → Variables tab

Add these **Repository Variables** (not secrets):

```
AZURE_CLIENT_ID = "<APP_ID from Step 1>"
AZURE_TENANT_ID = "<your-tenant-id>"
AZURE_SUBSCRIPTION_ID = "<your-subscription-id>"
AZURE_VM_HOST = "4.236.132.147"
AZURE_VM_USER = "azureuser"
```

### Get Tenant ID and Subscription ID:
```bash
# Get tenant ID
az account show --query tenantId -o tsv

# Get subscription ID  
az account show --query id -o tsv
```

## Step 5: Configure SSH Key for VM Deployment

Add this **Repository Secret**:

```
AZURE_VM_SSH_KEY = "<private-ssh-key-content>"
```

To get your SSH private key:
```bash
# If you don't have SSH key pair, create one:
ssh-keygen -t rsa -b 4096 -f ~/.ssh/jewelry-shop-vm

# Copy the private key content (this goes in the secret):
cat ~/.ssh/jewelry-shop-vm

# Copy the public key to your Azure VM:
ssh-copy-id -i ~/.ssh/jewelry-shop-vm.pub azureuser@4.236.132.147
```

## Step 6: Test the Setup

Create a simple test workflow to verify OIDC authentication:

```yaml
# .github/workflows/test-oidc.yml
name: Test OIDC Setup

on:
  workflow_dispatch:

permissions:
  id-token: write
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Azure OIDC Login
        uses: azure/login@v2
        with:
          client-id: ${{ vars.AZURE_CLIENT_ID }}
          tenant-id: ${{ vars.AZURE_TENANT_ID }}
          subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
          
      - name: Test Azure CLI
        run: |
          az account show
          az acr list --resource-group jewelry-shop-rg
```

## Step 7: Environment-Specific Setup (Optional)

For multiple environments (dev, staging, production), create separate apps:

```bash
# Development environment
az ad app create --display-name "jewelry-shop-github-actions-dev"
# ... repeat steps with dev-specific resource groups

# Staging environment  
az ad app create --display-name "jewelry-shop-github-actions-staging"
# ... repeat steps with staging-specific resource groups
```

Then use environment-specific variables:
```
AZURE_CLIENT_ID_DEV = "<dev-app-id>"
AZURE_CLIENT_ID_STAGING = "<staging-app-id>"
AZURE_CLIENT_ID_PROD = "<prod-app-id>"
```

## Security Best Practices

1. **Principle of Least Privilege**: Only assign necessary roles
2. **Scope Permissions**: Limit to specific resource groups, not entire subscription
3. **Regular Rotation**: OIDC tokens are short-lived (no rotation needed)
4. **Monitor Usage**: Use Azure Activity Log to monitor authentication events
5. **Branch Protection**: Only allow OIDC from protected branches

## Troubleshooting

### Common Issues:

1. **"AADSTS70016: Application not found"**
   - Check AZURE_CLIENT_ID matches the App ID
   - Ensure federated credentials are configured correctly

2. **"Insufficient permissions"**
   - Verify role assignments
   - Check resource group and registry names

3. **"Subject validation failed"**
   - Ensure repository name in federated credential matches exactly
   - Check branch name (main vs master)

### Debug Commands:

```bash
# List federated credentials
az ad app federated-credential list --id $APP_ID

# Check role assignments
az role assignment list --assignee $OBJECT_ID --scope "/subscriptions/$SUBSCRIPTION_ID"

# Test ACR access
az acr login --name jewelryshopacr01280
```

## Migration from Secrets

If you're migrating from service principal secrets:

1. **Remove old secrets**: `AZURE_CREDENTIALS`, `ACR_USERNAME`, `ACR_PASSWORD`
2. **Update workflows**: Replace `azure/login@v1` with OIDC version
3. **Test thoroughly**: Run CI/CD pipeline on a test branch first
4. **Delete service principal**: Once confirmed working, delete old SP

---

## Summary

✅ **Benefits of OIDC Setup:**
- 🔒 **More Secure**: No long-lived secrets in GitHub
- ⚡ **Faster**: No interactive authentication prompts
- 🛡️ **Auditable**: All actions logged in Azure Activity Log
- 🔄 **Zero Maintenance**: Tokens auto-refresh, no rotation needed

✅ **What You Achieved:**
- GitHub Actions can authenticate to Azure automatically
- Container registry push/pull permissions configured
- VM deployment via SSH ready
- Multiple environment support prepared

This setup provides enterprise-grade security for your jewelry shop CI/CD pipeline! 🚀