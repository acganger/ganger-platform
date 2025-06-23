#!/bin/bash

# Build and Deploy Ganger Platform to Vercel (Static Export)
# This builds locally and deploys the output to avoid workspace issues

set -e

echo "🚀 Starting Vercel deployment for Ganger Platform (Static Export)..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Build the staff app locally
echo "🏗️ Building staff app locally..."
pnpm build:staff

# Navigate to staff app
cd apps/staff

# Deploy the built output to Vercel
echo "📤 Deploying to Vercel..."
vercel deploy --prod \
    --token="RdwA23mHSvPcm9ptReM6zxjF" \
    --scope="team_wpY7PcIsYQNnslNN39o7fWvS" \
    --prebuilt \
    --yes

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls --token="RdwA23mHSvPcm9ptReM6zxjF" --scope="team_wpY7PcIsYQNnslNN39o7fWvS" | grep "ganger-staff-portal" | head -1 | awk '{print $2}')

echo "✅ Deployment complete!"
echo "🌐 Deployment URL: https://$DEPLOYMENT_URL"
echo ""
echo "📝 Next steps:"
echo "1. Add custom domain in Vercel dashboard: staff.gangerdermatology.com"
echo "2. Configure DNS in Cloudflare to point to Vercel"
echo "3. Test all app routes"