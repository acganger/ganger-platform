#!/bin/bash

# Script to manually trigger deployments for all apps

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# List of all apps to deploy
APPS=(
  "call-center-ops"
  "checkin-kiosk"
  "clinical-staffing"
  "compliance-training"
  "config-dashboard"
  "pharma-scheduling"
  "socials-reviews"
  "eos-l10"
  "batch-closeout"
)

echo "Triggering deployments for all apps..."
echo ""

for APP in "${APPS[@]}"; do
  echo -n "Triggering $APP... "
  
  # Trigger deployment
  RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    "https://api.vercel.com/v13/deployments?teamId=$TEAM_ID" \
    -d "{
      \"name\": \"$APP\",
      \"project\": \"$APP\",
      \"gitSource\": {
        \"type\": \"github\",
        \"repoId\": \"996544644\",
        \"ref\": \"main\"
      }
    }")
  
  if echo "$RESPONSE" | grep -q '"id"'; then
    DEPLOYMENT_ID=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
    echo "✓ (ID: $DEPLOYMENT_ID)"
  else
    echo "✗ Failed"
    echo "$RESPONSE" | head -2
  fi
done

echo ""
echo "All deployments triggered! Check Vercel dashboard for status."
echo "With pnpm configuration, builds should now succeed."