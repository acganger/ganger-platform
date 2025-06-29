#!/bin/bash

# ============================================================================
# Setup Vercel Environment Variables
# ============================================================================
# This script sets all environment variables for all Vercel projects
# Run this AFTER setup-vercel-projects.sh
# ============================================================================

set -e

# Configuration
VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"

# Load environment variables from .env file
if [ ! -f ".env" ]; then
  echo "❌ .env file not found in root directory"
  exit 1
fi

echo "📋 Loading environment variables from .env"
source .env

# List of all apps
APPS=(
  "inventory"
  "handouts"
  "eos-l10"
  "batch-closeout"
  "compliance-training"
  "clinical-staffing"
  "config-dashboard"
  "integration-status"
  "ai-receptionist"
  "call-center-ops"
  "medication-auth"
  "pharma-scheduling"
  "checkin-kiosk"
  "socials-reviews"
  "component-showcase"
  "platform-dashboard"
  "staff"
)

# Environment variables to set for all apps
ENV_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
  "DATABASE_URL=$DATABASE_URL"
  "DIRECT_URL=$DIRECT_URL"
  "NEXT_PUBLIC_STAFF_URL=$NEXT_PUBLIC_STAFF_URL"
  "GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET"
  "NEXTAUTH_URL=https://staff.gangerdermatology.com"
  "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
  "NODE_ENV=production"
)

echo "🔐 Setting environment variables for all Vercel projects"
echo ""

# Set environment variables for each app
for app in "${APPS[@]}"; do
  echo "🔧 Configuring environment for: $app"
  
  cd "apps/$app" 2>/dev/null || {
    echo "❌ App directory not found: apps/$app"
    continue
  }
  
  # Check if project is linked
  if [ ! -f ".vercel/project.json" ]; then
    echo "⚠️  Project not linked, skipping..."
    cd ../..
    continue
  fi
  
  # Set each environment variable
  for var in "${ENV_VARS[@]}"; do
    KEY="${var%%=*}"
    VALUE="${var#*=}"
    
    # Skip if value is empty
    if [ -z "$VALUE" ] || [ "$VALUE" = '""' ]; then
      continue
    fi
    
    echo "  Setting $KEY"
    
    # Add to production environment
    echo "$VALUE" | vercel env add "$KEY" production --token="$VERCEL_TOKEN" --yes 2>/dev/null || {
      echo "  ⚠️  Variable may already exist, skipping..."
    }
  done
  
  # Add app-specific variables
  if [ "$app" = "pharma-scheduling" ]; then
    echo "  Setting NEXT_PUBLIC_APP_URL for pharma-scheduling"
    echo "https://lunch.gangerdermatology.com" | vercel env add NEXT_PUBLIC_APP_URL production --token="$VERCEL_TOKEN" --yes 2>/dev/null || true
  fi
  
  if [ "$app" = "checkin-kiosk" ]; then
    echo "  Setting NEXT_PUBLIC_APP_URL for checkin-kiosk"
    echo "https://kiosk.gangerdermatology.com" | vercel env add NEXT_PUBLIC_APP_URL production --token="$VERCEL_TOKEN" --yes 2>/dev/null || true
  fi
  
  cd ../..
  echo "✅ Environment configured for $app"
  echo ""
done

echo "🎉 Environment setup complete!"
echo ""
echo "📝 Note: Some variables may have shown warnings if they already existed."
echo "This is normal and the values have been preserved."