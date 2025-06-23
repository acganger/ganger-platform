#!/bin/bash
# Automated Vercel Deployment for Ganger Platform
# This script handles the entire deployment process programmatically

set -e

echo "🚀 Automated Vercel Deployment for Ganger Platform"
echo "================================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Configuration
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

# Function to deploy an app
deploy_app() {
    local app_path=$1
    local app_name=$(basename $app_path)
    
    echo ""
    echo "📱 Deploying $app_name..."
    echo "Path: $app_path"
    
    # Deploy using Vercel CLI with proper monorepo settings
    vercel \
        --yes \
        --scope=ganger \
        --name="ganger-$app_name" \
        --build-env NODE_ENV=production \
        --prod \
        $app_path
    
    echo "✅ $app_name deployed successfully!"
}

# Main deployment process
main() {
    # Check for Vercel token
    if [ -z "$VERCEL_TOKEN" ]; then
        echo "❌ Error: VERCEL_TOKEN environment variable not set"
        echo "Please run: export VERCEL_TOKEN='your-vercel-token'"
        echo "Get your token from: https://vercel.com/account/tokens"
        exit 1
    fi
    
    # Verify we're in the right directory
    if [ ! -f "turbo.json" ]; then
        echo "❌ Error: Not in the ganger-platform root directory"
        exit 1
    fi
    
    echo "🔍 Found ${#APPS[@]} apps to deploy"
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
    echo "📋 Next steps:"
    echo "1. Visit https://vercel.com/dashboard to see your deployments"
    echo "2. Configure custom domains for each app"
    echo "3. Update DNS records in Cloudflare"
}

# Run main function
main "$@"