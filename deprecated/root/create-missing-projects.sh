#!/bin/bash
# Create the 3 missing Vercel projects

echo "🔨 Creating missing Vercel projects..."
echo ""

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"
REPO_ID="996544644"

# Missing projects
MISSING_PROJECTS=(
  "ganger-checkout-slips"
  "ganger-deployment-helper"
  "ganger-llm-demo"
)

for project_name in "${MISSING_PROJECTS[@]}"; do
  echo -n "Creating $project_name... "
  
  # Create project
  CREATE_RESPONSE=$(curl -s -X POST "https://api.vercel.com/v9/projects?teamId=${TEAM_ID}" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$project_name\",
      \"framework\": \"nextjs\",
      \"publicSource\": false,
      \"gitRepository\": {
        \"type\": \"github\",
        \"repo\": \"acganger/ganger-platform\"
      },
      \"environmentVariables\": [
        {
          \"key\": \"ENABLE_EXPERIMENTAL_COREPACK\",
          \"value\": \"1\",
          \"type\": \"plain\",
          \"target\": [\"production\", \"preview\", \"development\"]
        }
      ]
    }" 2>/dev/null)
  
  if echo "$CREATE_RESPONSE" | grep -q '"id"'; then
    echo "✅ Created"
    
    # Set root directory based on project name
    if [ "$project_name" = "ganger-checkout-slips" ]; then
      ROOT_DIR="apps/checkout-slips"
    elif [ "$project_name" = "ganger-deployment-helper" ]; then
      ROOT_DIR="apps/deployment-helper"
    elif [ "$project_name" = "ganger-llm-demo" ]; then
      ROOT_DIR="apps/llm-demo"
    fi
    
    # Update project settings
    echo -n "  Setting root directory to $ROOT_DIR... "
    UPDATE_RESPONSE=$(curl -s -X PATCH "https://api.vercel.com/v9/projects/$project_name?teamId=${TEAM_ID}" \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"rootDirectory\": \"$ROOT_DIR\",
        \"buildCommand\": \"cd ../.. && pnpm -F @${project_name#ganger-} build\",
        \"installCommand\": \"cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile\",
        \"outputDirectory\": \".next\"
      }" 2>/dev/null)
    
    if echo "$UPDATE_RESPONSE" | grep -q '"id"'; then
      echo "✅"
    else
      echo "❌ Failed to update settings"
    fi
    
  else
    echo "❌ Failed"
    ERROR=$(echo "$CREATE_RESPONSE" | python3 -c "
import json,sys
try:
    data = json.load(sys.stdin)
    print(data.get('error', {}).get('message', 'Unknown error'))
except:
    print('Parse error')
" 2>/dev/null)
    echo "  Error: $ERROR"
  fi
  
  sleep 1  # Rate limiting
done

echo ""
echo "✅ Done! All 20 projects should now exist in Vercel."