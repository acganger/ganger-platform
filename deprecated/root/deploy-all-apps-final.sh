#!/bin/bash

# Deploy all apps with the proven working configuration
VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Apps already successfully deployed:
# - inventory
# - call-center-ops  
# - eos-l10
# - handouts
# - integration-status
# - llm-demo
# - medication-auth

# Remaining apps to deploy
ALL_APPS=(
    "ai-receptionist"
    "batch-closeout"
    "checkin-kiosk"
    "clinical-staffing"
    "compliance-training"
    "component-showcase"
    "config-dashboard"
    "deployment-helper"
    "pharma-scheduling"
    "platform-dashboard"
    "socials-reviews"
    "staff"
)

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     Deploying All Ganger Platform Apps${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Using proven configuration from inventory deployment"
echo "Total apps to deploy: ${#ALL_APPS[@]}"
echo ""

# Function to create project if it doesn't exist
create_project_if_needed() {
    local app_name=$1
    local project_name="ganger-$app_name"
    
    # Check if project exists
    local exists=$(curl -s "https://api.vercel.com/v9/projects/$project_name?teamId=$VERCEL_TEAM_ID" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -w "%{http_code}" -o /dev/null)
    
    if [ "$exists" == "404" ]; then
        echo -e "${YELLOW}Creating project $project_name...${NC}"
        
        curl -X POST "https://api.vercel.com/v9/projects?teamId=$VERCEL_TEAM_ID" \
            -H "Authorization: Bearer $VERCEL_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"name\": \"$project_name\",
                \"framework\": \"nextjs\",
                \"publicSource\": false,
                \"installCommand\": \"cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile\",
                \"buildCommand\": \"cd ../.. && pnpm -F @ganger/$app_name build\",
                \"outputDirectory\": \".next\",
                \"gitRepository\": {
                    \"repo\": \"acganger/ganger-platform\",
                    \"type\": \"github\"
                }
            }" \
            -s -o /dev/null -w "  Status: %{http_code}\n"
        
        # Set ENABLE_EXPERIMENTAL_COREPACK
        curl -X POST "https://api.vercel.com/v10/projects/$project_name/env?teamId=$VERCEL_TEAM_ID" \
            -H "Authorization: Bearer $VERCEL_TOKEN" \
            -H "Content-Type: application/json" \
            -d '{
                "key": "ENABLE_EXPERIMENTAL_COREPACK",
                "value": "1",
                "type": "plain",
                "target": ["production", "preview", "development"]
            }' \
            -s -o /dev/null
    else
        echo -e "${GREEN}Project $project_name already exists${NC}"
    fi
}

# Function to deploy app
deploy_app() {
    local app=$1
    local project_name="ganger-$app"
    
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}Deploying: $app${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    
    # Create project if needed
    create_project_if_needed "$app"
    
    # Remove old .vercel directory
    rm -rf "apps/$app/.vercel"
    
    # Link to project
    cd "apps/$app"
    npx vercel@latest link --yes --project=$project_name --scope=$VERCEL_TEAM_ID --token=$VERCEL_TOKEN > /dev/null 2>&1
    
    # Deploy
    echo "Starting deployment..."
    local deployment_url=""
    local deployment_output=$(npx vercel@latest --prod --yes --token=$VERCEL_TOKEN 2>&1)
    local exit_code=$?
    
    # Extract deployment URL
    deployment_url=$(echo "$deployment_output" | grep -o "https://ganger-$app-[a-z0-9]*-ganger.vercel.app" | head -1)
    
    if [ $exit_code -eq 0 ] && [ ! -z "$deployment_url" ]; then
        echo -e "${GREEN}✅ $app deployed successfully!${NC}"
        echo -e "${GREEN}   URL: $deployment_url${NC}"
        
        # Wait for deployment to be ready
        echo "Waiting for deployment to be ready..."
        sleep 45
        
        cd ../..
        return 0
    else
        echo -e "${RED}❌ $app deployment failed!${NC}"
        echo "$deployment_output" | tail -20
        cd ../..
        return 1
    fi
}

# Main deployment loop
SUCCESSFUL_APPS=()
FAILED_APPS=()

for app in "${ALL_APPS[@]}"; do
    if deploy_app "$app"; then
        SUCCESSFUL_APPS+=("$app")
    else
        FAILED_APPS+=("$app")
    fi
    
    # Wait between deployments to ensure sequential processing
    if [ "$app" != "${ALL_APPS[-1]}" ]; then
        echo -e "${YELLOW}Waiting 60 seconds before next deployment to ensure sequential processing...${NC}"
        sleep 60
    fi
done

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Final Deployment Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}✅ Already deployed (8 apps):${NC}"
echo "   - inventory"
echo "   - call-center-ops"
echo "   - eos-l10"
echo "   - handouts"
echo "   - integration-status"
echo "   - llm-demo"
echo "   - medication-auth"

if [ ${#SUCCESSFUL_APPS[@]} -gt 0 ]; then
    echo -e "\n${GREEN}✅ Successfully deployed (${#SUCCESSFUL_APPS[@]}):${NC}"
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

TOTAL_SUCCESS=$((${#SUCCESSFUL_APPS[@]} + 8))  # +8 for already deployed
echo -e "\n${BLUE}Total: $TOTAL_SUCCESS / 20 apps deployed successfully${NC}"

echo ""
echo "Done!"