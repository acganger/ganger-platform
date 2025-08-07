#!/bin/bash

# Vercel Monorepo Setup Script
# Links all apps to their respective Vercel projects

set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vercel token from environment
VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"

echo -e "${GREEN}Starting Vercel setup for all apps in the monorepo${NC}"
echo "Using Vercel token: ${VERCEL_TOKEN:0:10}..."

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

# Function to link an app to Vercel
link_app() {
  local app_name=$1
  local app_dir="/q/Projects/ganger-platform/apps/$app_name"
  
  echo -e "\n${YELLOW}Processing $app_name...${NC}"
  
  # Check if app directory exists
  if [ ! -d "$app_dir" ]; then
    echo -e "${RED}Error: Directory $app_dir does not exist${NC}"
    return 1
  fi
  
  cd "$app_dir"
  
  # Check if already linked
  if [ -d ".vercel" ]; then
    echo -e "${GREEN}✓ $app_name is already linked to Vercel${NC}"
    
    # Pull latest settings anyway
    echo "Pulling latest settings..."
    vercel pull --yes --token "$VERCEL_TOKEN" 2>/dev/null || true
  else
    echo "Linking $app_name to Vercel..."
    
    # Try to link with the expected project name
    if vercel link --yes --token "$VERCEL_TOKEN" --project "$app_name" 2>/dev/null; then
      echo -e "${GREEN}✓ Successfully linked $app_name${NC}"
      
      # Pull project settings
      echo "Pulling project settings..."
      vercel pull --yes --token "$VERCEL_TOKEN" 2>/dev/null || true
    else
      echo -e "${RED}✗ Failed to link $app_name - project may not exist on Vercel${NC}"
      echo "  You may need to create the project on Vercel first"
    fi
  fi
}

# Process all apps
for app in "${apps[@]}"; do
  link_app "$app"
done

echo -e "\n${GREEN}Vercel setup complete!${NC}"
echo -e "\nNext steps:"
echo "1. For apps that failed to link, create the projects on Vercel first"
echo "2. Test local development with: vercel dev --token $VERCEL_TOKEN"
echo "3. Test production builds with: vercel build --token $VERCEL_TOKEN"