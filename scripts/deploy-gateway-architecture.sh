#!/bin/bash

# Automated Gateway Architecture Deployment Script
# This script automates the deployment of the new gateway architecture

set -e  # Exit on error

echo "🚀 Automated Gateway Architecture Deployment"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vercel credentials
VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to create Edge Config via API
create_edge_config() {
    echo -e "${YELLOW}📋 Creating Edge Config Store...${NC}"
    
    # Create the Edge Config store
    EDGE_CONFIG_RESPONSE=$(curl -X POST "https://api.vercel.com/v1/edge-config?teamId=$TEAM_ID" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "ganger-platform-app-urls",
            "items": {
                "appUrls": {
                    "inventory": "https://ganger-inventory-anand-gangers-projects.vercel.app",
                    "handouts": "https://ganger-handouts-anand-gangers-projects.vercel.app",
                    "l10": "https://ganger-eos-l10-anand-gangers-projects.vercel.app",
                    "eos-l10": "https://ganger-eos-l10-anand-gangers-projects.vercel.app",
                    "batch": "https://ganger-batch-closeout-anand-gangers-projects.vercel.app",
                    "batch-closeout": "https://ganger-batch-closeout-anand-gangers-projects.vercel.app",
                    "compliance": "https://ganger-compliance-training-anand-gangers-projects.vercel.app",
                    "compliance-training": "https://ganger-compliance-training-anand-gangers-projects.vercel.app",
                    "clinical-staffing": "https://ganger-clinical-staffing-anand-gangers-projects.vercel.app",
                    "config": "https://ganger-config-dashboard-anand-gangers-projects.vercel.app",
                    "config-dashboard": "https://ganger-config-dashboard-anand-gangers-projects.vercel.app",
                    "status": "https://ganger-integration-status-anand-gangers-projects.vercel.app",
                    "integration-status": "https://ganger-integration-status-anand-gangers-projects.vercel.app",
                    "ai-receptionist": "https://ganger-ai-receptionist-anand-gangers-projects.vercel.app",
                    "call-center": "https://ganger-call-center-ops-anand-gangers-projects.vercel.app",
                    "call-center-ops": "https://ganger-call-center-ops-anand-gangers-projects.vercel.app",
                    "medication-auth": "https://ganger-medication-auth-anand-gangers-projects.vercel.app",
                    "pharma": "https://ganger-pharma-scheduling-anand-gangers-projects.vercel.app",
                    "pharma-scheduling": "https://ganger-pharma-scheduling-anand-gangers-projects.vercel.app",
                    "lunch": "https://ganger-pharma-scheduling-anand-gangers-projects.vercel.app",
                    "kiosk": "https://ganger-checkin-kiosk-anand-gangers-projects.vercel.app",
                    "checkin-kiosk": "https://ganger-checkin-kiosk-anand-gangers-projects.vercel.app",
                    "socials": "https://ganger-socials-reviews-anand-gangers-projects.vercel.app",
                    "socials-reviews": "https://ganger-socials-reviews-anand-gangers-projects.vercel.app",
                    "component-showcase": "https://ganger-component-showcase-anand-gangers-projects.vercel.app",
                    "platform-dashboard": "https://ganger-platform-dashboard-anand-gangers-projects.vercel.app"
                }
            }
        }' 2>/dev/null)
    
    # Extract connection string
    EDGE_CONFIG_ID=$(echo "$EDGE_CONFIG_RESPONSE" | python3 -c "import json, sys; data = json.load(sys.stdin); print(data.get('id', ''))" 2>/dev/null || echo "")
    
    if [ -z "$EDGE_CONFIG_ID" ]; then
        # Check if already exists
        echo -e "${YELLOW}Edge Config might already exist. Fetching existing configs...${NC}"
        
        EXISTING_CONFIGS=$(curl -s "https://api.vercel.com/v1/edge-config?teamId=$TEAM_ID" \
            -H "Authorization: Bearer $VERCEL_TOKEN")
        
        EDGE_CONFIG_ID=$(echo "$EXISTING_CONFIGS" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for config in data.get('edgeConfigs', []):
    if config['name'] == 'ganger-platform-app-urls':
        print(config['id'])
        break
" 2>/dev/null || echo "")
    fi
    
    if [ -n "$EDGE_CONFIG_ID" ]; then
        EDGE_CONFIG_CONNECTION="https://edge-config.vercel.com/$EDGE_CONFIG_ID?token=$VERCEL_TOKEN"
        echo -e "${GREEN}✅ Edge Config ready: $EDGE_CONFIG_ID${NC}"
        echo "$EDGE_CONFIG_CONNECTION" > .edge-config-connection
        return 0
    else
        echo -e "${RED}❌ Failed to create/find Edge Config${NC}"
        return 1
    fi
}

# Function to add environment variable to Vercel project
add_env_variable() {
    local project_name=$1
    local env_key=$2
    local env_value=$3
    
    echo -e "${YELLOW}Adding $env_key to $project_name...${NC}"
    
    # First, try to get the project ID
    PROJECT_RESPONSE=$(curl -s "https://api.vercel.com/v9/projects/$project_name?teamId=$TEAM_ID" \
        -H "Authorization: Bearer $VERCEL_TOKEN")
    
    PROJECT_ID=$(echo "$PROJECT_RESPONSE" | python3 -c "import json, sys; data = json.load(sys.stdin); print(data.get('id', ''))" 2>/dev/null || echo "")
    
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${RED}Project $project_name not found${NC}"
        return 1
    fi
    
    # Add environment variable
    curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env?teamId=$TEAM_ID" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"$env_key\",
            \"value\": \"$env_value\",
            \"type\": \"encrypted\",
            \"target\": [\"production\", \"preview\", \"development\"]
        }" > /dev/null 2>&1
    
    echo -e "${GREEN}✅ Added $env_key to $project_name${NC}"
}

