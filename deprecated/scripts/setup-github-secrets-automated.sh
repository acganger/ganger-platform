#!/bin/bash

# ============================================================================
# Setup GitHub Secrets for Vercel Deployment (Automated)
# ============================================================================
# This script adds all required secrets to GitHub without interactive prompts
# Uses values from environment and existing configuration
# ============================================================================

set -e

echo "🔐 Setting up GitHub Secrets for Vercel Deployment (Automated)"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh) is not installed"
  echo "Install it from: https://cli.github.com/"
  exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
  echo "❌ Not authenticated with GitHub"
  echo "Run: gh auth login"
  exit 1
fi

# Vercel tokens from environment or fallback
VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"
VERCEL_ORG_ID="${VERCEL_ORG_ID:-team_wpY7PcIsYQNnslNN39o7fWvS}"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Set Vercel auth secrets
echo "📝 Adding Vercel authentication secrets..."
gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN" 2>/dev/null && echo "✅ Added VERCEL_TOKEN" || echo "⚠️  VERCEL_TOKEN already exists"
gh secret set VERCEL_ORG_ID --body "$VERCEL_ORG_ID" 2>/dev/null && echo "✅ Added VERCEL_ORG_ID" || echo "⚠️  VERCEL_ORG_ID already exists"
gh secret set VERCEL_TEAM_ID --body "$VERCEL_TEAM_ID" 2>/dev/null && echo "✅ Added VERCEL_TEAM_ID" || echo "⚠️  VERCEL_TEAM_ID already exists"

echo ""

# Check if project IDs file exists
if [ ! -f "vercel-project-ids.env" ]; then
  echo "⚠️  vercel-project-ids.env not found"
  echo "Run ./scripts/setup-vercel-projects.sh first"
  exit 1
fi

# Add project IDs
echo "📝 Adding Vercel project IDs..."
while IFS='=' read -r key value; do
  if [[ $key == VERCEL_PROJECT_ID_* ]]; then
    # GitHub secrets already use underscores, no conversion needed
    gh secret set "$key" --body "$value" 2>/dev/null && echo "✅ Added $key" || echo "⚠️  $key already exists"
  fi
done < vercel-project-ids.env

echo ""

# Load and add environment variables
if [ ! -f ".env" ]; then
  echo "❌ .env file not found"
  exit 1
fi

echo "📝 Adding environment variables from .env..."

# Critical environment variables to add
ENV_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "DATABASE_URL"
  "DIRECT_URL"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "NEXTAUTH_SECRET"
  "CLOUDFLARE_API_TOKEN"
  "SLACK_WEBHOOK_URL"
  "SECURITY_SALT"
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID"
  "NEXTAUTH_URL"
)

# Read .env file and add secrets
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  if [[ $key == \#* ]] || [ -z "$key" ]; then
    continue
  fi
  
  # Check if this is one of our required vars
  if [[ " ${ENV_VARS[@]} " =~ " ${key} " ]]; then
    # Remove quotes if present
    value="${value%\"}"
    value="${value#\"}"
    
    gh secret set "$key" --body "$value" 2>/dev/null && echo "✅ Added $key" || echo "⚠️  $key already exists"
  fi
done < .env

echo ""
echo "🎉 GitHub Secrets setup complete!"
echo ""
echo "📋 Summary:"
echo "- Vercel authentication secrets configured"
echo "- Project IDs configured"
echo "- Environment variables configured"
echo ""
echo "🚀 Ready for automated deployment via GitHub Actions!"