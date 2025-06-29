#!/bin/bash

# Load environment variables from .env
source .env

echo "🔍 Setting environment variables for all Vercel projects..."

# List of all project IDs and names (from the previous output)
declare -A PROJECTS=(
  ["ganger-inventory"]="prj_AC868NXvUCZHXUyCyA9AOWRtabu8"
  ["ganger-eos-l10"]="prj_tFLTyosnL10AAsFsOaagVgIS2aoi"
  ["ganger-handouts"]="prj_4Nf2RBXcF7AHiiYbfiSyIzLun3Mf"
  ["ganger-batch-closeout"]="prj_gYrNhjrxXEPg5upvst4opPpiYVGa"
  ["ganger-compliance-training"]="prj_nyXefRjw3vRhQmJBh4jQ38AtuPTd"
  ["ganger-config-dashboard"]="prj_RfI3tADUf1OFJ2iVyE4eoXdsHapR"
  ["ganger-clinical-staffing"]="prj_UXfHT3CiTwBcaf0FAByPj7Keh7dN"
  ["ganger-pharma-scheduling"]="prj_P1mgy6cw0Eemt1OkB7oaPxkQzDXW"
  ["ganger-call-center-ops"]="prj_XfvjRr8Vc1aBiDJ8M3dT5HdiGul3"
  ["ganger-socials-reviews"]="prj_yVy0L8Kr5piNFfeU3pThMUHyNjjL"
  ["ganger-staff"]="prj_NF5ig8gWFVupD9CbTtb65osM1Cz7"
  ["ganger-checkin-kiosk"]="prj_2C6D48SfvOgIUrRAkphZ6H8Ehajk"
  ["ganger-medication-auth"]="prj_2ahWES85ADV8axKY2xJmmtCzky6n"
  ["ganger-integration-status"]="prj_p7qMv4639vUURlvAEH9VRU96DrSR"
  ["ganger-platform-dashboard"]="prj_zqa9o0iyrPsm8tURW9tiljBjuIwN"
  ["ganger-ai-receptionist"]="prj_rX2RWwl80vNGkLN6RAFgRaMtZb9z"
  ["ganger-component-showcase"]="prj_u0YlA5N4X4f46ayy4BPfdO4sFpb7"
)

# Create JSON payload with all environment variables
create_env_json() {
  local nextauth_url=$1
  cat <<EOF
[
  {"key": "NEXT_PUBLIC_SUPABASE_URL", "value": "$NEXT_PUBLIC_SUPABASE_URL", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "NEXT_PUBLIC_SUPABASE_ANON_KEY", "value": "$NEXT_PUBLIC_SUPABASE_ANON_KEY", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "SUPABASE_SERVICE_ROLE_KEY", "value": "$SUPABASE_SERVICE_ROLE_KEY", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "DATABASE_URL", "value": "$DATABASE_URL", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "DIRECT_URL", "value": "$DIRECT_URL", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "NEXTAUTH_URL", "value": "$nextauth_url", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "NEXTAUTH_SECRET", "value": "$NEXTAUTH_SECRET", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "NODE_ENV", "value": "production", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "GOOGLE_CLIENT_ID", "value": "$GOOGLE_CLIENT_ID", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "GOOGLE_CLIENT_SECRET", "value": "$GOOGLE_CLIENT_SECRET", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "GOOGLE_DOMAIN", "value": "$GOOGLE_DOMAIN", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "GOOGLE_IMPERSONATE_EMAIL", "value": "$GOOGLE_IMPERSONATE_EMAIL", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "GOOGLE_TARGET_GROUP", "value": "$GOOGLE_TARGET_GROUP", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "GOOGLE_TARGET_OU", "value": "$GOOGLE_TARGET_OU", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "GCP_PROJECT_ID", "value": "$GCP_PROJECT_ID", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "CLOUDFLARE_ZONE_ID", "value": "$CLOUDFLARE_ZONE_ID", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "CLOUDFLARE_API_TOKEN", "value": "$CLOUDFLARE_API_TOKEN", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "SECURITY_SALT", "value": "$SECURITY_SALT", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "HEALTH_CHECK_KEY", "value": "$HEALTH_CHECK_KEY", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "SESSION_LIFETIME", "value": "$SESSION_LIFETIME", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "SESSION_NAME", "value": "$SESSION_NAME", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "NEXT_PUBLIC_STAFF_URL", "value": "$NEXT_PUBLIC_STAFF_URL", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "NEXT_PUBLIC_LUNCH_URL", "value": "$NEXT_PUBLIC_LUNCH_URL", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "NEXT_PUBLIC_L10_URL", "value": "$NEXT_PUBLIC_L10_URL", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "SLACK_WEBHOOK_URL", "value": "$SLACK_WEBHOOK_URL", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "SLACK_BOT_TOKEN", "value": "$SLACK_BOT_TOKEN", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "SHEET_ID", "value": "$SHEET_ID", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "UNIFI_SITE_MANAGER_API_KEY", "value": "$UNIFI_SITE_MANAGER_API_KEY", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "UNIFI_SITE_MANAGER_URL", "value": "$UNIFI_SITE_MANAGER_URL", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "UNIFI_NETWORK_CONTROLLER", "value": "$UNIFI_NETWORK_CONTROLLER", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "UNIFI_ANN_ARBOR_API_KEY", "value": "$UNIFI_ANN_ARBOR_API_KEY", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "UNIFI_PLYMOUTH_API_KEY", "value": "$UNIFI_PLYMOUTH_API_KEY", "type": "encrypted", "target": ["production", "preview", "development"]},
  {"key": "UNIFI_WIXOM_API_KEY", "value": "$UNIFI_WIXOM_API_KEY", "type": "encrypted", "target": ["production", "preview", "development"]}
]
EOF
}

