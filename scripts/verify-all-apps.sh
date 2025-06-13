#!/bin/bash
# 🚀 Comprehensive App Verification Script
# Tests build capability and deployment readiness for all apps

set -e

echo "🔍 GANGER PLATFORM - APP VERIFICATION REPORT"
echo "============================================="
echo "Date: $(date)"
echo "Total Apps: 16"
echo ""

# App list
APPS=(
    "ai-receptionist"
    "batch-closeout" 
    "call-center-ops"
    "checkin-kiosk"
    "clinical-staffing"
    "compliance-training"
    "config-dashboard"
    "eos-l10"
    "handouts"
    "integration-status"
    "inventory"
    "medication-auth"
    "pharma-scheduling"
    "platform-dashboard"
    "socials-reviews"
    "staff"
)

# Counters
BUILD_SUCCESS=0
BUILD_FAILED=0
HAS_WRANGLER=0
HAS_WORKER=0
DEPLOY_READY=0

echo "📋 BUILD VERIFICATION"
echo "===================="

for app in "${APPS[@]}"; do
    echo ""
    echo "🔍 Testing: $app"
    echo "-------------------"
    
    cd "apps/$app"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo "❌ No package.json found"
        cd ../..
        continue
    fi
    
    # Check for Next.js configuration
    if [ -f "next.config.js" ]; then
        echo "✅ Next.js app detected"
    else
        echo "ℹ️  Non-Next.js app"
    fi
    
    # Check for wrangler.toml
    if [ -f "wrangler.toml" ]; then
        echo "🔧 Has wrangler.toml (Workers ready)"
        HAS_WRANGLER=$((HAS_WRANGLER + 1))
    else
        echo "⚠️  No wrangler.toml"
    fi
    
    # Check for worker files
    if [ -f "worker.js" ] || [ -f "worker-simple.js" ]; then
        echo "⚡ Has Worker implementation"
        HAS_WORKER=$((HAS_WORKER + 1))
    else
        echo "📝 No Worker file"
    fi
    
    # Test build
    echo "🏗️  Testing build..."
    if timeout 60 pnpm run build > /dev/null 2>&1; then
        echo "✅ BUILD SUCCESS"
        BUILD_SUCCESS=$((BUILD_SUCCESS + 1))
        
        # Check if deploy ready
        if [ -f "wrangler.toml" ] && ([ -f "worker.js" ] || [ -f "worker-simple.js" ]); then
            echo "🚀 DEPLOYMENT READY"
            DEPLOY_READY=$((DEPLOY_READY + 1))
        fi
    else
        echo "❌ BUILD FAILED"
        BUILD_FAILED=$((BUILD_FAILED + 1))
    fi
    
    cd ../..
done

echo ""
echo "📊 VERIFICATION SUMMARY"
echo "======================="
echo "Total Apps: 16"
echo "✅ Builds Successfully: $BUILD_SUCCESS"
echo "❌ Build Failures: $BUILD_FAILED"
echo "🔧 Has wrangler.toml: $HAS_WRANGLER"
echo "⚡ Has Worker files: $HAS_WORKER"
echo "🚀 Deployment Ready: $DEPLOY_READY"
echo ""

if [ $DEPLOY_READY -gt 0 ]; then
    echo "🎯 READY FOR DEPLOYMENT: $DEPLOY_READY apps can be deployed immediately"
else
    echo "⚠️  NO APPS READY: Need to add Workers configuration"
fi