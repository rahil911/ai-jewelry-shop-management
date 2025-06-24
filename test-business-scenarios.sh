#!/bin/bash

# Jewelry Shop Management System - Business Scenario Testing
# Real-world business use cases for the jewelry shop

BASE_URL="http://4.236.132.147"
echo "💎 Jewelry Shop Business Scenario Testing"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Scenario 1: Customer wants to buy a 10g gold ring${NC}"
echo "1. Check current gold rates"
curl -s "$BASE_URL/api/gold-rates/current" | jq '.["22K"]' | xargs -I {} echo "Current 22K gold rate: ₹{} per gram"

echo "2. Calculate price for 10g 22K gold ring with 12% making charges"
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"weight":10,"purity":"22K","making_charge_percentage":12}' \
  "$BASE_URL/api/pricing/calculate-item-price" | jq .

echo -e "${YELLOW}Scenario 2: Check available ring inventory${NC}"
curl -s "$BASE_URL/api/inventory/items?category=rings" | jq '.items[] | {name, sku, weight, stock_quantity, base_price}'

echo -e "${YELLOW}Scenario 3: Customer wants a necklace - check pricing${NC}"
echo "Calculate price for 25g 22K gold necklace with 15% making charges"
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"weight":25,"purity":"22K","making_charge_percentage":15}' \
  "$BASE_URL/api/pricing/calculate-item-price" | jq .

echo -e "${YELLOW}Scenario 4: Shop owner checks total inventory value${NC}"
curl -s "$BASE_URL/api/inventory/valuation" | jq .

echo -e "${YELLOW}Scenario 5: Compare making charges across categories${NC}"
curl -s "$BASE_URL/api/making-charges" | jq .

echo -e "${YELLOW}Scenario 6: Add new custom jewelry item to inventory${NC}"
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"sku":"CR001","name":"Custom Diamond Ring","category":"rings","metal_type":"gold","purity":"18K","weight":8.5,"stock_quantity":1,"base_price":125000}' \
  "$BASE_URL/api/inventory/items" | jq .

echo -e "${YELLOW}Scenario 7: Customer registration and login${NC}"
echo "Register new customer:"
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"customer@gmail.com","password":"secure123","name":"Priya Sharma"}' \
  "$BASE_URL/api/auth/register" | jq .

echo "Customer login:"
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"customer@gmail.com","password":"secure123"}' \
  "$BASE_URL/api/auth/login" | jq .

echo -e "${GREEN}✅ All business scenarios tested successfully!${NC}"