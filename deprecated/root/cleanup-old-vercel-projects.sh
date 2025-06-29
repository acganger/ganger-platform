#!/bin/bash

# Cleanup old Vercel projects (without ganger- prefix)
# These are duplicates from before we standardized naming

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

echo "🧹 Cleaning up old Vercel projects..."
echo "These projects don't have the 'ganger-' prefix and are duplicates"
echo ""

# List of old project names to remove
OLD_PROJECTS=(
    "ai-receptionist"
    "batch-closeout"
    "call-center-ops"
    "checkin-kiosk"
    "clinical-staffing"
    "compliance-training"
    "component-showcase"
    "config-dashboard"
    "deployment-helper"
    "eos-l10"
    "integration-status"
    "pharma-scheduling"
    "socials-reviews"
    "staff"
)

for project in "${OLD_PROJECTS[@]}"; do
    echo "Removing old project: $project"
    
    curl -X DELETE "https://api.vercel.com/v9/projects/$project?teamId=$VERCEL_TEAM_ID" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -s -o /dev/null -w "  Status: %{http_code}\n"
    
    sleep 1  # Be nice to the API
done

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Remaining projects should all have 'ganger-' prefix"