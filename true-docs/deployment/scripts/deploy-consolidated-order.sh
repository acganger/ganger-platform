#!/bin/bash

# Deploy Consolidated Order Form to Vercel
# This script sets up the Vercel project and configures environment variables

set -e

echo "🚀 Deploying Consolidated Order Form to Vercel..."

# Check if VERCEL_TOKEN is set
if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ Error: VERCEL_TOKEN environment variable is not set"
  echo "Please set: export VERCEL_TOKEN='your-token-here'"
  exit 1
fi

# Check if VERCEL_TEAM_ID is set
if [ -z "$VERCEL_TEAM_ID" ]; then
  echo "❌ Error: VERCEL_TEAM_ID environment variable is not set"
  echo "Please set: export VERCEL_TEAM_ID='team_wpY7PcIsYQNnslNN39o7fWvS'"
  exit 1
fi

PROJECT_NAME="consolidated-order-form"
APP_PATH="apps/consolidated-order-form"

echo "📦 Creating Vercel project: $PROJECT_NAME"

# Create Vercel project using API
curl -X POST "https://api.vercel.com/v9/projects" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$PROJECT_NAME\",
    \"framework\": \"nextjs\",
    \"publicSource\": false,
    \"gitRepository\": {
      \"type\": \"github\",
      \"repo\": \"acganger/ganger-platform\"
    },
    \"rootDirectory\": \"$APP_PATH\",
    \"buildCommand\": \"cd ../.. && pnpm -F @ganger/consolidated-order-form build\",
    \"installCommand\": \"cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile\",
    \"outputDirectory\": \".next\",
    \"teamId\": \"$VERCEL_TEAM_ID\"
  }"

echo ""
echo "🔧 Setting environment variables..."

# Read .env file and set each variable
if [ -f ".env" ]; then
  while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ ! "$key" =~ ^#.*$ ]] && [[ -n "$key" ]]; then
      # Remove quotes from value
      value="${value%\"}"
      value="${value#\"}"
      
      echo "Setting $key..."
      
      curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_NAME/env" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"key\": \"$key\",
          \"value\": \"$value\",
          \"type\": \"encrypted\",
          \"target\": [\"production\", \"preview\", \"development\"],
          \"teamId\": \"$VERCEL_TEAM_ID\"
        }" > /dev/null 2>&1
    fi
  done < .env
  echo "✅ Environment variables set successfully"
else
  echo "⚠️  Warning: .env file not found"
fi

echo ""
echo "🌐 Setting up domain..."

# Add domain configuration
curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_NAME/domains" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"order-form.gangerdermatology.com\",
    \"teamId\": \"$VERCEL_TEAM_ID\"
  }"

echo ""
echo "🎯 Triggering initial deployment..."

# Trigger deployment
curl -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$PROJECT_NAME\",
    \"teamId\": \"$VERCEL_TEAM_ID\",
    \"gitSource\": {
      \"type\": \"github\",
      \"repo\": \"acganger/ganger-platform\",
      \"ref\": \"main\"
    },
    \"projectSettings\": {
      \"rootDirectory\": \"$APP_PATH\"
    }
  }"

echo ""
echo "✅ Consolidated Order Form deployment initiated!"
echo ""
echo "📝 Next steps:"
echo "1. Check deployment status at: https://vercel.com/$VERCEL_TEAM_ID/$PROJECT_NAME"
echo "2. Once deployed, the app will be available at:"
echo "   - https://$PROJECT_NAME.vercel.app"
echo "   - https://order-form.gangerdermatology.com (after DNS propagation)"
echo ""
echo "3. For staff portal integration, update the Edge Config with:"
echo "   'order-form': 'https://$PROJECT_NAME.vercel.app'"