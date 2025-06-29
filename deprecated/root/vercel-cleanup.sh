#!/bin/bash
# Clean up deprecated/stuck Vercel projects

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🧹 Vercel Project Cleanup & Audit${NC}"
echo "===================================="

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Expected 20 apps
declare -A EXPECTED_PROJECTS=(
  ["ganger-ai-receptionist"]="ai-receptionist"
  ["ganger-batch-closeout"]="batch-closeout"
  ["ganger-call-center-ops"]="call-center-ops"
  ["ganger-checkin-kiosk"]="checkin-kiosk"
  ["ganger-checkout-slips"]="checkout-slips"
  ["ganger-clinical-staffing"]="clinical-staffing"
  ["ganger-compliance-training"]="compliance-training"
  ["ganger-component-showcase"]="component-showcase"
  ["ganger-config-dashboard"]="config-dashboard"
  ["ganger-deployment-helper"]="deployment-helper"
  ["ganger-eos-l10"]="eos-l10"
  ["ganger-handouts"]="handouts"
  ["ganger-integration-status"]="integration-status"
  ["ganger-inventory"]="inventory"
  ["ganger-llm-demo"]="llm-demo"
  ["ganger-medication-auth"]="medication-auth"
  ["ganger-pharma-scheduling"]="pharma-scheduling"
  ["ganger-platform-dashboard"]="platform-dashboard"
  ["ganger-socials-reviews"]="socials-reviews"
  ["ganger-staff"]="staff"
)

echo "Fetching all Vercel projects..."
echo ""

# Get all projects
ALL_PROJECTS=$(curl -s "https://api.vercel.com/v9/projects?teamId=${TEAM_ID}&limit=100" \
  -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)

