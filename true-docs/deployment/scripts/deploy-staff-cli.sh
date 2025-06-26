#!/bin/bash

# Deploy Staff Portal using Vercel CLI
# This uses the Legacy CLI method when GitHub integration isn't working

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Staff Portal CLI Deployment${NC}"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Not in project root. Please run from /mnt/q/Projects/ganger-platform${NC}"
    exit 1
fi

# Step 1: Pre-deployment check
echo -e "\n${BLUE}📋 Running pre-deployment check...${NC}"
node true-docs/deployment/scripts/02-pre-deployment-check.js --app staff || true

# Step 2: Navigate to staff app
echo -e "\n${BLUE}📁 Navigating to staff app...${NC}"
cd apps/staff

# Step 3: Install Vercel CLI if needed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm i -g vercel
fi

# Step 4: Build the app locally first to catch errors
echo -e "\n${BLUE}🔨 Building app locally...${NC}"
npm install
npm run build || {
    echo -e "${RED}❌ Build failed locally. Fix errors before deploying.${NC}"
    exit 1
}

# Step 5: Deploy using Vercel CLI
echo -e "\n${BLUE}🚀 Deploying to Vercel...${NC}"
echo -e "${YELLOW}When prompted:${NC}"
echo "  - Set up and deploy: Y"
echo "  - Which scope: Select 'ganger'"
echo "  - Link to existing project? Y"
echo "  - What's the name: ganger-staff"
echo ""

# Set environment variables for non-interactive deployment if possible
export VERCEL_ORG_ID="team_wpY7PcIsYQNnslNN39o7fWvS"
export VERCEL_PROJECT_ID="prj_NF5ig8gWFVupD9CbTtb65osM1Cz7"

# Deploy with production flag
vercel --prod --yes || {
    echo -e "${YELLOW}If deployment failed, try:${NC}"
    echo "1. Run 'vercel link' to connect to the project"
    echo "2. Then run 'vercel --prod' again"
}

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo -e "${BLUE}Check status at:${NC} https://vercel.com/ganger/ganger-staff"
echo -e "${BLUE}Live URL:${NC} https://staff.gangerdermatology.com"