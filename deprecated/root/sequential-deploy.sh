#\!/bin/bash

# Sequential Vercel deployment script
# Deploys one app at a time, waiting for each to complete

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Apps to deploy in order
# Starting with deployment-helper, then proven working apps
APPS=(
    "deployment-helper"    # Build shared packages first
    "inventory"           # Known to work
    "handouts"           # Known to work
    "eos-l10"            # Known to work
    "call-center-ops"    # Known to work
    "integration-status" # Known to work
    "llm-demo"          # Known to work
    "medication-auth"   # Known to work
)

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     Sequential Vercel Deployment - One App at a Time${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "This script will deploy apps sequentially, waiting for each to complete."
echo "Starting with deployment-helper to build shared packages."
echo ""
echo -e "${YELLOW}Apps to deploy:${NC}"
for app in "${APPS[@]}"; do
    echo "  - $app"
done
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Function to deploy app using Vercel CLI
deploy_app() {
    local app=$1
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}Deploying: $app${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    
    # Create simple deploy script for the app
    cd apps/$app
    
    # Use vercel CLI directly (simpler approach)
    npx vercel@latest \
        --token=$VERCEL_TOKEN \
        --scope=$VERCEL_TEAM_ID \
        --yes \
        --name=ganger-$app \
        --prod
    
    local exit_code=$?
    cd ../..
    
    return $exit_code
}

# Main deployment loop
FAILED_APPS=()
SUCCESSFUL_APPS=()

for app in "${APPS[@]}"; do
    if deploy_app "$app"; then
        SUCCESSFUL_APPS+=("$app")
        echo -e "${GREEN}✅ $app deployed successfully\!${NC}"
    else
        FAILED_APPS+=("$app")
        echo -e "${RED}❌ $app deployment failed\!${NC}"
        echo -e "${RED}Stopping deployment sequence due to failure.${NC}"
        break
    fi
    
    # Small delay between apps
    if [ "$app" \!= "${APPS[-1]}" ]; then
        echo -e "${YELLOW}Waiting 10 seconds before next app...${NC}"
        sleep 10
    fi
done

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Deployment Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

if [ ${#SUCCESSFUL_APPS[@]} -gt 0 ]; then
    echo -e "${GREEN}✅ Successfully deployed (${#SUCCESSFUL_APPS[@]}):${NC}"
    for app in "${SUCCESSFUL_APPS[@]}"; do
        echo "   - $app"
    done
fi

if [ ${#FAILED_APPS[@]} -gt 0 ]; then
    echo -e "\n${RED}❌ Failed to deploy (${#FAILED_APPS[@]}):${NC}"
    for app in "${FAILED_APPS[@]}"; do
        echo "   - $app"
    done
fi

echo ""
echo "Done\!"
SCRIPT_END < /dev/null
