#\!/bin/bash

# Simple Vercel Deployment Script
# Uses existing Vercel project configuration

set -e

echo "🚀 Deploying to Vercel..."

# Set your Vercel token
export VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
export VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Deploy inventory app (already configured)
echo "Deploying inventory app..."
cd apps/inventory

# Use vercel CLI to deploy
vercel --prod --token="$VERCEL_TOKEN" --scope="$VERCEL_TEAM_ID" --yes

echo "✅ Deployment complete\!"
echo "Check status at: https://vercel.com/ganger/ganger-inventory"
EOF < /dev/null
