#!/bin/bash
# Setup Environment Variables for Vercel Deployments

echo "🔐 Setting up Environment Variables for Vercel"
echo "============================================"
echo ""

# Check for .env file
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "Please ensure you have a .env file with your environment variables"
    exit 1
fi

# Function to add env vars to a Vercel project
add_env_vars() {
    local project_name=$1
    
    echo "📝 Adding environment variables to $project_name..."
    
    # Read .env file and add each variable
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        if [[ -z "$key" || "$key" =~ ^# ]]; then
            continue
        fi
        
        # Remove quotes from value if present
        value="${value%\"}"
        value="${value#\"}"
        
        # Add to Vercel (production, preview, and development)
        vercel env add "$key" production < <(echo "$value") --yes --token="$VERCEL_TOKEN" --scope=ganger --cwd="$project_name" || true
        vercel env add "$key" preview < <(echo "$value") --yes --token="$VERCEL_TOKEN" --scope=ganger --cwd="$project_name" || true
        vercel env add "$key" development < <(echo "$value") --yes --token="$VERCEL_TOKEN" --scope=ganger --cwd="$project_name" || true
    done < .env
    
    echo "✅ Environment variables added to $project_name"
}

# Apps to configure
APPS=(
    "apps/eos-l10"
    "apps/inventory"
    "apps/handouts"
    "apps/checkin-kiosk"
    "apps/medication-auth"
    "apps/clinical-staffing"
    "apps/pharma-scheduling"
    "apps/batch-closeout"
    "apps/billing-ops"
    "apps/compliance-training"
    "apps/treatment-outcomes"
    "apps/ai-receptionist"
    "apps/demo"
    "apps/staff"
)

# Main function
main() {
    if [ -z "$VERCEL_TOKEN" ]; then
        echo "❌ Error: VERCEL_TOKEN not set"
        exit 1
    fi
    
    for app in "${APPS[@]}"; do
        if [ -d "$app" ]; then
            add_env_vars "$app"
        fi
    done
    
    echo ""
    echo "✅ All environment variables configured!"
}

main "$@"