# Parse project names
PROJECT_NAMES=$(echo "$ALL_PROJECTS" | python3 -c "
import json,sys
data = json.load(sys.stdin)
projects = data.get('projects', [])
for p in projects:
    print(p['name'])
" 2>/dev/null || echo "")

if [ -z "$PROJECT_NAMES" ]; then
  echo -e "${RED}Failed to fetch projects${NC}"
  exit 1
fi

# Count total projects
TOTAL_COUNT=$(echo "$PROJECT_NAMES" | wc -l)
echo -e "${BLUE}Total projects found: $TOTAL_COUNT${NC}"
echo ""

# Check for expected projects
echo -e "${GREEN}✅ Expected Projects (Should have 20):${NC}"
found_count=0
missing_projects=()

for project in "${!EXPECTED_PROJECTS[@]}"; do
  if echo "$PROJECT_NAMES" | grep -q "^${project}$"; then
    echo "  ✓ $project"
    ((found_count++))
  else
    echo -e "  ${RED}✗ $project (MISSING)${NC}"
    missing_projects+=("$project")
  fi
done

echo ""
echo -e "${BLUE}Found $found_count/20 expected projects${NC}"

# Check for unexpected projects
echo ""
echo -e "${YELLOW}⚠️  Unexpected/Deprecated Projects:${NC}"
unexpected_projects=()

while IFS= read -r project; do
  if [ -n "$project" ] && [ ! -v EXPECTED_PROJECTS["$project"] ]; then
    unexpected_projects+=("$project")
    
    # Get project details
    PROJECT_INFO=$(curl -s "https://api.vercel.com/v9/projects/${project}?teamId=${TEAM_ID}" \
      -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
    
    # Get last deployment info
    LAST_DEPLOY=$(echo "$PROJECT_INFO" | python3 -c "
import json,sys
data = json.load(sys.stdin)
updated = data.get('updatedAt', 0)
if updated:
    from datetime import datetime
    dt = datetime.fromtimestamp(updated/1000)
    print(dt.strftime('%Y-%m-%d %H:%M'))
else:
    print('Never')
" 2>/dev/null || echo "Unknown")
    
    echo -e "  ${RED}✗ $project${NC} (Last: $LAST_DEPLOY)"
  fi
done <<< "$PROJECT_NAMES"

if [ ${#unexpected_projects[@]} -eq 0 ]; then
  echo "  None found - environment is clean!"
else
  echo ""
  echo -e "${YELLOW}Found ${#unexpected_projects[@]} unexpected projects${NC}"
fi

# Check for stuck deployments
echo ""
echo -e "${BLUE}🔍 Checking for stuck deployments...${NC}"

stuck_deployments=()
for project in "${!EXPECTED_PROJECTS[@]}"; do
  # Get recent deployments
  DEPLOYMENTS=$(curl -s "https://api.vercel.com/v6/deployments?projectId=${project}&teamId=${TEAM_ID}&limit=5&state=BUILDING,QUEUED,INITIALIZING" \
    -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
  
  if echo "$DEPLOYMENTS" | grep -q '"deployments"'; then
    STUCK_COUNT=$(echo "$DEPLOYMENTS" | python3 -c "
import json,sys
from datetime import datetime, timezone
data = json.load(sys.stdin)
deployments = data.get('deployments', [])
stuck = 0
now = datetime.now(timezone.utc)
for d in deployments:
    created = datetime.fromtimestamp(d.get('created', 0)/1000, timezone.utc)
    age_minutes = (now - created).total_seconds() / 60
    if age_minutes > 30:  # Stuck if building for > 30 minutes
        stuck += 1
        print(f\"  {d['id']} - {d['state']} for {int(age_minutes)} minutes\")
if stuck > 0:
    print(f\"STUCK:{project}:{stuck}\")
" 2>/dev/null || echo "")
    
    if echo "$STUCK_COUNT" | grep -q "STUCK:"; then
      project_stuck=$(echo "$STUCK_COUNT" | grep "STUCK:" | cut -d: -f2)
      stuck_deployments+=("$project_stuck")
    fi
  fi
done

if [ ${#stuck_deployments[@]} -eq 0 ]; then
  echo "  ✓ No stuck deployments found"
else
  echo -e "  ${RED}Found stuck deployments in: ${stuck_deployments[*]}${NC}"
fi

# Cleanup options
echo ""
echo -e "${BLUE}📋 Cleanup Summary:${NC}"
echo "  - Missing expected projects: ${#missing_projects[@]}"
echo "  - Unexpected projects to remove: ${#unexpected_projects[@]}"
echo "  - Projects with stuck deployments: ${#stuck_deployments[@]}"

if [ ${#unexpected_projects[@]} -gt 0 ] || [ ${#stuck_deployments[@]} -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}Would you like to clean up? This will:${NC}"
  
  if [ ${#unexpected_projects[@]} -gt 0 ]; then
    echo "  1. Delete unexpected/deprecated projects"
  fi
  
  if [ ${#stuck_deployments[@]} -gt 0 ]; then
    echo "  2. Cancel stuck deployments"
  fi
  
  echo ""
  echo -e "${RED}⚠️  WARNING: This action cannot be undone!${NC}"
  echo -n "Proceed with cleanup? (yes/no): "
  read -r response
  
  if [ "$response" = "yes" ]; then
    echo ""
    echo -e "${YELLOW}Starting cleanup...${NC}"
    
    # Delete unexpected projects
    if [ ${#unexpected_projects[@]} -gt 0 ]; then
      echo ""
      echo "Deleting unexpected projects..."
      for project in "${unexpected_projects[@]}"; do
        echo -n "  Deleting $project... "
        DELETE_RESPONSE=$(curl -X DELETE "https://api.vercel.com/v9/projects/${project}?teamId=${TEAM_ID}" \
          -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
        
        if [ $? -eq 0 ]; then
          echo -e "${GREEN}✓${NC}"
        else
          echo -e "${RED}✗${NC}"
        fi
        
        sleep 1  # Rate limiting
      done
    fi
    
    # Cancel stuck deployments
    if [ ${#stuck_deployments[@]} -gt 0 ]; then
      echo ""
      echo "Canceling stuck deployments..."
      for project in "${stuck_deployments[@]}"; do
        DEPLOYMENTS=$(curl -s "https://api.vercel.com/v6/deployments?projectId=${project}&teamId=${TEAM_ID}&limit=10&state=BUILDING,QUEUED,INITIALIZING" \
          -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
        
        DEPLOYMENT_IDS=$(echo "$DEPLOYMENTS" | python3 -c "
import json,sys
data = json.load(sys.stdin)
for d in data.get('deployments', []):
    print(d['id'])
" 2>/dev/null || echo "")
        
        while IFS= read -r dep_id; do
          if [ -n "$dep_id" ]; then
            echo -n "  Canceling $dep_id... "
            CANCEL_RESPONSE=$(curl -X PATCH "https://api.vercel.com/v13/deployments/${dep_id}/cancel?teamId=${TEAM_ID}" \
              -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
            
            if echo "$CANCEL_RESPONSE" | grep -q "CANCELED"; then
              echo -e "${GREEN}✓${NC}"
            else
              echo -e "${RED}✗${NC}"
            fi
            
            sleep 1
          fi
        done <<< "$DEPLOYMENT_IDS"
      done
    fi
    
    echo ""
    echo -e "${GREEN}✅ Cleanup complete!${NC}"
  else
    echo ""
    echo "Cleanup cancelled."
  fi
fi

# Final recommendations
echo ""
echo -e "${BLUE}📝 Recommendations:${NC}"

if [ ${#missing_projects[@]} -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}Missing projects that need to be created:${NC}"
  for project in "${missing_projects[@]}"; do
    echo "  - $project"
  done
  echo ""
  echo "Run: ./true-docs/deployment/scripts/create-remaining-projects.sh"
fi

echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Run ./check-deployment-status.sh to verify project status"
echo "2. Run ./sequential-deploy.sh to deploy all apps in order"
echo ""
echo "Your Vercel environment should now have exactly 20 projects!"