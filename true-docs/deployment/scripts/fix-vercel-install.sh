#!/bin/bash

# Fix Vercel deployment by using npm install --force

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fixing Vercel Install Issues${NC}"
echo "=================================="

# Update vercel.json files to use npm install --force
APPS_TO_FIX=(
    "staff"
    "eos-l10"
    "batch-closeout"
    "deployment-helper"
)

for APP in "${APPS_TO_FIX[@]}"; do
    VERCEL_FILE="apps/$APP/vercel.json"
    
    if [ -f "$VERCEL_FILE" ]; then
        echo -e "${BLUE}Updating $VERCEL_FILE...${NC}"
        
        # Update install command to use --force
        node -e "
            const fs = require('fs');
            const config = JSON.parse(fs.readFileSync('$VERCEL_FILE', 'utf8'));
            config.installCommand = 'cd ../.. && npm install --force';
            fs.writeFileSync('$VERCEL_FILE', JSON.stringify(config, null, 2) + '\\n');
            console.log('✅ Updated install command to use --force');
        "
    fi
done

# Create a root-level vercel.json for better monorepo handling
echo -e "\n${BLUE}Creating root vercel.json...${NC}"
cat > vercel.json << 'EOF'
{
  "ignoreCommand": "echo 'Using custom ignore command' && exit 1"
}
EOF

echo -e "${GREEN}✅ Created root vercel.json to prevent automatic builds${NC}"

echo -e "\n${YELLOW}📋 Summary:${NC}"
echo "1. Updated install commands to use 'npm install --force'"
echo "2. Created root vercel.json to control builds"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Commit and push these changes"
echo "2. Redeploy the failed apps"
echo "3. The --force flag will resolve workspace dependency conflicts"