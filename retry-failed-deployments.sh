#!/bin/bash
# Retry failed deployments

echo "🔄 Retrying Failed Deployments"
echo "=============================="

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"
REPO_ID="996544644"

# Failed apps to retry
FAILED_APPS=(
  "deployment-helper:ganger-deployment-helper"
  "staff:ganger-staff"
  "checkout-slips:ganger-checkout-slips"
  "llm-demo:ganger-llm-demo"
)

echo "Retrying 4 failed apps..."
echo ""

for app_info in "${FAILED_APPS[@]}"; do
  IFS=':' read -r app_name project_name <<< "$app_info"
  
  echo -n "Retrying $app_name... "
  
  # Trigger new deployment
  RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    "https://api.vercel.com/v13/deployments?teamId=$TEAM_ID" \
    -d "{
      \"name\": \"$project_name\",
      \"project\": \"$project_name\",
      \"gitSource\": {
        \"type\": \"github\",
        \"repoId\": \"$REPO_ID\",
        \"ref\": \"main\"
      }
    }" 2>/dev/null)
  
  if echo "$RESPONSE" | grep -q '"id"'; then
    DEP_ID=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id', 'unknown'))" 2>/dev/null || echo "error")
    echo "✅ Triggered [${DEP_ID:0:24}]"
  else
    echo "❌ Failed to trigger"
  fi
  
  sleep 1
done

echo ""
echo "✅ Retry deployments triggered!"
echo ""
echo "Monitor at: https://vercel.com/ganger"