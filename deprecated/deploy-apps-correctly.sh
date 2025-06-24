#!/bin/bash
# Deploy Ganger Platform Apps to Vercel - Correct Approach

set -e

echo "🚀 Deploying Ganger Platform to Vercel"
echo "====================================="

# Configuration
export VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Apps to deploy
APPS=(
    "eos-l10"
    "inventory"
    "handouts"
    "checkin-kiosk"
    "medication-auth"
    "clinical-staffing"
    "pharma-scheduling"
    "batch-closeout"
    "compliance-training"
    "ai-receptionist"
    "staff"
    "call-center-ops"
    "component-showcase"
    "config-dashboard"
    "integration-status"
    "platform-dashboard"
    "socials-reviews"
)

# Deploy each app
for app in "${APPS[@]}"; do
    if [ -d "apps/$app" ]; then
        echo ""
        echo "📱 Deploying $app..."
        
        # Deploy from root with app directory specified
        vercel \
            --prod \
            --token="$VERCEL_TOKEN" \
            --scope="$TEAM_ID" \
            --yes \
            --name="ganger-$app" \
            --build-env NODE_ENV=production \
            apps/$app
        
        echo "✅ $app deployed!"
    else
        echo "⚠️  Skipping $app - directory not found"
    fi
done

echo ""
echo "🎉 All deployments complete!"
echo ""
echo "📊 View your deployments at: https://vercel.com/ganger"