#!/bin/bash
# Script to set ENABLE_EXPERIMENTAL_COREPACK=1 for all Vercel projects

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Setting ENABLE_EXPERIMENTAL_COREPACK=1 for all Vercel projects${NC}"
echo "========================================================"

# Vercel credentials
VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# List of all app names
APPS=(
  "ganger-ai-receptionist"
  "ganger-batch-closeout"
  "ganger-call-center-ops"
  "ganger-checkin-kiosk"
  "ganger-checkout-slips"
  "ganger-clinical-staffing"
  "ganger-compliance-training"
  "ganger-component-showcase"
  "ganger-config-dashboard"
  "ganger-deployment-helper"
  "ganger-eos-l10"
  "ganger-handouts"
  "ganger-integration-status"
  "ganger-inventory"
  "ganger-llm-demo"
  "ganger-medication-auth"
  "ganger-pharma-scheduling"
  "ganger-platform-dashboard"
  "ganger-socials-reviews"
  "ganger-staff"
)

success_count=0
failed_count=0

for app in "${APPS[@]}"; do
  echo -ne "Setting Corepack for ${app}... "
  
  # Create or update the environment variable
  RESPONSE=$(curl -X POST "https://api.vercel.com/v10/projects/${app}/env?teamId=${TEAM_ID}" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "key": "ENABLE_EXPERIMENTAL_COREPACK",
      "value": "1",
      "type": "plain",
      "target": ["production", "preview", "development"]
    }' 2>/dev/null)
  
  # Check if it already exists and needs updating
  if echo "$RESPONSE" | grep -q "already exists"; then
    # Update existing variable
    ENV_ID=$(curl -s "https://api.vercel.com/v9/projects/${app}/env?teamId=${TEAM_ID}" \
      -H "Authorization: Bearer $VERCEL_TOKEN" | \
      python3 -c "import json,sys; envs=json.load(sys.stdin).get('envs',[]); print(next((e['id'] for e in envs if e['key']=='ENABLE_EXPERIMENTAL_COREPACK'), ''))" 2>/dev/null || echo "")
    
    if [ -n "$ENV_ID" ]; then
      UPDATE_RESPONSE=$(curl -X PATCH "https://api.vercel.com/v10/projects/${app}/env/${ENV_ID}?teamId=${TEAM_ID}" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
          "value": "1",
          "target": ["production", "preview", "development"]
        }' 2>/dev/null)
      
      if echo "$UPDATE_RESPONSE" | grep -q '"key":"ENABLE_EXPERIMENTAL_COREPACK"'; then
        echo -e "${GREEN}✓ Updated${NC}"
        ((success_count++))
      else
        echo -e "${YELLOW}⚠ Update may have failed${NC}"
        ((failed_count++))
      fi
    else
      echo -e "${RED}✗ Could not find existing env var${NC}"
      ((failed_count++))
    fi
  elif echo "$RESPONSE" | grep -q '"key":"ENABLE_EXPERIMENTAL_COREPACK"'; then
    echo -e "${GREEN}✓ Created${NC}"
    ((success_count++))
  else
    echo -e "${RED}✗ Failed${NC}"
    echo "  Response: $RESPONSE"
    ((failed_count++))
  fi
done

echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  ${GREEN}✓ Success: $success_count${NC}"
echo -e "  ${RED}✗ Failed: $failed_count${NC}"

if [ $failed_count -eq 0 ]; then
  echo ""
  echo -e "${GREEN}🎉 All projects now have ENABLE_EXPERIMENTAL_COREPACK=1${NC}"
  echo -e "${YELLOW}Note: You may need to redeploy for the changes to take effect${NC}"
else
  echo ""
  echo -e "${YELLOW}⚠️  Some projects failed. You may need to set them manually in Vercel dashboard${NC}"
fi

echo ""
echo -e "${BLUE}To trigger redeployments, run:${NC}"
echo "./true-docs/deployment/scripts/trigger-all-deployments.sh"