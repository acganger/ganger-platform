#!/bin/bash

# ============================================================================
# Cleanup Duplicate Vercel Projects
# ============================================================================
# This script identifies and removes duplicate Vercel projects
# ============================================================================

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

echo "🔍 Fetching all Vercel projects..."

# Get all projects and save to temp file
curl -s "https://api.vercel.com/v9/projects?teamId=$VERCEL_TEAM_ID&limit=100" \
  -H "Authorization: Bearer $VERCEL_TOKEN" > /tmp/vercel-projects.json

# Extract project names and IDs
echo "📋 Analyzing projects..."
echo ""

# Create associative arrays to track projects
declare -A project_counts
declare -A project_ids

# Parse projects
while read -r line; do
  name=$(echo "$line" | cut -d'|' -f1)
  id=$(echo "$line" | cut -d'|' -f2)
  
  # Count occurrences
  if [ -n "$name" ]; then
    ((project_counts["$name"]++))
    project_ids["$name"]+="$id "
  fi
done < <(cat /tmp/vercel-projects.json | grep -o '"name":"[^"]*","id":"[^"]*"' | sed 's/"name":"//g' | sed 's/","id":"/|/g' | sed 's/"//g')

# Show duplicates
echo "🔍 Found the following duplicate projects:"
echo ""

declare -A keep_projects
for name in "${!project_counts[@]}"; do
  count=${project_counts[$name]}
  if [ $count -gt 1 ]; then
    echo "❗ $name: $count instances"
    ids=(${project_ids[$name]})
    
    # Keep the first one
    keep_projects["${ids[0]}"]="$name"
    echo "   Keeping: ${ids[0]}"
    
    # Mark others for deletion
    for ((i=1; i<${#ids[@]}; i++)); do
      echo "   Removing: ${ids[$i]}"
    done
    echo ""
  fi
done

# Ask for confirmation
echo "⚠️  This will remove duplicate projects, keeping only one instance of each"
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Remove duplicates
echo "🗑️  Removing duplicate projects..."
for name in "${!project_counts[@]}"; do
  count=${project_counts[$name]}
  if [ $count -gt 1 ]; then
    ids=(${project_ids[$name]})
    
    # Skip the first one (keep it)
    for ((i=1; i<${#ids[@]}; i++)); do
      echo "Removing duplicate $name (${ids[$i]})..."
      curl -X DELETE "https://api.vercel.com/v9/projects/${ids[$i]}?teamId=$VERCEL_TEAM_ID" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -s -w "\nStatus: %{http_code}\n"
    done
  fi
done

echo ""
echo "✅ Cleanup complete!"