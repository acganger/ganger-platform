#!/bin/bash

# Script to cancel all queued deployments except specified ones
# This prevents waiting hours for unnecessary builds

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# App to keep (pass as argument)
KEEP_APP="${1:-staff}"

echo "🚫 Canceling all queued deployments except: $KEEP_APP"
echo ""

# Get all queued deployments (NOT building ones)
QUEUED_DEPLOYMENTS=$(curl -s "https://api.vercel.com/v6/deployments?teamId=$TEAM_ID&limit=100&state=QUEUED" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | \
  python3 -c "
import json, sys
data = json.load(sys.stdin)
for d in data.get('deployments', []):
    name = d['name'].replace('ganger-', '')
    if name != '$KEEP_APP' and d['name'] != '$KEEP_APP':
        print(f\"{d['uid']}|{d['name']}\")
")

if [ -z "$QUEUED_DEPLOYMENTS" ]; then
    echo "✅ No queued deployments to cancel"
    exit 0
fi

# Cancel each queued deployment
echo "$QUEUED_DEPLOYMENTS" | while IFS='|' read -r uid name; do
    echo -n "Canceling $name... "
    
    response=$(curl -X PATCH "https://api.vercel.com/v12/deployments/$uid/cancel?teamId=$TEAM_ID" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -s -w "\n%{http_code}")
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Canceled"
    else
        echo "❌ Failed (HTTP $http_code)"
    fi
done

echo ""
echo "🎯 Kept deployment for: $KEEP_APP"
echo "Now only building apps should be in the queue!"