# 🏪 Jewelry Shop Management System

> AI-Powered E-commerce & ERP Platform for Traditional Indian Jewelry Businesses

[![Deploy to Azure](https://github.com/rahilharihar/jewelry-shop-management-system/workflows/Deploy%20Jewelry%20Shop%20Management%20System/badge.svg)](https://github.com/rahilharihar/jewelry-shop-management-system/actions)

## 🚀 **One-Command Deployment**

```bash
git clone <your-repo-url>
cd jewelry-shop-management-system
./setup.sh
```

That's it! Your complete jewelry shop management system will be deployed to Azure automatically.

## 📋 **What You Get**

### 🏗️ **9 Microservices**
- **User Management** - Authentication, roles, customers
- **Inventory Management** - Stock tracking, barcodes, valuations  
- **Pricing Service** - Real-time gold rates, making charges
- **Order Management** - Order lifecycle, customizations, invoices
- **Payment Service** - Secure payments, financial tracking
- **Image Management** - Product photos, gallery management
- **LLM Service** - AI chat, multilingual support (Kannada/Hindi/English)
- **Notification Service** - SMS, email, WhatsApp integration
- **Analytics Service** - Business insights, reporting

### 🎨 **Modern Frontend**
- **Next.js 14** with TypeScript
- **Responsive Design** for mobile and desktop
- **Real-time Updates** with WebSocket connections
- **Authentication** with JWT tokens
- **Dashboard** with analytics and insights

## 🏛️ **Architecture**

```
Frontend (Next.js) → API Gateway (Nginx) → Microservices (Docker) → Database (PostgreSQL)
                                    ↓
                            AI Services (OpenAI/Gemini)
```

## 💰 **Cost Breakdown**

| Component | Monthly Cost |
|-----------|-------------|
| Azure VM (Standard_B2s) | ~$30 |
| PostgreSQL Database | ~$15 |
| Storage & Networking | ~$5 |
| **Total** | **~$50/month** |

## 🔧 **Prerequisites**

- **Azure Account** with active subscription
- **Node.js 18+** installed locally
- **Azure CLI** installed and authenticated
- **GitHub Account** for CI/CD

## 📦 **Quick Setup**

### 1. **Azure Setup**
```bash
# Install Azure CLI (if not installed)
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login
```

### 2. **Clone and Deploy**
```bash
git clone <your-repo-url>
cd jewelry-shop-management-system
./setup.sh
```

### 3. **Push to Deploy**
```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

## 🎯 **Deployment Process**

1. **GitHub Actions** automatically triggers on push to `main`
2. **Build Phase** - Tests all services, builds Docker images
3. **Infrastructure** - Deploys Azure resources using Bicep
4. **Deploy Phase** - Pushes containers and starts services
5. **Health Checks** - Verifies all endpoints are responding

## 🌐 **Access Your Application**

After deployment completes (10-15 minutes):

```bash
# Your VM IP will be shown in GitHub Actions logs
VM_IP="<your-vm-ip>"

# API Gateway
curl http://$VM_IP/health

# Individual Services
curl http://$VM_IP:3001/health  # User Management
curl http://$VM_IP:3003/health  # Pricing Service
curl http://$VM_IP:3002/health  # Inventory Management
```

## 🧪 **Testing Business Features**

### Gold Rate API
```bash
curl http://$VM_IP:3003/api/gold-rates/current
```

### Price Calculation
```bash
curl -X POST http://$VM_IP:3003/api/pricing/calculate-item-price \
  -H "Content-Type: application/json" \
  -d '{"weight": 10, "purity": 22, "makingCharges": 15}'
```

### Inventory Management
```bash
curl http://$VM_IP:3002/api/inventory/items
```

### User Authentication
```bash
curl -X POST http://$VM_IP:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

## 🔧 **Development**

### Local Development
```bash
# Start all services locally
npm run dev

# Start individual service
cd services/user-management
npm run dev
```

### Adding New Features
1. Make changes to your service
2. Test locally with `npm run dev`
3. Push to GitHub - automatic deployment!

## 📚 **Project Structure**

```
jewelry-shop-management-system/
├── .github/workflows/     # CI/CD pipelines
├── infrastructure/        # Azure Bicep templates
├── services/             # 9 microservices
│   ├── user-management/
│   ├── pricing-service/
│   ├── inventory-management/
│   └── ...
├── frontend/             # Next.js application
├── shared/              # Common utilities
├── setup.sh            # One-command setup
└── README.md          # This file
```

## 🔐 **Security Features**

- **JWT Authentication** with refresh tokens
- **Role-based Access Control** (Owner/Manager/Staff/Customer)
- **API Rate Limiting** to prevent abuse
- **Input Validation** with Joi schemas
- **HTTPS Encryption** for all communications
- **Azure Security Groups** for network protection

## 🌍 **Multi-language Support**

The system supports Indian jewelry businesses with:
- **English** - Primary business language
- **Hindi** - Customer communication
- **Kannada** - Regional support
- **Voice Interface** - Talk to your ERP in local language

## 📊 **Business Features**

### Jewelry-Specific Functionality
- **Real-time Gold Rates** from multiple APIs
- **Making Charges** calculation (percentage & fixed)
- **Purity Management** (22K, 18K, 14K gold)
- **GST Compliance** for Indian market
- **Barcode Management** for inventory
- **Custom Design** orders and tracking

### AI-Powered Features
- **Natural Language Queries** - "Show me sales from last week"
- **Voice Commands** - Speak to your system in regional languages
- **Smart Analytics** - AI-generated business insights
- **Customer Support** - Automated chat assistance

## 📈 **Monitoring & Maintenance**

### Health Monitoring
```bash
# Check all services
curl http://$VM_IP/health

# View logs
ssh azureuser@$VM_IP 'docker-compose logs'
```

### Scaling
- **Vertical Scaling** - Upgrade VM size in Azure portal
- **Horizontal Scaling** - Add more VM instances
- **Database Scaling** - Upgrade PostgreSQL tier

## 🆘 **Troubleshooting**

### Common Issues

**Deployment Failed?**
- Check GitHub Actions logs
- Verify Azure credentials in repository secrets
- Ensure VM has enough resources

**Services Not Responding?**
```bash
ssh azureuser@$VM_IP 'docker-compose ps'
ssh azureuser@$VM_IP 'docker-compose logs service-name'
```

**Database Connection Issues?**
- Verify PostgreSQL is running
- Check connection strings in environment variables

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes and test locally
4. Push to GitHub - CI/CD will test automatically
5. Create Pull Request

## 📞 **Support**

- **Documentation** - Check this README and code comments
- **Issues** - Create GitHub issue for bugs
- **Discussions** - GitHub Discussions for questions

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎉 **Success!**

Your complete jewelry shop management system is now running on Azure with:
- ✅ 9 microservices deployed
- ✅ Modern React frontend
- ✅ AI-powered features
- ✅ Automatic CI/CD pipeline
- ✅ Professional monitoring
- ✅ Industry-standard security

**Total setup time:** 15 minutes  
**Monthly cost:** ~$50  
**Scalability:** Enterprise-ready  

Happy jewelry business management! 💎