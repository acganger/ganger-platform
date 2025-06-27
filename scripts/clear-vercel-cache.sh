#!/bin/bash

# Clear Vercel Build Cache Script
# This script automates clearing Vercel build cache for specific apps or all apps

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"
VERCEL_TEAM_ID="${VERCEL_TEAM_ID:-team_wpY7PcIsYQNnslNN39o7fWvS}"

# Function to clear cache for a single app
clear_app_cache() {
    local app_name=$1
    local app_path="apps/$app_name"
    
    echo -e "${BLUE}🗑️  Clearing cache for $app_name...${NC}"
    
    if [ ! -d "$app_path" ]; then
        echo -e "${YELLOW}⚠️  App directory not found: $app_path${NC}"
        return 1
    fi
    
    cd "$app_path"
    
    # Method 1: Force deployment (clears cache)
    echo -e "${YELLOW}→ Deploying with --force to clear cache...${NC}"
    npx vercel --token "$VERCEL_TOKEN" --scope "$VERCEL_TEAM_ID" --prod --force --yes > /dev/null 2>&1 || {
        echo -e "${RED}✗ Failed to clear cache for $app_name${NC}"
        cd ../..
        return 1
    }
    
    echo -e "${GREEN}✓ Cache cleared for $app_name${NC}"
    cd ../..
    return 0
}

# Function to clear cache using Vercel API
clear_cache_via_api() {
    local project_name=$1
    
    echo -e "${BLUE}🔧 Clearing cache via API for $project_name...${NC}"
    
    # Get project ID
    local project_id=$(curl -s \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        "https://api.vercel.com/v9/projects/$project_name?teamId=$VERCEL_TEAM_ID" \
        | jq -r '.id' 2>/dev/null)
    
    if [ -z "$project_id" ] || [ "$project_id" = "null" ]; then
        echo -e "${YELLOW}⚠️  Could not find project: $project_name${NC}"
        return 1
    fi
    
    # Trigger redeployment without cache
    curl -s -X POST \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        "https://api.vercel.com/v13/deployments?teamId=$VERCEL_TEAM_ID&forceNew=1&withCache=0" \
        -d "{\"name\":\"$project_name\",\"gitSource\":{\"ref\":\"main\",\"repoId\":\"$GITHUB_REPO_ID\"}}" \
        > /dev/null
    
    echo -e "${GREEN}✓ Cache clear triggered via API for $project_name${NC}"
}

# Parse command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [app-name|--all|--api]"
    echo ""
    echo "Options:"
    echo "  app-name    Clear cache for specific app (e.g., eos-l10)"
    echo "  --all       Clear cache for all apps"
    echo "  --api       Use Vercel API instead of CLI"
    echo "  --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 eos-l10           # Clear cache for eos-l10"
    echo "  $0 --all             # Clear cache for all apps"
    echo "  $0 eos-l10 --api     # Clear cache using API"
    exit 0
fi

# Main execution
echo -e "${BLUE}🚀 Vercel Cache Clearing Tool${NC}"
echo -e "${BLUE}================================${NC}"

if [ "$1" = "--all" ]; then
    # Clear cache for all apps
    APPS=(
        "eos-l10"
        "batch-closeout"
        "integration-status"
        "pharma-scheduling"
        "socials-reviews"
        "ai-receptionist"
        "call-center-ops"
        "medication-auth"
        "component-showcase"
    )
    
    echo -e "${YELLOW}Clearing cache for all apps...${NC}"
    
    for app in "${APPS[@]}"; do
        clear_app_cache "$app" || echo -e "${YELLOW}Continuing...${NC}"
        sleep 2  # Avoid rate limiting
    done
    
    echo -e "${GREEN}✅ Cache clearing complete!${NC}"
    
elif [ "$2" = "--api" ]; then
    # Use API method
    clear_cache_via_api "ganger-$1"
    
elif [ -n "$1" ]; then
    # Clear cache for specific app
    clear_app_cache "$1"
    
else
    echo -e "${RED}Error: Please specify an app name or --all${NC}"
    echo "Run '$0 --help' for usage information"
    exit 1
fi

# Additional automated cache clearing methods
echo -e "\n${BLUE}📋 Other Cache Clearing Methods:${NC}"
echo -e "${YELLOW}1. Vercel Dashboard:${NC}"
echo "   - Go to: https://vercel.com/ganger/[project-name]/settings"
echo "   - Click 'Purge Cache' button"
echo ""
echo -e "${YELLOW}2. Environment Variable Change:${NC}"
echo "   - Adding/modifying any env var triggers cache invalidation"
echo "   - Example: CACHE_BUST=\$(date +%s)"
echo ""
echo -e "${YELLOW}3. GitHub Integration:${NC}"
echo "   - Force push to trigger fresh build: git commit --amend && git push -f"
echo ""
echo -e "${YELLOW}4. Automated via GitHub Actions:${NC}"
echo "   - Add cache clearing step to deployment workflow"
echo "   - Use Vercel API in CI/CD pipeline"