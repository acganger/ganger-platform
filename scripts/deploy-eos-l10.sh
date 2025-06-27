#!/bin/bash

# Deploy EOS L10 with proper monorepo handling
# This script demonstrates the correct way to deploy a monorepo app to Vercel

set -e

echo "🚀 Deploying EOS L10 to Vercel..."

# Environment variables
VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"
VERCEL_TEAM_ID="${VERCEL_TEAM_ID:-team_wpY7PcIsYQNnslNN39o7fWvS}"

# Method 1: Deploy from root with proper configuration
deploy_from_root() {
    echo "📦 Method 1: Deploy from monorepo root..."
    
    # Create a temporary vercel.json at root for this deployment
    cat > vercel.json << EOF
{
  "framework": "nextjs",
  "installCommand": "npm install --legacy-peer-deps",
  "buildCommand": "npm run build:eos-l10",
  "outputDirectory": "apps/eos-l10/.next",
  "rootDirectory": "./"
}
EOF
    
    # Deploy from root
    npx vercel \
        --token "$VERCEL_TOKEN" \
        --scope "$VERCEL_TEAM_ID" \
        --prod \
        --force \
        --name eos-l10 \
        --yes
    
    # Clean up temporary vercel.json
    rm vercel.json
}

# Method 2: Create standalone deployment package
create_standalone_package() {
    echo "📦 Method 2: Creating standalone deployment package..."
    
    # Create deployment directory
    DEPLOY_DIR="/tmp/eos-l10-deploy"
    rm -rf "$DEPLOY_DIR"
    mkdir -p "$DEPLOY_DIR"
    
    # Copy built app
    cp -r apps/eos-l10/.next "$DEPLOY_DIR/"
    cp apps/eos-l10/package.json "$DEPLOY_DIR/"
    cp apps/eos-l10/next.config.js "$DEPLOY_DIR/"
    
    # Copy public folder if exists
    if [ -d "apps/eos-l10/public" ]; then
        cp -r apps/eos-l10/public "$DEPLOY_DIR/"
    fi
    
    # Create minimal package.json for deployment
    cat > "$DEPLOY_DIR/package.json" << EOF
{
  "name": "@ganger/eos-l10",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
EOF
    
    # Create vercel.json for standalone deployment
    cat > "$DEPLOY_DIR/vercel.json" << EOF
{
  "framework": "nextjs",
  "installCommand": "npm install --production",
  "buildCommand": "echo 'Using pre-built output'",
  "outputDirectory": ".next"
}
EOF
    
    # Deploy from standalone directory
    cd "$DEPLOY_DIR"
    npx vercel \
        --token "$VERCEL_TOKEN" \
        --scope "$VERCEL_TEAM_ID" \
        --prod \
        --force \
        --name eos-l10 \
        --yes
    
    cd -
}

# Method 3: Use Vercel's monorepo support
configure_vercel_project() {
    echo "📦 Method 3: Configure Vercel project for monorepo..."
    
    # This would typically be done in Vercel dashboard
    echo "To properly configure in Vercel dashboard:"
    echo "1. Set Root Directory to: ./"
    echo "2. Set Build Command to: npm run build:eos-l10"
    echo "3. Set Output Directory to: apps/eos-l10/.next"
    echo "4. Set Install Command to: npm install --legacy-peer-deps"
    echo ""
    echo "Or use Vercel API to update project settings:"
    
    # Update project settings via API
    curl -X PATCH \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        "https://api.vercel.com/v9/projects/eos-l10?teamId=$VERCEL_TEAM_ID" \
        -d '{
            "rootDirectory": "./",
            "framework": "nextjs",
            "buildCommand": "npm run build:eos-l10",
            "outputDirectory": "apps/eos-l10/.next",
            "installCommand": "npm install --legacy-peer-deps"
        }'
}

# Main execution
echo "Choose deployment method:"
echo "1. Deploy from monorepo root"
echo "2. Create standalone package"
echo "3. Configure Vercel project settings"
echo ""

# For now, let's try method 2 (standalone package)
create_standalone_package