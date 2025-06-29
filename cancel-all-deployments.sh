#\!/bin/bash

# Cancel all active Vercel deployments
VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

echo "🛑 Canceling all active deployments..."
echo ""

# Get all active deployments
DEPLOYMENTS=$(curl -s "https://api.vercel.com/v6/deployments?teamId=$VERCEL_TEAM_ID&limit=100" \
    -H "Authorization: Bearer $VERCEL_TOKEN"  < /dev/null |  \
    python3 -c "
import json, sys
data = json.load(sys.stdin)
for d in data.get('deployments', []):
    if d.get('state') in ['QUEUED', 'BUILDING', 'INITIALIZING']:
        print(f\"{d.get('uid')}|{d.get('name')}|{d.get('state')}\")
")

if [ -z "$DEPLOYMENTS" ]; then
    echo "No active deployments found."
else
    echo "Found active deployments to cancel:"
    echo "$DEPLOYMENTS" | while IFS='|' read -r uid name state; do
        echo "  - $name ($state)"
    done
    echo ""
    
    # Cancel each deployment
    echo "$DEPLOYMENTS" | while IFS='|' read -r uid name state; do
        echo "Canceling $name..."
        curl -X PATCH "https://api.vercel.com/v13/deployments/$uid/cancel?teamId=$VERCEL_TEAM_ID" \
            -H "Authorization: Bearer $VERCEL_TOKEN" \
            -s -o /dev/null -w "  Status: %{http_code}\n"
        sleep 0.5
    done
fi

echo ""
echo "✅ All active deployments canceled\!"
