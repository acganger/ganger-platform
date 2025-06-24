#!/bin/bash

# ============================================================================
# Remove Existing Vercel Projects
# ============================================================================
# This script removes the 6 existing Vercel projects to start with a clean slate
# ============================================================================

set -e

echo "🧹 Removing existing Vercel projects..."
echo "⚠️  This will remove all existing Vercel projects from your account"
echo "Press Ctrl+C to cancel, or Enter to continue"
read

# Vercel token from environment or prompt
VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# List existing projects
echo "📋 Fetching existing Vercel projects..."
PROJECTS=$(curl -s "https://api.vercel.com/v9/projects?teamId=$VERCEL_TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | \
  jq -r '.projects[].name')

echo "Found projects:"
echo "$PROJECTS"
echo ""

# Remove each project
for project in $PROJECTS; do
  echo "🗑️  Removing project: $project"
  curl -X DELETE "https://api.vercel.com/v9/projects/$project?teamId=$VERCEL_TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN"
  echo "✅ Removed $project"
  echo ""
done

echo "🎉 All Vercel projects have been removed!"
echo "You now have a clean slate for deployment."