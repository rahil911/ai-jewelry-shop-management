// Parameters
@description('Name of the virtual machine')
param vmName string = 'jewelry-backend-vm'

@description('Name of the container registry')
param registryName string = 'jewelryshopacr${uniqueString(resourceGroup().id)}'

@description('Location for all resources')
param location string = resourceGroup().location

@description('VM size')
param vmSize string = 'Standard_B2s'

@description('Admin username for the VM')
param adminUsername string = 'azureuser'

@description('SSH public key for the VM')
@secure()
param sshPublicKey string = ''

// Variables
var networkName = 'jewelry-vnet'
var subnetName = 'jewelry-subnet'
var nsgName = 'jewelry-nsg'
var publicIpName = '${vmName}-ip'
var nicName = '${vmName}-nic'

// Virtual Network
resource vnet 'Microsoft.Network/virtualNetworks@2023-04-01' = {
  name: networkName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: ['10.0.0.0/16']
    }
    subnets: [
      {
        name: subnetName
        properties: {
          addressPrefix: '10.0.1.0/24'
          networkSecurityGroup: {
            id: nsg.id
          }
        }
      }
    ]
  }
}

// Network Security Group
resource nsg 'Microsoft.Network/networkSecurityGroups@2023-04-01' = {
  name: nsgName
  location: location
  properties: {
    securityRules: [
      {
        name: 'SSH'
        properties: {
          priority: 1001
          protocol: 'Tcp'
          access: 'Allow'
          direction: 'Inbound'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '22'
        }
      }
      {
        name: 'HTTP'
        properties: {
          priority: 1002
          protocol: 'Tcp'
          access: 'Allow'
          direction: 'Inbound'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '80'
        }
      }
      {
        name: 'Microservices'
        properties: {
          priority: 1003
          protocol: 'Tcp'
          access: 'Allow'
          direction: 'Inbound'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '3001-3009'
        }
      }
    ]
  }
}

// Public IP
resource publicIp 'Microsoft.Network/publicIPAddresses@2023-04-01' = {
  name: publicIpName
  location: location
  properties: {
    publicIPAllocationMethod: 'Static'
    dnsSettings: {
      domainNameLabel: toLower('${vmName}-${uniqueString(resourceGroup().id)}')
    }
  }
  sku: {
    name: 'Standard'
  }
}

// Network Interface
resource nic 'Microsoft.Network/networkInterfaces@2023-04-01' = {
  name: nicName
  location: location
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          privateIPAllocationMethod: 'Dynamic'
          subnet: {
            id: '${vnet.id}/subnets/${subnetName}'
          }
          publicIPAddress: {
            id: publicIp.id
          }
        }
      }
    ]
  }
}

// Container Registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: registryName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// Virtual Machine
resource vm 'Microsoft.Compute/virtualMachines@2023-03-01' = {
  name: vmName
  location: location
  properties: {
    hardwareProfile: {
      vmSize: vmSize
    }
    osProfile: {
      computerName: vmName
      adminUsername: adminUsername
      linuxConfiguration: {
        disablePasswordAuthentication: true
        ssh: {
          publicKeys: [
            {
              path: '/home/${adminUsername}/.ssh/authorized_keys'
              keyData: sshPublicKey != '' ? sshPublicKey : 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC...' // Default key placeholder
            }
          ]
        }
      }
    }
    storageProfile: {
      imageReference: {
        publisher: 'Canonical'
        offer: '0001-com-ubuntu-server-jammy'
        sku: '22_04-lts-gen2'
        version: 'latest'
      }
      osDisk: {
        createOption: 'FromImage'
        managedDisk: {
          storageAccountType: 'Premium_LRS'
        }
      }
    }
    networkProfile: {
      networkInterfaces: [
        {
          id: nic.id
        }
      ]
    }
  }
}

