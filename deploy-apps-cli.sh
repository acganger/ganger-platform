#!/bin/bash

# Deploy all apps using Vercel CLI
source .env

echo "🚀 Deploying all apps using Vercel CLI..."
echo "Using token: ${VERCEL_TOKEN:0:10}..."

# Apps to deploy
APPS=(
  "inventory"
  "handouts"
  "eos-l10"
  "batch-closeout"
  "compliance-training"
  "clinical-staffing"
  "config-dashboard"
  "integration-status"
  "ai-receptionist"
  "call-center-ops"
  "medication-auth"
  "pharma-scheduling"
  "checkin-kiosk"
  "socials-reviews"
  "component-showcase"
  "platform-dashboard"
  "staff"
)

# Deploy each app
for app in "${APPS[@]}"; do
  echo ""
  echo "📦 Deploying $app..."
  
  cd "apps/$app" || continue
  
  # Create .vercel directory if it doesn't exist
  mkdir -p .vercel
  
  # Create project.json with the project ID
  case "$app" in
    "inventory") PROJECT_ID="prj_AC868NXvUCZHXUyCyA9AOWRtabu8" ;;
    "handouts") PROJECT_ID="prj_4Nf2RBXcF7AHiiYbfiSyIzLun3Mf" ;;
    "eos-l10") PROJECT_ID="prj_tFLTyosnL10AAsFsOaagVgIS2aoi" ;;
    "batch-closeout") PROJECT_ID="prj_gYrNhjrxXEPg5upvst4opPpiYVGa" ;;
    "compliance-training") PROJECT_ID="prj_nyXefRjw3vRhQmJBh4jQ38AtuPTd" ;;
    "clinical-staffing") PROJECT_ID="prj_UXfHT3CiTwBcaf0FAByPj7Keh7dN" ;;
    "config-dashboard") PROJECT_ID="prj_RfI3tADUf1OFJ2iVyE4eoXdsHapR" ;;
    "integration-status") PROJECT_ID="prj_p7qMv4639vUURlvAEH9VRU96DrSR" ;;
    "ai-receptionist") PROJECT_ID="prj_rX2RWwl80vNGkLN6RAFgRaMtZb9z" ;;
    "call-center-ops") PROJECT_ID="prj_XfvjRr8Vc1aBiDJ8M3dT5HdiGul3" ;;
    "medication-auth") PROJECT_ID="prj_2ahWES85ADV8axKY2xJmmtCzky6n" ;;
    "pharma-scheduling") PROJECT_ID="prj_P1mgy6cw0Eemt1OkB7oaPxkQzDXW" ;;
    "checkin-kiosk") PROJECT_ID="prj_2C6D48SfvOgIUrRAkphZ6H8Ehajk" ;;
    "socials-reviews") PROJECT_ID="prj_yVy0L8Kr5piNFfeU3pThMUHyNjjL" ;;
    "component-showcase") PROJECT_ID="prj_u0YlA5N4X4f46ayy4BPfdO4sFpb7" ;;
    "platform-dashboard") PROJECT_ID="prj_zqa9o0iyrPsm8tURW9tiljBjuIwN" ;;
    "staff") PROJECT_ID="prj_NF5ig8gWFVupD9CbTtb65osM1Cz7" ;;
  esac
  
  # Create project.json
  cat > .vercel/project.json << EOF
{
  "projectId": "$PROJECT_ID",
  "orgId": "$VERCEL_TEAM_ID"
}
EOF

  # Deploy using Vercel CLI
  echo "Deploying with project ID: $PROJECT_ID"
  vercel deploy --prod --yes --token=$VERCEL_TOKEN --scope=$VERCEL_TEAM_ID \
    --build-env NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    --build-env NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    --build-env SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
    --build-env DATABASE_URL=$DATABASE_URL \
    --build-env DIRECT_URL=$DIRECT_URL \
    --build-env NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
    --build-env NEXTAUTH_URL=https://staff.gangerdermatology.com \
    --build-env NODE_ENV=production \
    --build-env GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
    --build-env GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
    || echo "❌ Failed to deploy $app"
  
  cd ../..
done

echo ""
echo "🎉 Deployment process complete!"
echo "Check https://vercel.com/gangers-projects for deployment status"