#!/bin/bash

# Deploy a single app with proven configuration
VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

APP_NAME=${1:-"ai-receptionist"}
PROJECT_NAME="ganger-$APP_NAME"

echo "Deploying $APP_NAME..."

# Remove old .vercel directory
rm -rf "apps/$APP_NAME/.vercel"

# Link to project
cd "apps/$APP_NAME"
npx vercel@latest link --yes --project=$PROJECT_NAME --scope=$VERCEL_TEAM_ID --token=$VERCEL_TOKEN

# Deploy
echo "Starting deployment..."
npx vercel@latest --prod --yes --token=$VERCEL_TOKEN

cd ../..