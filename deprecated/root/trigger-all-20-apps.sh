#!/bin/bash
# Trigger deployments for all 20 apps in the monorepo

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Triggering Deployments for All 20 Apps${NC}"
echo "=========================================="

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"
REPO_ID="996544644"  # GitHub repo ID for ganger-platform

# All 20 apps with their Vercel project names
declare -A APPS=(
  ["ai-receptionist"]="ganger-ai-receptionist"
  ["batch-closeout"]="ganger-batch-closeout"
  ["call-center-ops"]="ganger-call-center-ops"
  ["checkin-kiosk"]="ganger-checkin-kiosk"
  ["checkout-slips"]="ganger-checkout-slips"
  ["clinical-staffing"]="ganger-clinical-staffing"
  ["compliance-training"]="ganger-compliance-training"
  ["component-showcase"]="ganger-component-showcase"
  ["config-dashboard"]="ganger-config-dashboard"
  ["deployment-helper"]="ganger-deployment-helper"
  ["eos-l10"]="ganger-eos-l10"
  ["handouts"]="ganger-handouts"
  ["integration-status"]="ganger-integration-status"
  ["inventory"]="ganger-inventory"
  ["llm-demo"]="ganger-llm-demo"
  ["medication-auth"]="ganger-medication-auth"
  ["pharma-scheduling"]="ganger-pharma-scheduling"
  ["platform-dashboard"]="ganger-platform-dashboard"
  ["socials-reviews"]="ganger-socials-reviews"
  ["staff"]="ganger-staff"
)

success_count=0
failed_count=0
deployment_ids=()

echo -e "${YELLOW}Starting deployments...${NC}"
echo ""

# Sort apps alphabetically for consistent output
sorted_apps=($(for key in "${!APPS[@]}"; do echo "$key"; done | sort))

for app_dir in "${sorted_apps[@]}"; do
  project_name="${APPS[$app_dir]}"
  echo -ne "Deploying ${GREEN}$app_dir${NC} ($project_name)... "
  
  # Trigger deployment using the Vercel API
  RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    "https://api.vercel.com/v13/deployments?teamId=$TEAM_ID" \
    -d "{
      \"name\": \"$project_name\",
      \"project\": \"$project_name\",
      \"gitSource\": {
        \"type\": \"github\",
        \"repoId\": \"$REPO_ID\",
        \"ref\": \"main\"
      }
    }" 2>/dev/null)
  
  # Check if deployment was triggered successfully
  if echo "$RESPONSE" | grep -q '"id"'; then
    DEPLOYMENT_ID=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id', 'unknown'))" 2>/dev/null || echo "parse-error")
    echo -e "${GREEN}✓${NC} [${DEPLOYMENT_ID:0:24}]"
    deployment_ids+=("$app_dir:$DEPLOYMENT_ID")
    ((success_count++))
  else
    echo -e "${RED}✗ Failed${NC}"
    ERROR_MSG=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('error',{}).get('message', 'Unknown error'))" 2>/dev/null || echo "$RESPONSE")
    echo "  Error: $ERROR_MSG"
    ((failed_count++))
  fi
  
  # Small delay to avoid rate limiting
  sleep 0.5
done

echo ""
echo -e "${BLUE}Deployment Summary:${NC}"
echo "==================="
echo -e "${GREEN}✓ Successful: $success_count${NC}"
echo -e "${RED}✗ Failed: $failed_count${NC}"

if [ $success_count -gt 0 ]; then
  echo ""
  echo -e "${BLUE}Deployment IDs:${NC}"
  for deployment in "${deployment_ids[@]}"; do
    echo "  $deployment"
  done
fi

echo ""
echo -e "${YELLOW}📊 Monitor deployments at:${NC}"
echo "https://vercel.com/team/ganger/projects"
echo ""
echo -e "${GREEN}✨ With pnpm configuration and ENABLE_EXPERIMENTAL_COREPACK=1,${NC}"
echo -e "${GREEN}   all deployments should now succeed!${NC}"

if [ $failed_count -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}⚠️  Some deployments failed to trigger.${NC}"
  echo "This might be because:"
  echo "1. The project doesn't exist in Vercel yet"
  echo "2. The project name doesn't match"
  echo "3. API rate limiting"
  echo ""
  echo "You can create missing projects with:"
  echo "./true-docs/deployment/scripts/create-remaining-projects.sh"
fi