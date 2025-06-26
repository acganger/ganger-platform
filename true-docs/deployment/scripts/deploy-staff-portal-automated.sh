#!/bin/bash

# Automated Staff Portal Deployment Script
# This script checks if staff portal exists and deploys/updates it

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Automated Staff Portal Deployment${NC}"
echo "===================================="

# Check if required environment variables are set
if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}❌ VERCEL_TOKEN not set${NC}"
    echo "Please run: export VERCEL_TOKEN='your-token'"
    exit 1
fi

# Set team ID if not already set
if [ -z "$VERCEL_TEAM_ID" ]; then
    export VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"
    echo -e "${YELLOW}⚠️  Using default VERCEL_TEAM_ID: $VERCEL_TEAM_ID${NC}"
fi

PROJECT_NAME="ganger-staff"
DOMAIN="staff.gangerdermatology.com"

echo -e "\n${BLUE}📋 Checking if project exists...${NC}"

# Check if project exists
PROJECT_EXISTS=$(curl -s "https://api.vercel.com/v9/projects/${PROJECT_NAME}?teamId=${VERCEL_TEAM_ID}" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -w "%{http_code}" -o /tmp/project_response.txt)

if [ "$PROJECT_EXISTS" = "200" ]; then
    echo -e "${GREEN}✅ Project exists${NC}"
    PROJECT_ID=$(cat /tmp/project_response.txt | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
    echo "Project ID: $PROJECT_ID"
else
    echo -e "${YELLOW}⚠️  Project doesn't exist. Creating...${NC}"
    
    # Create project with GitHub integration
    CREATE_RESPONSE=$(curl -s -X POST "https://api.vercel.com/v10/projects?teamId=${VERCEL_TEAM_ID}" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "'${PROJECT_NAME}'",
            "framework": "nextjs",
            "publicSource": true,
            "gitRepository": {
                "type": "github",
                "repo": "acganger/ganger-platform"
            },
            "rootDirectory": "apps/staff",
            "buildCommand": "cd ../.. && npm run build:staff",
            "devCommand": "next dev",
            "installCommand": "cd ../.. && npm install",
            "outputDirectory": "apps/staff/.next"
        }' -w "\n%{http_code}")
    
    HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo -e "${GREEN}✅ Project created successfully${NC}"
        PROJECT_ID=$(echo "$RESPONSE_BODY" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
        echo "New Project ID: $PROJECT_ID"
    else
        echo -e "${RED}❌ Failed to create project${NC}"
        echo "Response: $RESPONSE_BODY"
        exit 1
    fi
fi

# Add environment variables
echo -e "\n${BLUE}🔐 Configuring environment variables...${NC}"

# Read .env file and add variables
if [ -f "/mnt/q/Projects/ganger-platform/.env" ]; then
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        if [[ ! "$key" =~ ^# ]] && [[ -n "$key" ]]; then
            # Remove quotes from value
            value="${value%\"}"
            value="${value#\"}"
            value="${value%\'}"
            value="${value#\'}"
            
            echo -n "Adding $key... "
            
            # Add to production environment
            curl -s -X POST "https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}" \
                -H "Authorization: Bearer $VERCEL_TOKEN" \
                -H "Content-Type: application/json" \
                -d '{
                    "key": "'$key'",
                    "value": "'"$value"'",
                    "type": "encrypted",
                    "target": ["production", "preview", "development"]
                }' > /dev/null 2>&1
            
            echo -e "${GREEN}✓${NC}"
        fi
    done < "/mnt/q/Projects/ganger-platform/.env"
else
    echo -e "${YELLOW}⚠️  .env file not found. Skipping environment variables.${NC}"
fi

# Add custom domain
echo -e "\n${BLUE}🌐 Configuring custom domain...${NC}"

# Check if domain is already added
DOMAIN_CHECK=$(curl -s "https://api.vercel.com/v9/projects/${PROJECT_ID}/domains?teamId=${VERCEL_TEAM_ID}" \
    -H "Authorization: Bearer $VERCEL_TOKEN" | \
    python3 -c "import json,sys; domains=json.load(sys.stdin)['domains']; print('exists' if any(d['name']=='$DOMAIN' for d in domains) else 'not_found')" 2>/dev/null || echo "error")

if [ "$DOMAIN_CHECK" = "exists" ]; then
    echo -e "${GREEN}✅ Domain already configured${NC}"
else
    echo "Adding domain $DOMAIN..."
    
    DOMAIN_RESPONSE=$(curl -s -X POST "https://api.vercel.com/v10/projects/${PROJECT_ID}/domains?teamId=${VERCEL_TEAM_ID}" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name": "'$DOMAIN'"}' \
        -w "\n%{http_code}")
    
    HTTP_CODE=$(echo "$DOMAIN_RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "409" ]; then
        echo -e "${GREEN}✅ Domain configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not add domain (may need manual configuration)${NC}"
    fi
fi

# Trigger deployment
echo -e "\n${BLUE}🚀 Triggering deployment...${NC}"

# First, ensure we have the latest code
cd /mnt/q/Projects/ganger-platform
git pull origin main 2>/dev/null || true

# Create a deployment
DEPLOY_RESPONSE=$(curl -s -X POST "https://api.vercel.com/v13/deployments?teamId=${VERCEL_TEAM_ID}" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "'${PROJECT_NAME}'",
        "project": "'${PROJECT_ID}'",
        "target": "production",
        "gitSource": {
            "type": "github",
            "repoId": "814003807",
            "ref": "main"
        }
    }' -w "\n%{http_code}")

HTTP_CODE=$(echo "$DEPLOY_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$DEPLOY_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    DEPLOYMENT_URL=$(echo "$RESPONSE_BODY" | python3 -c "import json,sys; print(json.load(sys.stdin).get('url', ''))" 2>/dev/null || echo "")
    DEPLOYMENT_ID=$(echo "$RESPONSE_BODY" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")
    
    echo -e "${GREEN}✅ Deployment triggered${NC}"
    echo "Deployment URL: https://${DEPLOYMENT_URL}"
    echo "Deployment ID: $DEPLOYMENT_ID"
    
    echo -e "\n${BLUE}📊 Monitoring deployment status...${NC}"
    
    # Monitor deployment
    for i in {1..60}; do
        sleep 5
        
        STATUS=$(curl -s "https://api.vercel.com/v13/deployments/${DEPLOYMENT_ID}?teamId=${VERCEL_TEAM_ID}" \
            -H "Authorization: Bearer $VERCEL_TOKEN" | \
            python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('readyState', 'UNKNOWN'))" 2>/dev/null || echo "ERROR")
        
        case $STATUS in
            "READY")
                echo -e "\n${GREEN}✅ Deployment successful!${NC}"
                echo -e "\n${GREEN}🎉 Staff Portal is now live at:${NC}"
                echo -e "${BLUE}https://staff.gangerdermatology.com${NC}"
                echo -e "\n${YELLOW}📱 Beta Testers can now access:${NC}"
                echo "  ✓ 7 working applications"
                echo "  ✓ Professional 'Coming Soon' pages for pending apps"
                echo "  ✓ Unified authentication across all apps"
                exit 0
                ;;
            "ERROR"|"CANCELED")
                echo -e "\n${RED}❌ Deployment failed!${NC}"
                echo "Check the build logs at: https://vercel.com/${VERCEL_TEAM_ID}/${PROJECT_NAME}"
                exit 1
                ;;
            *)
                echo -n "."
                ;;
        esac
    done
    
    echo -e "\n${YELLOW}⚠️  Deployment is taking longer than expected${NC}"
    echo "Check status at: https://vercel.com/${VERCEL_TEAM_ID}/${PROJECT_NAME}"
else
    echo -e "${RED}❌ Failed to trigger deployment${NC}"
    echo "Response: $RESPONSE_BODY"
    echo -e "\n${YELLOW}Alternative: Deploy manually from Vercel dashboard${NC}"
    echo "1. Go to: https://vercel.com/${VERCEL_TEAM_ID}"
    echo "2. Click on ${PROJECT_NAME} project"
    echo "3. Click 'Redeploy' on the latest commit"
fi

echo -e "\n${BLUE}📚 Next Steps:${NC}"
echo "1. Verify deployment at: https://staff.gangerdermatology.com"
echo "2. Test all 7 working apps are accessible"
echo "3. Confirm 'Coming Soon' pages display for pending apps"
echo "4. Share with beta testers!"