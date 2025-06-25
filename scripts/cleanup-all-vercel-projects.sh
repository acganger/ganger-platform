#!/bin/bash

# ============================================================================
# Remove ALL Vercel Projects - Complete Cleanup
# ============================================================================
# This script removes ALL Vercel projects to start completely fresh
# ============================================================================

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

echo "🗑️  REMOVING ALL VERCEL PROJECTS"
echo "================================"
echo "This will delete ALL projects in your Vercel account!"
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Get all projects
echo "📋 Fetching all projects..."
PROJECTS=$(curl -s "https://api.vercel.com/v9/projects?teamId=$VERCEL_TEAM_ID&limit=100" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | \
  grep -o '"id":"[^"]*","name":"[^"]*"' | \
  sed 's/"id":"//g' | \
  sed 's/","name":"/ /g' | \
  sed 's/"//g')

if [ -z "$PROJECTS" ]; then
  echo "No projects found."
  exit 0
fi

echo "Found projects to remove:"
echo "$PROJECTS"
echo ""

# Remove each project
while IFS=' ' read -r id name; do
  if [ -n "$id" ]; then
    echo "🗑️  Removing $name ($id)..."
    curl -X DELETE "https://api.vercel.com/v9/projects/$id?teamId=$VERCEL_TEAM_ID" \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -s -w " - Status: %{http_code}\n"
  fi
done <<< "$PROJECTS"

echo ""
echo "✅ All projects removed!"
echo "You now have a completely clean Vercel account."