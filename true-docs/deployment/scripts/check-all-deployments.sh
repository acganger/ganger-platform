#!/bin/bash

# Check status of all recent deployments

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Checking All Deployment Statuses${NC}"
echo "===================================="
echo "Time: $(date)"
echo ""

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Recent deployments to check
declare -A DEPLOYMENTS=(
  ["Staff Portal"]="dpl_J6p1FkpaSLbN7kgbPyivVt37D8kD"
  ["EOS L10"]="dpl_5xyDCow5nv7Prjg9Ay2qwnUmL4pW"
  ["Batch Closeout"]="dpl_FL5jnTViEzji5W9iHecgTRhf7zT3"
  ["Deployment Helper"]="dpl_H7hjVdJjt2K6TtwKTZrwg28x4Nev"
)

echo -e "${BLUE}Recent Deployments:${NC}"
for APP_NAME in "${!DEPLOYMENTS[@]}"; do
  DEPLOYMENT_ID="${DEPLOYMENTS[$APP_NAME]}"
  
  RESPONSE=$(curl -s "https://api.vercel.com/v13/deployments/${DEPLOYMENT_ID}?teamId=${TEAM_ID}" \
    -H "Authorization: Bearer $VERCEL_TOKEN")
  
  STATE=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('readyState', 'Unknown'))" 2>/dev/null || echo "Error")
  URL=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('url', 'N/A'))" 2>/dev/null || echo "N/A")
  
  case "$STATE" in
    "READY")
      echo -e "  ${GREEN}✅ $APP_NAME: DEPLOYED${NC}"
      echo -e "     URL: https://$URL"
      ;;
    "ERROR")
      echo -e "  ${RED}❌ $APP_NAME: FAILED${NC}"
      ;;
    "BUILDING"|"QUEUED"|"INITIALIZING")
      echo -e "  ${YELLOW}🔄 $APP_NAME: $STATE${NC}"
      ;;
    *)
      echo -e "  ${YELLOW}❓ $APP_NAME: $STATE${NC}"
      ;;
  esac
done

echo ""
echo -e "${BLUE}Working Apps (Deployed):${NC}"
WORKING_APPS=(
  "inventory|https://ganger-inventory-ganger.vercel.app"
  "handouts|https://ganger-handouts-ganger.vercel.app"
  "compliance-training|https://ganger-compliance-training-ganger.vercel.app"
  "clinical-staffing|https://ganger-clinical-staffing-ganger.vercel.app"
  "config-dashboard|https://ganger-config-dashboard-ganger.vercel.app"
  "checkin-kiosk|https://ganger-checkin-kiosk-ganger.vercel.app"
  "platform-dashboard|https://ganger-platform-dashboard-ganger.vercel.app"
)

SUCCESS_COUNT=0
for APP_INFO in "${WORKING_APPS[@]}"; do
  IFS='|' read -r APP_NAME APP_URL <<< "$APP_INFO"
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" || echo "000")
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ${GREEN}✅ $APP_NAME${NC}"
    ((SUCCESS_COUNT++))
  else
    echo -e "  ${YELLOW}⚠️  $APP_NAME (HTTP $HTTP_CODE)${NC}"
  fi
done

echo ""
echo -e "${GREEN}Summary:${NC}"
echo "- Working apps: $SUCCESS_COUNT/7"
echo "- In progress: Check deployments above"
echo "- Total deployed: Will update once deployments complete"