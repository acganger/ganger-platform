#!/bin/bash
# Deploy all Ganger Platform apps systematically

echo "🚀 Deploying All Ganger Platform Apps"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to deploy an app
deploy_app() {
    local app_name=$1
    local app_path=$2
    
    echo ""
    echo "📦 Deploying $app_name..."
    
    # Build the app
    echo "  Building..."
    if pnpm --filter "$app_path" build; then
        echo -e "  ${GREEN}✅ Build successful${NC}"
        
        # Start with PM2
        echo "  Starting with PM2..."
        if pm2 start ecosystem.config.js --only "$app_name"; then
            echo -e "  ${GREEN}✅ Started successfully${NC}"
            
            # Give it a moment to start
            sleep 2
            
            # Check if running
            if pm2 status | grep -q "$app_name.*online"; then
                echo -e "  ${GREEN}✅ $app_name is running${NC}"
            else
                echo -e "  ${RED}❌ $app_name failed to start${NC}"
                pm2 logs "$app_name" --lines 20
            fi
        else
            echo -e "  ${RED}❌ Failed to start with PM2${NC}"
        fi
    else
        echo -e "  ${RED}❌ Build failed${NC}"
    fi
}

# Stop any existing apps
echo "🛑 Stopping existing apps..."
pm2 delete all 2>/dev/null || true

echo ""
echo "📋 Deployment order:"
echo "1. Core/Demo apps (no dependencies)"
echo "2. Medical apps"
echo "3. Operations apps"
echo "4. Analytics apps"
echo "5. Research apps"
echo "6. Administrative apps"

# Deploy in order
echo ""
echo "=== Phase 1: Core Apps ==="
deploy_app "demo" "./apps/demo"
deploy_app "ai-receptionist" "./apps/ai-receptionist"

echo ""
echo "=== Phase 2: Medical Apps ==="
deploy_app "inventory" "./apps/inventory"
deploy_app "handouts" "./apps/handouts"
deploy_app "checkin-kiosk" "./apps/checkin-kiosk"
deploy_app "medication-auth" "./apps/medication-auth"

echo ""
echo "=== Phase 3: Operations Apps ==="
deploy_app "clinical-staffing" "./apps/clinical-staffing"
deploy_app "eos-l10" "./apps/eos-l10"
deploy_app "pharma-scheduling" "./apps/pharma-scheduling"

echo ""
echo "=== Phase 4: Analytics Apps ==="
deploy_app "batch-closeout" "./apps/batch-closeout"
deploy_app "billing-ops" "./apps/billing-ops"
deploy_app "compliance-training" "./apps/compliance-training"

echo ""
echo "=== Phase 5: Research Apps ==="
deploy_app "treatment-outcomes" "./apps/treatment-outcomes"

echo ""
echo "=== Phase 6: Administrative Apps ==="
deploy_app "staff" "./apps/staff"

# Save PM2 configuration
echo ""
echo "💾 Saving PM2 configuration..."
pm2 save
pm2 startup systemd -u $USER --hp $HOME

echo ""
echo "📊 Deployment Summary:"
pm2 status

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Useful commands:"
echo "  pm2 status          - View all apps"
echo "  pm2 logs [app]      - View logs for an app"
echo "  pm2 restart [app]   - Restart an app"
echo "  pm2 monit           - Monitor all apps"