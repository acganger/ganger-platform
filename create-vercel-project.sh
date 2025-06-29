#!/bin/bash

# Create Vercel project with proper settings
VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

PROJECT_NAME="ganger-inventory"
APP_NAME="inventory"

echo "Creating Vercel project: $PROJECT_NAME"

# Create the project
curl -X POST "https://api.vercel.com/v9/projects?teamId=$VERCEL_TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"$PROJECT_NAME\",
        \"framework\": \"nextjs\",
        \"publicSource\": false,
        \"rootDirectory\": \"apps/$APP_NAME\",
        \"installCommand\": \"cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile\",
        \"buildCommand\": \"cd ../.. && pnpm -F @ganger/$APP_NAME build\",
        \"outputDirectory\": \".next\",
        \"gitRepository\": {
            \"repo\": \"acganger/ganger-platform\",
            \"type\": \"github\"
        }
    }" \
    -w "\nStatus: %{http_code}\n"

echo ""
echo "Setting environment variables..."

# Set ENABLE_EXPERIMENTAL_COREPACK
curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_NAME/env?teamId=$VERCEL_TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "key": "ENABLE_EXPERIMENTAL_COREPACK",
        "value": "1",
        "type": "plain",
        "target": ["production", "preview", "development"]
    }' \
    -s -o /dev/null -w "Corepack: %{http_code}\n"

echo "Done!"