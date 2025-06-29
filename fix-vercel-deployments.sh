#!/bin/bash
# fix-vercel-deployments.sh
# Automated fix for Vercel monorepo deployment issues

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing Vercel Deployments for Ganger Platform${NC}"
echo "================================================"

# 1. Clean npm artifacts
echo -e "\n${YELLOW}📦 Step 1: Cleaning npm artifacts...${NC}"
if [ -f "package-lock.json" ]; then
  rm -f package-lock.json
  echo "  ✓ Removed package-lock.json"
fi

# Remove all node_modules
find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true
echo "  ✓ Cleaned all node_modules directories"

# 2. Reinstall with pnpm
echo -e "\n${YELLOW}📦 Step 2: Installing dependencies with pnpm...${NC}"
npx pnpm@8.15.0 install --no-frozen-lockfile
echo "  ✓ Dependencies installed with pnpm"

# 3. Create missing vercel.json files
echo -e "\n${YELLOW}📝 Step 3: Creating missing vercel.json files...${NC}"

APPS_NEEDING_VERCEL_JSON=(
  "handouts"
  "integration-status"
  "inventory"
  "medication-auth"
  "platform-dashboard"
  "staff"
  "component-showcase"
)

created_count=0
for app in "${APPS_NEEDING_VERCEL_JSON[@]}"; do
  if [ ! -f "apps/$app/vercel.json" ]; then
    echo "  Creating vercel.json for $app..."
    cat > "apps/$app/vercel.json" << EOF
{
  "installCommand": "cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm -F @ganger/$app build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
EOF
    ((created_count++))
  else
    echo "  ✓ vercel.json already exists for $app"
  fi
done

echo -e "  ${GREEN}✓ Created $created_count new vercel.json files${NC}"

# 4. Check for workspace:* in packages
echo -e "\n${YELLOW}🔍 Step 4: Checking for workspace:* dependencies in packages...${NC}"
workspace_issues=$(grep -r "workspace:\*" packages/*/package.json 2>/dev/null || true)
if [ -n "$workspace_issues" ]; then
  echo -e "  ${RED}⚠️  Found workspace:* dependencies in packages:${NC}"
  echo "$workspace_issues"
  echo -e "  ${YELLOW}These may need manual fixing if pnpm doesn't handle them${NC}"
else
  echo -e "  ${GREEN}✓ No workspace:* issues found in packages${NC}"
fi

# 5. Verify pnpm-workspace.yaml exists
echo -e "\n${YELLOW}📋 Step 5: Verifying pnpm workspace configuration...${NC}"
if [ -f "pnpm-workspace.yaml" ]; then
  echo -e "  ${GREEN}✓ pnpm-workspace.yaml exists${NC}"
  cat pnpm-workspace.yaml
else
  echo -e "  ${RED}⚠️  pnpm-workspace.yaml missing! Creating...${NC}"
  cat > pnpm-workspace.yaml << EOF
packages:
  - 'apps/*'
  - 'packages/*'
EOF
  echo -e "  ${GREEN}✓ Created pnpm-workspace.yaml${NC}"
fi

# 6. Summary
echo -e "\n${BLUE}📊 Summary of Changes:${NC}"
echo "  ✓ Removed npm artifacts"
echo "  ✓ Installed dependencies with pnpm"
echo "  ✓ Created/verified vercel.json files for all apps"
echo "  ✓ Checked for workspace dependency issues"
echo "  ✓ Verified pnpm workspace configuration"

# 7. Git status
echo -e "\n${YELLOW}📝 Git Status:${NC}"
git status --short

# 8. Next steps
echo -e "\n${GREEN}✅ Fixes applied successfully!${NC}"
echo -e "\n${BLUE}Next Steps:${NC}"
echo "1. Review the changes with: git diff"
echo "2. Commit the changes: git add . && git commit -m \"fix: complete pnpm migration for Vercel deployments\""
echo "3. Push to trigger deployments: git push origin main"
echo "4. Monitor deployments in Vercel dashboard"
echo ""
echo -e "${YELLOW}⚠️  Important Reminders:${NC}"
echo "- Ensure ENABLE_EXPERIMENTAL_COREPACK=1 is set in ALL Vercel projects"
echo "- Verify environment variables are configured in each Vercel project"
echo "- Check build logs to confirm pnpm is being used"