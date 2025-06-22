#!/bin/bash
# Deploy updated Cloudflare Worker with VM routing for L10

echo "🚀 Deploying Updated Staff Router with VM Routing"
echo "================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📦 Building and deploying updated worker...${NC}"

cd cloudflare-workers

# Deploy the updated staff router
echo -e "${BLUE}Deploying staff-router with L10 VM routing...${NC}"
wrangler deploy staff-router.js \
  --name staff-portal-router \
  --compatibility-date 2024-01-01 \
  --route "staff.gangerdermatology.com/*" \
  --env production

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Worker deployed successfully!${NC}"
else
  echo -e "${YELLOW}⚠️  Worker deployment may have failed. Check the output above.${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}What's New:${NC}"
echo "  - L10 routes (/l10/*) now proxy to your VM at 35.225.189.208:3010"
echo "  - Automatic fallback to static template if VM is unavailable"
echo "  - CORS headers added for cross-origin requests"
echo ""
echo -e "${BLUE}Test URLs:${NC}"
echo "  - https://staff.gangerdermatology.com/l10 (proxies to VM)"
echo "  - http://35.225.189.208:3010 (direct VM access)"
echo ""
echo -e "${YELLOW}Note: Make sure the EOS L10 app is deployed and running on your VM${NC}"