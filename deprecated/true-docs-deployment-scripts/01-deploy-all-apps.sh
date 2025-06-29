#!/bin/bash

# ============================================================================
# 01-deploy-all-apps.sh - Main Deployment Automation
# ============================================================================
# IMPORTANT: This script is INCOMPATIBLE with our current GitHub Actions setup
#           We already have Vercel projects created and use GitHub Actions
#           This is kept for reference but should NOT be used
# ============================================================================
# Purpose: Deploy all apps in the monorepo to individual Vercel projects
# Dependencies: Vercel CLI, jq
# Related Docs: ../02-deployment-plan.md
# Next Script: 03-update-staff-rewrites.js
# ============================================================================

set -e

# Configuration
# These should be set as environment variables (GitHub Secrets in Actions)
VERCEL_TOKEN="${VERCEL_TOKEN:-}"
VERCEL_SCOPE="${VERCEL_TEAM_ID:-}"
GITHUB_REPO="https://github.com/acganger/ganger-platform"

# Validate required environment variables
if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ Error: VERCEL_TOKEN environment variable is not set"
  echo "Please set it as a GitHub Secret or export it before running this script"
  exit 1
fi

if [ -z "$VERCEL_SCOPE" ]; then
  echo "❌ Error: VERCEL_TEAM_ID environment variable is not set"
  echo "Please set it as a GitHub Secret or export it before running this script"
  exit 1
fi

# Environment variables configuration
# NOTE: For production, these should be stored in a secret manager
# or loaded from a secure .env file that is NOT committed to git

# Load environment variables from secure file if it exists
ENV_FILE="${ENV_FILE:-./deployment-env.secret}"
if [ -f "$ENV_FILE" ]; then
  echo "📦 Loading environment variables from $ENV_FILE"
  source "$ENV_FILE"
else
  echo "⚠️  WARNING: Using hardcoded environment variables"
  echo "   For production, create $ENV_FILE with your secrets"
fi

# Common environment variables for all apps
# These will be set for both production and preview environments
# All values should come from GitHub Secrets or environment variables
COMMON_ENV_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
  "SUPABASE_URL=${SUPABASE_URL}"
  "SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}"
  "SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}"
  "NEXT_PUBLIC_STAFF_URL=${NEXT_PUBLIC_STAFF_URL:-https://staff.gangerdermatology.com}"
  "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}"
  "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}"
)

# Validate critical environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "❌ Error: Required Supabase environment variables are not set"
  echo "Please set them as GitHub Secrets or export them before running this script"
  exit 1
fi

# List of apps to deploy (excluding staff portal which is deployed last)
APPS=(
  "inventory"
  "handouts"
  "checkin-kiosk"
  "medication-auth"
  "eos-l10"
  "compliance-training"
  "clinical-staffing"
  "socials-reviews"
  "config-dashboard"
  "integration-status"
  "ai-receptionist"
  "call-center-ops"
  "pharma-scheduling"
  "component-showcase"
  "batch-closeout"
)

# Output file for deployment URLs
DEPLOYMENT_URLS_FILE="deployment-urls.json"
echo "{" > $DEPLOYMENT_URLS_FILE

# Function to set environment variables for a project
set_env_vars() {
  local project_name=$1
  
  echo "  Setting environment variables for $project_name..."
  
  # Set each environment variable for both production and preview
  for env_var in "${COMMON_ENV_VARS[@]}"; do
    key="${env_var%%=*}"
    value="${env_var#*=}"
    
    # Set for production
    vercel env add "$key" production --token="$VERCEL_TOKEN" --scope="$VERCEL_SCOPE" <<< "$value" >/dev/null 2>&1 || true
    
    # Set for preview
    vercel env add "$key" preview --token="$VERCEL_TOKEN" --scope="$VERCEL_SCOPE" <<< "$value" >/dev/null 2>&1 || true
  done
}

# Function to deploy a single app
deploy_app() {
  local app_name=$1
  local app_path="apps/$app_name"
  
  echo "🚀 Deploying $app_name..."
  
  # Navigate to app directory
  cd "$app_path"
  
  # Create Vercel project using API
  PROJECT_NAME="ganger-$app_name"
  
  # First create the project
  vercel link \
    --token="$VERCEL_TOKEN" \
    --scope="$VERCEL_SCOPE" \
    --project="$PROJECT_NAME" \
    --yes \
    --repo="$GITHUB_REPO" \
    --git-branch main \
    --root-directory "$app_path" \
    >/dev/null 2>&1 || true
  
  # Set environment variables
  set_env_vars "$PROJECT_NAME"
  
  # Deploy the project
  vercel deploy \
    --token="$VERCEL_TOKEN" \
    --scope="$VERCEL_SCOPE" \
    --prod \
    --yes \
    > deploy-output.txt 2>&1
  
  # Extract deployment URL
  DEPLOYMENT_URL=$(grep -oE 'https://[^ ]+\.vercel\.app' deploy-output.txt | head -n 1)
  
  if [ -z "$DEPLOYMENT_URL" ]; then
    echo "❌ Failed to deploy $app_name"
    cat deploy-output.txt
    return 1
  fi
  
  echo "✅ Deployed $app_name to: $DEPLOYMENT_URL"
  
  # Save to JSON file (navigate back to root first)
  cd ../..
  echo "  \"$app_name\": \"$DEPLOYMENT_URL\"," >> $DEPLOYMENT_URLS_FILE
  
  return 0
}

# Main deployment process
echo "🏗️ Starting automated deployment of all apps..."
echo "📝 Deployment URLs will be saved to: $DEPLOYMENT_URLS_FILE"

# Deploy all apps
for app in "${APPS[@]}"; do
  if [ -d "apps/$app" ]; then
    deploy_app "$app" || echo "⚠️  Continuing despite error in $app"
  else
    echo "⚠️  Skipping $app - directory not found"
  fi
  
  # Add a small delay to avoid rate limiting
  sleep 5
done

# Deploy staff portal last (with rewrites)
echo "🚀 Deploying Staff Portal (Router)..."

# First, update the vercel.json with all deployment URLs
# This will be done by the update-staff-rewrites.js script

# Close JSON file
echo "  \"staff-portal\": \"https://staff.gangerdermatology.com\"" >> $DEPLOYMENT_URLS_FILE
echo "}" >> $DEPLOYMENT_URLS_FILE

echo "✅ Deployment complete!"
echo "📋 Deployment URLs saved to: $DEPLOYMENT_URLS_FILE"
echo ""
echo "Next steps:"
echo "1. Run: node scripts/update-staff-rewrites.js"
echo "2. Deploy staff portal with updated rewrites"
echo "3. Configure custom domain in Vercel"