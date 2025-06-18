#!/bin/bash

# EOS L10 Production Deployment Script
# Deploys to staff.gangerdermatology.com/l10 using Cloudflare Workers
# Phase 1 Day 5-7: Workers deployment pipeline

set -e

echo "🚀 Starting EOS L10 production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "wrangler.jsonc" ]; then
    print_error "wrangler.jsonc not found. Make sure you're in the eos-l10 app directory."
    exit 1
fi

print_status "Checking environment variables..."

# Check required environment variables
REQUIRED_VARS=(
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "CLOUDFLARE_API_TOKEN"
    "CLOUDFLARE_ACCOUNT_ID"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set"
        exit 1
    fi
done

print_success "All required environment variables are set"

# Step 1: Install dependencies
print_status "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 2: Run linting
print_status "Running linter..."
npm run lint
if [ $? -ne 0 ]; then
    print_warning "Linting issues found, but continuing deployment..."
fi

# Step 3: Build the application
print_status "Building application..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi

print_success "Build completed successfully"

# Step 4: Run @cloudflare/next-on-pages
print_status "Preparing for Workers deployment..."
npx @cloudflare/next-on-pages
if [ $? -ne 0 ]; then
    print_error "Workers preparation failed"
    exit 1
fi

# Step 5: Deploy to Cloudflare Workers
print_status "Deploying to Cloudflare Workers..."
npx wrangler deploy --env production --config wrangler.jsonc
if [ $? -ne 0 ]; then
    print_error "Deployment failed"
    exit 1
fi

print_success "🎉 EOS L10 successfully deployed to production!"
print_status "Application URL: https://staff.gangerdermatology.com/l10"

# Step 6: Verify deployment
print_status "Verifying deployment..."
sleep 5

# Test the deployment with a simple health check
HEALTH_CHECK_URL="https://staff.gangerdermatology.com/l10"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" || echo "000")

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
    print_success "Health check passed (HTTP $HTTP_STATUS)"
    print_success "EOS L10 is live at: $HEALTH_CHECK_URL"
else
    print_warning "Health check returned HTTP $HTTP_STATUS"
    print_warning "The application may still be initializing..."
fi

echo ""
print_success "✅ Deployment completed successfully!"
print_status "📊 Next steps:"
echo "   1. Test the application at https://staff.gangerdermatology.com/l10"
echo "   2. Run data migration: npm run setup:l10"
echo "   3. Monitor logs: npx wrangler tail --env production"
echo ""