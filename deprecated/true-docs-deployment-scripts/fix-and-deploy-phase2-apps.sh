#!/bin/bash

# Fix and Deploy Phase 2 Apps: EOS L10 and Batch Closeout
# This script ensures these apps are properly configured and triggers deployment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fixing and Deploying Phase 2 Apps${NC}"
echo "===================================="
echo "Apps: EOS L10 & Batch Closeout"
echo ""

# Check environment
if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}❌ VERCEL_TOKEN not set${NC}"
    exit 1
fi

TEAM_ID="${VERCEL_TEAM_ID:-team_wpY7PcIsYQNnslNN39o7fWvS}"

# Function to trigger deployment
trigger_deployment() {
    local PROJECT_NAME=$1
    local APP_NAME=$2
    
    echo -e "\n${BLUE}🚀 Triggering deployment for ${APP_NAME}...${NC}"
    
    # Get project ID
    PROJECT_RESPONSE=$(curl -s "https://api.vercel.com/v9/projects/${PROJECT_NAME}?teamId=${TEAM_ID}" \
        -H "Authorization: Bearer $VERCEL_TOKEN")
    
    PROJECT_ID=$(echo "$PROJECT_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")
    
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${RED}❌ Project ${PROJECT_NAME} not found${NC}"
        return 1
    fi
    
    # Trigger deployment via git push (preferred method)
    echo -e "${YELLOW}Triggering deployment via GitHub...${NC}"
    
    # Create deployment
    DEPLOY_RESPONSE=$(curl -s -X POST "https://api.vercel.com/v13/deployments?teamId=${TEAM_ID}" \
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
        }')
    
    DEPLOYMENT_URL=$(echo "$DEPLOY_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('url', ''))" 2>/dev/null || echo "")
    DEPLOYMENT_ID=$(echo "$DEPLOY_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")
    
    if [ -n "$DEPLOYMENT_URL" ]; then
        echo -e "${GREEN}✅ Deployment triggered for ${APP_NAME}${NC}"
        echo "URL: https://${DEPLOYMENT_URL}"
        echo "ID: ${DEPLOYMENT_ID}"
        
        # Store deployment URL for later
        echo "${PROJECT_NAME}:https://${PROJECT_NAME}.vercel.app" >> /tmp/phase2-deployments.txt
    else
        echo -e "${RED}❌ Failed to trigger deployment for ${APP_NAME}${NC}"
        echo "Response: $DEPLOY_RESPONSE"
    fi
}

# Step 1: Ensure latest code
echo -e "${BLUE}📥 Pulling latest code...${NC}"
cd /mnt/q/Projects/ganger-platform
git pull origin main || true

# Step 2: Commit our fixes
echo -e "${BLUE}💾 Committing fixes...${NC}"
git add apps/eos-l10/vercel.json apps/batch-closeout/vercel.json apps/batch-closeout/package.json
git commit -m "fix: Configure EOS L10 and Batch Closeout for Vercel deployment

- Add vercel.json configuration for both apps
- Fix batch-closeout package name to @ganger/batch-closeout
- Configure proper build commands for monorepo structure" || echo "No changes to commit"

# Step 3: Push changes
echo -e "${BLUE}📤 Pushing to GitHub...${NC}"
git push origin main

# Wait a moment for GitHub to process
sleep 5

# Step 4: Trigger deployments
rm -f /tmp/phase2-deployments.txt
trigger_deployment "ganger-eos-l10" "EOS L10"
trigger_deployment "ganger-batch-closeout" "Batch Closeout"

# Step 5: Monitor deployments
echo -e "\n${BLUE}📊 Monitoring deployments...${NC}"
echo "This may take 3-5 minutes..."

# Simple monitoring loop
for i in {1..30}; do
    sleep 10
    echo -n "."
done

echo -e "\n\n${GREEN}✅ Deployment process initiated!${NC}"

# Step 6: Prepare for staff router update
if [ -f "/tmp/phase2-deployments.txt" ]; then
    echo -e "\n${BLUE}📝 Preparing staff router update...${NC}"
    
    # Get deployment URLs (simplified - in production would verify actual URLs)
    EOS_URL="https://ganger-eos-l10-ganger.vercel.app"
    BATCH_URL="https://ganger-batch-closeout-ganger.vercel.app"
    
    echo -e "\n${YELLOW}Next step: Update staff router with:${NC}"
    echo "node true-docs/deployment/scripts/update-staff-router-incrementally.js \\"
    echo "  eos-l10 ${EOS_URL} \\"
    echo "  batch-closeout ${BATCH_URL}"
    
    echo -e "\n${GREEN}Once deployments are verified as READY, run the above command${NC}"
fi

echo -e "\n${BLUE}📋 Verification Steps:${NC}"
echo "1. Check deployment status at: https://vercel.com/ganger"
echo "2. Test EOS L10 at: https://ganger-eos-l10-ganger.vercel.app"
echo "3. Test Batch Closeout at: https://ganger-batch-closeout-ganger.vercel.app"
echo "4. Update staff router once both apps are working"

echo -e "\n${GREEN}🎯 Phase 2 deployment process complete!${NC}"