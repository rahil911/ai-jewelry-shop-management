# 🚀 Deployment Guide

## Overview

This project uses **GitHub Actions CI/CD** for automated deployment to Azure. Every push to the `main` branch automatically deploys the entire system.

## Architecture

```
GitHub → GitHub Actions → Azure Container Registry → Azure VM → Docker Compose
```

## Prerequisites

1. **Azure Account** with active subscription
2. **GitHub Repository** with this code
3. **Azure Service Principal** for GitHub Actions authentication

## Setup Process

### 1. Run Setup Script

```bash
./setup.sh
```

This script will:
- Check prerequisites (Azure CLI, Node.js)
- Create Azure Service Principal
- Install all dependencies
- Build all services
- Provide Azure credentials for GitHub

### 2. Configure GitHub Secrets

Add these secrets to your GitHub repository:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `AZURE_CREDENTIALS` | Service Principal JSON | Provided by `setup.sh` script |

### 3. Deploy

Simply push to main branch:

```bash
git add .
git commit -m "Deploy jewelry shop system"
git push origin main
```

## Deployment Process

### Build Phase (5-7 minutes)
1. **Install Dependencies** - All services and shared library
2. **Build Shared Library** - Common utilities and types
3. **Build Services** - All 9 microservices
4. **Run Tests** - Type checking and linting
5. **Build Docker Images** - Container images for each service

### Deploy Phase (8-10 minutes)
1. **Deploy Infrastructure** - Azure VM, networking, security groups
2. **Setup VM** - Install Docker, Docker Compose, configure environment
3. **Push Images** - Upload container images to Azure Container Registry
4. **Start Services** - Deploy with Docker Compose
5. **Health Checks** - Verify all services are responding

## Infrastructure Details

### Azure Resources Created

| Resource | Purpose | Cost/Month |
|----------|---------|------------|
| **Virtual Machine** (Standard_B2s) | Host all microservices | ~$30 |
| **Container Registry** (Basic) | Store Docker images | ~$5 |
| **Storage Account** | Logs and data | ~$2 |
| **Network Security Group** | Firewall rules | Free |
| **Public IP** | External access | ~$3 |
| **Virtual Network** | Private networking | Free |

**Total: ~$40/month**

### VM Configuration

- **OS**: Ubuntu 22.04 LTS
- **Size**: Standard_B2s (2 vCPU, 4GB RAM)
- **Disk**: 30GB Premium SSD
- **Docker**: Latest version with Docker Compose v2
- **Services**: All 9 microservices + Nginx gateway

## Service Architecture

### Microservices Deployed

1. **User Management** (Port 3001)
   - Authentication, JWT tokens
   - User registration and login
   - Role-based access control

2. **Pricing Service** (Port 3003)
   - Real-time gold rate integration
   - Making charges calculation
   - Dynamic pricing with GST

3. **Inventory Management** (Port 3002)
   - Stock tracking and valuation
   - Barcode management
   - Multi-location support

4. **Order Management** (Port 3004)
   - Order lifecycle management
   - Invoice generation
   - Customization handling

5. **Payment Service** (Port 3006)
   - Payment processing
   - Financial tracking
   - Integration with payment gateways

6. **Image Management** (Port 3005)
   - Product photo uploads
   - Image optimization
   - Gallery management

7. **LLM Service** (Port 3007)
   - AI chat functionality
   - Multilingual support
   - Voice processing

8. **Notification Service** (Port 3008)
   - SMS and email notifications
   - Push notifications
   - WhatsApp integration

9. **Analytics Service** (Port 3009)
   - Business reporting
   - Sales analytics
   - Performance metrics

### API Gateway (Nginx)

- **Port 80** - Main entry point
- **Load Balancing** - Distributes requests
- **Health Checks** - Monitors service status
- **SSL Termination** - HTTPS support (when configured)

## Environment Variables

### Production Environment

All services are configured with:

```bash
NODE_ENV=production
PORT=<service-port>
JWT_SECRET=<secure-secret>
DATABASE_URL=<postgresql-connection>
REDIS_URL=<redis-connection>
```

### Secrets Management

Sensitive configuration is managed through:
- **GitHub Secrets** - Build-time secrets
- **Azure Key Vault** - Runtime secrets (optional)
- **Environment Variables** - Non-sensitive config

## Health Monitoring

### Endpoints

All services provide health check endpoints:

```bash
# API Gateway
curl http://<vm-ip>/health

# Individual Services
curl http://<vm-ip>:3001/health  # User Management
curl http://<vm-ip>:3003/health  # Pricing Service
curl http://<vm-ip>:3002/health  # Inventory Management
# ... etc for all services
```

### Monitoring Commands

```bash
# SSH into VM
ssh azureuser@<vm-ip>

# Check service status
docker-compose ps

# View logs
docker-compose logs <service-name>

# Restart service
docker-compose restart <service-name>

# Update services
docker-compose pull && docker-compose up -d
```

## Scaling

### Vertical Scaling (Upgrade VM)

1. Stop services: `docker-compose down`
2. Resize VM in Azure Portal
3. Start services: `docker-compose up -d`

### Horizontal Scaling (Multiple VMs)

1. Deploy additional VMs
2. Configure load balancer
3. Update DNS to point to load balancer

## Troubleshooting

### Common Issues

**Build Failures**
- Check GitHub Actions logs
- Verify all dependencies are installed
- Ensure TypeScript compilation succeeds

**Deployment Failures**
- Verify Azure credentials in GitHub secrets
- Check Azure subscription has sufficient quota
- Ensure resource group doesn't already exist

**Service Not Responding**
```bash
# Check if service is running
docker-compose ps

# View service logs
docker-compose logs <service-name>

# Restart specific service
docker-compose restart <service-name>

# Full restart
docker-compose down && docker-compose up -d
```

**Database Connection Issues**
- Verify PostgreSQL is accessible
- Check connection string format
- Ensure firewall allows connections

### Debug Commands

```bash
# VM resource usage
top
df -h
free -m

# Docker resource usage
docker stats

# Network connectivity
curl -I http://localhost:3001/health
netstat -tulpn | grep :3001

# Service logs
docker-compose logs --tail=50 user-management
```

## Updates & Maintenance

### Automated Updates

Every push to `main` branch automatically:
1. Builds new Docker images
2. Pushes to container registry
3. Updates running services with zero downtime

### Manual Updates

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d --force-recreate
```

### Database Migrations

```bash
# Run migrations (when database is connected)
cd shared
npm run migrate
npm run seed
```

## Security

### Network Security

- **Firewall Rules**: Only required ports open (22, 80, 3001-3009)
- **SSH Keys**: Password authentication disabled
- **VPN**: Optional - Azure Virtual Network Gateway

### Application Security

- **JWT Tokens**: Secure authentication
- **Input Validation**: Joi schemas for all inputs
- **Rate Limiting**: Prevents API abuse
- **CORS**: Configured for frontend domain

### Data Security

- **Encryption**: All data encrypted at rest
- **Backups**: Automated database backups
- **Secrets**: Environment variables for sensitive data

## Cost Optimization

### Current Costs (~$40/month)

- **VM**: $30 (can be reduced to ~$15 with smaller size)
- **Storage**: $2 (minimal usage)
- **Networking**: $3 (standard rates)
- **Registry**: $5 (can be reduced with cleanup)

### Optimization Strategies

1. **Smaller VM**: Use Standard_B1s for development
2. **Spot Instances**: 70% cost reduction for non-production
3. **Reserved Instances**: 30% discount for 1-year commitment
4. **Auto-shutdown**: Schedule VM to stop during off-hours

## Backup & Recovery

### Automated Backups

- **Database**: Daily automated backups
- **Docker Images**: Stored in container registry
- **Code**: Version controlled in GitHub

### Recovery Process

1. **Redeploy VM**: Run GitHub Actions workflow
2. **Restore Database**: From automated backup
3. **Verify Services**: Run health checks

### Disaster Recovery

- **RTO**: 30 minutes (Recovery Time Objective)
- **RPO**: 24 hours (Recovery Point Objective)
- **Backup Location**: Different Azure region

## Support

### Documentation
- **API Documentation**: Available at `/docs` endpoint
- **Service Documentation**: In each service's README
- **Architecture Diagrams**: In `/docs` folder

### Monitoring
- **Azure Monitor**: VM and network metrics
- **Application Insights**: Service performance
- **Custom Dashboards**: Business metrics

### Contact
- **Issues**: Create GitHub issue
- **Questions**: GitHub Discussions
- **Emergency**: Check runbook in `/docs/RUNBOOK.md`