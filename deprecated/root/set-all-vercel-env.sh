#!/bin/bash

# Load environment variables from .env
source .env

# Get all projects starting with "ganger-"
echo "🔍 Fetching all Vercel projects..."
response=$(curl -s "https://api.vercel.com/v9/projects?teamId=$VERCEL_TEAM_ID&limit=100" \
  -H "Authorization: Bearer $VERCEL_TOKEN")

# Parse JSON without jq using python
projects=$(echo "$response" | python3 -c "
import json, sys
data = json.load(sys.stdin)
projects = data.get('projects', [])
for p in projects:
    if p.get('name', '').startswith('ganger-'):
        print(f\"{p['id']}:{p['name']}\")")

if [ -z "$projects" ]; then
  echo "❌ No projects found or error fetching projects"
  exit 1
fi

echo "📋 Found projects:"
echo "$projects" | while IFS=':' read -r id name; do
  echo "  - $name (ID: $id)"
done

# Environment variables to set for all apps
declare -A env_vars=(
  ["NEXT_PUBLIC_SUPABASE_URL"]="$NEXT_PUBLIC_SUPABASE_URL"
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]="$NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ["SUPABASE_SERVICE_ROLE_KEY"]="$SUPABASE_SERVICE_ROLE_KEY"
  ["DATABASE_URL"]="$DATABASE_URL"
  ["DIRECT_URL"]="$DIRECT_URL"
  ["NEXTAUTH_SECRET"]="$NEXTAUTH_SECRET"
  ["NODE_ENV"]="production"
  ["GOOGLE_CLIENT_ID"]="$GOOGLE_CLIENT_ID"
  ["GOOGLE_CLIENT_SECRET"]="$GOOGLE_CLIENT_SECRET"
  ["GOOGLE_DOMAIN"]="$GOOGLE_DOMAIN"
  ["GOOGLE_IMPERSONATE_EMAIL"]="$GOOGLE_IMPERSONATE_EMAIL"
  ["GOOGLE_TARGET_GROUP"]="$GOOGLE_TARGET_GROUP"
  ["GOOGLE_TARGET_OU"]="$GOOGLE_TARGET_OU"
  ["GCP_PROJECT_ID"]="$GCP_PROJECT_ID"
  ["CLOUDFLARE_ZONE_ID"]="$CLOUDFLARE_ZONE_ID"
  ["CLOUDFLARE_API_TOKEN"]="$CLOUDFLARE_API_TOKEN"
  ["SECURITY_SALT"]="$SECURITY_SALT"
  ["HEALTH_CHECK_KEY"]="$HEALTH_CHECK_KEY"
  ["SESSION_LIFETIME"]="$SESSION_LIFETIME"
  ["SESSION_NAME"]="$SESSION_NAME"
  ["NEXT_PUBLIC_STAFF_URL"]="$NEXT_PUBLIC_STAFF_URL"
  ["NEXT_PUBLIC_LUNCH_URL"]="$NEXT_PUBLIC_LUNCH_URL"
  ["NEXT_PUBLIC_L10_URL"]="$NEXT_PUBLIC_L10_URL"
  ["SLACK_WEBHOOK_URL"]="$SLACK_WEBHOOK_URL"
  ["SLACK_BOT_TOKEN"]="$SLACK_BOT_TOKEN"
  ["SHEET_ID"]="$SHEET_ID"
)

# UniFi variables
env_vars["UNIFI_SITE_MANAGER_API_KEY"]="$UNIFI_SITE_MANAGER_API_KEY"
env_vars["UNIFI_SITE_MANAGER_URL"]="$UNIFI_SITE_MANAGER_URL"
env_vars["UNIFI_NETWORK_CONTROLLER"]="$UNIFI_NETWORK_CONTROLLER"
env_vars["UNIFI_ANN_ARBOR_API_KEY"]="$UNIFI_ANN_ARBOR_API_KEY"
env_vars["UNIFI_PLYMOUTH_API_KEY"]="$UNIFI_PLYMOUTH_API_KEY"
env_vars["UNIFI_WIXOM_API_KEY"]="$UNIFI_WIXOM_API_KEY"

# Function to set environment variable
set_env_var() {
  local project_id=$1
  local key=$2
  local value=$3
  
  # Skip if value is empty
  if [ -z "$value" ]; then
    return
  fi
  
  # Delete existing env var if it exists (to update it)
  curl -s -X DELETE "https://api.vercel.com/v10/projects/$project_id/env/$key?teamId=$VERCEL_TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" > /dev/null 2>&1
  
  # Create new env var
  response=$(curl -s -X POST "https://api.vercel.com/v10/projects/$project_id/env?teamId=$VERCEL_TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"key\": \"$key\",
      \"value\": \"$value\",
      \"type\": \"encrypted\",
      \"target\": [\"production\", \"preview\", \"development\"]
    }")
  
  if echo "$response" | grep -q "error"; then
    error_msg=$(echo "$response" | python3 -c "import json, sys; data = json.load(sys.stdin); print(data.get('error', {}).get('message', 'Unknown error'))" 2>/dev/null || echo "Unknown error")
    echo "    ❌ Failed to set $key: $error_msg"
  else
    echo "    ✅ Set $key"
  fi
}

# Process each project
echo "$projects" | while IFS=':' read -r project_id project_name; do
  echo ""
  echo "🔧 Setting environment variables for: $project_name"
  
  # Set all common environment variables
  for key in "${!env_vars[@]}"; do
    set_env_var "$project_id" "$key" "${env_vars[$key]}"
  done
  
  # Set app-specific NEXTAUTH_URL
  case "$project_name" in
    "ganger-pharma-scheduling")
      echo "  📍 Setting custom NEXTAUTH_URL for pharma-scheduling"
      set_env_var "$project_id" "NEXTAUTH_URL" "https://lunch.gangerdermatology.com"
      set_env_var "$project_id" "NEXT_PUBLIC_APP_URL" "https://lunch.gangerdermatology.com"
      ;;
    "ganger-checkin-kiosk")
      echo "  📍 Setting custom NEXTAUTH_URL for checkin-kiosk"
      set_env_var "$project_id" "NEXTAUTH_URL" "https://kiosk.gangerdermatology.com"
      set_env_var "$project_id" "NEXT_PUBLIC_APP_URL" "https://kiosk.gangerdermatology.com"
      ;;
    *)
      echo "  📍 Setting default NEXTAUTH_URL for staff app"
      set_env_var "$project_id" "NEXTAUTH_URL" "https://staff.gangerdermatology.com"
      ;;
  esac
  
  echo "  ✅ Environment configured for $project_name"
done

echo ""
echo "🎉 All environment variables have been set!"
echo ""
echo "📋 Next steps:"
echo "1. Trigger new deployments: git push origin main"
echo "2. Monitor build status at https://vercel.com/gangers-projects"
echo "3. Check deployment status with: ./check-deployment-status.js"