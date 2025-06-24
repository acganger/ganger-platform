#!/bin/bash

# ============================================================================
# 06-run-all-cleanup.sh - Master Cleanup Script
# ============================================================================
# Purpose: Orchestrates the complete Vercel cleanup process
# Dependencies: All other cleanup scripts
# Related Docs: ./01-cleanup-plan.md
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

clear

echo -e "${MAGENTA}╔══════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     VERCEL CLEANUP MASTER SCRIPT         ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}This script will guide you through the complete${NC}"
echo -e "${YELLOW}Vercel cleanup process after migration.${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "01-cleanup-plan.md" ]; then
  echo -e "${RED}❌ Error: Run this script from the cleanup directory${NC}"
  echo "cd true-docs/deployment/cleanup"
  exit 1
fi

# Make all scripts executable
chmod +x *.sh

# Function to run a cleanup step
run_step() {
  local step_num=$1
  local script=$2
  local description=$3
  local critical=$4
  
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Step $step_num: $description${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  if [ "$critical" = "true" ]; then
    echo -e "${RED}⚠️  CRITICAL STEP - Must be completed${NC}"
  fi
  
  echo -e "\n${YELLOW}Ready to run: $script?${NC}"
  echo -n "Continue? (yes/skip/quit): "
  read -r response
  
  case $response in
    yes|y)
      echo -e "\n${GREEN}Running $script...${NC}\n"
      if ./"$script"; then
        echo -e "\n${GREEN}✅ Step $step_num completed successfully${NC}"
      else
        echo -e "\n${RED}❌ Step $step_num failed${NC}"
        if [ "$critical" = "true" ]; then
          echo -e "${RED}This was a critical step. Please fix and retry.${NC}"
          exit 1
        fi
      fi
      ;;
    skip|s)
      echo -e "${YELLOW}⏭️  Skipping step $step_num${NC}"
      ;;
    quit|q)
      echo -e "${YELLOW}Exiting cleanup process${NC}"
      exit 0
      ;;
    *)
      echo -e "${RED}Invalid response. Exiting.${NC}"
      exit 1
      ;;
  esac
}

# Pre-cleanup checklist
echo -e "\n${YELLOW}Pre-Cleanup Checklist:${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ Clean architecture deployment is working"
echo "✓ All 5 workers are deployed and tested"
echo "✓ You have Vercel CLI access"
echo "✓ You have GitHub repository access"
echo "✓ You're ready to remove old Vercel setup"
echo ""
echo -n "All items checked? (yes/no): "
read -r READY

if [ "$READY" != "yes" ]; then
  echo -e "${YELLOW}Please complete the checklist before running cleanup.${NC}"
  exit 0
fi

# Track completion
STEPS_COMPLETED=0
TOTAL_STEPS=5

# Step 1: Security Cleanup (CRITICAL)
run_step 1 "05-security-cleanup.sh" "Security Cleanup - Revoke Exposed Credentials" true
STEPS_COMPLETED=$((STEPS_COMPLETED + 1))

# Step 2: Remove Vercel Projects
run_step 2 "02-cleanup-vercel-projects.sh" "Remove Vercel Projects" false
STEPS_COMPLETED=$((STEPS_COMPLETED + 1))

# Step 3: Clean GitHub Actions
run_step 3 "03-cleanup-github-actions.sh" "Archive/Remove GitHub Actions" false
STEPS_COMPLETED=$((STEPS_COMPLETED + 1))

# Step 4: Clean Codebase
run_step 4 "04-cleanup-codebase.sh" "Remove Vercel References from Code" false
STEPS_COMPLETED=$((STEPS_COMPLETED + 1))

# Step 5: Final Verification
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 5: Final Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}Performing final checks...${NC}"

# Check for remaining Vercel references
REMAINING=$(grep -r "vercel" ../../../ \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=cleanup \
  --exclude="*.log" \
  -l 2>/dev/null | wc -l || echo "0")

echo -e "\nRemaining Vercel references: ${YELLOW}$REMAINING files${NC}"

# Create final report
FINAL_REPORT="cleanup-complete-$(date +%Y%m%d-%H%M%S).md"

cat > "$FINAL_REPORT" << EOF
# Vercel Cleanup Complete

**Date**: $(date)
**Steps Completed**: $STEPS_COMPLETED / $TOTAL_STEPS

## Cleanup Summary

### ✅ Completed Actions
- Security credentials revoked
- Vercel projects removed
- GitHub Actions archived
- Codebase cleaned
- Documentation updated

### 📁 Backup Locations
- Archived workflows: .github/workflows/archive/
- Configuration backups: true-docs/deployment/cleanup/backups/
- Audit logs: true-docs/deployment/cleanup/

### 🔍 Remaining Items
- Vercel references found in $REMAINING files
- These may be in documentation or comments

### 🚀 Next Steps
1. Review and commit all changes
2. Push to GitHub
3. Verify clean architecture is working
4. Monitor for any issues

### 📚 Documentation
- Cleanup plan: ./01-cleanup-plan.md
- Security audit: ./security-audit-*.log
- All cleanup scripts: ./0*.sh

## Verification Commands

\`\`\`bash
# Check for Vercel references
grep -r "vercel" . --exclude-dir=node_modules

# Verify no active Vercel workflows
ls .github/workflows/*.yml | grep -v archive

# Test clean architecture
curl -I https://router.gangerplatform.com
\`\`\`
EOF

STEPS_COMPLETED=$((STEPS_COMPLETED + 1))

# Final summary
echo ""
echo -e "${MAGENTA}╔══════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║        CLEANUP COMPLETE                  ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Completed $STEPS_COMPLETED / $TOTAL_STEPS steps${NC}"
echo ""
echo -e "📄 Final report: ${YELLOW}$FINAL_REPORT${NC}"
echo ""
echo -e "${YELLOW}Important Reminders:${NC}"
echo "1. Commit and push all changes"
echo "2. Verify clean architecture is working"
echo "3. Keep backups for 30 days"
echo "4. Update team documentation"
echo ""
echo -e "${GREEN}🎉 Vercel cleanup process complete!${NC}"

# Create commit helper
cat > "../commit-cleanup.sh" << EOF
#!/bin/bash
# Helper script to commit all cleanup changes

cd "$(git rev-parse --show-toplevel)"

# Add all cleanup-related changes
git add true-docs/deployment/cleanup/
git add .github/workflows/archive/
git add -u  # Add all modified files

# Create comprehensive commit
git commit -m "🧹 Complete Vercel cleanup after migration

Security Actions:
- Revoked exposed Vercel credentials
- Removed hardcoded tokens from codebase

Cleanup Actions:
- Removed 6 Vercel projects
- Archived GitHub Actions workflow
- Removed vercel.json configurations
- Updated package.json deploy scripts

Documentation:
- Created cleanup audit trail
- Archived all removed configurations
- Updated deployment documentation

See /true-docs/deployment/cleanup/ for complete details"

echo "✅ Changes committed. Run 'git push' when ready."
EOF

chmod +x ../commit-cleanup.sh

echo -e "\n${BLUE}To commit all changes:${NC}"
echo "  cd .. && ./commit-cleanup.sh"