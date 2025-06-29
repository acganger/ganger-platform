#!/bin/bash

# Script to set ENABLE_EXPERIMENTAL_COREPACK=1 for all Vercel projects
# This enables pnpm support in Vercel deployments

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# List of projects that need the environment variable
PROJECTS=(
  "ai-receptionist"
  "call-center-ops"
  "checkin-kiosk"
  "clinical-staffing"
  "compliance-training"
  "config-dashboard"
  "pharma-scheduling"
  "socials-reviews"
)

echo "Setting ENABLE_EXPERIMENTAL_COREPACK=1 for all projects..."

for PROJECT in "${PROJECTS[@]}"; do
  echo -n "Setting for $PROJECT... "
  
  # Set the environment variable
  curl -s -X POST \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    "https://api.vercel.com/v10/projects/$PROJECT/env?teamId=$TEAM_ID" \
    -d '{
      "key": "ENABLE_EXPERIMENTAL_COREPACK",
      "value": "1",
      "type": "plain",
      "target": ["production", "preview", "development"]
    }' > /dev/null
  
  if [ $? -eq 0 ]; then
    echo "✓"
  else
    echo "✗ Failed"
  fi
done

echo "Complete! All projects should now have ENABLE_EXPERIMENTAL_COREPACK=1 set."
echo ""
echo "Next steps:"
echo "1. Monitor deployments in Vercel dashboard"
echo "2. Check build logs for successful pnpm installation"
echo "3. If builds succeed, apps will be available at their Vercel URLs"