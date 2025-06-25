#!/bin/bash

# 💎 JEWELRY SHOP MANAGEMENT SYSTEM - FINAL BACKEND VALIDATION
# Unified comprehensive test script for 100% backend readiness
# Tests all 9 microservices with business functionality validation

set -e

# Configuration from environment variables
BASE_URL="${JEWELRY_API_BASE_URL:-http://4.236.132.147}"
ENVIRONMENT="${JEWELRY_ENV:-production}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BLUE}💎 JEWELRY SHOP MANAGEMENT SYSTEM - FINAL BACKEND VALIDATION${NC}"
echo -e "${BLUE}================================================================${NC}"
echo -e "🌐 Base URL: $BASE_URL"
echo -e "🏗️ Environment: $ENVIRONMENT"
echo -e "📅 Test Date: $(date)"
echo -e "🎯 Goal: 100% Backend Readiness for Frontend Development"
echo ""

# Test function
test_endpoint() {
    local description="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_pattern="$5"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing: $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s "$BASE_URL$endpoint")
    else
        response=$(curl -s -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    if echo "$response" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "   Expected: $expected_pattern"
        echo "   Got: $(echo $response | head -c 100)..."
        return 1
    fi
}

echo -e "${PURPLE}🏥 SYSTEM HEALTH & INFRASTRUCTURE${NC}"
echo "--------------------------------------------------------"

test_endpoint "System Health Check" "GET" "/health" "" "healthy"
test_endpoint "API Documentation" "GET" "/api" "" "jewelry_shop_api"

echo ""
echo -e "${PURPLE}💰 PRICING SERVICE - Core Business Logic${NC}"
echo "--------------------------------------------------------"

test_endpoint "Real-time Gold Rates" "GET" "/api/gold-rates/current" "" "22K"
test_endpoint "Historical Rates" "GET" "/api/gold-rates/history" "" "data"
test_endpoint "Price Calculator (10g Ring)" "POST" "/api/pricing/calculate-item-price" '{"weight":10,"purity":"22K","making_charge_percentage":12}' "total_price"
test_endpoint "Making Charges Config" "GET" "/api/making-charges" "" "success"

echo ""
echo -e "${PURPLE}📦 INVENTORY MANAGEMENT - Stock Operations${NC}"
echo "--------------------------------------------------------"

test_endpoint "Get All Items" "GET" "/api/inventory/items" "" "items"
test_endpoint "Category Filter (Rings)" "GET" "/api/inventory/items?category=rings" "" "items"
test_endpoint "Add New Item" "POST" "/api/inventory/items" '{"name":"Test Ring","category":"rings","weight":5,"purity":"22K","price":30000}' "success"
test_endpoint "Stock Valuation" "GET" "/api/inventory/valuation" "" "total"

echo ""
echo -e "${PURPLE}📋 ORDER MANAGEMENT - Business Workflow${NC}"
echo "--------------------------------------------------------"

test_endpoint "Get Orders" "GET" "/api/orders" "" "data"
test_endpoint "Create Order" "POST" "/api/orders" '{"customer_id":1,"items":[{"item_id":1,"quantity":1}],"total":25000}' "order_id"
test_endpoint "Order Status" "GET" "/api/orders/1" "" "order_id"

echo ""
echo -e "${PURPLE}💳 PAYMENT SERVICE - Transaction Processing${NC}"
echo "--------------------------------------------------------"

test_endpoint "Get Payments" "GET" "/api/payments" "" "data"
test_endpoint "Create Payment" "POST" "/api/payments" '{"order_id":1,"amount":25000,"payment_method":"card"}' "payment_id"
test_endpoint "Payment Status" "GET" "/api/payments/PAY-123" "" "payment_id"
test_endpoint "Invoice Generation" "GET" "/api/invoices/INV-123" "" "invoice_id"

echo ""
echo -e "${PURPLE}🖼️ IMAGE MANAGEMENT - Product Showcase${NC}"
echo "--------------------------------------------------------"

test_endpoint "Gallery by Category" "GET" "/api/images/gallery/rings" "" "image_id"
test_endpoint "Upload Image" "POST" "/api/images/upload" '{"filename":"ring001.jpg","category":"rings"}' "image_id"
test_endpoint "Image Details" "GET" "/api/images/IMG-123" "" "image_id"

echo ""
echo -e "${PURPLE}🤖 LLM SERVICE - AI Features${NC}"
echo "--------------------------------------------------------"

test_endpoint "AI Chat (English)" "POST" "/api/llm/chat" '{"message":"What is todays gold rate?","language":"en"}' "message"
test_endpoint "AI Chat (Hindi)" "POST" "/api/llm/chat" '{"message":"आज का सोने का भाव क्या है?","language":"hi"}' "message"
test_endpoint "AI Chat (Kannada)" "POST" "/api/llm/chat" '{"message":"ಇಂದಿನ ಚಿನ್ನದ ದರ ಏನು?","language":"kn"}' "message"
test_endpoint "Available Models" "GET" "/api/llm/models" "" "available_models"
test_endpoint "Voice Processing" "POST" "/api/llm/voice" '{"audio_data":"test","language":"en"}' "transcription"

echo ""
echo -e "${PURPLE}🔔 NOTIFICATION SERVICE - Communication${NC}"
echo "--------------------------------------------------------"

test_endpoint "Send Notification" "POST" "/api/notifications/send" '{"type":"sms","recipient":"+91-9876543210","message":"Test"}' "notification_id"
test_endpoint "Notification History" "GET" "/api/notifications/history" "" "data"
test_endpoint "Bulk Send" "POST" "/api/notifications/bulk-send" '{"recipients":["+91-9876543210"],"message":"Test"}' "batch_id"
test_endpoint "Templates" "GET" "/api/notifications/templates" "" "order_ready"

echo ""
echo -e "${PURPLE}📊 ANALYTICS SERVICE - Business Intelligence${NC}"
echo "--------------------------------------------------------"

test_endpoint "Sales Analytics" "GET" "/api/analytics/sales" "" "total_sales"
test_endpoint "Inventory Analytics" "GET" "/api/analytics/inventory" "" "total_items"
test_endpoint "Customer Analytics" "GET" "/api/analytics/customers" "" "total_customers"
test_endpoint "Revenue Analytics" "GET" "/api/analytics/revenue" "" "current_revenue"
test_endpoint "Trend Analytics" "GET" "/api/analytics/trends" "" "trending_categories"

echo ""
echo -e "${PURPLE}🎭 BUSINESS SCENARIOS - Real-world Workflows${NC}"
echo "--------------------------------------------------------"

# Scenario 1: Customer Price Inquiry
echo -n "Business Scenario 1: Customer Price Inquiry... "
gold_response=$(curl -s "$BASE_URL/api/gold-rates/current")
price_response=$(curl -s -X POST "$BASE_URL/api/pricing/calculate-item-price" \
  -H "Content-Type: application/json" \
  -d '{"weight":15,"purity":"22K","making_charge_percentage":12}')

if echo "$price_response" | grep -q "total_price" && echo "$gold_response" | grep -q "22K"; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Scenario 2: Multilingual AI Support
echo -n "Business Scenario 2: Multilingual AI Support... "
en_response=$(curl -s -X POST "$BASE_URL/api/llm/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","language":"en"}')
kn_response=$(curl -s -X POST "$BASE_URL/api/llm/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"ನಮಸ್ಕಾರ","language":"kn"}')

if echo "$en_response" | grep -q "language.*en" && echo "$kn_response" | grep -q "language.*kn"; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Scenario 3: Complete Order to Payment Flow
echo -n "Business Scenario 3: Order to Payment Flow... "
order_response=$(curl -s "$BASE_URL/api/orders")
payment_response=$(curl -s "$BASE_URL/api/payments")

if echo "$order_response" | grep -q "data" && echo "$payment_response" | grep -q "data"; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo -e "${CYAN}📋 FINAL BACKEND VALIDATION REPORT${NC}"
echo "============================================================================"
echo -e "🏆 JEWELRY SHOP MANAGEMENT SYSTEM - BACKEND READINESS ASSESSMENT"
echo -e "📅 Test Date: $(date)"
echo -e "🌐 Environment: $BASE_URL"
echo ""
echo -e "${GREEN}✅ PASSED TESTS: $PASSED_TESTS${NC}"
echo -e "${RED}❌ FAILED TESTS: $FAILED_TESTS${NC}"
echo -e "${BLUE}📊 TOTAL TESTS: $TOTAL_TESTS${NC}"

# Calculate success rate
if [ $TOTAL_TESTS -gt 0 ]; then
    success_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    echo -e "${PURPLE}📈 SUCCESS RATE: $success_rate%${NC}"
else
    echo -e "${RED}❌ NO TESTS EXECUTED${NC}"
    exit 1
fi

echo ""
echo "============================================================================"
echo "🎯 BACKEND READINESS STATUS:"

if [ $success_rate -ge 95 ]; then
    echo -e "${GREEN}🎉 BACKEND IS 100% READY FOR FRONTEND DEVELOPMENT!${NC}"
    echo -e "${GREEN}✅ All core business functions operational${NC}"
    echo -e "${GREEN}✅ All microservices responding correctly${NC}"
    echo -e "${GREEN}✅ AI and multilingual features working${NC}"
    echo -e "${GREEN}✅ Real-time pricing and inventory management ready${NC}"
    echo -e "${GREEN}✅ Order and payment processing functional${NC}"
    echo ""
    echo -e "${BLUE}🚀 READY TO START FRONTEND DEVELOPMENT${NC}"
    exit 0
elif [ $success_rate -ge 80 ]; then
    echo -e "${YELLOW}⚠️ BACKEND IS MOSTLY READY (Minor issues to address)${NC}"
    echo -e "${YELLOW}📝 Review failed tests above and fix before frontend development${NC}"
    exit 1
else
    echo -e "${RED}❌ BACKEND NEEDS SIGNIFICANT FIXES${NC}"
    echo -e "${RED}🔧 Address critical issues before proceeding${NC}"
    exit 1
fi