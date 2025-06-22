#!/bin/bash
# Deploy Ganger Platform to Vercel - Ready to Run

set -e

echo "🚀 Deploying Ganger Platform to Vercel"
echo "====================================="
echo ""

# Your Vercel configuration
export VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"
VERCEL_ORG_ID="PoO93urQJCWz9Sou0o7pXFQu"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Apps to deploy
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

# Deploy function
deploy_app() {
    local app_path=$1
    local app_name=$(basename $app_path)
    
    echo ""
    echo "📱 Deploying $app_name..."
    
    # Check if project exists, if not create it
    project_exists=$(vercel ls --token="$VERCEL_TOKEN" --scope="$VERCEL_TEAM_ID" 2>/dev/null | grep -c "ganger-$app_name" || true)
    
    if [ "$project_exists" -eq 0 ]; then
        echo "Creating new project: ganger-$app_name"
        
        # Link and deploy
        cd "$app_path"
        vercel link --yes \
            --token="$VERCEL_TOKEN" \
            --scope="$VERCEL_TEAM_ID" \
            --project="ganger-$app_name"
        
        # Deploy to production
        vercel --prod \
            --token="$VERCEL_TOKEN" \
            --scope="$VERCEL_TEAM_ID" \
            --yes
        
        cd - > /dev/null
    else
        echo "Project exists, deploying update..."
        
        # Just deploy
        vercel --prod \
            --token="$VERCEL_TOKEN" \
            --scope="$VERCEL_TEAM_ID" \
            --yes \
            --cwd="$app_path"
    fi
    
    echo "✅ $app_name deployed!"
}

# Main execution
main() {
    # Verify we're in the right directory
    if [ ! -f "turbo.json" ]; then
        echo "❌ Error: Not in the ganger-platform root directory"
        exit 1
    fi
    
    echo "🔍 Found ${#APPS[@]} apps to deploy"
    echo "📋 Using team: $VERCEL_TEAM_ID"
    echo "🔐 Environment variables: Already configured in Vercel team settings"
    echo ""
    
    # Deploy each app
    for app in "${APPS[@]}"; do
        if [ -d "$app" ]; then
            deploy_app "$app"
        else
            echo "⚠️  Skipping $app - directory not found"
        fi
    done
    
    echo ""
    echo "🎉 All deployments complete!"
    echo ""
    echo "📊 View your deployments at:"
    echo "https://vercel.com/$VERCEL_TEAM_ID"
    echo ""
    echo "🌐 Next: Run ./update-cloudflare-for-vercel.sh to point your domains to Vercel"
}

# Run deployment
main "$@"