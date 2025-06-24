#!/bin/bash

# ============================================================================
# 03-cleanup-github-actions.sh - Remove/Archive Vercel GitHub Actions
# ============================================================================
# Purpose: Clean up GitHub Actions workflows related to Vercel deployment
# Dependencies: git
# Related Docs: ./01-cleanup-plan.md
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧹 GitHub Actions Cleanup${NC}"
echo "================================"

# Navigate to repository root
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT"

# Step 1: Check for Vercel workflow
echo -e "\n${YELLOW}Step 1: Checking for Vercel deployment workflows...${NC}"

WORKFLOW_FILE=".github/workflows/deploy-vercel.yml"
ARCHIVE_DIR=".github/workflows/archive"

if [ -f "$WORKFLOW_FILE" ]; then
  echo -e "${GREEN}✓${NC} Found: $WORKFLOW_FILE"
  
  # Show workflow details
  echo -e "\n${BLUE}Workflow Details:${NC}"
  grep -E "^name:|VERCEL_PROJECT_ID:|branches:" "$WORKFLOW_FILE" | sed 's/^/  /'
else
  echo -e "${YELLOW}⚠️  No Vercel workflow found at $WORKFLOW_FILE${NC}"
  exit 0
fi

# Step 2: Create archive directory
echo -e "\n${YELLOW}Step 2: Creating archive directory...${NC}"

if [ ! -d "$ARCHIVE_DIR" ]; then
  mkdir -p "$ARCHIVE_DIR"
  echo -e "${GREEN}✓${NC} Created: $ARCHIVE_DIR"
else
  echo -e "${GREEN}✓${NC} Archive directory already exists"
fi

# Step 3: Archive the workflow
echo -e "\n${YELLOW}Step 3: Archiving workflow...${NC}"

ARCHIVE_NAME="deploy-vercel-archived-$(date +%Y%m%d-%H%M%S).yml"
ARCHIVE_PATH="$ARCHIVE_DIR/$ARCHIVE_NAME"

# Copy with timestamp
cp "$WORKFLOW_FILE" "$ARCHIVE_PATH"
echo -e "${GREEN}✓${NC} Archived to: $ARCHIVE_PATH"

# Add deprecation notice to archived file
cat > "$ARCHIVE_PATH.README.md" << EOF
# Archived Vercel Deployment Workflow

**Archived on**: $(date)
**Reason**: Migrated to clean architecture deployment

This workflow was used for deploying to Vercel before migrating to the clean architecture.

## Original Configuration
- Vercel Org ID: team_wpY7PcIsYQNnslNN39o7fWvS
- Vercel Project ID: prj_9PlXR5HftwXI4u4hAxVhyOjwk6y5
- Target: apps/staff

## Migration Details
See /true-docs/deployment/ for new deployment architecture.
EOF

echo -e "${GREEN}✓${NC} Created archive README"

# Step 4: Remove the active workflow
echo -e "\n${YELLOW}Step 4: Removing active workflow...${NC}"
echo -e "${RED}⚠️  This will disable automatic Vercel deployments${NC}"
echo -n "Remove $WORKFLOW_FILE? (yes/no): "
read CONFIRM

if [ "$CONFIRM" = "yes" ]; then
  rm "$WORKFLOW_FILE"
  echo -e "${GREEN}✓${NC} Removed: $WORKFLOW_FILE"
  
  # Create a placeholder to prevent accidental recreation
  cat > "$WORKFLOW_FILE.removed" << EOF
# This workflow has been removed
# Archived at: $ARCHIVE_PATH
# Date: $(date)
# See /true-docs/deployment/ for current deployment method
EOF
  
  echo -e "${GREEN}✓${NC} Created removal notice"
else
  echo -e "${YELLOW}Workflow removal cancelled${NC}"
fi

# Step 5: Check for other deployment workflows
echo -e "\n${YELLOW}Step 5: Checking for other deployment workflows...${NC}"

OTHER_WORKFLOWS=$(find .github/workflows -name "*.yml" -o -name "*.yaml" | grep -v archive || true)

if [ -n "$OTHER_WORKFLOWS" ]; then
  echo -e "\n${BLUE}Other workflows found:${NC}"
  echo "$OTHER_WORKFLOWS" | while read -r workflow; do
    # Check if workflow mentions Vercel
    if grep -qi "vercel" "$workflow" 2>/dev/null; then
      echo -e "  ${RED}✗${NC} $workflow (contains Vercel references)"
    else
      echo -e "  ${GREEN}✓${NC} $workflow"
    fi
  done
else
  echo -e "${GREEN}✓${NC} No other workflows found"
fi

# Step 6: Summary
echo -e "\n================================"
echo -e "${BLUE}📊 GitHub Actions Cleanup Summary${NC}"
echo "================================"

if [ -f "$ARCHIVE_PATH" ]; then
  echo -e "${GREEN}✓ Workflow archived${NC}: $ARCHIVE_PATH"
fi

if [ ! -f "$WORKFLOW_FILE" ]; then
  echo -e "${GREEN}✓ Active workflow removed${NC}"
else
  echo -e "${YELLOW}⚠️  Active workflow still exists${NC}"
fi

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Commit these changes to git"
echo "2. Push to GitHub to complete the cleanup"
echo "3. Verify no deployments are triggered"

# Create git commands file
cat > "github-cleanup-commands.sh" << EOF
#!/bin/bash
# Git commands to complete GitHub Actions cleanup

git add .github/workflows/archive/
git add .github/workflows/deploy-vercel.yml.removed
git rm .github/workflows/deploy-vercel.yml

git commit -m "🧹 Archive and remove Vercel deployment workflow

- Archived workflow to .github/workflows/archive/
- Removed active Vercel deployment trigger
- Migrated to clean architecture deployment

See /true-docs/deployment/ for new deployment method"

# Uncomment to push
# git push origin main
EOF

chmod +x github-cleanup-commands.sh

echo -e "\n${BLUE}To complete the cleanup, run:${NC}"
echo "  ./github-cleanup-commands.sh"