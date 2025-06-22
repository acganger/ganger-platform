#!/bin/bash
# Step 2: Install Dependencies and Build Packages

echo "🚀 Ganger Platform VM Deployment - Step 2: Dependencies"
echo "======================================================"
echo ""

cd ~/ganger-platform

echo "📦 Installing all dependencies with pnpm..."
pnpm install

echo ""
echo "🔨 Building shared packages..."
pnpm --filter "./packages/**" build

echo ""
echo "✅ Dependencies installed and packages built!"
echo ""
echo "Next: Run vm-deploy-step3.sh"