#!/bin/bash

# Deploy apps using Vercel API
source .env

echo "🚀 Deploying apps via Vercel API..."

# Function to create deployment
create_deployment() {
  local project_id=$1
  local app_name=$2
  
  echo "📦 Creating deployment for $app_name..."
  
  response=$(curl -s -X POST "https://api.vercel.com/v13/deployments?teamId=$VERCEL_TEAM_ID&forceNew=1" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"ganger-$app_name\",
      \"project\": \"$project_id\",
      \"target\": \"production\",
      \"gitSource\": {
        \"type\": \"github\",
        \"ref\": \"main\",
        \"repoId\": \"996544644\"
      }
    }")
  
  deployment_id=$(echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('id', ''))" 2>/dev/null || echo "")
  
  if [ -n "$deployment_id" ]; then
    echo "✅ Created deployment: $deployment_id"
    echo "   URL: $(echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('url', ''))" 2>/dev/null || echo "")"
  else
    echo "❌ Failed to create deployment"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
  fi
  echo ""
}

# Deploy key apps first
create_deployment "prj_p7qMv4639vUURlvAEH9VRU96DrSR" "integration-status"
create_deployment "prj_yVy0L8Kr5piNFfeU3pThMUHyNjjL" "socials-reviews"
create_deployment "prj_NF5ig8gWFVupD9CbTtb65osM1Cz7" "staff"

echo "🎉 Deployment requests sent!"
echo "Monitor at: https://vercel.com/gangers-projects"