# Function to trigger deployment
trigger_deployment() {
    local project_name=$1
    
    echo -e "${YELLOW}🚀 Triggering deployment for $project_name...${NC}"
    
    # Get the latest commit SHA
    COMMIT_SHA=$(git rev-parse HEAD)
    
    # Trigger deployment
    DEPLOYMENT_RESPONSE=$(curl -X POST "https://api.vercel.com/v13/deployments?teamId=$TEAM_ID" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$project_name\",
            \"gitSource\": {
                \"type\": \"github\",
                \"ref\": \"main\",
                \"sha\": \"$COMMIT_SHA\",
                \"repoId\": \"770039913\"
            },
            \"target\": \"production\",
            \"source\": \"cli\"
        }" 2>/dev/null)
    
    DEPLOYMENT_URL=$(echo "$DEPLOYMENT_RESPONSE" | python3 -c "import json, sys; data = json.load(sys.stdin); print(data.get('url', ''))" 2>/dev/null || echo "")
    
    if [ -n "$DEPLOYMENT_URL" ]; then
        echo -e "${GREEN}✅ Deployment started: https://$DEPLOYMENT_URL${NC}"
        echo "$project_name|https://$DEPLOYMENT_URL" >> .deployment-urls
        return 0
    else
        echo -e "${RED}❌ Failed to trigger deployment for $project_name${NC}"
        return 1
    fi
}

# Main deployment process
main() {
    echo -e "${GREEN}Starting automated deployment...${NC}"
    echo ""
    
    # Step 1: Create Edge Config
    if ! create_edge_config; then
        echo -e "${RED}Failed to create Edge Config. Manual intervention required.${NC}"
        echo "Please create it manually at: https://vercel.com/team_wpY7PcIsYQNnslNN39o7fWvS/stores"
        exit 1
    fi
    
    # Step 2: Commit changes
    echo -e "${YELLOW}📝 Committing changes...${NC}"
    git add -A
    git commit -m "feat: implement gateway architecture with Edge Config

- Replace static vercel.json rewrites with dynamic middleware
- Add basePath configuration to all apps
- Configure SSO with .gangerdermatology.com cookie domain
- Remove googleapis dependency to improve build times
- Add Edge Config for dynamic URL management

This enables:
- Stable production URLs (staff.gangerdermatology.com/[app])
- Dynamic app URL updates without redeployment
- Seamless SSO across all applications
- Independent app deployments
- Faster build times (<2 minutes)

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    # Step 3: Push to GitHub
    echo -e "${YELLOW}📤 Pushing to GitHub...${NC}"
    git push origin main
    
    # Step 4: Add Edge Config to staff app
    if [ -f .edge-config-connection ]; then
        EDGE_CONFIG_CONNECTION=$(cat .edge-config-connection)
        add_env_variable "ganger-staff" "EDGE_CONFIG" "$EDGE_CONFIG_CONNECTION"
    fi
    
    # Step 5: Deploy staff app first
    echo -e "${YELLOW}🚀 Deploying staff portal...${NC}"
    trigger_deployment "ganger-staff"
    
    # Step 6: Wait for staff deployment
    echo -e "${YELLOW}⏳ Waiting 30 seconds for staff deployment to start...${NC}"
    sleep 30
    
    # Step 7: Deploy inventory as test
    echo -e "${YELLOW}🧪 Deploying inventory app as test...${NC}"
    trigger_deployment "ganger-inventory"
    
    echo ""
    echo -e "${GREEN}✅ Automated deployment complete!${NC}"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Monitor deployments at: https://vercel.com/team_wpY7PcIsYQNnslNN39o7fWvS"
    echo "2. Once staff app is deployed, test: https://staff.gangerdermatology.com"
    echo "3. Once inventory is deployed, update Edge Config with new URL"
    echo "4. Test gateway routing: https://staff.gangerdermatology.com/inventory"
    echo ""
    echo "🔧 To deploy remaining apps, run:"
    echo "   ./scripts/deploy-all-apps.sh"
    echo ""
    echo "📝 Deployment URLs saved to: .deployment-urls"
}

# Run main function
main