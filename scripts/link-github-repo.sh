#!/bin/bash

# ============================================================================
# Link GitHub Repository to Vercel Projects
# ============================================================================
# This script links the GitHub repository to all Vercel projects
# ============================================================================

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"
GITHUB_REPO="acganger/ganger-platform"

# Check if project IDs file exists
if [ ! -f "vercel-project-ids.env" ]; then
  echo "❌ vercel-project-ids.env not found"
  exit 1
fi

echo "🔗 Linking GitHub repository to Vercel projects..."
echo ""

# Read project IDs and link to GitHub
while IFS='=' read -r key value; do
  if [[ $key == VERCEL_PROJECT_ID_* ]]; then
    # Extract app name from key
    app_name=${key#VERCEL_PROJECT_ID_}
    app_name=$(echo "$app_name" | tr '_' '-' | tr '[:upper:]' '[:lower:]')
    PROJECT_ID="$value"
    
    echo "🔗 Linking $app_name (ID: $PROJECT_ID) to GitHub..."
    
    # Link to GitHub repository
    curl -s -X POST "https://api.vercel.com/v9/projects/$PROJECT_ID/link?teamId=$VERCEL_TEAM_ID" \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"type\": \"github\",
        \"repo\": \"$GITHUB_REPO\"
      }" > /tmp/link-result.json 2>&1
    
    if grep -q "error" /tmp/link-result.json; then
      echo "❌ Failed to link $app_name"
      cat /tmp/link-result.json
    else
      echo "✅ Linked $app_name to GitHub"
    fi
    echo ""
  fi
done < vercel-project-ids.env

echo "🎉 GitHub repository linking complete!"