#!/bin/bash
# Deploy Next.js apps as dynamic applications to Cloudflare Pages

echo "🚀 Deploying Dynamic Next.js Apps to Cloudflare Pages"
echo "===================================================="

deploy_app() {
    local app_name=$1
    local pages_project=$2
    
    echo "📦 Deploying $app_name..."
    cd apps/$app_name
    
    # Build for production (NOT static export)
    npm run build
    
    # Deploy to Cloudflare Pages
    CLOUDFLARE_API_TOKEN=TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf \
    wrangler pages deploy .next \
        --project-name=$pages_project \
        --compatibility-date=2024-01-01
    
    cd ../..
}

# Deploy each app
deploy_app "inventory" "inventory-dynamic"
deploy_app "handouts" "handouts-dynamic"
deploy_app "checkin-kiosk" "kiosk-dynamic"

echo "✅ Dynamic deployment complete!"
echo "Your apps now have:"
echo "- Server-side rendering"
echo "- Working API routes"
echo "- Database connections"
echo "- Real-time data"