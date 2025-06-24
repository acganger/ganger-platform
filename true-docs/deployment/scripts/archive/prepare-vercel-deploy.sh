#!/bin/bash

# Prepare staff app for standalone Vercel deployment
# This creates a deployable version with all dependencies included

set -e

echo "🚀 Preparing staff app for Vercel deployment..."

# Create a temporary deployment directory
DEPLOY_DIR="/tmp/ganger-staff-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy the staff app
echo "📦 Copying staff app..."
cp -r apps/staff/* $DEPLOY_DIR/
cp -r apps/staff/.* $DEPLOY_DIR/ 2>/dev/null || true

# Copy necessary packages
echo "📦 Copying workspace packages..."
mkdir -p $DEPLOY_DIR/packages
cp -r packages/auth $DEPLOY_DIR/packages/
cp -r packages/db $DEPLOY_DIR/packages/
cp -r packages/integrations $DEPLOY_DIR/packages/
cp -r packages/types $DEPLOY_DIR/packages/
cp -r packages/ui $DEPLOY_DIR/packages/
cp -r packages/utils $DEPLOY_DIR/packages/
cp -r packages/config $DEPLOY_DIR/packages/

# Create a root package.json for the deployment
echo "📝 Creating deployment package.json..."
cat > $DEPLOY_DIR/package.json << 'EOF'
{
  "name": "ganger-staff-deploy",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    ".",
    "packages/*"
  ],
  "dependencies": {},
  "devDependencies": {}
}
EOF

# Update the staff app's package.json to use local packages
echo "📝 Updating package references..."
cd $DEPLOY_DIR
sed -i 's/"workspace:\*"/"file:packages\/auth"/g' package.json
sed -i 's/"@ganger\/auth": "workspace:\*"/"@ganger\/auth": "file:packages\/auth"/g' package.json
sed -i 's/"@ganger\/db": "workspace:\*"/"@ganger\/db": "file:packages\/db"/g' package.json
sed -i 's/"@ganger\/integrations": "workspace:\*"/"@ganger\/integrations": "file:packages\/integrations"/g' package.json
sed -i 's/"@ganger\/types": "workspace:\*"/"@ganger\/types": "file:packages\/types"/g' package.json
sed -i 's/"@ganger\/ui": "workspace:\*"/"@ganger\/ui": "file:packages\/ui"/g' package.json
sed -i 's/"@ganger\/utils": "workspace:\*"/"@ganger\/utils": "file:packages\/utils"/g' package.json
sed -i 's/"@ganger\/config": "workspace:\*"/"@ganger\/config": "file:packages\/config"/g' package.json

# Copy environment files
echo "📝 Copying environment files..."
cp /mnt/q/Projects/ganger-platform/.env.local $DEPLOY_DIR/ 2>/dev/null || true

# Create vercel.json
echo "📝 Creating vercel.json..."
cat > $DEPLOY_DIR/vercel.json << 'EOF'
{
  "framework": "nextjs",
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
EOF

echo "✅ Deployment package ready at: $DEPLOY_DIR"
echo ""
echo "📝 Next steps:"
echo "1. cd $DEPLOY_DIR"
echo "2. vercel --prod"
echo "3. Follow the prompts to deploy"

# Navigate to deployment directory
cd $DEPLOY_DIR
echo ""
echo "🚀 Ready to deploy! Running: vercel --prod"

# Deploy to Vercel
vercel --prod --token="RdwA23mHSvPcm9ptReM6zxjF" --scope="team_wpY7PcIsYQNnslNN39o7fWvS" --yes --name="ganger-staff-portal"