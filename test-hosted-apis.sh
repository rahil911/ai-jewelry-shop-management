#!/bin/bash

# 💎 Jewelry Shop Management System - Comprehensive API Testing
# Testing all deployed services on Azure VM: 4.236.132.147
# Updated: June 24, 2025 - Testing 3/9 deployed microservices

BASE_URL="http://4.236.132.147"
echo "💎 Testing Jewelry Shop Management System APIs"
echo "🌐 Production URL: $BASE_URL"
echo "📅 Test Date: $(date)"
echo "🎯 Services: User Management, Pricing, Inventory (3/9 deployed)"
echo "=============================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test API endpoints
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${BLUE}Testing: $description${NC}"
    echo "Endpoint: $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ SUCCESS (HTTP $http_code)${NC}"
        echo "Response: $body" | jq . 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ FAILED (HTTP $http_code)${NC}"
        echo "Response: $body"
    fi
    echo "=================================================="
}

# Test System Health
test_endpoint "GET" "/health" "" "System Health Check"

# Test User Management Service
echo -e "${YELLOW}📱 User Management Service Tests${NC}"
test_endpoint "POST" "/api/auth/login" '{"email":"test@jewelry.com","password":"password123"}' "User Login"
test_endpoint "POST" "/api/auth/register" '{"email":"newuser@jewelry.com","password":"password123","name":"New User"}' "User Registration"
test_endpoint "GET" "/api/users" "" "Get Users List"

# Test Pricing Service  
echo -e "${YELLOW}💰 Pricing Service Tests${NC}"
test_endpoint "GET" "/api/gold-rates/current" "" "Current Gold Rates"
test_endpoint "GET" "/api/gold-rates/history?days=7" "" "Gold Rate History (7 days)"
test_endpoint "GET" "/api/making-charges" "" "Making Charges Configuration"
test_endpoint "POST" "/api/pricing/calculate-item-price" '{"weight":15.5,"purity":"22K","making_charge_percentage":12}' "Calculate Item Price (15.5g 22K Gold Ring)"
test_endpoint "POST" "/api/pricing/calculate-item-price" '{"weight":25.0,"purity":"18K","making_charge_percentage":15}' "Calculate Item Price (25g 18K Gold Necklace)"

# Test Inventory Management Service
echo -e "${YELLOW}📦 Inventory Management Service Tests${NC}"
test_endpoint "GET" "/api/inventory/items" "" "Get All Inventory Items"
test_endpoint "GET" "/api/inventory/items?category=rings" "" "Get Ring Items"
test_endpoint "GET" "/api/inventory/items?purity=22K" "" "Get 22K Gold Items"
test_endpoint "GET" "/api/inventory/items/1" "" "Get Specific Item (ID: 1)"
test_endpoint "GET" "/api/inventory/valuation" "" "Get Total Inventory Valuation"
test_endpoint "POST" "/api/inventory/items" '{"sku":"GB001","name":"Gold Bracelet","category":"bracelets","metal_type":"gold","purity":"18K","weight":12.5,"stock_quantity":3,"base_price":85000}' "Add New Inventory Item"

# Pagination Test
test_endpoint "GET" "/api/inventory/items?page=1&limit=2" "" "Inventory Pagination (Page 1, Limit 2)"

# Pricing edge cases
echo -e "${YELLOW}🧪 Edge Case Tests${NC}"
test_endpoint "POST" "/api/pricing/calculate-item-price" '{"weight":0.5,"purity":"14K","making_charge_percentage":20}' "Small Weight Calculation (0.5g 14K)"
test_endpoint "POST" "/api/pricing/calculate-item-price" '{"weight":100,"purity":"22K","making_charge_percentage":8}' "Large Weight Calculation (100g 22K)"

# Error handling tests
echo -e "${YELLOW}⚠️  Error Handling Tests${NC}"
test_endpoint "POST" "/api/pricing/calculate-item-price" '{"purity":"22K"}' "Missing Weight Parameter"
test_endpoint "POST" "/api/pricing/calculate-item-price" '{"weight":10}' "Missing Purity Parameter"
test_endpoint "GET" "/api/inventory/items/999" "" "Non-existent Item ID"

echo -e "${GREEN}🎉 API Testing Completed!${NC}"
echo "All services are running on Azure VM at $BASE_URL"
echo ""
echo "Available Endpoints:"
echo "- Health: $BASE_URL/health"
echo "- Gold Rates: $BASE_URL/api/gold-rates/current"  
echo "- Price Calculator: $BASE_URL/api/pricing/calculate-item-price"
echo "- Inventory: $BASE_URL/api/inventory/items"
echo "- User Auth: $BASE_URL/api/auth/login"
echo ""
echo "Direct Service Access:"
echo "- User Management: $BASE_URL:3001"
echo "- Inventory Service: $BASE_URL:3002" 
echo "- Pricing Service: $BASE_URL:3003"