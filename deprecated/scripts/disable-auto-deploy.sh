#!/bin/bash

# Script to disable auto-deploy for all Vercel projects
# This gives us manual control over deployments via GitHub Actions

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

echo "🔧 Disabling auto-deploy for all Vercel projects..."
echo "This will prevent automatic builds when pushing to GitHub."
echo ""

# List of all apps
apps=(
  "ganger-ai-receptionist"
  "ganger-batch-closeout"
  "ganger-call-center-ops"
  "ganger-checkin-kiosk"
  "ganger-clinical-staffing"
  "ganger-compliance-training"
  "ganger-component-showcase"
  "ganger-config-dashboard"
  "ganger-deployment-helper"
  "ganger-eos-l10"
  "ganger-handouts"
  "ganger-integration-status"
  "ganger-inventory"
  "ganger-llm-demo"
  "ganger-medication-auth"
  "ganger-pharma-scheduling"
  "ganger-platform-dashboard"
  "ganger-socials-reviews"
  "ganger-staff"
)

# Counter for results
success=0
failed=0

# Update each project
for project in "${apps[@]}"; do
  echo -n "Disabling auto-deploy for $project... "
  
  # Update project settings to disable auto-deploy
  response=$(curl -X PATCH "https://api.vercel.com/v9/projects/$project?teamId=$TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "gitProviderOptions": {
        "createDeployments": "disabled"
      }
    }' \
    -s -w "\n%{http_code}")
  
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" = "200" ]; then
    echo "✅ Disabled"
    ((success++))
  else
    echo "❌ Failed (HTTP $http_code)"
    ((failed++))
  fi
done

echo ""
echo "========================================="
echo "✅ Successfully disabled: $success projects"
echo "❌ Failed: $failed projects"
echo "========================================="
echo ""
echo "Auto-deploy is now disabled. Use GitHub Actions workflow to deploy:"
echo "  1. Go to Actions tab in GitHub"
echo "  2. Select 'Smart Sequential Deployment'"
echo "  3. Click 'Run workflow'"
echo "  4. Choose deployment mode and options"