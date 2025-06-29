#!/bin/bash
# Investigate deployment errors

echo "🔍 Investigating Deployment Errors"
echo "=================================="

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Get a sample of failed apps to check
FAILED_APPS=(
  "ganger-staff"
  "ganger-component-showcase"
  "ganger-config-dashboard"
  "ganger-batch-closeout"
)

echo "Checking build logs for failed apps..."
echo ""

for project in "${FAILED_APPS[@]}"; do
  echo "❌ $project:"
  echo "-------------------"
  
  # Get latest deployment
  DEPLOYMENT=$(curl -s "https://api.vercel.com/v6/deployments?projectId=${project}&teamId=${TEAM_ID}&limit=1" \
    -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
  
  if echo "$DEPLOYMENT" | grep -q '"deployments"'; then
    DEP_ID=$(echo "$DEPLOYMENT" | python3 -c "
import json,sys
data = json.load(sys.stdin)
if data.get('deployments'):
    print(data['deployments'][0].get('uid', ''))
" 2>/dev/null)
    
    if [ -n "$DEP_ID" ]; then
      # Get build output
      echo "Build output (checking for errors):"
      
      BUILD_OUTPUT=$(curl -s "https://api.vercel.com/v2/deployments/${DEP_ID}/events?limit=100&builds=1&logs=1" \
        -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null | \
        python3 -c "
import json,sys
try:
    data = json.load(sys.stdin)
    error_found = False
    for event in data:
        if event.get('type') in ['command', 'stdout', 'stderr']:
            text = event.get('payload', {}).get('text', '')
            if text and ('error' in text.lower() or 'failed' in text.lower() or 'cannot find' in text.lower()):
                print(text[:300])
                error_found = True
                if error_found and len(text) > 10:
                    break
except:
    print('Could not parse build output')
" 2>/dev/null)
      
      echo "$BUILD_OUTPUT" | head -10
    fi
  fi
  
  echo ""
done

echo "Common patterns:"
echo "1. Check if apps are missing pages directory or app directory"
echo "2. Check if Next.js build is failing due to missing dependencies"
echo "3. Check if TypeScript errors are blocking builds"