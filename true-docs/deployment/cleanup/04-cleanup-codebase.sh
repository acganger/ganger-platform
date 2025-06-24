#!/bin/bash

# ============================================================================
# 04-cleanup-codebase.sh - Remove Vercel References from Code
# ============================================================================
# Purpose: Clean up Vercel-related configurations and scripts from codebase
# Dependencies: jq, sed
# Related Docs: ./01-cleanup-plan.md
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧹 Codebase Cleanup${NC}"
echo "================================"

# Navigate to repository root
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT"

# Create backup directory
BACKUP_DIR="true-docs/deployment/cleanup/backups"
mkdir -p "$BACKUP_DIR"

# Step 1: Remove vercel.json files
echo -e "\n${YELLOW}Step 1: Removing vercel.json files...${NC}"

VERCEL_CONFIGS=$(find . -name "vercel.json" -not -path "./node_modules/*" -not -path "./.git/*" || true)

if [ -n "$VERCEL_CONFIGS" ]; then
  echo "$VERCEL_CONFIGS" | while read -r config; do
    echo -e "Found: ${YELLOW}$config${NC}"
    
    # Backup before removal
    BACKUP_NAME=$(echo "$config" | sed 's/\//_/g')
    cp "$config" "$BACKUP_DIR/$BACKUP_NAME.backup"
    echo -e "  ${GREEN}✓${NC} Backed up to: $BACKUP_DIR/$BACKUP_NAME.backup"
    
    # Remove file
    rm "$config"
    echo -e "  ${GREEN}✓${NC} Removed: $config"
  done
else
  echo -e "${GREEN}✓${NC} No vercel.json files found"
fi

# Step 2: Update package.json deploy scripts
echo -e "\n${YELLOW}Step 2: Updating package.json deploy scripts...${NC}"

# Find all package.json files with .vercel references
PACKAGE_FILES=$(find apps -name "package.json" -not -path "*/node_modules/*" || true)

UPDATED_COUNT=0
for pkg in $PACKAGE_FILES; do
  if grep -q "\.vercel/output/static" "$pkg" 2>/dev/null; then
    echo -e "\nUpdating: ${YELLOW}$pkg${NC}"
    
    # Backup
    BACKUP_NAME=$(echo "$pkg" | sed 's/\//_/g')
    cp "$pkg" "$BACKUP_DIR/$BACKUP_NAME.backup"
    
    # Remove deploy script that references .vercel
    jq 'del(.scripts.deploy)' "$pkg" > "$pkg.tmp" && mv "$pkg.tmp" "$pkg"
    
    echo -e "  ${GREEN}✓${NC} Removed .vercel deploy script"
    UPDATED_COUNT=$((UPDATED_COUNT + 1))
  fi
done

echo -e "\n${GREEN}✓${NC} Updated $UPDATED_COUNT package.json files"

# Step 3: Clean up .gitignore entries
echo -e "\n${YELLOW}Step 3: Cleaning .gitignore files...${NC}"

GITIGNORE_FILES=$(find . -name ".gitignore" -not -path "./node_modules/*" -not -path "./.git/*" || true)

for gitignore in $GITIGNORE_FILES; do
  if grep -q "\.vercel" "$gitignore" 2>/dev/null; then
    echo -e "Updating: ${YELLOW}$gitignore${NC}"
    
    # Keep .vercel in gitignore (it's still good practice)
    echo -e "  ${BLUE}ℹ${NC} Keeping .vercel entry (good practice)"
  fi
done

# Step 4: Update deployment scripts
echo -e "\n${YELLOW}Step 4: Updating deployment scripts...${NC}"

# Update the deployment script to remove Vercel references
DEPLOY_SCRIPT="true-docs/deployment/scripts/01-deploy-all-apps.sh"

if [ -f "$DEPLOY_SCRIPT" ]; then
  echo -e "${YELLOW}⚠️  Note: $DEPLOY_SCRIPT contains Vercel references${NC}"
  echo "  This script is part of the Vercel deployment strategy"
  echo "  It should be archived, not modified"
fi

# Step 5: Create comprehensive cleanup report
echo -e "\n${YELLOW}Step 5: Creating cleanup report...${NC}"

REPORT_FILE="$BACKUP_DIR/cleanup-report-$(date +%Y%m%d-%H%M%S).md"

cat > "$REPORT_FILE" << EOF
# Codebase Cleanup Report

**Date**: $(date)
**Performed by**: Automated cleanup script

## Changes Made

### 1. Removed Files
EOF

if [ -n "$VERCEL_CONFIGS" ]; then
  echo "$VERCEL_CONFIGS" | while read -r config; do
    echo "- $config" >> "$REPORT_FILE"
  done
else
  echo "- No vercel.json files found" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

### 2. Updated package.json Files
- Removed .vercel/output/static deploy scripts from $UPDATED_COUNT files

### 3. Backup Location
All removed/modified files are backed up in: $BACKUP_DIR

### 4. Remaining References
The following files still contain Vercel references and may need manual review:
EOF

# Find remaining Vercel references
echo -e "\n${YELLOW}Step 6: Finding remaining Vercel references...${NC}"

REMAINING=$(grep -r "vercel" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.next \
  --exclude-dir=dist \
  --exclude-dir=build \
  --exclude="*.log" \
  --exclude="*.lock" \
  -l 2>/dev/null | grep -v "$BACKUP_DIR" || true)

if [ -n "$REMAINING" ]; then
  echo "$REMAINING" | while read -r file; do
    echo "- $file" >> "$REPORT_FILE"
    echo -e "  ${YELLOW}⚠️${NC} $file"
  done
else
  echo "- No remaining references found" >> "$REPORT_FILE"
fi

echo -e "\n${GREEN}✓${NC} Cleanup report saved to: $REPORT_FILE"

# Summary
echo -e "\n================================"
echo -e "${BLUE}📊 Codebase Cleanup Summary${NC}"
echo "================================"

echo -e "${GREEN}✓ Removed vercel.json files${NC}"
echo -e "${GREEN}✓ Updated package.json deploy scripts${NC}"
echo -e "${GREEN}✓ Created backups of all changes${NC}"
echo -e "${GREEN}✓ Generated cleanup report${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Review the cleanup report: $REPORT_FILE"
echo "2. Check remaining Vercel references"
echo "3. Test that builds still work"
echo "4. Commit the changes"

# Create git commands
cat > "codebase-cleanup-commands.sh" << EOF
#!/bin/bash
# Git commands to complete codebase cleanup

# Add all changes
git add -A

# Commit
git commit -m "🧹 Remove Vercel configurations from codebase

- Removed vercel.json files
- Cleaned up package.json deploy scripts
- Created backups of all removed configurations

Migration to clean architecture complete.
See /true-docs/deployment/cleanup/ for details"

# Show what changed
git diff --stat HEAD~1
EOF

chmod +x codebase-cleanup-commands.sh

echo -e "\n${BLUE}To commit the cleanup, run:${NC}"
echo "  ./codebase-cleanup-commands.sh"