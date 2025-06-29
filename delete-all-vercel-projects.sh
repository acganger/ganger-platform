#!/bin/bash

# Delete ALL Vercel projects for clean slate
VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

echo "🗑️  Deleting ALL Vercel projects for clean slate..."
echo ""
echo "⚠️  This will delete all projects. Press Ctrl+C to cancel, or wait 5 seconds to continue..."
sleep 5

# Get all projects
PROJECTS=$(curl -s "https://api.vercel.com/v9/projects?teamId=$VERCEL_TEAM_ID&limit=100" \
    -H "Authorization: Bearer $VERCEL_TOKEN" | \
    python3 -c "
import json, sys
data = json.load(sys.stdin)
for p in data.get('projects', []):
    print(p.get('name', ''))
")

if [ -z "$PROJECTS" ]; then
    echo "No projects found."
else
    echo "Found projects to delete:"
    echo "$PROJECTS" | while read -r project; do
        echo "  - $project"
    done
    echo ""
    
    # Delete each project
    echo "$PROJECTS" | while read -r project; do
        if [ ! -z "$project" ]; then
            echo "Deleting $project..."
            curl -X DELETE "https://api.vercel.com/v9/projects/$project?teamId=$VERCEL_TEAM_ID" \
                -H "Authorization: Bearer $VERCEL_TOKEN" \
                -s -o /dev/null -w "  Status: %{http_code}\n"
            sleep 0.5
        fi
    done
fi

echo ""
echo "✅ All projects deleted! Clean slate achieved."