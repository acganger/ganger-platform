#!/bin/bash
# 🚀 Quick Platform Deployment Script
# Deploy changes to the platform with minimal effort

set -e

echo "🚀 GANGER PLATFORM - QUICK DEPLOYMENT"
echo "====================================="
echo ""

# Check if we're in the right directory
if [ ! -f "cloudflare-workers/staff-router.js" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Show what changed
echo "📝 Changes detected:"
git diff --name-only cloudflare-workers/ | head -5

echo ""
echo "🚀 Deploying to Cloudflare Workers..."
cd cloudflare-workers

# Deploy with environment variables if they exist
if [ -f "../.env" ]; then
    export $(grep -v '^#' ../.env | xargs)
fi

# Try direct deployment first
npx wrangler deploy --env production

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "🌐 Your changes are now live at:"
    echo "   https://staff.gangerdermatology.com/"
    echo ""
    echo "🔍 Test a few applications:"
    echo "   • Homepage: https://staff.gangerdermatology.com/"
    echo "   • Status: https://staff.gangerdermatology.com/status"
    echo "   • Inventory: https://staff.gangerdermatology.com/inventory"
    echo ""
else
    echo ""
    echo "⚠️  Direct deployment failed, trying GitHub Actions..."
    cd ..
    
    # Commit and push for auto-deployment
    git add cloudflare-workers/
    git commit -m "Quick deployment: $(date)"
    git push origin main
    
    echo ""
    echo "🔄 GitHub Actions will deploy automatically in ~2 minutes"
    echo "   Check status: gh run list --limit 3"
fi