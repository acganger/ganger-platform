#!/bin/bash
# EOS L10 Deployment Fix Script
# This script helps deploy the real Next.js EOS L10 app to replace the demo

echo "🚀 EOS L10 Deployment Fix"
echo "=========================="
echo ""
echo "Current Status:"
echo "- EOS L10 is serving demo content with alert popups"
echo "- Real Next.js app is built and ready in apps/eos-l10/out/"
echo "- Static worker is configured in workers/eos-l10-static/"
echo ""

echo "Step 1: Checking Next.js build..."
if [ -d "apps/eos-l10/out" ]; then
    echo "✅ Next.js static export found"
    echo "   $(ls -la apps/eos-l10/out/ | wc -l) files built"
else
    echo "❌ Next.js build not found - running build..."
    cd apps/eos-l10
    npm run build
    cd ../..
fi

echo ""
echo "Step 2: Checking worker configuration..."
if [ -f "workers/eos-l10-static/worker.js" ]; then
    echo "✅ Static worker configured"
    echo "   $(wc -l < workers/eos-l10-static/worker.js) lines of code"
else
    echo "❌ Worker not found"
    exit 1
fi

echo ""
echo "Step 3: Deployment Options:"
echo ""
echo "Option A - Fix API Token:"
echo "  1. Go to https://dash.cloudflare.com/profile/api-tokens"
echo "  2. Create a new API token with Workers:Edit permissions"
echo "  3. Run: export CLOUDFLARE_API_TOKEN=\"your-new-token\""
echo "  4. Run: cd workers/eos-l10-static && npx wrangler deploy --env production"
echo ""
echo "Option B - Manual Deployment:"
echo "  1. Open Cloudflare Dashboard"
echo "  2. Go to Workers & Pages"
echo "  3. Find 'ganger-eos-l10-prod' worker"
echo "  4. Replace worker.js with the content from workers/eos-l10-static/worker.js"
echo "  5. Upload assets from apps/eos-l10/out/ to the worker's KV storage"
echo ""
echo "Option C - GitHub Actions (if configured):"
echo "  1. Commit these changes to GitHub"
echo "  2. Push to main branch to trigger deployment"
echo ""

echo "Current Worker Health Check:"
curl -s "https://ganger-eos-l10-prod.michiganger.workers.dev/health" | jq . 2>/dev/null || curl -s "https://ganger-eos-l10-prod.michiganger.workers.dev/health"

echo ""
echo "Expected Files in Static Export:"
echo "================================"
ls -la apps/eos-l10/out/ 2>/dev/null || echo "Build directory not found"

echo ""
echo "Ready to deploy! Choose one of the options above."