# Set env vars for a single project
set_project_env() {
  local project_name=$1
  local project_id=$2
  
  # Determine NEXTAUTH_URL based on project
  local nextauth_url="https://staff.gangerdermatology.com"
  case "$project_name" in
    "ganger-pharma-scheduling")
      nextauth_url="https://lunch.gangerdermatology.com"
      ;;
    "ganger-checkin-kiosk")
      nextauth_url="https://kiosk.gangerdermatology.com"
      ;;
  esac
  
  echo "🔧 Setting environment for: $project_name"
  
  # First, get existing env vars
  existing_vars=$(curl -s "https://api.vercel.com/v9/projects/$project_id/env?teamId=$VERCEL_TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" | \
    python3 -c "import json, sys; data = json.load(sys.stdin); print(','.join([e['key'] for e in data.get('envs', [])]))" 2>/dev/null || echo "")
  
  # Delete existing env vars to avoid conflicts
  if [ -n "$existing_vars" ]; then
    echo "  Cleaning existing environment variables..."
    IFS=',' read -ra VARS <<< "$existing_vars"
    for var in "${VARS[@]}"; do
      curl -s -X DELETE "https://api.vercel.com/v10/projects/$project_id/env/$var?teamId=$VERCEL_TEAM_ID" \
        -H "Authorization: Bearer $VERCEL_TOKEN" > /dev/null 2>&1
    done
  fi
  
  # Set all env vars in batch
  echo "  Setting new environment variables..."
  env_json=$(create_env_json "$nextauth_url")
  
  # Process each env var
  echo "$env_json" | python3 -c "
import json, sys, subprocess
envs = json.load(sys.stdin)
for env in envs:
    cmd = [
        'curl', '-s', '-X', 'POST',
        f'https://api.vercel.com/v10/projects/$project_id/env?teamId=$VERCEL_TEAM_ID',
        '-H', 'Authorization: Bearer $VERCEL_TOKEN',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps(env)
    ]
    subprocess.run(cmd, capture_output=True)
print(f'  ✅ Set {len(envs)} environment variables')
"
}

# Process all projects
for project_name in "${!PROJECTS[@]}"; do
  set_project_env "$project_name" "${PROJECTS[$project_name]}"
done

echo ""
echo "🎉 Environment variables set for all projects!"
echo ""
echo "📋 Now triggering redeployment..."

# Trigger redeployment by making a small change
echo "# Trigger rebuild $(date)" >> README.md
git add README.md
git commit -m "chore: Trigger rebuild after setting environment variables"
git push origin main

echo ""
echo "✅ Deployment triggered! Monitor at https://vercel.com/gangers-projects"