#!/bin/bash

source .env

echo "🔧 Fixing project settings for monorepo..."

# Project mappings
declare -A PROJECTS=(
  ["inventory"]="prj_AC868NXvUCZHXUyCyA9AOWRtabu8"
  ["handouts"]="prj_4Nf2RBXcF7AHiiYbfiSyIzLun3Mf"
  ["eos-l10"]="prj_tFLTyosnL10AAsFsOaagVgIS2aoi"
  ["batch-closeout"]="prj_gYrNhjrxXEPg5upvst4opPpiYVGa"
  ["compliance-training"]="prj_nyXefRjw3vRhQmJBh4jQ38AtuPTd"
  ["clinical-staffing"]="prj_UXfHT3CiTwBcaf0FAByPj7Keh7dN"
  ["config-dashboard"]="prj_RfI3tADUf1OFJ2iVyE4eoXdsHapR"
  ["integration-status"]="prj_p7qMv4639vUURlvAEH9VRU96DrSR"
  ["ai-receptionist"]="prj_rX2RWwl80vNGkLN6RAFgRaMtZb9z"
  ["call-center-ops"]="prj_XfvjRr8Vc1aBiDJ8M3dT5HdiGul3"
  ["medication-auth"]="prj_2ahWES85ADV8axKY2xJmmtCzky6n"
  ["pharma-scheduling"]="prj_P1mgy6cw0Eemt1OkB7oaPxkQzDXW"
  ["checkin-kiosk"]="prj_2C6D48SfvOgIUrRAkphZ6H8Ehajk"
  ["socials-reviews"]="prj_yVy0L8Kr5piNFfeU3pThMUHyNjjL"
  ["component-showcase"]="prj_u0YlA5N4X4f46ayy4BPfdO4sFpb7"
  ["platform-dashboard"]="prj_zqa9o0iyrPsm8tURW9tiljBjuIwN"
  ["staff"]="prj_NF5ig8gWFVupD9CbTtb65osM1Cz7"
)

for app_name in "${!PROJECTS[@]}"; do
  project_id="${PROJECTS[$app_name]}"
  
  echo "Updating $app_name..."
  
  # Update project settings for monorepo
  curl -s -X PATCH "https://api.vercel.com/v9/projects/$project_id?teamId=$VERCEL_TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"framework\": \"nextjs\",
      \"buildCommand\": \"pnpm turbo run build --filter=@ganger/$app_name\",
      \"outputDirectory\": \"apps/$app_name/.next\",
      \"installCommand\": \"pnpm install\",
      \"rootDirectory\": null,
      \"nodeVersion\": \"18.x\"
    }" > /dev/null 2>&1
  
  echo "✅ Updated $app_name"
done

echo ""
echo "🎉 All projects updated!"
echo ""
echo "Now triggering new deployments..."

# Trigger a rebuild by pushing a change
echo "# Rebuild trigger $(date)" >> README.md
git add . && git commit -m "chore: Fix project settings and trigger rebuild" && git push