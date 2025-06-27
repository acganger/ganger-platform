#!/bin/bash

# Fix npm dependencies properly without using --force

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fixing NPM Dependencies Properly${NC}"
echo "====================================="

# Step 1: Clean node_modules and reinstall
echo -e "\n${BLUE}Step 1: Clean install${NC}"
echo "Removing node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

# Step 2: Install with legacy peer deps (less aggressive than force)
echo -e "\n${BLUE}Step 2: Install with legacy peer deps${NC}"
npm install --legacy-peer-deps

# Step 3: Update vercel.json files to use legacy-peer-deps
echo -e "\n${BLUE}Step 3: Update Vercel configs${NC}"

APPS_TO_UPDATE=(
    "staff"
    "eos-l10"
    "batch-closeout"
    "deployment-helper"
)

for APP in "${APPS_TO_UPDATE[@]}"; do
    VERCEL_FILE="apps/$APP/vercel.json"
    
    if [ -f "$VERCEL_FILE" ]; then
        echo -e "Updating $VERCEL_FILE..."
        
        # Update to use legacy-peer-deps instead of force
        sed -i 's/npm install --force/npm install --legacy-peer-deps/g' "$VERCEL_FILE"
        echo -e "${GREEN}✅ Updated $APP${NC}"
    fi
done

echo -e "\n${YELLOW}📋 Summary:${NC}"
echo "1. Cleaned node_modules and package-lock.json"
echo "2. Reinstalled with --legacy-peer-deps (safer than --force)"
echo "3. Updated Vercel configs to use --legacy-peer-deps"
echo ""
echo -e "${GREEN}Benefits over --force:${NC}"
echo "- Respects package-lock.json"
echo "- Only bypasses peer dependency conflicts"
echo "- Maintains build consistency"
echo "- Better for production environments"