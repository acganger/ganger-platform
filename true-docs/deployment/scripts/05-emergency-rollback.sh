#!/bin/bash

# ============================================================================
# 05-emergency-rollback.sh - Emergency Rollback Procedure
# ============================================================================
# Purpose: Rolls back all apps to their previous deployment version
# Dependencies: Vercel CLI
# Related Docs: ../04-risk-mitigation.md
# When to Use: When verification fails or critical issues found
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}🚨 EMERGENCY ROLLBACK INITIATED 🚨${NC}"
echo "This will rollback ALL deployed applications to their previous versions."
echo -n "Are you sure? (yes/no): "
read CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Rollback cancelled."
  exit 0
fi

# Load deployment configuration
VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"
VERCEL_SCOPE="${VERCEL_SCOPE:-team_wpY7PcIsYQNnslNN39o7fWvS}"

# Apps to rollback
APPS=(
  "staff"
  "inventory"
  "handouts"
  "checkin-kiosk"
  "medication-auth"
  "eos-l10"
  "compliance-training"
  "clinical-staffing"
  "socials-reviews"
  "config-dashboard"
  "integration-status"
  "ai-receptionist"
  "call-center-ops"
  "pharma-scheduling"
  "component-showcase"
  "batch-closeout"
)

FAILED_ROLLBACKS=0

# Function to rollback a single app
rollback_app() {
  local app_name=$1
  local project_name="ganger-$app_name"
  
  echo -e "\n${YELLOW}Rolling back $app_name...${NC}"
  
  # Get the latest production deployment
  DEPLOYMENTS=$(vercel ls "$project_name" \
    --token="$VERCEL_TOKEN" \
    --scope="$VERCEL_SCOPE" \
    --prod \
    --yes 2>/dev/null | grep -E "Ready|Error" | head -2)
  
  # Get the second deployment (previous one)
  PREV_DEPLOYMENT=$(echo "$DEPLOYMENTS" | sed -n '2p' | awk '{print $2}')
  
  if [ -z "$PREV_DEPLOYMENT" ]; then
    echo -e "${RED}✗${NC} No previous deployment found for $app_name"
    FAILED_ROLLBACKS=$((FAILED_ROLLBACKS + 1))
    return 1
  fi
  
  # Perform rollback
  if vercel rollback "$PREV_DEPLOYMENT" \
    --token="$VERCEL_TOKEN" \
    --scope="$VERCEL_SCOPE" \
    --yes 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Rolled back $app_name to $PREV_DEPLOYMENT"
    return 0
  else
    echo -e "${RED}✗${NC} Failed to rollback $app_name"
    FAILED_ROLLBACKS=$((FAILED_ROLLBACKS + 1))
    return 1
  fi
}

# Start rollback process
echo -e "\n${YELLOW}Starting rollback of all applications...${NC}"

for app in "${APPS[@]}"; do
  rollback_app "$app" || true
done

# Summary
echo -e "\n========================================="
echo "📊 Rollback Summary"
echo "========================================="

if [ $FAILED_ROLLBACKS -eq 0 ]; then
  echo -e "${GREEN}✅ All applications rolled back successfully!${NC}"
  
  # Run verification
  echo -e "\n${YELLOW}Running deployment verification...${NC}"
  ./scripts/deployment/verify-deployment.sh || true
else
  echo -e "${RED}❌ $FAILED_ROLLBACKS applications failed to rollback${NC}"
  echo -e "${YELLOW}⚠️  Manual intervention may be required${NC}"
fi

# Log the rollback
echo "$(date): Emergency rollback performed - $FAILED_ROLLBACKS failures" >> deployment-log.txt

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Check application functionality"
echo "2. Investigate what caused the need for rollback"
echo "3. Fix issues before attempting re-deployment"
echo "4. Update deployment documentation with lessons learned"