#!/bin/bash

# Create Deploy Hooks for all Vercel projects
# This allows deployment without GitHub integration

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔗 Creating Deploy Hooks for All Projects${NC}"
echo "========================================"

VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"
TEAM_ID="${VERCEL_TEAM_ID:-team_wpY7PcIsYQNnslNN39o7fWvS}"

# List of projects
PROJECTS=(
    "ganger-staff"
    "ganger-inventory"
    "ganger-handouts"
    "ganger-eos-l10"
    "ganger-batch-closeout"
    "ganger-compliance-training"
    "ganger-clinical-staffing"
    "ganger-config-dashboard"
    "ganger-integration-status"
    "ganger-pharma-scheduling"
    "ganger-socials-reviews"
    "ganger-ai-receptionist"
    "ganger-call-center-ops"
    "ganger-medication-auth"
    "ganger-component-showcase"
    "ganger-checkin-kiosk"
    "ganger-platform-dashboard"
)

# Output file for deploy hooks
OUTPUT_FILE="true-docs/deployment/deploy-hooks.env"
echo "# Deploy Hooks for Vercel Projects" > "$OUTPUT_FILE"
echo "# Generated on $(date)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

for PROJECT in "${PROJECTS[@]}"; do
    echo -e "\n${BLUE}Processing ${PROJECT}...${NC}"
    
    # Get project details
    PROJECT_RESPONSE=$(curl -s "https://api.vercel.com/v9/projects/${PROJECT}?teamId=${TEAM_ID}" \
        -H "Authorization: Bearer $VERCEL_TOKEN")
    
    PROJECT_ID=$(echo "$PROJECT_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")
    
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${YELLOW}⚠️  Project ${PROJECT} not found${NC}"
        continue
    fi
    
    # Create deploy hook
    HOOK_RESPONSE=$(curl -s -X POST "https://api.vercel.com/v1/projects/${PROJECT_ID}/deploy-hooks?teamId=${TEAM_ID}" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name": "CLI Deploy Hook"}')
    
    HOOK_URL=$(echo "$HOOK_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('url', ''))" 2>/dev/null || echo "")
    
    if [ -n "$HOOK_URL" ]; then
        echo -e "${GREEN}✅ Created hook for ${PROJECT}${NC}"
        echo "${PROJECT}_DEPLOY_HOOK=\"${HOOK_URL}\"" >> "$OUTPUT_FILE"
    else
        echo -e "${RED}❌ Failed to create hook for ${PROJECT}${NC}"
    fi
done

echo -e "\n${GREEN}✅ Deploy hooks saved to: ${OUTPUT_FILE}${NC}"
echo -e "${YELLOW}To trigger a deployment:${NC}"
echo "curl -X POST \$PROJECT_NAME_DEPLOY_HOOK"