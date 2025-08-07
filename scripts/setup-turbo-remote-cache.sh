#!/bin/bash

# Turbo Remote Cache Setup Script
# Configures Turborepo to use Vercel's remote caching

set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vercel token and team ID from environment
VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"
VERCEL_TEAM_ID="${VERCEL_TEAM_ID:-team_wpY7PcIsYQNnslNN39o7fWvS}"

echo -e "${BLUE}=== Setting up Turbo Remote Caching with Vercel ===${NC}"
echo ""

# Check if turbo.json exists
if [ ! -f "turbo.json" ]; then
  echo -e "${RED}Error: turbo.json not found in current directory${NC}"
  exit 1
fi

# Create .turbo directory if it doesn't exist
mkdir -p .turbo

# Create turbo config with remote cache settings
cat > .turbo/config.json << EOF
{
  "teamId": "${VERCEL_TEAM_ID}",
  "token": "${VERCEL_TOKEN}"
}
EOF

echo -e "${GREEN}✓ Created .turbo/config.json with remote cache configuration${NC}"

# Add .turbo to .gitignore if not already there
if ! grep -q "^\.turbo$" .gitignore 2>/dev/null; then
  echo ".turbo" >> .gitignore
  echo -e "${GREEN}✓ Added .turbo to .gitignore${NC}"
fi

# Update turbo.json to include remote caching configuration
echo -e "\n${YELLOW}Updating turbo.json configuration...${NC}"

# Check if turbo.json has remoteCache configuration
if ! grep -q "remoteCache" turbo.json; then
  # Add remoteCache configuration using Node.js
  node -e "
    const fs = require('fs');
    const turboConfig = JSON.parse(fs.readFileSync('turbo.json', 'utf8'));
    turboConfig.remoteCache = {
      enabled: true,
      teamId: '${VERCEL_TEAM_ID}'
    };
    fs.writeFileSync('turbo.json', JSON.stringify(turboConfig, null, 2));
    console.log('✓ Added remoteCache configuration to turbo.json');
  "
else
  echo -e "${GREEN}✓ turbo.json already has remoteCache configuration${NC}"
fi

# Test the remote cache setup
echo -e "\n${YELLOW}Testing remote cache connection...${NC}"

# Run a simple turbo command to test the connection
if npx turbo run build --dry=json --filter=@ganger/inventory 2>&1 | grep -q "remote cache"; then
  echo -e "${GREEN}✓ Remote cache is properly configured!${NC}"
else
  echo -e "${YELLOW}⚠ Could not verify remote cache connection${NC}"
  echo "  This might be normal if no builds have been cached yet"
fi

echo -e "\n${BLUE}=== Remote Cache Setup Complete! ===${NC}"
echo ""
echo "Benefits of remote caching:"
echo "  • Shared build cache across team members"
echo "  • Faster CI/CD builds"
echo "  • Reduced build times for unchanged packages"
echo ""
echo "Usage:"
echo "  • Run any turbo command normally (e.g., pnpm run build)"
echo "  • Turbo will automatically use remote cache when available"
echo "  • View cache hits/misses with: turbo run build --dry=json"
echo ""
echo -e "${YELLOW}Note: Make sure to keep your Vercel token secure and never commit it to the repository${NC}"