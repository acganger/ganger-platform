#!/bin/bash

# Setup environment variables for all Vercel projects
# This script reads from .env and applies to all projects

set -e

# Check if VERCEL_TOKEN is set
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ Error: VERCEL_TOKEN not set"
    echo "Please run: export VERCEL_TOKEN='your-token'"
    exit 1
fi

TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Read project IDs
source ../vercel-project-ids.env

# List of all project ID variables
PROJECT_IDS=(
    "$VERCEL_PROJECT_ID_INVENTORY"
    "$VERCEL_PROJECT_ID_HANDOUTS"
    "$VERCEL_PROJECT_ID_EOS_L10"
    "$VERCEL_PROJECT_ID_BATCH_CLOSEOUT"
    "$VERCEL_PROJECT_ID_COMPLIANCE_TRAINING"
    "$VERCEL_PROJECT_ID_CLINICAL_STAFFING"
    "$VERCEL_PROJECT_ID_CONFIG_DASHBOARD"
    "$VERCEL_PROJECT_ID_INTEGRATION_STATUS"
    "$VERCEL_PROJECT_ID_AI_RECEPTIONIST"
    "$VERCEL_PROJECT_ID_CALL_CENTER_OPS"
    "$VERCEL_PROJECT_ID_MEDICATION_AUTH"
    "$VERCEL_PROJECT_ID_PHARMA_SCHEDULING"
    "$VERCEL_PROJECT_ID_CHECKIN_KIOSK"
    "$VERCEL_PROJECT_ID_SOCIALS_REVIEWS"
    "$VERCEL_PROJECT_ID_COMPONENT_SHOWCASE"
    "$VERCEL_PROJECT_ID_PLATFORM_DASHBOARD"
    "$VERCEL_PROJECT_ID_STAFF"
)

# Read .env file from root
ENV_FILE="../../../.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env file not found at $ENV_FILE"
    exit 1
fi

echo "📦 Setting up environment variables for all projects..."

# Function to add env var to a project
add_env_var() {
    local project_id=$1
    local key=$2
    local value=$3
    
    # Skip empty values
    if [ -z "$value" ]; then
        return
    fi
    
    # Add to production, preview, and development
    for target in "production" "preview" "development"; do
        curl -s -X POST "https://api.vercel.com/v10/projects/$project_id/env?teamId=$TEAM_ID" \
            -H "Authorization: Bearer $VERCEL_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"key\": \"$key\",
                \"value\": \"$value\",
                \"type\": \"encrypted\",
                \"target\": [\"$target\"]
            }" > /dev/null
    done
}

# Process each project
for project_id in "${PROJECT_IDS[@]}"; do
    echo "Setting up env vars for project: $project_id"
    
    # Read each line from .env
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        
        # Remove quotes from value
        value="${value%\"}"
        value="${value#\"}"
        value="${value%\'}"
        value="${value#\'}"
        
        # Add the env var
        add_env_var "$project_id" "$key" "$value"
        echo "  ✓ Added $key"
        
    done < "$ENV_FILE"
    
    echo "✅ Completed project $project_id"
    echo ""
done

echo "🎉 All environment variables have been set!"
echo ""
echo "Next steps:"
echo "1. Trigger new deployments: git push origin main"
echo "2. Monitor deployment status: ./check-vercel-status.sh"
echo "3. Check build logs in Vercel dashboard if any fail"