#!/bin/bash

# Set ENABLE_EXPERIMENTAL_COREPACK=1 for all Vercel projects
VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

echo "🔧 Setting ENABLE_EXPERIMENTAL_COREPACK=1 for all Vercel projects..."
echo ""

# Get all projects
PROJECTS=$(curl -s "https://api.vercel.com/v9/projects?teamId=$VERCEL_TEAM_ID&limit=100" \
    -H "Authorization: Bearer $VERCEL_TOKEN" | \
    python3 -c "
import json, sys
data = json.load(sys.stdin)
for p in data.get('projects', []):
    print(f\"{p.get('id')}|{p.get('name')}\")
")

if [ -z "$PROJECTS" ]; then
    echo "No projects found."
    exit 1
fi

# Set environment variable for each project
echo "$PROJECTS" | while IFS='|' read -r project_id project_name; do
    if [ ! -z "$project_id" ]; then
        echo "Setting Corepack for $project_name..."
        
        # Create or update the environment variable
        curl -X POST "https://api.vercel.com/v10/projects/$project_id/env?teamId=$VERCEL_TEAM_ID" \
            -H "Authorization: Bearer $VERCEL_TOKEN" \
            -H "Content-Type: application/json" \
            -d '{
                "key": "ENABLE_EXPERIMENTAL_COREPACK",
                "value": "1",
                "type": "plain",
                "target": ["production", "preview", "development"]
            }' \
            -s -o /dev/null -w "  Status: %{http_code}\n"
    fi
done

echo ""
echo "✅ Corepack environment variable set for all projects!"