#!/bin/bash

# ============================================================================
# 04-verify-deployment.sh - Post-deployment Verification
# ============================================================================
# Purpose: Verifies all apps are accessible both directly and through router
# Dependencies: curl, jq, lighthouse (optional)
# Related Docs: ../04-risk-mitigation.md
# Previous: Run after staff portal is deployed
# Next Script: 05-emergency-rollback.sh (if issues found)
# ============================================================================

set -e

# Load deployment URLs
if [ ! -f "deployment-urls.json" ]; then
  echo "❌ deployment-urls.json not found. Run deployment first."
  exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test URL
test_url() {
  local url=$1
  local description=$2
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  # Test with curl
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
  
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "308" ]; then
    echo -e "${GREEN}✓${NC} $description: $STATUS"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    return 0
  else
    echo -e "${RED}✗${NC} $description: $STATUS"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi
}

# Function to test API endpoint
test_api() {
  local url=$1
  local description=$2
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  # Test API with proper headers
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Accept: application/json" \
    -H "Origin: https://staff.gangerdermatology.com" \
    "$url")
  
  STATUS=$(echo "$RESPONSE" | tail -n1)
  
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ]; then
    echo -e "${GREEN}✓${NC} $description: $STATUS"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    return 0
  else
    echo -e "${RED}✗${NC} $description: $STATUS"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi
}

echo "🔍 Post-Deployment Verification Starting..."
echo "========================================="

# Test Staff Portal
echo -e "\n${YELLOW}Testing Staff Portal (Router)${NC}"
test_url "https://staff.gangerdermatology.com" "Staff Portal Homepage"
test_url "https://staff.gangerdermatology.com/dashboard" "Staff Portal Dashboard"

# Test each app via router
echo -e "\n${YELLOW}Testing Apps via Router${NC}"
test_url "https://staff.gangerdermatology.com/inventory" "Inventory via Router"
test_url "https://staff.gangerdermatology.com/handouts" "Handouts via Router"
test_url "https://staff.gangerdermatology.com/l10" "EOS L10 via Router"
test_url "https://staff.gangerdermatology.com/meds" "Medication Auth via Router"
test_url "https://staff.gangerdermatology.com/kiosk" "Check-in Kiosk via Router"

# Test direct Vercel URLs (if available)
echo -e "\n${YELLOW}Testing Direct Vercel URLs${NC}"
# Parse deployment-urls.json to get URLs
INVENTORY_URL=$(jq -r '.inventory // empty' deployment-urls.json)
HANDOUTS_URL=$(jq -r '.handouts // empty' deployment-urls.json)

if [ -n "$INVENTORY_URL" ]; then
  test_url "$INVENTORY_URL" "Inventory Direct"
fi

if [ -n "$HANDOUTS_URL" ]; then
  test_url "$HANDOUTS_URL" "Handouts Direct"
fi

# Test API endpoints
echo -e "\n${YELLOW}Testing API Endpoints${NC}"
test_api "https://staff.gangerdermatology.com/api/auth/user" "Auth API"
test_api "https://staff.gangerdermatology.com/api/health" "Health Check API"

# Test CORS headers
echo -e "\n${YELLOW}Testing CORS Configuration${NC}"
CORS_TEST=$(curl -s -I \
  -H "Origin: https://staff.gangerdermatology.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  "https://staff.gangerdermatology.com/api/health" | \
  grep -i "access-control-allow-origin" || echo "")

if [ -n "$CORS_TEST" ]; then
  echo -e "${GREEN}✓${NC} CORS headers present"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo -e "${RED}✗${NC} CORS headers missing"
  FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Performance check
echo -e "\n${YELLOW}Running Performance Check${NC}"
if command -v lighthouse &> /dev/null; then
  lighthouse https://staff.gangerdermatology.com \
    --quiet \
    --chrome-flags="--headless" \
    --only-categories=performance \
    --output=json \
    --output-path=./lighthouse-results.json
  
  PERF_SCORE=$(jq '.categories.performance.score * 100' lighthouse-results.json)
  
  if (( $(echo "$PERF_SCORE > 80" | bc -l) )); then
    echo -e "${GREEN}✓${NC} Performance score: $PERF_SCORE"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${YELLOW}⚠${NC} Performance score: $PERF_SCORE (below 80)"
  fi
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
  echo -e "${YELLOW}⚠${NC} Lighthouse not installed - skipping performance check"
fi

# Summary
echo -e "\n========================================="
echo "📊 Verification Summary"
echo "========================================="
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "\n${GREEN}✅ All tests passed! Deployment verified.${NC}"
  exit 0
else
  echo -e "\n${RED}❌ $FAILED_TESTS tests failed. Please investigate.${NC}"
  exit 1
fi