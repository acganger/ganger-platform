#!/bin/bash

# Script to update Vercel project settings with proper ignore commands
# This fixes the issue where ignoreCommand in vercel.json is not supported

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

echo "🔧 Updating Vercel project ignore commands via API..."

# List of all apps with their package names
declare -A apps=(
  ["ganger-ai-receptionist"]="@ganger/ai-receptionist"
  ["ganger-batch-closeout"]="@ganger/batch-closeout"
  ["ganger-call-center-ops"]="@ganger/call-center-ops"
  ["ganger-checkin-kiosk"]="@ganger/checkin-kiosk"
  ["ganger-clinical-staffing"]="@ganger/clinical-staffing"
  ["ganger-compliance-training"]="@ganger/compliance-training"
  ["ganger-component-showcase"]="@ganger/component-showcase"
  ["ganger-config-dashboard"]="@ganger/config-dashboard"
  ["ganger-deployment-helper"]="@ganger/deployment-helper"
  ["ganger-eos-l10"]="@ganger/eos-l10"
  ["ganger-handouts"]="@ganger/handouts"
  ["ganger-integration-status"]="@ganger/integration-status"
  ["ganger-inventory"]="@ganger/inventory"
  ["ganger-llm-demo"]="@ganger/llm-demo"
  ["ganger-medication-auth"]="@ganger/medication-auth"
  ["ganger-pharma-scheduling"]="@ganger/pharma-scheduling"
  ["ganger-platform-dashboard"]="@ganger/platform-dashboard"
  ["ganger-socials-reviews"]="@ganger/socials-reviews"
  ["ganger-staff"]="@ganger/staff"
)

# Update each project
for project in "${!apps[@]}"; do
  package="${apps[$project]}"
  echo "Updating $project with turbo-ignore for $package..."
  
  # Update project settings
  curl -X PATCH "https://api.vercel.com/v9/projects/$project?teamId=$TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "commandForIgnoringBuildStep": "cd ../.. && npx turbo-ignore '"$package"'"
    }' \
    -s -o /dev/null
  
  if [ $? -eq 0 ]; then
    echo "✅ Updated $project"
  else
    echo "❌ Failed to update $project"
  fi
done

echo ""
echo "✅ Completed updating all project ignore commands!"
echo ""
echo "Note: The ignore command is now properly set at the project level."
echo "Future pushes should only trigger builds for changed apps."