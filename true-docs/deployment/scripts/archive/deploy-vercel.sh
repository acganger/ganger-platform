#!/bin/bash

# Deploy Ganger Platform to Vercel
# This script automates the deployment of the staff portal as the main entry point

set -e

echo "🚀 Starting Vercel deployment for Ganger Platform..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Navigate to staff app
cd apps/staff

# Set up Vercel project if not already linked
if [ ! -f ".vercel/project.json" ]; then
    echo "📋 Setting up Vercel project..."
    vercel link --yes \
        --project="ganger-staff-portal" \
        --scope="team_wpY7PcIsYQNnslNN39o7fWvS" \
        --token="RdwA23mHSvPcm9ptReM6zxjF"
fi

# Deploy to Vercel (it will handle the build)
echo "🏗️ Building and deploying to Vercel..."
vercel deploy --prod \
    --token="RdwA23mHSvPcm9ptReM6zxjF" \
    --scope="team_wpY7PcIsYQNnslNN39o7fWvS" \
    --yes

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls --token="RdwA23mHSvPcm9ptReM6zxjF" --scope="team_wpY7PcIsYQNnslNN39o7fWvS" | grep "ganger-platform" | head -1 | awk '{print $2}')

echo "✅ Deployment complete!"
echo "🌐 Deployment URL: https://$DEPLOYMENT_URL"
echo ""
echo "📝 Next steps:"
echo "1. Add custom domain in Vercel dashboard: staff.gangerdermatology.com"
echo "2. Configure DNS in Cloudflare to point to Vercel"
echo "3. Test all app routes:"
echo "   - /inventory"
echo "   - /handouts"
echo "   - /meds"
echo "   - /kiosk"
echo "   - /l10"
echo "   - /compliance"
echo "   - /staffing"
echo "   - /socials"
echo ""
echo "🎯 All apps are now accessible under staff.gangerdermatology.com!"