#!/bin/bash
# Step 1: Prepare VM for Ganger Platform Deployment

echo "🚀 Ganger Platform VM Deployment - Step 1: Preparation"
echo "====================================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
node --version
npm --version
pnpm --version || echo "❌ pnpm not found - please install via: npm install -g pnpm"
pm2 --version
nginx -v

echo ""
echo "📁 Creating directory structure..."
mkdir -p ~/ganger-platform
cd ~/ganger-platform

echo ""
echo "✅ VM prepared for deployment!"
echo ""
echo "Next steps:"
echo "1. From your local machine, sync the monorepo:"
echo "   rsync -avz --exclude='node_modules' --exclude='.next' --exclude='dist' \\"
echo "     /mnt/q/Projects/ganger-platform/ \\"
echo "     anand@35.225.189.208:~/ganger-platform/"
echo ""
echo "2. Then run vm-deploy-step2.sh on the VM"