#!/bin/bash

# Vercel Build Test Script
# Tests production builds for all apps using Vercel CLI

set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vercel token from environment
VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"

echo -e "${BLUE}=== Vercel Production Build Test for All Apps ===${NC}"
echo "Using Vercel token: ${VERCEL_TOKEN:0:10}..."
echo ""

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

# Track results
successful_builds=()
failed_builds=()

# Function to build an app with Vercel
build_app() {
  local app_name=$1
  local app_dir="/q/Projects/ganger-platform/apps/$app_name"
  
  echo -e "\n${YELLOW}Building $app_name...${NC}"
  echo "----------------------------------------"
  
  # Check if app directory exists
  if [ ! -d "$app_dir" ]; then
    echo -e "${RED}Error: Directory $app_dir does not exist${NC}"
    failed_builds+=("$app_name (directory not found)")
    return 1
  fi
  
  cd "$app_dir"
  
  # Check if linked to Vercel
  if [ ! -d ".vercel" ]; then
    echo -e "${RED}Error: $app_name is not linked to Vercel${NC}"
    failed_builds+=("$app_name (not linked)")
    return 1
  fi
  
  # Try to build with Vercel
  echo "Running vercel build..."
  if vercel build --token "$VERCEL_TOKEN" --yes 2>&1; then
    echo -e "${GREEN}✓ Successfully built $app_name${NC}"
    successful_builds+=("$app_name")
  else
    echo -e "${RED}✗ Failed to build $app_name${NC}"
    failed_builds+=("$app_name")
  fi
}

# Test mode - build only first few apps
if [ "$1" = "--test" ]; then
  echo -e "${YELLOW}Running in test mode - building only first 3 apps${NC}\n"
  apps=("${apps[@]:0:3}")
fi

# Start timer
start_time=$(date +%s)

# Process all apps
for app in "${apps[@]}"; do
  build_app "$app"
done

# Calculate elapsed time
end_time=$(date +%s)
elapsed_time=$((end_time - start_time))
minutes=$((elapsed_time / 60))
seconds=$((elapsed_time % 60))

# Print summary
echo -e "\n${BLUE}=== Build Summary ===${NC}"
echo -e "Total time: ${minutes}m ${seconds}s"
echo ""
echo -e "${GREEN}Successful builds (${#successful_builds[@]}):${NC}"
for app in "${successful_builds[@]}"; do
  echo "  ✓ $app"
done

if [ ${#failed_builds[@]} -gt 0 ]; then
  echo ""
  echo -e "${RED}Failed builds (${#failed_builds[@]}):${NC}"
  for app in "${failed_builds[@]}"; do
    echo "  ✗ $app"
  done
fi

echo ""
echo -e "${BLUE}=== Next Steps ===${NC}"
echo "1. Fix any failed builds by checking their error messages"
echo "2. Test individual apps with: cd apps/[app-name] && vercel dev --token $VERCEL_TOKEN"
echo "3. Deploy to production with: vercel --token $VERCEL_TOKEN --prod"