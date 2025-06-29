#!/bin/bash

# Update Vercel project settings via API
VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Function to update project settings
update_project() {
    local project_name=$1
    local app_name=$2
    
    echo "Updating settings for $project_name..."
    
    # Update project settings
    curl -X PATCH "https://api.vercel.com/v9/projects/$project_name?teamId=$VERCEL_TEAM_ID" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"rootDirectory\": \"apps/$app_name\",
            \"framework\": \"nextjs\",
            \"nodeVersion\": \"20.x\",
            \"installCommand\": \"cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile\",
            \"buildCommand\": \"cd ../.. && pnpm -F @ganger/$app_name build\",
            \"outputDirectory\": \".next\"
        }" \
        -s -o /dev/null -w "Status: %{http_code}\n"
}

# Update inventory project
update_project "ganger-inventory" "inventory"

echo "Done!"