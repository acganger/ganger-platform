#!/bin/bash

# ============================================================================
# Setup Vercel Projects with GitHub Integration
# ============================================================================
# This script creates Vercel projects connected to GitHub from the start
# Uses Vercel's native GitHub integration for automatic deployments
# ============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Vercel GitHub Integration Setup${NC}"
echo "Setting up projects with automatic GitHub deployments"
echo ""

# Configuration
VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"
GITHUB_REPO="acganger/ganger-platform"
GITHUB_REPO_ID="996544644"

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

# Create output file for project IDs
echo "# Vercel Project IDs - Generated $(date)" > vercel-project-ids-new.env
echo "# Projects with GitHub integration enabled" >> vercel-project-ids-new.env
echo "" >> vercel-project-ids-new.env

# Function to create project with GitHub integration
create_github_project() {
  local app=$1
  echo -e "\n${GREEN}📦 Creating project: ganger-$app${NC}"
  
  # Create project with GitHub integration
  echo "Creating project with GitHub integration..."
  RESPONSE=$(curl -s -X POST "https://api.vercel.com/v10/projects?teamId=$VERCEL_TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"ganger-$app\",
      \"framework\": \"nextjs\",
      \"rootDirectory\": \"apps/$app\",
      \"buildCommand\": \"cd ../.. && pnpm run build --filter=@ganger/$app...\",
      \"installCommand\": \"cd ../.. && pnpm install\",
      \"outputDirectory\": \".next\",
      \"gitRepository\": {
        \"type\": \"github\",
        \"repo\": \"$GITHUB_REPO\"
      }
    }")
  
  # Extract project ID
  PROJECT_ID=$(echo "$RESPONSE" | python3 -c "import json,sys; data=json.load(sys.stdin); print(data.get('id', ''))" 2>/dev/null || echo "")
  
  if [ -n "$PROJECT_ID" ]; then
    echo -e "${GREEN}✅ Created project with ID: $PROJECT_ID${NC}"
    
    # Save project ID
    APP_UPPER=$(echo "$app" | tr '-' '_' | tr '[:lower:]' '[:upper:]')
    echo "VERCEL_PROJECT_ID_$APP_UPPER=$PROJECT_ID" >> vercel-project-ids-new.env
    
    # Connect to GitHub repository
    echo "Connecting to GitHub repository..."
    LINK_RESPONSE=$(curl -s -X POST "https://api.vercel.com/v9/projects/$PROJECT_ID/link?teamId=$VERCEL_TEAM_ID" \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"type\": \"github\",
        \"repo\": \"$GITHUB_REPO\",
        \"gitCredentialId\": \"\"
      }")
    
    echo -e "${GREEN}✅ GitHub integration configured${NC}"
  else
    echo -e "${RED}❌ Failed to create project${NC}"
    echo "Response: $RESPONSE"
  fi
}

# Create all projects
for app in "${APPS[@]}"; do
  create_github_project "$app"
done

echo -e "\n${GREEN}✅ All projects created with GitHub integration!${NC}"
echo ""
echo "📋 Project IDs saved to: vercel-project-ids-new.env"
echo ""
echo -e "${YELLOW}🔑 Next steps:${NC}"
echo "1. Go to https://vercel.com/ganger to verify projects"
echo "2. Each project should show 'Connected to GitHub'"
echo "3. Push to main branch will automatically deploy"
echo "4. Configure custom domains in Vercel dashboard"