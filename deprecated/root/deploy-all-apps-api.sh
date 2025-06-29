#!/bin/bash

# Deploy all apps using Vercel API
source .env

echo "🚀 Deploying ALL apps via Vercel API..."

# Project mappings
declare -A PROJECTS=(
  ["inventory"]="prj_AC868NXvUCZHXUyCyA9AOWRtabu8"
  ["handouts"]="prj_4Nf2RBXcF7AHiiYbfiSyIzLun3Mf"
  ["eos-l10"]="prj_tFLTyosnL10AAsFsOaagVgIS2aoi"
  ["batch-closeout"]="prj_gYrNhjrxXEPg5upvst4opPpiYVGa"
  ["compliance-training"]="prj_nyXefRjw3vRhQmJBh4jQ38AtuPTd"
  ["clinical-staffing"]="prj_UXfHT3CiTwBcaf0FAByPj7Keh7dN"
  ["config-dashboard"]="prj_RfI3tADUf1OFJ2iVyE4eoXdsHapR"
  ["ai-receptionist"]="prj_rX2RWwl80vNGkLN6RAFgRaMtZb9z"
  ["call-center-ops"]="prj_XfvjRr8Vc1aBiDJ8M3dT5HdiGul3"
  ["medication-auth"]="prj_2ahWES85ADV8axKY2xJmmtCzky6n"
  ["pharma-scheduling"]="prj_P1mgy6cw0Eemt1OkB7oaPxkQzDXW"
  ["checkin-kiosk"]="prj_2C6D48SfvOgIUrRAkphZ6H8Ehajk"
  ["component-showcase"]="prj_u0YlA5N4X4f46ayy4BPfdO4sFpb7"
  ["platform-dashboard"]="prj_zqa9o0iyrPsm8tURW9tiljBjuIwN"
)

# Function to create deployment
create_deployment() {
  local app_name=$1
  local project_id=$2
  
  echo "📦 Deploying $app_name..."
  
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
  
  if echo "$response" | grep -q "dpl_"; then
    echo "✅ Deployment created for $app_name"
  else
    echo "❌ Failed: $(echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('error', {}).get('message', 'Unknown error'))" 2>/dev/null || echo "Parse error")"
  fi
}

# Deploy all apps
for app_name in "${!PROJECTS[@]}"; do
  create_deployment "$app_name" "${PROJECTS[$app_name]}"
done

echo ""
echo "🎉 All deployment requests sent!"
echo "Monitor at: https://vercel.com/gangers-projects"
echo ""
echo "Waiting 30 seconds before checking status..."
sleep 30

# Check deployment status
echo ""
echo "📊 Checking deployment status..."
curl -s "https://api.vercel.com/v6/deployments?teamId=$VERCEL_TEAM_ID&limit=20" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | \
  python3 -c "
import json, sys
from datetime import datetime
data = json.load(sys.stdin)
deployments = [d for d in data.get('deployments', []) if d.get('name', '').startswith('ganger-')]
print(f'\\nFound {len(deployments)} Ganger deployments\\n')
if deployments:
    ready = sum(1 for d in deployments if d.get('state') == 'READY')
    building = sum(1 for d in deployments if d.get('state') == 'BUILDING')
    error = sum(1 for d in deployments if d.get('state') == 'ERROR')
    print(f'✅ Ready: {ready}')
    print(f'🔨 Building: {building}')
    print(f'❌ Error: {error}')
"