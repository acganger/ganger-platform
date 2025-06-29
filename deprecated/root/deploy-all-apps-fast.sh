#!/bin/bash
# Fast deployment of all 20 apps

echo "🚀 Fast Deployment of All 20 Apps"
echo "================================="

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"
REPO_ID="996544644"

# Deployment order - deployment-helper first
APPS=(
  "deployment-helper:ganger-deployment-helper"
  "staff:ganger-staff"
  "inventory:ganger-inventory"
  "handouts:ganger-handouts"
  "medication-auth:ganger-medication-auth"
  "platform-dashboard:ganger-platform-dashboard"
  "component-showcase:ganger-component-showcase"
  "config-dashboard:ganger-config-dashboard"
  "compliance-training:ganger-compliance-training"
  "clinical-staffing:ganger-clinical-staffing"
  "integration-status:ganger-integration-status"
  "eos-l10:ganger-eos-l10"
  "batch-closeout:ganger-batch-closeout"
  "pharma-scheduling:ganger-pharma-scheduling"
  "socials-reviews:ganger-socials-reviews"
  "ai-receptionist:ganger-ai-receptionist"
  "call-center-ops:ganger-call-center-ops"
  "checkin-kiosk:ganger-checkin-kiosk"
  "checkout-slips:ganger-checkout-slips"
  "llm-demo:ganger-llm-demo"
)

echo "Starting deployments..."
echo ""

# Track deployment IDs
declare -A deployment_ids

# Trigger all deployments
for app_info in "${APPS[@]}"; do
  IFS=':' read -r app_name project_name <<< "$app_info"
  
  echo -n "Deploying $app_name... "
  
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
    deployment_ids[$app_name]=$DEP_ID
    echo "✅ [${DEP_ID:0:24}]"
  else
    ERROR=$(echo "$RESPONSE" | python3 -c "
import json,sys
try:
    data = json.load(sys.stdin)
    print(data.get('error', {}).get('message', 'Unknown error')[:50])
except:
    print('Parse error')
" 2>/dev/null || echo "Unknown")
    echo "❌ Error: $ERROR"
  fi
  
  # Small delay between deployments
  sleep 2
done

echo ""
echo "✅ All deployments triggered!"
echo ""
echo "Deployment IDs:"
for app in "${!deployment_ids[@]}"; do
  echo "  $app: ${deployment_ids[$app]}"
done

echo ""
echo "📊 Monitor at: https://vercel.com/ganger"
echo ""

# Save deployment results
cat > deployment-results-fast.md << EOF
# Fast Deployment Results - $(date)

## Deployment IDs

| App | Deployment ID | Status |
|-----|---------------|--------|
EOF

for app_info in "${APPS[@]}"; do
  IFS=':' read -r app_name project_name <<< "$app_info"
  if [ -n "${deployment_ids[$app_name]}" ]; then
    echo "| $app_name | ${deployment_ids[$app_name]} | Triggered |" >> deployment-results-fast.md
  else
    echo "| $app_name | - | Failed to trigger |" >> deployment-results-fast.md
  fi
done

echo "" >> deployment-results-fast.md
echo "Monitor deployments at: https://vercel.com/ganger" >> deployment-results-fast.md

echo "Results saved to: deployment-results-fast.md"