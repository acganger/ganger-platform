#!/bin/bash

# ============================================================================
# Setup GitHub Secrets for Vercel Deployment
# ============================================================================
# This script helps you add all required secrets to GitHub
# Requires: GitHub CLI (gh) to be installed and authenticated
# ============================================================================

set -e

echo "🔐 Setting up GitHub Secrets for Vercel Deployment"
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

# Vercel tokens (you'll need to provide these)
echo "📝 First, let's set up Vercel authentication"
echo "Get these from: https://vercel.com/account/tokens"
echo ""

read -p "Enter your Vercel Token: " VERCEL_TOKEN
read -p "Enter your Vercel Org ID: " VERCEL_ORG_ID
echo ""

# Set Vercel auth secrets
gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
gh secret set VERCEL_ORG_ID --body "$VERCEL_ORG_ID"
gh secret set VERCEL_TEAM_ID --body "team_wpY7PcIsYQNnslNN39o7fWvS"

echo "✅ Vercel authentication secrets added"
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
    # Convert hyphen to underscore for GitHub secret name
    secret_name=$(echo "$key" | sed 's/-/_/g')
    gh secret set "$secret_name" --body "$value"
    echo "✅ Added $secret_name"
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
    
    gh secret set "$key" --body "$value"
    echo "✅ Added $key"
  fi
done < .env

echo ""
echo "🎉 GitHub Secrets setup complete!"
echo ""
echo "📋 Summary:"
echo "- Vercel authentication secrets added"
echo "- Project IDs added"
echo "- Environment variables added"
echo ""
echo "🚀 You're now ready to use GitHub Actions for deployment!"