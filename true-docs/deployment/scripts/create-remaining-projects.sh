#!/bin/bash

# Script to create remaining Vercel projects with pnpm configuration

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# List of remaining projects to create
PROJECTS=(
  "call-center-ops"
  "checkin-kiosk"
  "clinical-staffing"
  "compliance-training"
  "config-dashboard"
  "pharma-scheduling"
  "socials-reviews"
)

echo "Creating remaining Vercel projects with pnpm configuration..."

for PROJECT in "${PROJECTS[@]}"; do
  echo -n "Creating $PROJECT... "
  
  # Create the project
  RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    "https://api.vercel.com/v9/projects?teamId=$TEAM_ID" \
    -d "{
      \"name\": \"$PROJECT\",
      \"framework\": \"nextjs\",
      \"publicSource\": false,
      \"gitRepository\": {
        \"repo\": \"acganger/ganger-platform\",
        \"type\": \"github\"
      },
      \"rootDirectory\": \"apps/$PROJECT\",
      \"buildCommand\": \"cd ../.. && pnpm -F @ganger/$PROJECT build\",
      \"installCommand\": \"cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile\",
      \"outputDirectory\": \".next\"
    }")
  
  if echo "$RESPONSE" | grep -q '"id"'; then
    echo "✓"
    
    # Set ENABLE_EXPERIMENTAL_COREPACK environment variable
    echo -n "  Setting ENABLE_EXPERIMENTAL_COREPACK=1... "
    curl -s -X POST \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -H "Content-Type: application/json" \
      "https://api.vercel.com/v10/projects/$PROJECT/env?teamId=$TEAM_ID" \
      -d '{
        "key": "ENABLE_EXPERIMENTAL_COREPACK",
        "value": "1",
        "type": "plain",
        "target": ["production", "preview", "development"]
      }' > /dev/null
    
    if [ $? -eq 0 ]; then
      echo "✓"
    else
      echo "✗"
    fi
  else
    echo "✗ Failed"
    echo "$RESPONSE" | head -3
  fi
done

echo ""
echo "Complete! All projects should now be created and deploying."
echo "Check the Vercel dashboard for deployment status."