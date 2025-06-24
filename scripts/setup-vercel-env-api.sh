#!/bin/bash

# ============================================================================
# Setup Vercel Environment Variables via API
# ============================================================================
# This script sets all environment variables for all Vercel projects using API
# Works with projects created via API (no .vercel directories needed)
# ============================================================================

set -e

# Configuration
VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Load environment variables from .env file
if [ ! -f ".env" ]; then
  echo "❌ .env file not found in root directory"
  exit 1
fi

# Check if project IDs file exists
if [ ! -f "vercel-project-ids.env" ]; then
  echo "❌ vercel-project-ids.env not found"
  echo "Run ./scripts/setup-vercel-projects-monorepo.sh first"
  exit 1
fi

echo "📋 Loading environment variables..."

# Read .env into associative array
declare -A ENV_VALUES
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  if [[ $key == \#* ]] || [ -z "$key" ]; then
    continue
  fi
  # Remove quotes
  value="${value%\"}"
  value="${value#\"}"
  ENV_VALUES["$key"]="$value"
done < .env

# Read project IDs
declare -A PROJECT_IDS
while IFS='=' read -r key value; do
  if [[ $key == VERCEL_PROJECT_ID_* ]]; then
    # Extract app name from key
    app_name=${key#VERCEL_PROJECT_ID_}
    app_name=$(echo "$app_name" | tr '_' '-' | tr '[:upper:]' '[:lower:]')
    PROJECT_IDS["$app_name"]="$value"
  fi
done < vercel-project-ids.env

# Environment variables to set for all apps
ENV_KEYS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "DATABASE_URL"
  "DIRECT_URL"
  "NEXT_PUBLIC_STAFF_URL"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "NEXTAUTH_SECRET"
  "CLOUDFLARE_API_TOKEN"
  "SECURITY_SALT"
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID"
)

echo "🔐 Setting environment variables for all Vercel projects"
echo ""

# Function to set env var via API
set_env_var() {
  local project_id=$1
  local key=$2
  local value=$3
  local target="production"
  
  # Create the environment variable
  curl -s -X POST "https://api.vercel.com/v10/projects/$project_id/env?teamId=$VERCEL_TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"key\": \"$key\",
      \"value\": \"$value\",
      \"type\": \"encrypted\",
      \"target\": [\"$target\"]
    }" > /dev/null 2>&1
}

# Process each app
for app in "${!PROJECT_IDS[@]}"; do
  PROJECT_ID="${PROJECT_IDS[$app]}"
  echo "🔧 Configuring environment for: $app (ID: $PROJECT_ID)"
  
  # Set common environment variables
  for key in "${ENV_KEYS[@]}"; do
    if [ -n "${ENV_VALUES[$key]}" ]; then
      echo "  Setting $key"
      set_env_var "$PROJECT_ID" "$key" "${ENV_VALUES[$key]}"
    fi
  done
  
  # Set NEXTAUTH_URL based on app
  case "$app" in
    "pharma-scheduling")
      echo "  Setting NEXTAUTH_URL for pharma-scheduling"
      set_env_var "$PROJECT_ID" "NEXTAUTH_URL" "https://lunch.gangerdermatology.com"
      echo "  Setting NEXT_PUBLIC_APP_URL"
      set_env_var "$PROJECT_ID" "NEXT_PUBLIC_APP_URL" "https://lunch.gangerdermatology.com"
      ;;
    "checkin-kiosk")
      echo "  Setting NEXTAUTH_URL for checkin-kiosk"
      set_env_var "$PROJECT_ID" "NEXTAUTH_URL" "https://kiosk.gangerdermatology.com"
      echo "  Setting NEXT_PUBLIC_APP_URL"
      set_env_var "$PROJECT_ID" "NEXT_PUBLIC_APP_URL" "https://kiosk.gangerdermatology.com"
      ;;
    *)
      echo "  Setting NEXTAUTH_URL for staff app"
      set_env_var "$PROJECT_ID" "NEXTAUTH_URL" "https://staff.gangerdermatology.com"
      ;;
  esac
  
  # Always set NODE_ENV
  echo "  Setting NODE_ENV"
  set_env_var "$PROJECT_ID" "NODE_ENV" "production"
  
  echo "✅ Environment configured for $app"
  echo ""
done

echo "🎉 Environment variable setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Push to main branch to trigger deployment"
echo "2. Configure custom domains in Vercel dashboard"
echo "3. Monitor deployments in GitHub Actions"