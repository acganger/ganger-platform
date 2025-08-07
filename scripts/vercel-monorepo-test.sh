#!/bin/bash

# Comprehensive Vercel Monorepo Testing Script
# Tests various Vercel commands across the monorepo

set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Vercel token from environment
VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"

# Script options
COMMAND=${1:-help}
APP_NAME=${2:-}

# Function to print usage
print_usage() {
  echo -e "${BLUE}Vercel Monorepo Testing Script${NC}"
  echo ""
  echo "Usage: ./vercel-monorepo-test.sh [command] [app-name]"
  echo ""
  echo "Commands:"
  echo "  dev [app]        - Run vercel dev for specified app or all apps"
  echo "  build [app]      - Run vercel build for specified app or all apps"
  echo "  test-one [app]   - Test dev and build for a single app"
  echo "  test-all         - Run basic tests for all apps"
  echo "  cache-status     - Check Turbo remote cache status"
  echo "  list             - List all apps in the monorepo"
  echo "  help             - Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./vercel-monorepo-test.sh dev inventory"
  echo "  ./vercel-monorepo-test.sh build"
  echo "  ./vercel-monorepo-test.sh test-one handouts"
}

# Array of all apps
apps=(
  "ai-purchasing-agent"
  "ai-receptionist"
  "batch-closeout"
  "call-center-ops"
  "checkin-kiosk"
  "clinical-staffing"
  "compliance-training"
  "component-showcase"
  "config-dashboard"
  "consolidated-order-form"
  "eos-l10"
  "ganger-actions"
  "ganger-staff"
  "handouts"
  "integration-status"
  "inventory"
  "llm-demo"
  "medication-auth"
  "pharma-scheduling"
  "platform-dashboard"
  "socials-reviews"
)

# Function to run vercel dev for an app
run_dev() {
  local app_name=$1
  local app_dir="/q/Projects/ganger-platform/apps/$app_name"
  
  echo -e "${CYAN}Starting Vercel dev server for $app_name...${NC}"
  cd "$app_dir"
  
  if [ -d ".vercel" ]; then
    echo "Press Ctrl+C to stop the dev server"
    vercel dev --token "$VERCEL_TOKEN"
  else
    echo -e "${RED}Error: $app_name is not linked to Vercel${NC}"
    return 1
  fi
}

# Function to run vercel build for an app
run_build() {
  local app_name=$1
  local app_dir="/q/Projects/ganger-platform/apps/$app_name"
  
  echo -e "${CYAN}Building $app_name with Vercel...${NC}"
  cd "$app_dir"
  
  if [ -d ".vercel" ]; then
    if vercel build --token "$VERCEL_TOKEN" --yes; then
      echo -e "${GREEN}✓ Build successful for $app_name${NC}"
      return 0
    else
      echo -e "${RED}✗ Build failed for $app_name${NC}"
      return 1
    fi
  else
    echo -e "${RED}Error: $app_name is not linked to Vercel${NC}"
    return 1
  fi
}

# Function to test a single app
test_one_app() {
  local app_name=$1
  
  echo -e "${BLUE}=== Testing $app_name ===${NC}"
  echo ""
  
  # Test build
  if run_build "$app_name"; then
    echo -e "${GREEN}✓ $app_name build test passed${NC}"
  else
    echo -e "${RED}✗ $app_name build test failed${NC}"
  fi
  
  echo ""
  echo "To test dev server, run: ./vercel-monorepo-test.sh dev $app_name"
}

# Function to test all apps
test_all_apps() {
  echo -e "${BLUE}=== Testing All Apps ===${NC}"
  echo "This will build each app with Vercel to verify configuration"
  echo ""
  
  local passed=0
  local failed=0
  
  for app in "${apps[@]}"; do
    echo -e "\n${YELLOW}Testing $app...${NC}"
    if run_build "$app"; then
      ((passed++))
    else
      ((failed++))
    fi
  done
  
  echo -e "\n${BLUE}=== Test Summary ===${NC}"
  echo -e "${GREEN}Passed: $passed${NC}"
  echo -e "${RED}Failed: $failed${NC}"
}

# Function to check cache status
check_cache_status() {
  echo -e "${BLUE}=== Turbo Remote Cache Status ===${NC}"
  echo ""
  
  cd /q/Projects/ganger-platform
  
  echo "Running a dry build to check cache status..."
  npx turbo run build --filter=@ganger/inventory --dry=json | jq -r '.tasks[] | "\(.taskId): \(.cache.status // "no cache info")"' 2>/dev/null || {
    echo "Cache information:"
    npx turbo run build --filter=@ganger/inventory --dry
  }
}

# Function to list all apps
list_apps() {
  echo -e "${BLUE}=== Apps in Monorepo ===${NC}"
  echo ""
  
  for i in "${!apps[@]}"; do
    local app="${apps[$i]}"
    local app_dir="/q/Projects/ganger-platform/apps/$app"
    
    if [ -d "$app_dir/.vercel" ]; then
      echo -e "$((i+1)). ${GREEN}$app${NC} ✓ (linked to Vercel)"
    else
      echo -e "$((i+1)). ${YELLOW}$app${NC} (not linked)"
    fi
  done
}

# Main script logic
case "$COMMAND" in
  dev)
    if [ -n "$APP_NAME" ]; then
      run_dev "$APP_NAME"
    else
      echo -e "${RED}Error: Please specify an app name${NC}"
      echo "Available apps:"
      list_apps
    fi
    ;;
    
  build)
    if [ -n "$APP_NAME" ]; then
      run_build "$APP_NAME"
    else
      test_all_apps
    fi
    ;;
    
  test-one)
    if [ -n "$APP_NAME" ]; then
      test_one_app "$APP_NAME"
    else
      echo -e "${RED}Error: Please specify an app name${NC}"
      list_apps
    fi
    ;;
    
  test-all)
    test_all_apps
    ;;
    
  cache-status)
    check_cache_status
    ;;
    
  list)
    list_apps
    ;;
    
  help|*)
    print_usage
    ;;
esac