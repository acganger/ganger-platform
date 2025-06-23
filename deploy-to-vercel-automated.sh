#!/bin/bash

# Automated Vercel Deployment Script for Ganger Platform
# This script deploys all apps in the monorepo to Vercel automatically

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting automated Vercel deployment...${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm i -g vercel@latest
fi

# Check for Vercel token
if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}Error: VERCEL_TOKEN environment variable not set${NC}"
    echo "Please set your Vercel token: export VERCEL_TOKEN='your-token-here'"
    echo "Get your token from: https://vercel.com/account/tokens"
    exit 1
fi

# Apps to deploy
APPS=(
    "inventory"
    "handouts"
    "checkin-kiosk"
    "medication-auth"
    "eos-l10"
    "pharma-scheduling"
    "compliance-training"
    "clinical-staffing"
    "socials-reviews"
    "config-dashboard"
    "integration-status"
    "platform-dashboard"
)

# Function to deploy an app
deploy_app() {
    local app=$1
    local app_path="apps/$app"
    
    echo -e "\n${YELLOW}Deploying $app...${NC}"
    
    if [ ! -d "$app_path" ]; then
        echo -e "${RED}Warning: $app_path not found, skipping${NC}"
        return
    fi
    
    cd "$app_path"
    
    # Deploy to Vercel with automatic settings
    vercel deploy \
        --prod \
        --token="$VERCEL_TOKEN" \
        --scope="$VERCEL_TEAM_ID" \
        --yes \
        --name="ganger-$app" \
        --build-env DATABASE_URL="$DATABASE_URL" \
        --build-env DIRECT_URL="$DIRECT_URL" \
        --build-env SUPABASE_URL="$SUPABASE_URL" \
        --build-env SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
        --build-env NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL" \
        --build-env NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
        --env DATABASE_URL="$DATABASE_URL" \
        --env DIRECT_URL="$DIRECT_URL" \
        --env SUPABASE_URL="$SUPABASE_URL" \
        --env SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
        --env SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
        --env GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
        --env GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET"
    
    cd ../..
    
    echo -e "${GREEN}✓ $app deployed successfully${NC}"
}

# Main deployment loop
echo -e "${GREEN}Deploying ${#APPS[@]} apps to Vercel...${NC}"

for app in "${APPS[@]}"; do
    deploy_app "$app"
done

echo -e "\n${GREEN}All deployments complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Visit https://vercel.com/dashboard to see your deployments"
echo "2. Configure custom domains in Vercel dashboard"
echo "3. Update Cloudflare DNS to point to Vercel"