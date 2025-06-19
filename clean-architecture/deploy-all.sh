#!/bin/bash
# Deploy Clean Architecture - 5 Workers Total

set -e  # Exit on error

echo "🚀 Deploying Ganger Platform Clean Architecture"
echo "=============================================="
echo

# Function to deploy a worker
deploy_worker() {
    local WORKER_DIR=$1
    local WORKER_NAME=$2
    
    echo "📦 Deploying $WORKER_NAME..."
    cd $WORKER_DIR
    
    # Install dependencies if package.json exists
    if [ -f "package.json" ]; then
        npm install
    fi
    
    # Deploy to production
    npx wrangler deploy --env production
    
    cd ..
    echo "✅ $WORKER_NAME deployed successfully!"
    echo
}

# Deploy all workers
echo "🏥 Step 1: Medical Apps Worker"
deploy_worker "medical" "Medical Apps (Inventory, Handouts, Meds, Kiosk)"

echo "💼 Step 2: Business Apps Worker"
deploy_worker "business" "Business Apps (L10, Compliance, Staffing, Socials)"

echo "🏠 Step 3: Core Platform Worker"
deploy_worker "core" "Core Platform (Dashboard, Config, Admin)"

echo "👥 Step 4: Patient Portal Worker"
deploy_worker "portal" "Patient Portal (External Domains)"

echo "🔌 Step 5: API Gateway Worker"
deploy_worker "api" "API Gateway"

echo
echo "✨ Deployment Complete!"
echo "======================"
echo
echo "📋 Verify Deployment:"
echo "  - Medical: https://staff.gangerdermatology.com/inventory"
echo "  - Business: https://staff.gangerdermatology.com/l10"
echo "  - Core: https://staff.gangerdermatology.com/"
echo "  - Portal: https://handouts.gangerdermatology.com/"
echo "  - API: https://api.gangerdermatology.com/health"
echo
echo "🔍 Check Worker Logs:"
echo "  wrangler tail ganger-medical-production"
echo "  wrangler tail ganger-business-production"
echo "  wrangler tail ganger-core-production"
echo "  wrangler tail ganger-portal-production"
echo "  wrangler tail ganger-api-production"
echo
echo "📊 View in Cloudflare Dashboard:"
echo "  https://dash.cloudflare.com/68d0160c9915efebbbecfddfd48cddab/workers/overview"