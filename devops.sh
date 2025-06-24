#!/bin/bash

# Jewelry Shop Management System - DevOps Script
# This script provides easy commands to manage the entire microservices architecture

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project info
PROJECT_NAME="Jewelry Shop Management System"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Function to print colored output
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

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
}

# Function to start all services
start_services() {
    print_status "Starting all ${PROJECT_NAME} services..."
    check_docker
    check_docker_compose
    
    # Stop any existing services first
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Build and start services
    print_status "Building and starting services (this may take a few minutes on first run)..."
    docker-compose up -d --build
    
    print_success "All services are starting up!"
    print_status "Waiting for services to be healthy..."
    
    # Wait for services to be healthy
    sleep 10
    
    # Check service status
    check_services_health
}

# Function to stop all services
stop_services() {
    print_status "Stopping all ${PROJECT_NAME} services..."
    docker-compose down --remove-orphans
    print_success "All services stopped!"
}

# Function to restart all services
restart_services() {
    print_status "Restarting all ${PROJECT_NAME} services..."
    stop_services
    start_services
}

# Function to check services health
check_services_health() {
    print_status "Checking service health..."
    
    services=(
        "frontend:3000"
        "user-management:3001"
        "inventory-management:3002"
        "pricing-service:3003"
        "order-management:3004"
        "image-management:3005"
        "payment-service:3006"
        "llm-service:3007"
        "notification-service:3008"
        "analytics-service:3009"
        "api-gateway:3010"
    )
    
    echo ""
    echo "🏥 Service Health Status:"
    echo "========================"
    
    for service_port in "${services[@]}"; do
        service=$(echo $service_port | cut -d: -f1)
        port=$(echo $service_port | cut -d: -f2)
        
        if curl -f -s "http://localhost:$port/health" >/dev/null 2>&1 || curl -f -s "http://localhost:$port" >/dev/null 2>&1; then
            echo -e "✅ $service (port $port) - ${GREEN}Healthy${NC}"
        else
            echo -e "❌ $service (port $port) - ${RED}Unhealthy${NC}"
        fi
    done
    
    echo ""
    print_status "Database Services:"
    if docker-compose ps postgres | grep -q "Up"; then
        echo -e "✅ PostgreSQL - ${GREEN}Running${NC}"
    else
        echo -e "❌ PostgreSQL - ${RED}Not Running${NC}"
    fi
    
    if docker-compose ps redis | grep -q "Up"; then
        echo -e "✅ Redis - ${GREEN}Running${NC}"
    else
        echo -e "❌ Redis - ${RED}Not Running${NC}"
    fi
    
    echo ""
    print_success "Health check complete!"
}

# Function to show logs
show_logs() {
    service=${1:-"all"}
    
    if [ "$service" = "all" ]; then
        print_status "Showing logs for all services..."
        docker-compose logs -f --tail=100
    else
        print_status "Showing logs for $service..."
        docker-compose logs -f --tail=100 "$service"
    fi
}

# Function to show service URLs
show_urls() {
    echo ""
    echo "🌐 Service URLs:"
    echo "==============="
    echo -e "Frontend:           ${BLUE}http://localhost:3000${NC}"
    echo -e "API Gateway:        ${BLUE}http://localhost:3010${NC}"
    echo -e "User Management:    ${BLUE}http://localhost:3001${NC}"
    echo -e "Inventory:          ${BLUE}http://localhost:3002${NC}"
    echo -e "Pricing Service:    ${BLUE}http://localhost:3003${NC}"
    echo -e "Order Management:   ${BLUE}http://localhost:3004${NC}"
    echo -e "Image Management:   ${BLUE}http://localhost:3005${NC}"
    echo -e "Payment Service:    ${BLUE}http://localhost:3006${NC}"
    echo -e "LLM Service:        ${BLUE}http://localhost:3007${NC}"
    echo -e "Notifications:      ${BLUE}http://localhost:3008${NC}"
    echo -e "Analytics:          ${BLUE}http://localhost:3009${NC}"
    echo ""
    echo "📊 Database URLs:"
    echo "=================="
    echo -e "PostgreSQL:         ${BLUE}localhost:5432${NC}"
    echo -e "Redis:              ${BLUE}localhost:6379${NC}"
    echo ""
}

# Function to setup the project
setup_project() {
    print_status "Setting up ${PROJECT_NAME}..."
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm install
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating .env file..."
        cat > .env << EOF
# Database Configuration
DATABASE_URL=postgres://jewelry_admin:jewelry_secure_2024@localhost:5432/jewelry_shop
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=jewelry_jwt_secret_2024_ultra_secure
JWT_REFRESH_SECRET=jewelry_refresh_secret_2024_ultra_secure

# API Keys (Replace with your actual keys)
GOLD_API_KEY=your_gold_api_key_here
METAL_PRICE_API_KEY=your_metal_price_api_key_here
OPENAI_API_KEY=your_openai_api_key
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key

# Payment Gateway Keys
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
STRIPE_SECRET_KEY=your_stripe_secret_key

# Azure Configuration
AZURE_STORAGE_CONNECTION_STRING=your_azure_storage_connection_string
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=your_azure_speech_region

# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# SMS & WhatsApp
SMS_API_KEY=your_sms_api_key
WHATSAPP_API_KEY=your_whatsapp_api_key
EOF
        print_success ".env file created! Please update it with your actual API keys."
    fi
    
    print_success "Project setup complete!"
    print_warning "Please update the .env file with your actual API keys before starting services."
}

# Function to clean up Docker resources
cleanup() {
    print_status "Cleaning up Docker resources..."
    docker-compose down --volumes --remove-orphans
    docker system prune -f
    print_success "Cleanup complete!"
}

# Function to show help
show_help() {
    echo ""
    echo "🏪 ${PROJECT_NAME} - DevOps Management Script"
    echo "============================================="
    echo ""
    echo "Usage: ./devops.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start all services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  status      Check service health status"
    echo "  logs [service]  Show logs (default: all services)"
    echo "  urls        Show all service URLs"
    echo "  setup       Setup the project (install dependencies, create .env)"
    echo "  cleanup     Clean up Docker resources"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./devops.sh start                 # Start all services"
    echo "  ./devops.sh logs user-management  # Show user management logs"
    echo "  ./devops.sh status               # Check all service health"
    echo ""
}

# Main script logic
case "${1:-help}" in
    start)
        start_services
        show_urls
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        show_urls
        ;;
    status)
        check_services_health
        ;;
    logs)
        show_logs "${2:-all}"
        ;;
    urls)
        show_urls
        ;;
    setup)
        setup_project
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac