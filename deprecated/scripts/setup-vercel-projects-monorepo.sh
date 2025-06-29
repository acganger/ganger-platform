#!/bin/bash

# ============================================================================
# setup-vercel-projects-monorepo.sh - Proper Vercel monorepo setup
# ============================================================================
# This script creates Vercel projects with correct monorepo configuration
# Each project links to the monorepo root with proper root directory setting
# ============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Vercel Monorepo Project Setup${NC}"
echo "Creating projects with proper root directory configuration"
echo ""

# Ensure we're in the monorepo root
if [ ! -f "turbo.json" ]; then
  echo -e "${RED}❌ Error: Must run from monorepo root directory${NC}"
  echo "Current directory: $(pwd)"
  exit 1
fi

# Check for required environment variables
if [ -z "$VERCEL_TOKEN" ]; then
  echo -e "${RED}❌ Error: VERCEL_TOKEN not set${NC}"
  echo "Get your token from: https://vercel.com/account/tokens"
  exit 1
fi

if [ -z "$VERCEL_TEAM_ID" ]; then
  echo -e "${RED}❌ Error: VERCEL_TEAM_ID not set${NC}"
  echo "Find your team ID in Vercel dashboard settings"
  exit 1
fi

# List of all apps to create projects for
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

# Create output file for project IDs
echo "# Vercel Project IDs - Generated $(date)" > vercel-project-ids.env
echo "# Add these to GitHub Secrets" >> vercel-project-ids.env
echo "" >> vercel-project-ids.env

# Clean up any existing .vercel directories in root
rm -rf .vercel

# Create each project from the monorepo root
for app in "${APPS[@]}"; do
  echo -e "\n${GREEN}📦 Creating project: ganger-$app${NC}"
  
  # Check if app directory exists
  if [ ! -d "apps/$app" ]; then
    echo -e "${RED}❌ App directory not found: apps/$app${NC}"
    continue
  fi
  
  # Remove any existing .vercel directory in the app
  rm -rf "apps/$app/.vercel"
  
  # Create project via API
  echo "Creating project via API with root directory: apps/$app"
  PROJECT_RESPONSE=$(curl -s -X POST "https://api.vercel.com/v9/projects?teamId=$VERCEL_TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"ganger-$app\",
      \"framework\": \"nextjs\",
      \"rootDirectory\": \"apps/$app\",
      \"buildCommand\": \"cd ../.. && pnpm run build --filter=@ganger/$app...\",
      \"installCommand\": \"cd ../.. && pnpm install\",
      \"outputDirectory\": \".next\"
    }")
  
  # Extract project ID from response
  PROJECT_ID=$(echo "$PROJECT_RESPONSE" | grep -o '"id":"[^"]*"' | sed 's/"id":"//g' | sed 's/"//g')
  
  # Check if project was created successfully
  if [ -n "$PROJECT_ID" ]; then
    echo -e "${GREEN}✅ Created project with ID: $PROJECT_ID${NC}"
    
    # Save project ID
    APP_UPPER=$(echo "$app" | tr '-' '_' | tr '[:lower:]' '[:upper:]')
    echo "VERCEL_PROJECT_ID_$APP_UPPER=$PROJECT_ID" >> vercel-project-ids.env
  else
    echo -e "${RED}❌ Failed to create project${NC}"
    echo "Response: $PROJECT_RESPONSE"
  fi
  
  # Clean up
  rm -rf .vercel
done

echo -e "\n${GREEN}✅ Monorepo project setup complete!${NC}"
echo ""
echo "📋 Project IDs saved to: vercel-project-ids.env"
echo ""
echo -e "${YELLOW}🔑 Next steps:${NC}"
echo "1. Run ./scripts/setup-github-secrets.sh to add project IDs to GitHub"
echo "2. Run ./scripts/setup-vercel-env.sh to configure environment variables"
echo "3. Push to main to trigger deployment"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "- Projects are now properly configured for monorepo deployment"
echo "- Each project has its root directory set to apps/[app-name]"
echo "- Build commands will run from the monorepo root"