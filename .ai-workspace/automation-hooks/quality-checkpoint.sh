#!/bin/bash
# 🔍 Quality Checkpoint System
# Automated quality gates for Beast Mode development

echo "🔍 Running Beast Mode Quality Checkpoint..."
echo "🎯 Platform: Ganger Platform (Medical Practice Management)"
echo ""

# Initialize results
TYPESCRIPT_PASS=false
LINT_PASS=false
BUILD_PASS=false
OVERALL_PASS=false

# TypeScript compilation check
echo "📊 TypeScript Compilation:"
if npm run type-check 2>/dev/null; then
    echo "✅ TypeScript compilation successful"
    TYPESCRIPT_PASS=true
else
    echo "❌ TypeScript compilation failed"
    echo "🔧 Run: npm run type-check (for detailed errors)"
fi

# ESLint check
echo ""
echo "📊 ESLint Code Quality:"
if npm run lint 2>/dev/null; then
    echo "✅ ESLint checks passing"
    LINT_PASS=true
else
    echo "❌ ESLint issues found"
    echo "🔧 Run: npm run lint (for detailed issues)"
fi

# Build check
echo ""
echo "📊 Build Process:"
if npm run build 2>/dev/null; then
    echo "✅ Build successful"
    BUILD_PASS=true
else
    echo "❌ Build failed"
    echo "🔧 Run: npm run build (for detailed errors)"
fi

# Overall assessment
echo ""
echo "📊 Overall Quality Assessment:"
if [ "$TYPESCRIPT_PASS" = true ] && [ "$LINT_PASS" = true ] && [ "$BUILD_PASS" = true ]; then
    echo "✅ ALL QUALITY GATES PASSED"
    echo "🎉 Code meets Ganger Platform quality standards"
    echo "🚀 Ready for production deployment"
    OVERALL_PASS=true
else
    echo "❌ QUALITY GATES FAILED"
    echo "🔧 Fix required issues before proceeding"
    
    if [ "$TYPESCRIPT_PASS" = false ]; then
        echo "   - TypeScript compilation errors"
    fi
    if [ "$LINT_PASS" = false ]; then
        echo "   - ESLint code quality issues"
    fi
    if [ "$BUILD_PASS" = false ]; then
        echo "   - Build process failures"
    fi
fi

# Platform-specific checks
echo ""
echo "📊 Platform-Specific Checks:"

# Check if Universal Hubs are accessible
echo "🔌 Universal Hubs Status:"
if [ -d "packages/integrations/src/communication" ]; then
    echo "✅ Universal Communication Hub: Available"
else
    echo "❌ Universal Communication Hub: Missing"
fi

if [ -d "packages/integrations/src/payments" ]; then
    echo "✅ Universal Payment Hub: Available"
else
    echo "❌ Universal Payment Hub: Missing"
fi

if [ -d "packages/integrations/src/database" ]; then
    echo "✅ Enhanced Database Hub: Available"
else
    echo "❌ Enhanced Database Hub: Missing"
fi

# Check shared packages
echo ""
echo "📦 Shared Packages Status:"
for package in ui auth db integrations utils; do
    if [ -d "packages/$package" ]; then
        echo "✅ @ganger/$package: Available"
    else
        echo "❌ @ganger/$package: Missing"
    fi
done

# Check production apps
echo ""
echo "🏥 Production Applications Status:"
for app in inventory handouts checkin-kiosk; do
    if [ -d "apps/$app" ]; then
        echo "✅ $app: Available"
    else
        echo "❌ $app: Missing"
    fi
done

# Terminal coordination check
echo ""
echo "🔄 Terminal Coordination Status:"
if [ -f ".ai-workspace/terminal-coordination/frontend-terminal-state.json" ]; then
    FRONTEND_STATUS=$(cat .ai-workspace/terminal-coordination/frontend-terminal-state.json | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
    echo "🖥️ Frontend Terminal: $FRONTEND_STATUS"
else
    echo "🖥️ Frontend Terminal: Not initialized"
fi

if [ -f ".ai-workspace/terminal-coordination/backend-terminal-state.json" ]; then
    BACKEND_STATUS=$(cat .ai-workspace/terminal-coordination/backend-terminal-state.json | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
    echo "⚙️ Backend Terminal: $BACKEND_STATUS"
else
    echo "⚙️ Backend Terminal: Not initialized"
fi

# Git status check
echo ""
echo "📋 Git Repository Status:"
UNCOMMITTED_CHANGES=$(git status --porcelain | wc -l)
if [ $UNCOMMITTED_CHANGES -eq 0 ]; then
    echo "✅ No uncommitted changes"
else
    echo "⚠️ $UNCOMMITTED_CHANGES uncommitted changes"
    echo "💡 Consider committing completed work"
fi

# Summary and recommendations
echo ""
echo "========================================"
echo "🎯 QUALITY CHECKPOINT SUMMARY"
echo "========================================"

if [ "$OVERALL_PASS" = true ]; then
    echo "🎉 STATUS: EXCELLENT"
    echo "✅ All quality gates passed"
    echo "🚀 Ready for continued development or deployment"
    echo ""
    echo "💡 Recommendations:"
    echo "   - Continue with current development approach"
    echo "   - Consider committing current progress"
    echo "   - Ready for next Beast Mode development cycle"
else
    echo "⚠️ STATUS: REQUIRES ATTENTION"
    echo "🔧 Quality issues detected"
    echo "📋 Fix required before proceeding"
    echo ""
    echo "💡 Recommendations:"
    echo "   - Address TypeScript compilation errors first"
    echo "   - Fix ESLint code quality issues"
    echo "   - Ensure build process succeeds"
    echo "   - Re-run quality checkpoint after fixes"
    echo "   - Use Emergency Reset if needed (.ai-workspace/ai-beast-control.sh → Option 7)"
fi

echo ""
echo "📚 Resources:"
echo "   - Full documentation: docs/BEAST_MODE_REFERENCE.md"
echo "   - Platform status: PROJECT_TRACKER.md"
echo "   - Emergency help: .ai-workspace/ai-beast-control.sh"