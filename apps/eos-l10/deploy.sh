#!/bin/bash

# EOS L10 Management Platform R2 Deployment Script
# Pattern: Proven deployment strategy with R2 bucket + Cloudflare Workers

set -e

echo "📊 Starting EOS L10 Management Platform deployment..."

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
wrangler r2 bucket create ganger-eos-l10-staging 2>/dev/null || echo "Staging bucket already exists"
wrangler r2 bucket create ganger-eos-l10-production 2>/dev/null || echo "Production bucket already exists"

# Deploy to staging
echo "🔄 Deploying to staging..."
cd out

# Upload all files to staging bucket using R2 API with error handling
echo "📁 Starting file upload to staging bucket..."
upload_count=0
error_count=0

find . -type f | while read file; do
    # Remove leading ./ from file path
    key=${file#./}
    echo "📤 Uploading: $key"
    
    # Simple content-type detection based on file extension
    case "$key" in
        *.html) content_type="text/html" ;;
        *.css) content_type="text/css" ;;
        *.js) content_type="application/javascript" ;;
        *.json) content_type="application/json" ;;
        *.png) content_type="image/png" ;;
        *.jpg|*.jpeg) content_type="image/jpeg" ;;
        *.gif) content_type="image/gif" ;;
        *.svg) content_type="image/svg+xml" ;;
        *.ico) content_type="image/x-icon" ;;
        *.woff) content_type="font/woff" ;;
        *.woff2) content_type="font/woff2" ;;
        *.ttf) content_type="font/ttf" ;;
        *.eot) content_type="application/vnd.ms-fontobject" ;;
        *) content_type="application/octet-stream" ;;
    esac
    
    # Upload with error checking
    if wrangler r2 object put "ganger-eos-l10-staging/$key" --file="$file" --content-type="$content_type" 2>&1; then
        echo "✅ Successfully uploaded: $key"
        upload_count=$((upload_count + 1))
    else
        echo "❌ Failed to upload: $key"
        error_count=$((error_count + 1))
    fi
done

echo "📊 Staging upload complete: $upload_count successful, $error_count failed"

cd ..

# Deploy staging worker
echo "📡 Deploying staging worker..."
wrangler deploy --env staging

echo "✅ Staging deployment completed!"
echo "🔗 Staging URL: https://ganger-eos-l10-staging.michiganger.workers.dev"

# Production deployment (if on main branch)
if [ "${GITHUB_REF}" == "refs/heads/main" ] || [ "${1}" == "production" ]; then
    echo "🎯 Deploying to production..."
    
    cd out
    
    # Upload all files to production bucket with error handling
    echo "📁 Starting file upload to production bucket..."
    prod_upload_count=0
    prod_error_count=0
    
    find . -type f | while read file; do
        key=${file#./}
        echo "📤 Uploading to production: $key"
        
        # Simple content-type detection based on file extension
        case "$key" in
            *.html) content_type="text/html" ;;
            *.css) content_type="text/css" ;;
            *.js) content_type="application/javascript" ;;
            *.json) content_type="application/json" ;;
            *.png) content_type="image/png" ;;
            *.jpg|*.jpeg) content_type="image/jpeg" ;;
            *.gif) content_type="image/gif" ;;
            *.svg) content_type="image/svg+xml" ;;
            *.ico) content_type="image/x-icon" ;;
            *.woff) content_type="font/woff" ;;
            *.woff2) content_type="font/woff2" ;;
            *.ttf) content_type="font/ttf" ;;
            *.eot) content_type="application/vnd.ms-fontobject" ;;
            *) content_type="application/octet-stream" ;;
        esac
        
        # Upload with error checking
        if wrangler r2 object put "ganger-eos-l10-production/$key" --file="$file" --content-type="$content_type" 2>&1; then
            echo "✅ Successfully uploaded: $key"
            prod_upload_count=$((prod_upload_count + 1))
        else
            echo "❌ Failed to upload: $key"
            prod_error_count=$((prod_error_count + 1))
        fi
    done
    
    echo "📊 Production upload complete: $prod_upload_count successful, $prod_error_count failed"
    
    cd ..
    
    # Deploy production worker
    echo "📡 Deploying production worker..."
    wrangler deploy --env production
    
    echo "✅ Production deployment completed!"
    echo "🔗 Production URL: https://ganger-eos-l10-v2.michiganger.workers.dev"
else
    echo "ℹ️  Skipping production deployment (not on main branch)"
    echo "ℹ️  Run './deploy.sh production' to force production deployment"
fi

echo "🎉 EOS L10 Management Platform deployment completed successfully!"