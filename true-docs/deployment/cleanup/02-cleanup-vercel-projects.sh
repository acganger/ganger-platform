#!/bin/bash

# ============================================================================
# 02-cleanup-vercel-projects.sh - Remove Vercel Projects
# ============================================================================
# Purpose: Safely remove all Vercel projects after migration
# Dependencies: Vercel CLI, jq
# Related Docs: ./01-cleanup-plan.md
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"
VERCEL_SCOPE="${VERCEL_SCOPE:-team_wpY7PcIsYQNnslNN39o7fWvS}"

# Expected projects to clean up
EXPECTED_PROJECTS=(
  "ganger-staff"
  "ganger-inventory"
  "ganger-handouts"
  "ganger-checkin-kiosk"
  "ganger-medication-auth"
  "ganger-eos-l10"
)

echo -e "${BLUE}🧹 Vercel Project Cleanup${NC}"
echo "================================"

# Step 1: List all Vercel projects
echo -e "\n${YELLOW}Step 1: Listing all Vercel projects...${NC}"

# Create audit log
AUDIT_LOG="vercel-cleanup-audit-$(date +%Y%m%d-%H%M%S).log"
echo "Vercel Project Cleanup Audit - $(date)" > "$AUDIT_LOG"
echo "======================================" >> "$AUDIT_LOG"

# Get list of projects
echo "Fetching projects from Vercel..."
PROJECTS_JSON=$(vercel ls --token="$VERCEL_TOKEN" --scope="$VERCEL_SCOPE" --json 2>/dev/null || echo '{"projects":[]}')

# Parse project names
PROJECTS=$(echo "$PROJECTS_JSON" | jq -r '.projects[].name' 2>/dev/null || echo "")

if [ -z "$PROJECTS" ]; then
  echo -e "${YELLOW}⚠️  No projects found or unable to fetch projects${NC}"
  echo "No projects found" >> "$AUDIT_LOG"
  exit 0
fi

echo -e "\n${BLUE}Found the following projects:${NC}"
echo "$PROJECTS" | while read -r project; do
  echo "  - $project"
  echo "Found: $project" >> "$AUDIT_LOG"
done

# Step 2: Identify Ganger projects
echo -e "\n${YELLOW}Step 2: Identifying Ganger projects to remove...${NC}"

PROJECTS_TO_REMOVE=()
while IFS= read -r project; do
  if [[ " ${EXPECTED_PROJECTS[@]} " =~ " ${project} " ]] || [[ "$project" =~ ^ganger- ]]; then
    PROJECTS_TO_REMOVE+=("$project")
    echo -e "  ${RED}✗${NC} Will remove: $project"
    echo "Marked for removal: $project" >> "$AUDIT_LOG"
  else
    echo -e "  ${GREEN}✓${NC} Keeping: $project"
    echo "Keeping: $project" >> "$AUDIT_LOG"
  fi
done <<< "$PROJECTS"

# Step 3: Confirm removal
if [ ${#PROJECTS_TO_REMOVE[@]} -eq 0 ]; then
  echo -e "\n${GREEN}✅ No Ganger projects found to remove${NC}"
  echo "No projects to remove" >> "$AUDIT_LOG"
  exit 0
fi

echo -e "\n${RED}⚠️  WARNING: This will remove ${#PROJECTS_TO_REMOVE[@]} Vercel projects:${NC}"
for project in "${PROJECTS_TO_REMOVE[@]}"; do
  echo "  - $project"
done

echo -e "\n${YELLOW}This action cannot be undone!${NC}"
echo -n "Type 'DELETE' to confirm: "
read CONFIRM

if [ "$CONFIRM" != "DELETE" ]; then
  echo -e "${YELLOW}Cleanup cancelled${NC}"
  echo "Cleanup cancelled by user" >> "$AUDIT_LOG"
  exit 0
fi

# Step 4: Remove projects
echo -e "\n${YELLOW}Step 4: Removing projects...${NC}"

REMOVED_COUNT=0
FAILED_COUNT=0

for project in "${PROJECTS_TO_REMOVE[@]}"; do
  echo -n "Removing $project... "
  
  # Use Vercel CLI to remove project
  if vercel rm "$project" --yes --token="$VERCEL_TOKEN" --scope="$VERCEL_SCOPE" 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
    echo "Successfully removed: $project" >> "$AUDIT_LOG"
    REMOVED_COUNT=$((REMOVED_COUNT + 1))
  else
    echo -e "${RED}✗ Failed${NC}"
    echo "Failed to remove: $project" >> "$AUDIT_LOG"
    FAILED_COUNT=$((FAILED_COUNT + 1))
  fi
done

# Step 5: Summary
echo -e "\n================================"
echo -e "${BLUE}📊 Cleanup Summary${NC}"
echo "================================"
echo -e "${GREEN}Removed: $REMOVED_COUNT projects${NC}"
if [ $FAILED_COUNT -gt 0 ]; then
  echo -e "${RED}Failed: $FAILED_COUNT projects${NC}"
fi

echo -e "\nAudit log saved to: ${YELLOW}$AUDIT_LOG${NC}"

# Final summary in audit log
echo "" >> "$AUDIT_LOG"
echo "Summary:" >> "$AUDIT_LOG"
echo "Removed: $REMOVED_COUNT projects" >> "$AUDIT_LOG"
echo "Failed: $FAILED_COUNT projects" >> "$AUDIT_LOG"
echo "Completed at: $(date)" >> "$AUDIT_LOG"

if [ $FAILED_COUNT -gt 0 ]; then
  echo -e "\n${YELLOW}⚠️  Some projects failed to remove. Check the audit log for details.${NC}"
  exit 1
else
  echo -e "\n${GREEN}✅ All Vercel projects successfully removed!${NC}"
fi