// VM Extension to install Docker and setup services
resource vmExtension 'Microsoft.Compute/virtualMachines/extensions@2023-03-01' = {
  parent: vm
  name: 'docker-setup'
  properties: {
    publisher: 'Microsoft.Azure.Extensions'
    type: 'CustomScript'
    typeHandlerVersion: '2.1'
    autoUpgradeMinorVersion: true
    settings: {
      fileUris: []
      commandToExecute: '''
        #!/bin/bash
        set -e
        
        # Update system
        apt-get update -y
        
        # Install Docker
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        usermod -aG docker azureuser
        
        # Install Docker Compose
        curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        
        # Install additional tools
        apt-get install -y git curl jq nginx
        
        # Create project directory
        mkdir -p /home/azureuser/jewelry-shop
        chown azureuser:azureuser /home/azureuser/jewelry-shop
        
        # Create docker-compose.yml for production
        cat > /home/azureuser/jewelry-shop/docker-compose.yml << 'EOFCOMPOSE'
version: '3.8'

services:
  user-management:
    image: ${registryName}.azurecr.io/user-management:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    restart: unless-stopped

  pricing-service:
    image: ${registryName}.azurecr.io/pricing-service:latest
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - PORT=3003
    restart: unless-stopped

  inventory-management:
    image: ${registryName}.azurecr.io/inventory-management:latest
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - PORT=3002
    restart: unless-stopped

  order-management:
    image: ${registryName}.azurecr.io/order-management:latest
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=production
      - PORT=3004
    restart: unless-stopped

  payment-service:
    image: ${registryName}.azurecr.io/payment-service:latest
    ports:
      - "3006:3006"
    environment:
      - NODE_ENV=production
      - PORT=3006
    restart: unless-stopped

  image-management:
    image: ${registryName}.azurecr.io/image-management:latest
    ports:
      - "3005:3005"
    environment:
      - NODE_ENV=production
      - PORT=3005
    restart: unless-stopped

  llm-service:
    image: ${registryName}.azurecr.io/llm-service:latest
    ports:
      - "3007:3007"
    environment:
      - NODE_ENV=production
      - PORT=3007
    restart: unless-stopped

  notification-service:
    image: ${registryName}.azurecr.io/notification-service:latest
    ports:
      - "3008:3008"
    environment:
      - NODE_ENV=production
      - PORT=3008
    restart: unless-stopped

  analytics-service:
    image: ${registryName}.azurecr.io/analytics-service:latest
    ports:
      - "3009:3009"
    environment:
      - NODE_ENV=production
      - PORT=3009
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - user-management
      - pricing-service
      - inventory-management
    restart: unless-stopped
EOFCOMPOSE

        # Create nginx configuration
        cat > /home/azureuser/jewelry-shop/nginx.conf << 'EOFNGINX'
events {
    worker_connections 1024;
}

http {
    upstream user_management {
        server user-management:3001;
    }
    
    upstream pricing_service {
        server pricing-service:3003;
    }
    
    upstream inventory_management {
        server inventory-management:3002;
    }

    server {
        listen 80;
        
        location /health {
            return 200 '{"status": "ok", "message": "Jewelry Shop Backend is healthy", "timestamp": "$time_iso8601"}';
            add_header Content-Type application/json;
        }
        
        location /api/users/ {
            proxy_pass http://user_management/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location /api/pricing/ {
            proxy_pass http://pricing_service/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location /api/inventory/ {
            proxy_pass http://inventory_management/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location / {
            return 200 '{"message": "Jewelry Shop Management System API", "version": "1.0.0"}';
            add_header Content-Type application/json;
        }
    }
}
EOFNGINX

        chown -R azureuser:azureuser /home/azureuser/jewelry-shop
        
        echo "VM setup completed successfully!"
      '''
    }
  }
}

// Outputs
output vmPublicIp string = publicIp.properties.ipAddress
output vmFqdn string = publicIp.properties.dnsSettings.fqdn
output registryLoginServer string = containerRegistry.properties.loginServer
output registryName string = containerRegistry.name