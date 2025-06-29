#!/bin/bash

# Emergency Recovery Deployment Script
# Based on deployment engineer's recommendations for recovery

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}🚨 Emergency Recovery Deployment${NC}"
echo "=================================="
echo "This script implements the deployment engineer's recovery recommendations"
echo ""

# Step 1: Summary of Current Issues
echo -e "${BLUE}📊 Current Situation:${NC}"
echo "- GitHub integration appears disconnected"
echo "- Staff portal project exists but deployments fail"
echo "- 7 apps are already deployed and working"
echo "- 10 apps need deployment"
echo ""

# Step 2: Recovery Options
echo -e "${YELLOW}Recovery Options:${NC}"
echo ""
echo "1. ${GREEN}Clean Slate Approach${NC} (Nuclear option - start fresh)"
echo "   - Remove all Vercel projects"
echo "   - Re-create with proper GitHub integration"
echo "   - Time: 2-3 hours"
echo ""
echo "2. ${GREEN}Manual Vercel Dashboard${NC} (Recommended for immediate results)"
echo "   - Go to https://vercel.com/ganger/ganger-staff"
echo "   - Click 'Settings' → 'Git'"
echo "   - Reconnect GitHub repository"
echo "   - Redeploy from dashboard"
echo "   - Time: 10 minutes"
echo ""
echo "3. ${GREEN}Vercel CLI Direct Deploy${NC} (Works without GitHub)"
echo "   - Use 'vercel' command from app directory"
echo "   - Bypasses GitHub integration issues"
echo "   - Time: 5 minutes per app"
echo ""
echo "4. ${GREEN}Create GitHub Action${NC} (Long-term solution)"
echo "   - Custom deployment workflow"
echo "   - Full control over build process"
echo "   - Time: 1 hour setup, then automated"
echo ""

# Step 3: Immediate Actions
echo -e "${BLUE}🎯 Recommended Immediate Actions:${NC}"
echo ""
echo "1. ${YELLOW}For Staff Portal (URGENT):${NC}"
echo "   cd apps/staff"
echo "   vercel --prod --yes --token=$VERCEL_TOKEN"
echo ""
echo "2. ${YELLOW}For Phase 2 Apps (EOS L10 & Batch):${NC}"
echo "   cd apps/eos-l10 && vercel --prod --yes"
echo "   cd apps/batch-closeout && vercel --prod --yes"
echo ""
echo "3. ${YELLOW}Check Build Logs:${NC}"
echo "   Latest failed deployment: https://vercel.com/ganger/ganger-staff/dpl_CFTkd6kbNhwLsZqg7VZKmTMXx4po"
echo ""

# Step 4: Diagnostic Information
echo -e "${BLUE}🔍 Diagnostic Information:${NC}"
echo ""

# Check if Vercel CLI is installed
if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✅ Vercel CLI is installed${NC}"
    vercel --version
else
    echo -e "${RED}❌ Vercel CLI not installed${NC}"
    echo "   Install with: npm i -g vercel"
fi

# Check current directory
echo -e "\nCurrent directory: $(pwd)"

# Check if we're in a git repo
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Git repository detected${NC}"
    echo "   Branch: $(git branch --show-current)"
    echo "   Last commit: $(git log -1 --oneline)"
else
    echo -e "${RED}❌ Not in a git repository${NC}"
fi

# Step 5: Quick Deploy Function
deploy_with_cli() {
    local APP_NAME=$1
    local APP_DIR="apps/$APP_NAME"
    
    if [ -d "$APP_DIR" ]; then
        echo -e "\n${BLUE}Deploying $APP_NAME with Vercel CLI...${NC}"
        cd "$APP_DIR"
        
        # Build first to catch errors
        if npm run build; then
            echo -e "${GREEN}✅ Build successful${NC}"
            
            # Deploy with Vercel CLI
            vercel --prod --yes --token="$VERCEL_TOKEN" --scope="$VERCEL_TEAM_ID"
        else
            echo -e "${RED}❌ Build failed for $APP_NAME${NC}"
        fi
        
        cd - > /dev/null
    else
        echo -e "${RED}❌ Directory $APP_DIR not found${NC}"
    fi
}

# Step 6: Offer to deploy
echo -e "\n${YELLOW}Ready to deploy?${NC}"
echo "1. Deploy staff portal now (Recommended)"
echo "2. Deploy all Phase 2 apps (EOS L10 & Batch)"
echo "3. Show manual instructions only"
echo "4. Exit"
echo ""
read -p "Select option (1-4): " choice

case $choice in
    1)
        deploy_with_cli "staff"
        ;;
    2)
        deploy_with_cli "eos-l10"
        deploy_with_cli "batch-closeout"
        ;;
    3)
        echo -e "\n${BLUE}Manual Deployment Instructions:${NC}"
        echo "1. Open https://vercel.com/ganger"
        echo "2. For each failed project:"
        echo "   - Click on the project"
        echo "   - Go to Settings → Git"
        echo "   - Reconnect repository if needed"
        echo "   - Click 'Redeploy' on latest commit"
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid option"
        ;;
esac

echo -e "\n${GREEN}✅ Recovery process complete${NC}"
echo "Check deployment status at: https://vercel.com/ganger"