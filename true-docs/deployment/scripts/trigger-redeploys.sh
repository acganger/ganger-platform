#!/bin/bash

# Script to trigger redeploys for all Vercel projects
# This will make them pick up the new environment variables

# Vercel credentials
export VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
export VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Get the latest git commit SHA
LATEST_COMMIT=$(git rev-parse HEAD)
echo "Latest commit: $LATEST_COMMIT"

# List of all project names that need redeployment
projects=(
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
  "ganger-medication-auth"
  "ganger-pharma-scheduling"
  "ganger-platform-dashboard"
  "ganger-socials-reviews"
  "ganger-staff"
)

echo "Triggering redeploys for all projects..."
echo "======================================="

# Function to trigger a redeploy
trigger_redeploy() {
  local project_id=$1
  
  # Create a new deployment
  response=$(curl -X POST "https://api.vercel.com/v13/deployments?teamId=${VERCEL_TEAM_ID}" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"${project_id}\",
      \"project\": \"${project_id}\",
      \"target\": \"production\",
      \"gitSource\": {
        \"type\": \"github\",
        \"repo\": \"acganger/ganger-platform\",
        \"ref\": \"main\",
        \"sha\": \"${LATEST_COMMIT}\"
      }
    }" \
    -s -w "\n%{http_code}")
  
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    deployment_url=$(echo "$response" | head -n-1 | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('url', 'N/A'))")
    echo "  ✓ Deployment triggered: $deployment_url"
  else
    echo "  ✗ Failed with HTTP code: $http_code"
  fi
}

# Process each project
for project in "${projects[@]}"; do
  echo "Triggering redeploy for: $project"
  trigger_redeploy "$project"
  echo ""
done

echo "======================================="
echo "All redeploys have been triggered!"
echo ""
echo "Monitor the deployments at: https://vercel.com/team/gangerdermatology/projects"