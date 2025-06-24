#!/bin/bash

# Simple Vercel deployment for the staff portal
# This treats the staff app as a standalone Next.js app

set -e

echo "🚀 Starting simple Vercel deployment..."

# Navigate to staff app
cd apps/staff

# Create a temporary package.json that includes workspace dependencies
echo "📦 Creating deployment package.json..."
node -e "
const pkg = require('./package.json');
const rootPkg = require('../../package.json');

// Replace workspace references with versions
const deps = { ...pkg.dependencies };
const devDeps = { ...pkg.devDependencies };

Object.keys(deps).forEach(key => {
  if (deps[key] === 'workspace:*') {
    deps[key] = '*';
  }
});

Object.keys(devDeps).forEach(key => {
  if (devDeps[key] === 'workspace:*') {
    devDeps[key] = '*';
  }
});

pkg.dependencies = deps;
pkg.devDependencies = devDeps;

console.log(JSON.stringify(pkg, null, 2));
" > package.deploy.json

# Backup original and use deployment version
mv package.json package.original.json
mv package.deploy.json package.json

# Deploy to Vercel
echo "🏗️ Deploying to Vercel..."
vercel --prod \
    --token="RdwA23mHSvPcm9ptReM6zxjF" \
    --scope="team_wpY7PcIsYQNnslNN39o7fWvS" \
    --yes \
    --name="ganger-staff-portal"

# Restore original package.json
mv package.original.json package.json

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Add custom domain: staff.gangerdermatology.com"
echo "2. The app routes (/inventory, /handouts, etc) will show in the sidebar"
echo "3. Those routes will need to be implemented or connected later"