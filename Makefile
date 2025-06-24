# Jewelry Shop Management System - Makefile
# Simple commands to manage the entire microservices architecture

.PHONY: help setup start stop restart status logs urls cleanup build test lint

# Default target
help:
	@echo "🏪 Jewelry Shop Management System - DevOps Commands"
	@echo "=================================================="
	@echo ""
	@echo "Available commands:"
	@echo "  make setup     - Setup the project (install deps, create .env)"
	@echo "  make start     - Start all services with Docker Compose"
	@echo "  make stop      - Stop all services"
	@echo "  make restart   - Restart all services"
	@echo "  make status    - Check service health status"
	@echo "  make logs      - Show logs for all services"
	@echo "  make urls      - Show all service URLs"
	@echo "  make build     - Build all services"
	@echo "  make test      - Run tests for all services"
	@echo "  make lint      - Run linting for all services"
	@echo "  make cleanup   - Clean up Docker resources"
	@echo ""
	@echo "Examples:"
	@echo "  make start                    # Start everything"
	@echo "  make logs service=frontend    # Show frontend logs"
	@echo "  make restart                 # Restart all services"
	@echo ""

# Setup the project
setup:
	@echo "🛠️  Setting up Jewelry Shop Management System..."
	npm install
	@if [ ! -f .env ]; then \
		echo "📄 Creating .env file..."; \
		cp .env.example .env; \
		echo "✅ .env file created! Please update it with your API keys."; \
	else \
		echo "✅ .env file already exists."; \
	fi
	@echo "🎉 Setup complete!"

# Start all services
start:
	@echo "🚀 Starting all services..."
	./devops.sh start

# Stop all services
stop:
	@echo "🛑 Stopping all services..."
	./devops.sh stop

# Restart all services
restart:
	@echo "🔄 Restarting all services..."
	./devops.sh restart

# Check service status
status:
	@echo "🏥 Checking service health..."
	./devops.sh status

# Show logs
logs:
	@if [ "$(service)" ]; then \
		echo "📋 Showing logs for $(service)..."; \
		./devops.sh logs $(service); \
	else \
		echo "📋 Showing logs for all services..."; \
		./devops.sh logs; \
	fi

# Show service URLs
urls:
	@echo "🌐 Service URLs:"
	./devops.sh urls

# Build all services
build:
	@echo "🔨 Building all services..."
	npm run build

# Run tests
test:
	@echo "🧪 Running tests..."
	npm run test

# Run linting
lint:
	@echo "🔍 Running linting..."
	npm run lint

# Clean up Docker resources
cleanup:
	@echo "🧹 Cleaning up Docker resources..."
	./devops.sh cleanup

# Development shortcuts
dev-frontend:
	@echo "🎨 Starting frontend in development mode..."
	cd frontend && npm run dev

dev-user-management:
	@echo "👤 Starting user management service..."
	cd services/user-management && npm run dev

dev-pricing:
	@echo "💰 Starting pricing service..."
	cd services/pricing-service && npm run dev

# Database operations
db-setup:
	@echo "🗄️  Setting up database..."
	docker-compose up -d postgres redis
	sleep 10
	npm run db:migrate
	npm run db:seed

db-reset:
	@echo "♻️  Resetting database..."
	docker-compose down -v
	make db-setup

# Quick development start (essential services only)
dev-quick:
	@echo "⚡ Starting essential services for quick development..."
	docker-compose up -d postgres redis frontend user-management pricing-service

# Production build
prod-build:
	@echo "🏭 Building for production..."
	NODE_ENV=production npm run build

# Health check
health:
	@echo "🔍 Running comprehensive health check..."
	@./devops.sh status
	@echo ""
	@echo "🌐 Testing API endpoints..."
	@curl -f http://localhost:3010/health >/dev/null 2>&1 && echo "✅ API Gateway: Healthy" || echo "❌ API Gateway: Unhealthy"
	@curl -f http://localhost:3000 >/dev/null 2>&1 && echo "✅ Frontend: Healthy" || echo "❌ Frontend: Unhealthy"

# Install dependencies for all services
install:
	@echo "📦 Installing dependencies for all services..."
	npm install
	cd frontend && npm install
	cd services/user-management && npm install
	cd services/pricing-service && npm install
	cd services/inventory-management && npm install
	cd services/order-management && npm install
	cd services/image-management && npm install
	cd services/payment-service && npm install
	cd services/llm-service && npm install
	cd services/notification-service && npm install
	cd services/analytics-service && npm install
	cd shared && npm install