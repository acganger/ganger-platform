#!/bin/bash

# Improved deployment script based on Vercel monorepo best practices
VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Apps to deploy (starting with known working ones)
WORKING_APPS=(
    "inventory"
    "handouts"
    "eos-l10"
    "call-center-ops"
    "integration-status"
    "llm-demo"
    "medication-auth"
)

FAILING_APPS=(
    "deployment-helper"
    "ai-receptionist"
    "batch-closeout"
    "checkin-kiosk"
    "clinical-staffing"
    "compliance-training"
    "config-dashboard"
    "pharma-scheduling"
    "socials-reviews"
    "staff"
)

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     Vercel Monorepo Deployment with Best Practices${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "This script deploys apps following the recommendations from the analysis:"
echo "- Using pnpm workspace configuration"
echo "- ENABLE_EXPERIMENTAL_COREPACK is set"
echo "- Proper vercel.json configurations"
echo ""

# Function to verify vercel.json
verify_vercel_json() {
    local app=$1
    local vercel_json="apps/$app/vercel.json"
    
    if [ ! -f "$vercel_json" ]; then
        echo -e "${YELLOW}Creating vercel.json for $app...${NC}"
        cat > "$vercel_json" << EOF
{
  "installCommand": "cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm -F @ganger/$app build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
EOF
    fi
}

# Function to deploy app
deploy_app() {
    local app=$1
    local deployment_type=$2
    
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}Deploying: $app ($deployment_type)${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    
    # Verify vercel.json exists
    verify_vercel_json "$app"
    
    # Remove old .vercel directory if exists
    rm -rf "apps/$app/.vercel"
    
    # Deploy from monorepo root with cwd
    echo "Deploying with: npx vercel --cwd apps/$app --prod"
    
    if npx vercel@latest \
        --cwd "apps/$app" \
        --token=$VERCEL_TOKEN \
        --scope=$VERCEL_TEAM_ID \
        --yes \
        --name="ganger-$app" \
        --prod; then
        echo -e "${GREEN}✅ $app deployed successfully!${NC}"
        return 0
    else
        echo -e "${RED}❌ $app deployment failed!${NC}"
        return 1
    fi
}

# Ask user which apps to deploy
echo -e "${YELLOW}Select deployment option:${NC}"
echo "1. Deploy only working apps (7 apps)"
echo "2. Deploy only previously failing apps (10 apps)"
echo "3. Deploy all apps (17 apps)"
echo "4. Deploy specific app"
echo ""
read -p "Enter option (1-4): " option

case $option in
    1)
        APPS_TO_DEPLOY=("${WORKING_APPS[@]}")
        ;;
    2)
        APPS_TO_DEPLOY=("${FAILING_APPS[@]}")
        ;;
    3)
        APPS_TO_DEPLOY=("${WORKING_APPS[@]}" "${FAILING_APPS[@]}")
        ;;
    4)
        read -p "Enter app name: " specific_app
        APPS_TO_DEPLOY=("$specific_app")
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}Will deploy ${#APPS_TO_DEPLOY[@]} apps:${NC}"
for app in "${APPS_TO_DEPLOY[@]}"; do
    echo "  - $app"
done
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Deploy apps
SUCCESSFUL_APPS=()
FAILED_APPS=()

for app in "${APPS_TO_DEPLOY[@]}"; do
    # Determine if this is a known working or failing app
    if [[ " ${WORKING_APPS[@]} " =~ " ${app} " ]]; then
        deployment_type="Known Working"
    else
        deployment_type="Previously Failing"
    fi
    
    if deploy_app "$app" "$deployment_type"; then
        SUCCESSFUL_APPS+=("$app")
    else
        FAILED_APPS+=("$app")
        echo -e "${YELLOW}Continuing with next app...${NC}"
    fi
    
    # Small delay between deployments
    if [ "$app" != "${APPS_TO_DEPLOY[-1]}" ]; then
        echo -e "${YELLOW}Waiting 10 seconds before next deployment...${NC}"
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
echo "Done!"