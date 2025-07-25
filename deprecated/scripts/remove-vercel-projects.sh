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

# Vercel token from environment
if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ Error: VERCEL_TOKEN not set"
  echo "Get your token from: https://vercel.com/account/tokens"
  exit 1
fi

if [ -z "$VERCEL_TEAM_ID" ]; then
  echo "❌ Error: VERCEL_TEAM_ID not set"
  echo "Find your team ID in Vercel dashboard settings"
  exit 1
fi

# List existing projects
echo "📋 Fetching existing Vercel projects..."

# Get projects and extract names using grep and sed
RESPONSE=$(curl -s "https://api.vercel.com/v9/projects?teamId=$VERCEL_TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN")

# Extract project names using grep and sed
PROJECTS=$(echo "$RESPONSE" | grep -o '"name":"[^"]*"' | sed 's/"name":"//g' | sed 's/"//g')

if [ -z "$PROJECTS" ]; then
  echo "No projects found or unable to fetch projects."
  echo "Response: $RESPONSE"
  exit 1
fi

echo "Found projects:"
echo "$PROJECTS"
echo ""

# Remove each project
for project in $PROJECTS; do
  echo "🗑️  Removing project: $project"
  curl -X DELETE "https://api.vercel.com/v9/projects/$project?teamId=$VERCEL_TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -s -w "\nHTTP Status: %{http_code}\n"
  echo "✅ Processed $project"
  echo ""
done

echo "🎉 All Vercel projects have been removed!"
echo "You now have a clean slate for deployment."