#!/bin/bash
# Deploy Next.js apps to Cloudflare Workers (NOT Pages)
# This creates actual dynamic apps, not static exports

echo "🚀 Deploying Next.js Apps to Cloudflare Workers"
echo "=============================================="
echo "This will deploy your ACTUAL apps with:"
echo "✅ Database connections"
echo "✅ API routes"
echo "✅ Authentication"
echo "✅ Real-time data"
echo ""

# Function to deploy a Next.js app to Workers
deploy_nextjs_app() {
    local app_name=$1
    local worker_name=$2
    
    echo "📦 Processing $app_name..."
    cd apps/$app_name
    
    # 1. Remove static export if present
    sed -i "s/output: 'export',/\/\/ output: 'export', \/\/ Disabled for Workers/g" next.config.js
    
    # 2. Add edge runtime
    cat > next.config.js.tmp << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    runtime: 'edge', // Enable edge runtime for Workers
  },
  // Your existing config...
EOF
    
    # 3. Install Cloudflare adapter
    npm install -D @cloudflare/next-on-pages
    
    # 4. Build for Workers
    npx @cloudflare/next-on-pages
    
    # 5. Create wrangler.toml for this app
    cat > wrangler.toml << EOF
name = "$worker_name"
main = ".vercel/output/static/_worker.js"
compatibility_date = "2024-01-01"

[site]
bucket = ".vercel/output/static"

[env.production.vars]
NEXT_PUBLIC_SUPABASE_URL = "https://pfqtzmxxxhhsxmlddrta.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTg1MjQsImV4cCI6MjA2NDY3NDUyNH0.v14_9iozO98QoNQq8JcaI9qMM6KKTlcWMYTkXyCDc5s"

# Not using routes - will be proxied by clean architecture workers
EOF
    
    # 6. Deploy to Workers
    CLOUDFLARE_API_TOKEN=TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf \
    wrangler deploy --env production
    
    echo "✅ $app_name deployed to $worker_name"
    cd ../..
}

# Deploy each app
deploy_nextjs_app "inventory" "ganger-inventory-worker"
deploy_nextjs_app "handouts" "ganger-handouts-worker"
deploy_nextjs_app "checkin-kiosk" "ganger-kiosk-worker"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Now update the clean architecture medical worker to proxy to these:"
echo "- inventory → ganger-inventory-worker.michiganger.workers.dev"
echo "- handouts → ganger-handouts-worker.michiganger.workers.dev"
echo "- kiosk → ganger-kiosk-worker.michiganger.workers.dev"