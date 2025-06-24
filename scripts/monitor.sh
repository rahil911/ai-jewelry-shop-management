#!/bin/bash

# Jewelry Shop Management System - Monitoring Script
# Real-time monitoring dashboard for all services

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Function to check service health
check_service_health() {
    local service_name=$1
    local port=$2
    local endpoint=${3:-""}
    
    if curl -f -s "http://localhost:$port$endpoint" >/dev/null 2>&1; then
        echo -e "${GREEN}●${NC}"
    else
        echo -e "${RED}●${NC}"
    fi
}

# Function to get container status
get_container_status() {
    local container_name=$1
    local status=$(docker ps --filter "name=$container_name" --format "{{.Status}}" 2>/dev/null)
    
    if [[ $status =~ "Up" ]]; then
        echo -e "${GREEN}Running${NC}"
    elif [[ $status =~ "Restarting" ]]; then
        echo -e "${YELLOW}Restarting${NC}"
    else
        echo -e "${RED}Stopped${NC}"
    fi
}

# Function to get resource usage
get_resource_usage() {
    local container_name=$1
    local stats=$(docker stats --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" $container_name 2>/dev/null | tail -n 1)
    
    if [ -n "$stats" ]; then
        echo "$stats"
    else
        echo "N/A"
    fi
}

# Main monitoring loop
monitor_services() {
    while true; do
        clear
        echo -e "${BLUE}┌─────────────────────────────────────────────────────────────────┐${NC}"
        echo -e "${BLUE}│  🏪 Jewelry Shop Management System - Real-Time Monitor        │${NC}"
        echo -e "${BLUE}└─────────────────────────────────────────────────────────────────┘${NC}"
        echo ""
        echo -e "${CYAN}Last Update: $(date)${NC}"
        echo ""
        
        # Services Status
        echo -e "${PURPLE}┌─ Services Status ────────────────────────────────────────────────┐${NC}"
        printf "%-20s %-8s %-10s %-15s %-20s\n" "Service" "Health" "Status" "CPU/Memory" "Container"
        echo "─────────────────────────────────────────────────────────────────────"
        
        # Frontend
        health=$(check_service_health "Frontend" "3000")
        status=$(get_container_status "jewelry-frontend")
        resources=$(get_resource_usage "jewelry-frontend")
        printf "%-20s %-8s %-10s %-35s\n" "Frontend" "$health" "$status" "$resources"
        
        # API Gateway
        health=$(check_service_health "API Gateway" "3010" "/health")
        status=$(get_container_status "jewelry-api-gateway")
        resources=$(get_resource_usage "jewelry-api-gateway")
        printf "%-20s %-8s %-10s %-35s\n" "API Gateway" "$health" "$status" "$resources"
        
        # Microservices
        services=(
            "User Management:3001:jewelry-user-management"
            "Inventory:3002:jewelry-inventory-management"
            "Pricing Service:3003:jewelry-pricing-service"
            "Order Management:3004:jewelry-order-management"
            "Image Management:3005:jewelry-image-management"
            "Payment Service:3006:jewelry-payment-service"
            "LLM Service:3007:jewelry-llm-service"
            "Notifications:3008:jewelry-notification-service"
            "Analytics:3009:jewelry-analytics-service"
        )
        
        for service_info in "${services[@]}"; do
            IFS=':' read -r service_name port container_name <<< "$service_info"
            health=$(check_service_health "$service_name" "$port" "/health")
            status=$(get_container_status "$container_name")
            resources=$(get_resource_usage "$container_name")
            printf "%-20s %-8s %-10s %-35s\n" "$service_name" "$health" "$status" "$resources"
        done
        
        echo -e "${PURPLE}└──────────────────────────────────────────────────────────────────┘${NC}"
        echo ""
        
        # Database Status
        echo -e "${PURPLE}┌─ Database Status ────────────────────────────────────────────────┐${NC}"
        postgres_status=$(get_container_status "jewelry-postgres")
        redis_status=$(get_container_status "jewelry-redis")
        postgres_resources=$(get_resource_usage "jewelry-postgres")
        redis_resources=$(get_resource_usage "jewelry-redis")
        
        printf "%-20s %-8s %-10s %-35s\n" "PostgreSQL" "$(check_service_health "PostgreSQL" "5432")" "$postgres_status" "$postgres_resources"
        printf "%-20s %-8s %-10s %-35s\n" "Redis" "$(check_service_health "Redis" "6379")" "$redis_status" "$redis_resources"
        echo -e "${PURPLE}└──────────────────────────────────────────────────────────────────┘${NC}"
        echo ""
        
        # System Overview
        echo -e "${PURPLE}┌─ System Overview ────────────────────────────────────────────────┐${NC}"
        total_containers=$(docker ps -q | wc -l)
        running_containers=$(docker ps --filter "status=running" -q | wc -l)
        
        echo -e "Total Containers: ${CYAN}$total_containers${NC}"
        echo -e "Running Containers: ${GREEN}$running_containers${NC}"
        echo -e "Docker Images: ${CYAN}$(docker images -q | wc -l)${NC}"
        echo -e "Docker Volumes: ${CYAN}$(docker volume ls -q | wc -l)${NC}"
        echo -e "${PURPLE}└──────────────────────────────────────────────────────────────────┘${NC}"
        echo ""
        
        # Quick Actions
        echo -e "${PURPLE}┌─ Quick Actions ──────────────────────────────────────────────────┐${NC}"
        echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
        echo -e "${YELLOW}Commands: make start | make stop | make restart | make logs${NC}"
        echo -e "${PURPLE}└──────────────────────────────────────────────────────────────────┘${NC}"
        
        # Wait before next update
        sleep 5
    done
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Start monitoring
echo -e "${GREEN}Starting Jewelry Shop Management System Monitor...${NC}"
echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
sleep 2

monitor_services