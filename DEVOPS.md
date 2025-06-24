# DevOps Guide - Jewelry Shop Management System

This guide covers the complete DevOps setup for the AI-Powered Jewelry Shop Management System with all 9 microservices and frontend.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ installed
- Git installed

### One-Command Setup
```bash
# Clone and setup the entire project
git clone <your-repo-url>
cd jewelry-shop-management-system
make setup
make start
```

That's it! All 9 microservices + frontend + databases will be running.

## 🛠️ Available Commands

### Using Make (Recommended)
```bash
make help         # Show all available commands
make setup        # Setup project (install deps, create .env)
make start        # Start all services
make stop         # Stop all services
make restart      # Restart all services
make status       # Check service health
make logs         # Show logs for all services
make urls         # Show all service URLs
make cleanup      # Clean up Docker resources
```

### Using DevOps Script
```bash
./devops.sh start                 # Start all services
./devops.sh stop                  # Stop all services
./devops.sh status               # Check health
./devops.sh logs user-management  # Show specific service logs
./devops.sh urls                 # Show all URLs
```

### Using Docker Compose Directly
```bash
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f frontend   # Follow frontend logs
docker-compose ps                 # Show running services
```

## 🏗️ Architecture Overview

### Services and Ports
- **Frontend**: http://localhost:3000 (Next.js)
- **API Gateway**: http://localhost:3010 (Nginx)
- **User Management**: http://localhost:3001 (Authentication, Users)
- **Inventory Management**: http://localhost:3002 (Stock, Items)
- **Pricing Service**: http://localhost:3003 (Gold rates, Pricing)
- **Order Management**: http://localhost:3004 (Orders, Invoices)
- **Image Management**: http://localhost:3005 (Photos, Gallery)
- **Payment Service**: http://localhost:3006 (Payments, Billing)
- **LLM Service**: http://localhost:3007 (AI, Voice, Chat)
- **Notification Service**: http://localhost:3008 (SMS, Email)
- **Analytics Service**: http://localhost:3009 (Reports, Analytics)

### Databases
- **PostgreSQL**: localhost:5432 (Main database)
- **Redis**: localhost:6379 (Cache, Sessions)

## 🔧 Configuration

### Environment Variables
Copy `.env.example` to `.env` and update with your API keys:

```bash
cp .env.example .env
# Edit .env with your actual API keys
```

Required API keys:
- `GOLD_API_KEY` - For real-time gold rates
- `OPENAI_API_KEY` - For AI features
- `GOOGLE_GEMINI_API_KEY` - Alternative AI model
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` - Payment gateway
- `AZURE_STORAGE_CONNECTION_STRING` - Image storage

### Service Configuration
Each service has its own configuration in `services/<service-name>/src/config/`.

## 🐳 Docker Configuration

### Development Setup
- Each service has a `Dockerfile.dev` for development
- Hot reloading enabled for all services
- Source code mounted as volumes for instant updates
- Separate containers for databases

### Production Setup
Use `docker-compose.prod.yml` for production deployment:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 Monitoring and Debugging

### Health Checks
```bash
make status        # Check all services
make health        # Comprehensive health check
```

### Logs
```bash
make logs                    # All service logs
make logs service=frontend   # Specific service logs
docker-compose logs -f       # Follow all logs
```

### Service Status
```bash
docker-compose ps            # Show running containers
docker stats                # Show resource usage
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill processes using ports
   sudo lsof -ti:3000 | xargs kill -9
   ```

2. **Docker Out of Space**
   ```bash
   make cleanup        # Clean up Docker resources
   docker system prune -a --volumes
   ```

3. **Service Won't Start**
   ```bash
   make logs service=<service-name>  # Check specific logs
   docker-compose restart <service-name>
   ```

4. **Database Connection Issues**
   ```bash
   docker-compose restart postgres redis
   make db-reset  # Reset database
   ```

### Performance Optimization

1. **Increase Docker Resources**
   - Docker Desktop → Settings → Resources
   - RAM: 8GB minimum, 16GB recommended
   - CPU: 4 cores minimum

2. **Enable Docker BuildKit**
   ```bash
   export DOCKER_BUILDKIT=1
   ```

## 🔐 Security

### Development Security
- Default passwords are for development only
- Change all secrets in production
- Use environment-specific .env files

### Production Security Checklist
- [ ] Change all default passwords
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS
- [ ] Configure firewall rules
- [ ] Use Docker secrets for sensitive data
- [ ] Enable container security scanning

## 📊 Scaling

### Horizontal Scaling
Scale individual services based on load:
```bash
docker-compose up -d --scale user-management=3
docker-compose up -d --scale pricing-service=2
```

### Load Balancing
The Nginx API Gateway automatically load balances requests.

### Database Scaling
- Use read replicas for PostgreSQL
- Implement Redis Cluster for cache scaling

## 🚀 Deployment

### Local Development
```bash
make start          # Start with hot reloading
```

### Staging Environment
```bash
export NODE_ENV=staging
docker-compose -f docker-compose.staging.yml up -d
```

### Production Deployment
```bash
export NODE_ENV=production
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD Pipeline
The project includes GitHub Actions workflows for:
- Automated testing
- Docker image building
- Security scanning
- Deployment to Azure

## 🎯 Development Workflow

### Starting Development
1. `make setup` - Setup project
2. `make start` - Start all services
3. `make status` - Verify everything is running
4. Open http://localhost:3000

### Making Changes
1. Edit code (hot reloading enabled)
2. `make logs service=<service>` - Check logs
3. `make test` - Run tests
4. `make lint` - Check code quality

### Adding New Services
1. Create service directory in `services/`
2. Add to `docker-compose.yml`
3. Update Nginx configuration
4. Add to DevOps scripts

## 📈 Monitoring

### Application Monitoring
- Health checks on all services
- Automatic restart on failure
- Resource usage monitoring

### Performance Monitoring
```bash
docker stats        # Real-time resource usage
make health        # Service health overview
```

### Log Aggregation
All logs are centralized and can be forwarded to:
- ELK Stack
- Azure Application Insights
- Datadog

## 🔄 Backup and Recovery

### Database Backup
```bash
# Automated backup script
./scripts/backup-database.sh
```

### Disaster Recovery
- Database backups stored in Azure Blob Storage
- Complete infrastructure as code
- One-command restore capability

## 📋 Checklists

### Pre-Production Checklist
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Security scan passed
- [ ] Performance testing completed

### Daily Operations Checklist
- [ ] Check service health: `make status`
- [ ] Review error logs: `make logs`
- [ ] Monitor resource usage: `docker stats`
- [ ] Verify backups completed
- [ ] Check security alerts

## 🎉 Success!

If you see all services showing as "Healthy" when running `make status`, congratulations! You have successfully deployed the complete Jewelry Shop Management System with:

✅ 9 Microservices running
✅ Frontend application ready
✅ Databases operational
✅ API Gateway configured
✅ Health monitoring active
✅ Development workflow ready

Visit http://localhost:3000 to access your jewelry shop management system!

## 💡 Tips

1. **Use `make` commands** - They're the easiest way to manage everything
2. **Check logs regularly** - `make logs` shows all service logs
3. **Monitor health** - `make status` gives you a quick overview
4. **Use the API Gateway** - All API calls go through http://localhost:3010
5. **Hot reloading works** - Edit code and see changes instantly

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Run `make status` to identify problem services
3. Check specific service logs with `make logs service=<name>`
4. Review the configuration in `.env`
5. Ensure Docker has sufficient resources

For additional support, refer to the main project documentation or create an issue in the repository.