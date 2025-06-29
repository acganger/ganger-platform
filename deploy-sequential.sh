#!/bin/bash

# Sequential deployment - one app at a time
VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
export VERCEL_ORG_ID="team_wpY7PcIsYQNnslNN39o7fWvS"
export VERCEL_PROJECT_ID=""

# Apps to deploy (proven working ones first)
APPS=(
    "deployment-helper"
    "inventory"
    "handouts" 
    "eos-l10"
    "call-center-ops"
    "integration-status"
    "llm-demo"
    "medication-auth"
)

echo "🚀 Sequential Deployment Plan"
echo "============================="
echo ""
echo "Will deploy these apps one at a time:"
for app in "${APPS[@]}"; do
    echo "  - $app"
done
echo ""
echo "Each deployment will complete before starting the next."
echo "Press Enter to start or Ctrl+C to cancel..."
read

# Deploy each app
for app in "${APPS[@]}"; do
    echo ""
    echo "🔨 Deploying $app..."
    echo "===================="
    
    cd apps/$app 2>/dev/null || {
        echo "❌ App directory not found: apps/$app"
        continue
    }
    
    # Deploy using npx vercel
    echo "Running: npx vercel --prod --yes --token=$VERCEL_TOKEN --scope=$VERCEL_ORG_ID --name=ganger-$app"
    
    if npx vercel --prod --yes --token=$VERCEL_TOKEN --scope=$VERCEL_ORG_ID --name=ganger-$app; then
        echo "✅ $app deployed successfully!"
    else
        echo "❌ $app deployment failed!"
        echo "Stopping here. Fix the issue before continuing."
        cd ../..
        exit 1
    fi
    
    cd ../..
    
    # Wait between deployments
    if [ "$app" != "${APPS[-1]}" ]; then
        echo "⏳ Waiting 30 seconds before next deployment..."
        sleep 30
    fi
done

echo ""
echo "🎉 All deployments complete!"