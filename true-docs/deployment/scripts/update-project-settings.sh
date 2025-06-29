#!/bin/bash

# Script to update project settings with pnpm commands

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# List of all apps that need updating
APPS=(
  "ai-receptionist"
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

echo "Updating project settings with pnpm commands..."
echo ""

for APP in "${APPS[@]}"; do
  echo -n "Updating $APP... "
  
  # Update project settings
  RESPONSE=$(curl -s -X PATCH \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    "https://api.vercel.com/v9/projects/$APP?teamId=$TEAM_ID" \
    -d "{
      \"buildCommand\": \"cd ../.. && pnpm -F @ganger/$APP build\",
      \"installCommand\": \"cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile\",
      \"outputDirectory\": \".next\",
      \"framework\": \"nextjs\"
    }")
  
  if echo "$RESPONSE" | grep -q '"id"'; then
    echo "✓"
  else
    echo "✗ Failed"
    echo "$RESPONSE" | head -2
  fi
done

echo ""
echo "Project settings updated! Now triggering new deployments..."