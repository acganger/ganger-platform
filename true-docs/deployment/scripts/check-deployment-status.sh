#!/bin/bash

# Check deployment status for all apps

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Checking Deployment Status${NC}"
echo "================================"
echo "Time: $(date)"
echo ""

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Check specific deployment
DEPLOYMENT_ID="dpl_J6p1FkpaSLbN7kgbPyivVt37D8kD"
echo -e "${BLUE}Staff Portal Deployment:${NC}"
RESPONSE=$(curl -s "https://api.vercel.com/v13/deployments/${DEPLOYMENT_ID}?teamId=${TEAM_ID}" \
  -H "Authorization: Bearer $VERCEL_TOKEN")

STATE=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('readyState', 'Unknown'))" 2>/dev/null || echo "Error")
URL=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('url', 'N/A'))" 2>/dev/null || echo "N/A")

case "$STATE" in
  "READY")
    echo -e "  ${GREEN}✅ Status: $STATE${NC}"
    echo -e "  URL: https://$URL"
    ;;
  "ERROR")
    echo -e "  ${RED}❌ Status: $STATE${NC}"
    ;;
  "BUILDING"|"QUEUED"|"INITIALIZING")
    echo -e "  ${YELLOW}🔄 Status: $STATE${NC}"
    echo -e "  URL: https://$URL (building...)"
    ;;
  *)
    echo -e "  ${YELLOW}❓ Status: $STATE${NC}"
    ;;
esac

echo ""
echo -e "${BLUE}Direct App Access Test:${NC}"
echo "Testing authentication on deployed apps..."
echo ""

# Test URLs
APPS=(
  "inventory|https://ganger-inventory-ganger.vercel.app"
  "handouts|https://ganger-handouts-ganger.vercel.app"
  "config-dashboard|https://ganger-config-dashboard-ganger.vercel.app"
  "platform-dashboard|https://ganger-platform-dashboard-ganger.vercel.app"
)

for APP_INFO in "${APPS[@]}"; do
  IFS='|' read -r APP_NAME APP_URL <<< "$APP_INFO"
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" || echo "000")
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ${GREEN}✅ $APP_NAME: Accessible${NC}"
  elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo -e "  ${GREEN}✅ $APP_NAME: Auth required (good!)${NC}"
  else
    echo -e "  ${YELLOW}⚠️  $APP_NAME: HTTP $HTTP_CODE${NC}"
  fi
done

echo ""
echo -e "${BLUE}Staff Portal Status:${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://staff.gangerdermatology.com" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "  ${GREEN}✅ staff.gangerdermatology.com is LIVE!${NC}"
elif [ "$HTTP_CODE" = "404" ]; then
  echo -e "  ${YELLOW}⏳ staff.gangerdermatology.com: Waiting for deployment${NC}"
else
  echo -e "  ${RED}❌ staff.gangerdermatology.com: HTTP $HTTP_CODE${NC}"
fi

echo ""
echo -e "${GREEN}Run this script again in 1-2 minutes to check progress.${NC}"