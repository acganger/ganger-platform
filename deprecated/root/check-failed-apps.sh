#!/bin/bash
# Check error details for failed apps

echo "🔍 Checking Failed App Error Details"
echo "===================================="

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Failed apps
FAILED_APPS=(
  "ganger-deployment-helper"
  "ganger-staff"
  "ganger-checkout-slips"
  "ganger-llm-demo"
)

for project in "${FAILED_APPS[@]}"; do
  echo ""
  echo "❌ $project:"
  echo "-------------------"
  
  # Get latest deployment
  RESPONSE=$(curl -s "https://api.vercel.com/v6/deployments?projectId=${project}&teamId=${TEAM_ID}&limit=1" \
    -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
  
  if echo "$RESPONSE" | grep -q '"deployments"'; then
    ERROR_INFO=$(echo "$RESPONSE" | python3 -c "
import json,sys
data = json.load(sys.stdin)
if data.get('deployments'):
    d = data['deployments'][0]
    dep_id = d.get('uid', 'unknown')
    error_msg = d.get('errorMessage', '')
    error_code = d.get('errorCode', '')
    print(f'{dep_id}|{error_code}|{error_msg}')
else:
    print('||No deployment found')
" 2>/dev/null || echo "||Parse error")
    
    IFS='|' read -r DEP_ID ERROR_CODE ERROR_MSG <<< "$ERROR_INFO"
    
    echo "Deployment ID: $DEP_ID"
    echo "Error Code: $ERROR_CODE"
    echo "Error Message: $ERROR_MSG"
    
    # Try to get build logs
    echo ""
    echo "Build output (last 20 lines):"
    BUILD_LOGS=$(curl -s "https://api.vercel.com/v2/deployments/${DEP_ID}/events?teamId=${TEAM_ID}&limit=20&types=stdout,stderr" \
      -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null | \
      python3 -c "
import json,sys
try:
    data = json.load(sys.stdin)
    for event in reversed(data):
        if event.get('type') in ['stdout', 'stderr']:
            text = event.get('payload', {}).get('text', '')
            if text and 'error' in text.lower():
                print(text[:200])
except:
    print('Could not parse logs')
" 2>/dev/null || echo "Could not fetch logs")
    
    echo "$BUILD_LOGS" | head -20
  fi
done

echo ""
echo "Common issues:"
echo "1. TypeScript errors in dev apps (checkout-slips, llm-demo)"
echo "2. Missing dependencies or build configuration"
echo "3. Staff app may have routing configuration issues"
echo "4. Deployment-helper might be missing files"