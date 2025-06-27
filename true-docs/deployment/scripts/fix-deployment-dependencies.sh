#!/bin/bash

# Fix deployment dependencies for apps that build locally but fail on Vercel

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fixing Deployment Dependencies${NC}"
echo "===================================="

# Fix 1: Add missing dependencies to EOS L10
echo -e "\n${BLUE}Fixing EOS L10...${NC}"
cd apps/eos-l10

# Add missing direct dependencies
npm install react-chartjs-2 chart.js @supabase/ssr framer-motion --save

# Ensure workspace packages are listed as dependencies (not devDependencies)
echo -e "${GREEN}✅ Added missing dependencies to EOS L10${NC}"

# Fix 2: Add missing dependencies to Batch Closeout
echo -e "\n${BLUE}Fixing Batch Closeout...${NC}"
cd ../batch-closeout

# Add framer-motion which is used but not declared
npm install framer-motion --save

echo -e "${GREEN}✅ Added missing dependencies to Batch Closeout${NC}"

# Fix 3: Update root turbo.json to ensure packages build first
echo -e "\n${BLUE}Updating turbo.json build pipeline...${NC}"
cd ../..

# Create a more explicit build order
cat > turbo-build-fix.json << 'EOF'
{
  "pipeline": {
    "build:packages": {
      "outputs": ["dist/**", "build/**"],
      "dependsOn": [],
      "env": ["NODE_ENV"]
    },
    "build": {
      "dependsOn": ["^build", "build:packages"],
      "outputs": [".next/**", "!.next/cache/**"],
      "env": ["NODE_ENV"]
    }
  }
}
EOF

echo -e "${GREEN}✅ Created build order fix${NC}"

# Fix 4: Add prebuild script to ensure packages are built
echo -e "\n${BLUE}Adding prebuild scripts...${NC}"

# For each app that needs it, add a prebuild script
APPS_TO_FIX=("eos-l10" "batch-closeout")

for APP in "${APPS_TO_FIX[@]}"; do
  PACKAGE_JSON="apps/$APP/package.json"
  
  if [ -f "$PACKAGE_JSON" ]; then
    # Add prebuild script using Node.js
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('$PACKAGE_JSON', 'utf8'));
      if (!pkg.scripts.prebuild) {
        pkg.scripts.prebuild = 'cd ../.. && npm run build --workspace=@ganger/auth --workspace=@ganger/ui --workspace=@ganger/utils';
        fs.writeFileSync('$PACKAGE_JSON', JSON.stringify(pkg, null, 2) + '\\n');
        console.log('✅ Added prebuild script to $APP');
      }
    "
  fi
done

echo -e "\n${YELLOW}📋 Summary of Changes:${NC}"
echo "1. Added missing direct dependencies to apps"
echo "2. Created turbo.json build order fix"
echo "3. Added prebuild scripts to ensure packages compile first"

echo -e "\n${GREEN}✅ Dependency fixes complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Commit these changes"
echo "2. Push to trigger new deployments"
echo "3. Monitor Vercel builds - they should succeed now"