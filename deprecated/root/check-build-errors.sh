#!/bin/bash

export VERCEL_TOKEN=RdwA23mHSvPcm9ptReM6zxjF
export VERCEL_TEAM_ID=team_wpY7PcIsYQNnslNN39o7fWvS

echo "🔍 Checking build errors..."

# Get the latest failed deployment
deployment=$(curl -s "https://api.vercel.com/v6/deployments?teamId=$VERCEL_TEAM_ID&limit=100&state=ERROR" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | \
  python3 -c "
import json, sys
data = json.load(sys.stdin)
deployments = [d for d in data.get('deployments', []) if d.get('name', '').startswith('ganger-')]
if deployments:
    d = deployments[0]
    print(f\"{d.get('uid', '')}|{d.get('name', '')}|{d.get('url', '')}\")
")

if [ -z "$deployment" ]; then
  echo "No failed deployments found"
  exit 0
fi

IFS='|' read -r uid name url <<< "$deployment"
echo "Checking deployment: $name"
echo "ID: $uid"

# Get build logs
echo ""
echo "Build Output:"
echo "============="
curl -s "https://api.vercel.com/v2/deployments/$uid/events?teamId=$VERCEL_TEAM_ID&builds=1&logs=1" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | \
  python3 -c "
import json, sys
data = json.load(sys.stdin)
events = data if isinstance(data, list) else data.get('events', [])
for event in events:
    if event.get('type') == 'stdout':
        print(event.get('text', ''))
" | tail -50