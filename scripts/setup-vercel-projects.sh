#!/bin/bash

# ============================================================================
# Setup Vercel Projects - Initial Project Creation
# ============================================================================
# This script creates all Vercel projects for the Ganger Platform
# Run this ONCE to set up all projects
# ============================================================================

set -e

# Configuration
VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

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

echo "🚀 Setting up Vercel projects for Ganger Platform"
echo "Team ID: $VERCEL_TEAM_ID"
echo ""

# Create output file for project IDs
echo "# Vercel Project IDs - Generated $(date)" > vercel-project-ids.env
echo "# Add these to GitHub Secrets" >> vercel-project-ids.env
echo "" >> vercel-project-ids.env

# Create each project
for app in "${APPS[@]}"; do
  echo "📦 Creating project: ganger-$app"
  
  cd "apps/$app" 2>/dev/null || {
    echo "❌ App directory not found: apps/$app"
    continue
  }
  
  # Check if project already exists
  if [ -f ".vercel/project.json" ]; then
    echo "⚠️  Project already linked, skipping..."
    PROJECT_ID=$(cat .vercel/project.json | jq -r .projectId)
  else
    # Link project (creates it if it doesn't exist)
    vercel link --yes \
      --token="$VERCEL_TOKEN" \
      --scope="$VERCEL_TEAM_ID" \
      --project="ganger-$app" 2>&1 | tee /tmp/vercel-link.log
    
    # Extract project ID from .vercel/project.json
    if [ -f ".vercel/project.json" ]; then
      PROJECT_ID=$(cat .vercel/project.json | jq -r .projectId)
      echo "✅ Created project with ID: $PROJECT_ID"
    else
      echo "❌ Failed to create project"
      cd ../..
      continue
    fi
  fi
  
  # Save project ID
  echo "VERCEL_PROJECT_ID_$app=$PROJECT_ID" >> ../../vercel-project-ids.env
  
  cd ../..
  echo ""
done

echo "✅ Project setup complete!"
echo ""
echo "📋 Project IDs saved to: vercel-project-ids.env"
echo ""
echo "🔑 Next steps:"
echo "1. Add these project IDs to GitHub Secrets"
echo "2. Run ./scripts/setup-vercel-env.sh to configure environment variables"
echo "3. Commit the .vercel directories to git (they contain project configuration)"