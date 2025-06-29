#!/bin/bash
# Add essential environment variables to all projects

echo "🔧 Adding essential environment variables to all projects..."
echo ""

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Read environment variables from .env file
if [ -f ".env" ]; then
  source .env
else
  echo "❌ .env file not found!"
  exit 1
fi

# All 20 projects
PROJECTS=(
  "ganger-ai-receptionist"
  "ganger-batch-closeout"
  "ganger-call-center-ops"
  "ganger-checkin-kiosk"
  "ganger-checkout-slips"
  "ganger-clinical-staffing"
  "ganger-compliance-training"
  "ganger-component-showcase"
  "ganger-config-dashboard"
  "ganger-deployment-helper"
  "ganger-eos-l10"
  "ganger-handouts"
  "ganger-integration-status"
  "ganger-inventory"
  "ganger-llm-demo"
  "ganger-medication-auth"
  "ganger-pharma-scheduling"
  "ganger-platform-dashboard"
  "ganger-socials-reviews"
  "ganger-staff"
)

# Essential variables to add
declare -A ENV_VARS=(
  ["NEXT_PUBLIC_SUPABASE_URL"]="$NEXT_PUBLIC_SUPABASE_URL"
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]="$NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ["SUPABASE_SERVICE_ROLE_KEY"]="$SUPABASE_SERVICE_ROLE_KEY"
  ["DATABASE_URL"]="$DATABASE_URL"
  ["DIRECT_URL"]="$DIRECT_URL"
  ["ENABLE_EXPERIMENTAL_COREPACK"]="1"
)

# Function to add or update env var
add_env_var() {
  local project=$1
  local key=$2
  local value=$3
  
  # Try to create new env var
  RESPONSE=$(curl -s -X POST "https://api.vercel.com/v10/projects/${project}/env?teamId=${TEAM_ID}" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"key\": \"$key\",
      \"value\": \"$value\",
      \"type\": \"plain\",
      \"target\": [\"production\", \"preview\", \"development\"]
    }" 2>/dev/null)
  
  if echo "$RESPONSE" | grep -q "already exists"; then
    # Update existing
    ENV_ID=$(curl -s "https://api.vercel.com/v9/projects/${project}/env?teamId=${TEAM_ID}" \
      -H "Authorization: Bearer $VERCEL_TOKEN" | \
      python3 -c "
import json,sys
envs = json.load(sys.stdin).get('envs', [])
for e in envs:
    if e['key'] == '$key':
        print(e['id'])
        break
" 2>/dev/null || echo "")
    
    if [ -n "$ENV_ID" ]; then
      curl -s -X PATCH "https://api.vercel.com/v10/projects/${project}/env/${ENV_ID}?teamId=${TEAM_ID}" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"value\": \"$value\",
          \"target\": [\"production\", \"preview\", \"development\"]
        }" > /dev/null 2>&1
    fi
  fi
}

# Process each project
for project in "${PROJECTS[@]}"; do
  echo "Processing $project..."
  
  for key in "${!ENV_VARS[@]}"; do
    value="${ENV_VARS[$key]}"
    if [ -n "$value" ]; then
      add_env_var "$project" "$key" "$value"
      echo -n "."
    fi
  done
  
  echo " ✅"
  sleep 0.5  # Rate limiting
done

echo ""
echo "✅ Essential environment variables added to all projects!"