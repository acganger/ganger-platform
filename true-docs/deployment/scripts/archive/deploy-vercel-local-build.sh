#!/bin/bash

# Deploy pre-built Next.js app to Vercel
# This builds locally and deploys the output

set -e

echo "🚀 Starting Vercel deployment with local build..."

# Build the staff app
echo "🏗️ Building staff app locally..."
pnpm build:staff

# Create Vercel build output
echo "📦 Creating Vercel build output..."
cd apps/staff

# First build for Vercel output
npx vercel build --token="RdwA23mHSvPcm9ptReM6zxjF"

# Deploy the built output
echo "📤 Deploying to Vercel..."
vercel deploy --prebuilt --prod \
    --token="RdwA23mHSvPcm9ptReM6zxjF" \
    --scope="team_wpY7PcIsYQNnslNN39o7fWvS" \
    --yes \
    --name="ganger-staff-portal"

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Visit the deployment URL shown above"
echo "2. Add custom domain: staff.gangerdermatology.com"
echo "3. Test the app functionality"