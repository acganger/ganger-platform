#!/bin/bash

# ============================================================================
# Remove ALL Vercel Projects using JSON parsing
# ============================================================================

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

echo "🗑️  REMOVING ALL VERCEL PROJECTS"
echo "================================"

# Get all projects and extract IDs using Python
echo "📋 Fetching all projects..."
PROJECT_IDS=$(curl -s "https://api.vercel.com/v9/projects?teamId=$VERCEL_TEAM_ID&limit=100" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | \
  python3 -c "
import json, sys
data = json.load(sys.stdin)
for project in data.get('projects', []):
    print(f\"{project['id']} {project['name']}\")
")

if [ -z "$PROJECT_IDS" ]; then
  echo "No projects found."
  exit 0
fi

echo "Found projects to remove:"
echo "$PROJECT_IDS"
echo ""
echo "Press Enter to remove ALL projects or Ctrl+C to cancel..."
read

# Remove each project
while IFS=' ' read -r id name; do
  if [ -n "$id" ]; then
    echo "🗑️  Removing $name ($id)..."
    curl -X DELETE "https://api.vercel.com/v9/projects/$id?teamId=$VERCEL_TEAM_ID" \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -s -w " - Status: %{http_code}\n"
  fi
done <<< "$PROJECT_IDS"

echo ""
echo "✅ All projects removed!"