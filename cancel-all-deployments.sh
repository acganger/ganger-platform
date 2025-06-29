#!/bin/bash
# Cancel all queued/building deployments across all projects

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🛑 Canceling All Active Deployments${NC}"
echo "====================================="

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

echo "Fetching all active deployments..."
echo ""

# Get all deployments that are building, queued, or initializing
ACTIVE_DEPLOYMENTS=$(curl -s "https://api.vercel.com/v6/deployments?teamId=${TEAM_ID}&limit=100&state=BUILDING,QUEUED,INITIALIZING" \
  -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)

# Parse deployment IDs and project names
DEPLOYMENT_DATA=$(echo "$ACTIVE_DEPLOYMENTS" | python3 -c "
import json,sys
try:
    data = json.load(sys.stdin)
    deployments = data.get('deployments', [])
    print(f'Found {len(deployments)} active deployments')
    for d in deployments:
        dep_id = d.get('uid', d.get('id', 'unknown'))
        name = d.get('name', 'unknown')
        state = d.get('state', 'unknown')
        print(f'{dep_id}|{name}|{state}')
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    print('Error|parsing|deployments')
" 2>&1)

if echo "$DEPLOYMENT_DATA" | grep -q "Found 0 active deployments"; then
  echo -e "${GREEN}✓ No active deployments to cancel${NC}"
  echo ""
  echo "Environment is clean - ready for sequential deployment!"
  exit 0
fi

# Display active deployments
echo "$DEPLOYMENT_DATA" | head -1
echo ""
echo -e "${YELLOW}Active deployments to cancel:${NC}"

# Count deployments
cancel_count=0
success_count=0
failed_count=0

# Process each deployment
while IFS='|' read -r dep_id project_name state; do
  # Skip the header line
  if [[ "$dep_id" == "Found"* ]]; then
    continue
  fi
  
  if [ -n "$dep_id" ]; then
    echo -ne "  Canceling $project_name ($state) [$dep_id]... "
    ((cancel_count++))
    
    # Cancel the deployment
    CANCEL_RESPONSE=$(curl -s -X PATCH "https://api.vercel.com/v13/deployments/${dep_id}/cancel?teamId=${TEAM_ID}" \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -H "Content-Type: application/json" 2>/dev/null)
    
    # Check if cancellation was successful
    if echo "$CANCEL_RESPONSE" | grep -q '"state":"CANCELED"'; then
      echo -e "${GREEN}✓${NC}"
      ((success_count++))
    elif echo "$CANCEL_RESPONSE" | grep -q "already"; then
      echo -e "${YELLOW}Already canceled${NC}"
      ((success_count++))
    else
      echo -e "${RED}✗ Failed${NC}"
      ((failed_count++))
      # Show error if available
      ERROR=$(echo "$CANCEL_RESPONSE" | python3 -c "
import json,sys
try:
    data = json.load(sys.stdin)
    if 'error' in data:
        print(f\"    Error: {data['error'].get('message', 'Unknown error')}\")
except:
    pass
" 2>/dev/null || echo "")
      [ -n "$ERROR" ] && echo "$ERROR"
    fi
    
    # Small delay to avoid rate limiting
    sleep 0.5
  fi
done <<< "$DEPLOYMENT_DATA"

# Summary
echo ""
echo -e "${BLUE}📊 Cancellation Summary:${NC}"
echo "  Total deployments found: $cancel_count"
echo -e "  ${GREEN}Successfully canceled: $success_count${NC}"
if [ $failed_count -gt 0 ]; then
  echo -e "  ${RED}Failed to cancel: $failed_count${NC}"
fi

# Double-check no active deployments remain
echo ""
echo "Verifying all deployments are canceled..."

REMAINING=$(curl -s "https://api.vercel.com/v6/deployments?teamId=${TEAM_ID}&limit=10&state=BUILDING,QUEUED,INITIALIZING" \
  -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null | \
  python3 -c "
import json,sys
data = json.load(sys.stdin)
count = len(data.get('deployments', []))
print(count)
" 2>/dev/null || echo "0")

if [ "$REMAINING" -eq 0 ]; then
  echo -e "${GREEN}✅ All deployments canceled successfully!${NC}"
  echo ""
  echo -e "${BLUE}Environment is now clean and ready for sequential deployment.${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Run ./vercel-cleanup.sh to check for deprecated projects"
  echo "2. Run ./check-deployment-status.sh to verify project configuration"
  echo "3. Run ./sequential-deploy.sh to start sequential deployment"
else
  echo -e "${YELLOW}⚠️  Warning: $REMAINING deployments may still be active${NC}"
  echo "You may need to wait a moment and run this script again."
fi