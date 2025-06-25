#!/bin/bash

# Sync all environment variables from .env to Vercel projects
# This ensures all projects have the complete set of environment variables

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Syncing Environment Variables to Vercel${NC}"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# Vercel configuration
VERCEL_TOKEN="${VERCEL_TOKEN:-WbDEXgkrhO85oc6mz0aAMQQc}"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# List of all projects
PROJECTS=(
    "ganger-inventory"
    "ganger-handouts"
    "ganger-eos-l10"
    "ganger-batch-closeout"
    "ganger-compliance-training"
    "ganger-clinical-staffing"
    "ganger-config-dashboard"
    "ganger-integration-status"
    "ganger-ai-receptionist"
    "ganger-call-center-ops"
    "ganger-medication-auth"
    "ganger-pharma-scheduling"
    "ganger-checkin-kiosk"
    "ganger-socials-reviews"
    "ganger-component-showcase"
    "ganger-platform-dashboard"
    "ganger-staff"
)

# Function to add env var to a project
add_env_var() {
    local project=$1
    local key=$2
    local value=$3
    
    # Add to both production and preview environments
    for env_type in "production" "preview" "development"; do
        curl -s -X POST "https://api.vercel.com/v10/projects/${project}/env?teamId=${VERCEL_TEAM_ID}" \
            -H "Authorization: Bearer ${VERCEL_TOKEN}" \
            -H "Content-Type: application/json" \
            -d "{
                \"key\": \"${key}\",
                \"value\": \"${value}\",
                \"type\": \"encrypted\",
                \"target\": [\"${env_type}\"]
            }" > /dev/null 2>&1 || true
    done
}

# Read all env vars from .env file
echo -e "${GREEN}📖 Reading environment variables from .env...${NC}"
declare -A env_vars
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ ! "$key" =~ ^[[:space:]]*# ]] && [[ -n "$key" ]]; then
        # Remove quotes from value if present
        value="${value%\"}"
        value="${value#\"}"
        value="${value%\'}"
        value="${value#\'}"
        env_vars["$key"]="$value"
    fi
done < .env

echo -e "${GREEN}✅ Found ${#env_vars[@]} environment variables${NC}"
echo ""

# Process each project
for project in "${PROJECTS[@]}"; do
    echo -e "${YELLOW}📦 Processing project: $project${NC}"
    
    # Get existing env vars for the project
    existing_vars=$(curl -s -H "Authorization: Bearer ${VERCEL_TOKEN}" \
        "https://api.vercel.com/v9/projects/${project}/env?teamId=${VERCEL_TEAM_ID}" | \
        python3 -c "import json,sys; data=json.load(sys.stdin); print(' '.join([e['key'] for e in data.get('envs', [])]))" 2>/dev/null || echo "")
    
    added_count=0
    # Add each env var if it doesn't exist
    for key in "${!env_vars[@]}"; do
        if [[ ! " $existing_vars " =~ " $key " ]]; then
            echo -n "  Adding $key..."
            add_env_var "$project" "$key" "${env_vars[$key]}"
            echo " ✓"
            ((added_count++))
        fi
    done
    
    if [ $added_count -eq 0 ]; then
        echo -e "  ${GREEN}All environment variables already present${NC}"
    else
        echo -e "  ${GREEN}Added $added_count environment variables${NC}"
    fi
    echo ""
done

echo -e "${GREEN}✅ Environment variable sync complete!${NC}"
echo ""
echo -e "${YELLOW}Note: You may need to redeploy the applications for the new environment variables to take effect.${NC}"