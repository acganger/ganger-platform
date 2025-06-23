#!/bin/bash

# Call Center Ops Platform R2 Deployment Script
# Pattern: Proven deployment strategy with R2 bucket + Cloudflare Workers

set -e

echo "📞 Starting Call Center Ops Platform deployment..."

# Build the Next.js application
echo "📦 Building Next.js application..."
npm run build

# Check if out directory exists
if [ ! -d "out" ]; then
    echo "❌ Build failed: 'out' directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Create R2 buckets if they don't exist (staging and production)
echo "🪣 Creating R2 buckets..."

# Try to create buckets (will fail silently if they exist)
wrangler r2 bucket create ganger-call-center-ops-staging 2>/dev/null || echo "Staging bucket already exists"
wrangler r2 bucket create ganger-call-center-ops-production 2>/dev/null || echo "Production bucket already exists"

# Deploy to staging
echo "🔄 Deploying to staging..."
cd out

# Upload all files to staging bucket using R2 API
find . -type f | while read file; do
    # Remove leading ./ from file path
    key=${file#./}
    echo "Uploading: $key"
    wrangler r2 object put ganger-call-center-ops-staging/"$key" --file="$file" --content-type="$(file -b --mime-type "$file")"
done

cd ..

# Deploy staging worker
echo "📡 Deploying staging worker..."
wrangler deploy --env staging

echo "✅ Staging deployment completed!"
echo "🔗 Staging URL: https://ganger-call-center-ops-staging.michiganger.workers.dev"

# Production deployment (if on main branch)
if [ "${GITHUB_REF}" == "refs/heads/main" ] || [ "${1}" == "production" ]; then
    echo "🎯 Deploying to production..."
    
    cd out
    
    # Upload all files to production bucket
    find . -type f | while read file; do
        key=${file#./}
        echo "Uploading to production: $key"
        wrangler r2 object put ganger-call-center-ops-production/"$key" --file="$file" --content-type="$(file -b --mime-type "$file")"
    done
    
    cd ..
    
    # Deploy production worker
    echo "📡 Deploying production worker..."
    wrangler deploy --env production
    
    echo "✅ Production deployment completed!"
    echo "🔗 Production URL: https://ganger-call-center-ops-v2.michiganger.workers.dev"
else
    echo "ℹ️  Skipping production deployment (not on main branch)"
    echo "ℹ️  Run './deploy.sh production' to force production deployment"
fi

echo "🎉 Call Center Ops Platform deployment completed successfully!"