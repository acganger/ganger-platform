#!/bin/bash

source .env

# Projects configuration
declare -A PROJECTS=(
  ["ganger-inventory"]="prj_AC868NXvUCZHXUyCyA9AOWRtabu8:inventory"
  ["ganger-eos-l10"]="prj_tFLTyosnL10AAsFsOaagVgIS2aoi:eos-l10"
  ["ganger-handouts"]="prj_4Nf2RBXcF7AHiiYbfiSyIzLun3Mf:handouts"
  ["ganger-batch-closeout"]="prj_gYrNhjrxXEPg5upvst4opPpiYVGa:batch-closeout"
  ["ganger-compliance-training"]="prj_nyXefRjw3vRhQmJBh4jQ38AtuPTd:compliance-training"
  ["ganger-config-dashboard"]="prj_RfI3tADUf1OFJ2iVyE4eoXdsHapR:config-dashboard"
  ["ganger-clinical-staffing"]="prj_UXfHT3CiTwBcaf0FAByPj7Keh7dN:clinical-staffing"
  ["ganger-pharma-scheduling"]="prj_P1mgy6cw0Eemt1OkB7oaPxkQzDXW:pharma-scheduling"
  ["ganger-call-center-ops"]="prj_XfvjRr8Vc1aBiDJ8M3dT5HdiGul3:call-center-ops"
  ["ganger-socials-reviews"]="prj_yVy0L8Kr5piNFfeU3pThMUHyNjjL:socials-reviews"
  ["ganger-staff"]="prj_NF5ig8gWFVupD9CbTtb65osM1Cz7:staff"
  ["ganger-checkin-kiosk"]="prj_2C6D48SfvOgIUrRAkphZ6H8Ehajk:checkin-kiosk"
  ["ganger-medication-auth"]="prj_2ahWES85ADV8axKY2xJmmtCzky6n:medication-auth"
  ["ganger-integration-status"]="prj_p7qMv4639vUURlvAEH9VRU96DrSR:integration-status"
  ["ganger-platform-dashboard"]="prj_zqa9o0iyrPsm8tURW9tiljBjuIwN:platform-dashboard"
  ["ganger-ai-receptionist"]="prj_rX2RWwl80vNGkLN6RAFgRaMtZb9z:ai-receptionist"
  ["ganger-component-showcase"]="prj_u0YlA5N4X4f46ayy4BPfdO4sFpb7:component-showcase"
)

echo "🔧 Updating project configurations..."

for project_name in "${!PROJECTS[@]}"; do
  IFS=':' read -r project_id app_dir <<< "${PROJECTS[$project_name]}"
  
  echo "Updating $project_name configuration..."
  
  # Update project configuration
  curl -s -X PATCH "https://api.vercel.com/v9/projects/$project_id?teamId=$VERCEL_TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"framework\": \"nextjs\",
      \"buildCommand\": \"cd ../.. && pnpm run build --filter=@ganger/$app_dir...\",
      \"installCommand\": \"cd ../.. && pnpm install\",
      \"outputDirectory\": \"apps/$app_dir/.next\",
      \"rootDirectory\": \"apps/$app_dir\"
    }" > /dev/null 2>&1
  
  echo "✅ Updated $project_name"
done

echo ""
echo "🎉 All project configurations updated!"
echo ""
echo "Triggering deployments..."
git add . && git commit -m "chore: Trigger deployments after project configuration" && git push origin main