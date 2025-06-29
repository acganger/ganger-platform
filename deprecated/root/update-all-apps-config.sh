#!/bin/bash

# Source environment variables
source .env

# Update all Vercel projects with monorepo configuration

APPS=(
  "ai-receptionist"
  "batch-closeout"
  "call-center-ops"
  "checkin-kiosk"
  "clinical-staffing"
  "compliance-training"
  "component-showcase"
  "config-dashboard"
  "eos-l10"
  "handouts"
  "integration-status"
  "inventory"
  "medication-auth"
  "pharma-scheduling"
  "platform-dashboard"
  "socials-reviews"
  "staff"
)

echo "Updating Vercel project configurations for monorepo..."

for app in "${APPS[@]}"; do
  echo "Updating $app..."
  
  # Try both with and without ganger- prefix
  PROJECT_ID=""
  
  # First try without prefix
  PROJECT_ID=$(curl -s "https://api.vercel.com/v9/projects/$app?teamId=$VERCEL_TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" | \
    python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('id', ''))" 2>/dev/null)
  
  # If not found, try with ganger- prefix
  if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID=$(curl -s "https://api.vercel.com/v9/projects/ganger-$app?teamId=$VERCEL_TEAM_ID" \
      -H "Authorization: Bearer $VERCEL_TOKEN" | \
      python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('id', ''))" 2>/dev/null)
  fi
  
  if [ -z "$PROJECT_ID" ]; then
    echo "  ❌ Failed to get project ID for $app"
    continue
  fi
  
  echo "  Found project ID: $PROJECT_ID"
  
  # Update the project configuration
  RESPONSE=$(curl -s -X PATCH "https://api.vercel.com/v9/projects/$PROJECT_ID?teamId=$VERCEL_TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "framework": "nextjs",
      "buildCommand": "cd ../.. && pnpm turbo run build --filter=@ganger/'$app'",
      "installCommand": "cd ../.. && pnpm install",
      "outputDirectory": ".next",
      "rootDirectory": "apps/'$app'",
      "nodeVersion": "20.x"
    }' 2>&1)
  
  # Check if update was successful
  if echo "$RESPONSE" | grep -q '"id"'; then
    echo "  ✅ Successfully updated $app configuration"
  else
    echo "  ❌ Failed to update $app: $RESPONSE"
  fi
  
  sleep 1 # Rate limiting
done

echo ""
echo "Configuration update complete!"
echo "Triggering deployments by pushing to GitHub..."