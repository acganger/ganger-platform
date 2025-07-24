#!/bin/bash

# Pre-deployment Validation Script
# Comprehensive checks before pushing to main

set -e

echo "🚀 Running pre-deployment checks..."
echo ""

# Check for uncommitted changes
echo "📝 Checking for uncommitted changes..."
if [[ -n $(git status --porcelain) ]]; then
  echo "❌ Uncommitted changes detected. Please commit or stash them first."
  exit 1
else
  echo "✅ Working directory clean"
fi

# Run type checks
echo ""
echo "🔍 Running type checks..."
if ./scripts/validate-types.sh > /dev/null 2>&1; then
  echo "✅ All type checks passed"
else
  echo "❌ Type check failures detected"
  exit 1
fi

# Run build validation
echo ""
echo "🏗️ Validating builds..."
if ./scripts/validate-builds.sh > /dev/null 2>&1; then
  echo "✅ All builds successful"
else
  echo "❌ Build failures detected"
  exit 1
fi

# Check for console.log statements in production code
echo ""
echo "🔍 Checking for console.log statements..."
CONSOLE_LOGS=$(grep -r "console\\.log" --include="*.ts" --include="*.tsx" apps/ packages/ --exclude-dir=node_modules --exclude-dir=.next | grep -v "// eslint-disable-line" | wc -l)
if [ $CONSOLE_LOGS -gt 0 ]; then
  echo "⚠️  Found $CONSOLE_LOGS console.log statements (consider removing for production)"
else
  echo "✅ No console.log statements found"
fi

# Check for TODO comments
echo ""
echo "📋 Checking for TODO comments..."
TODOS=$(grep -r "TODO\\|FIXME\\|HACK" --include="*.ts" --include="*.tsx" apps/ packages/ --exclude-dir=node_modules --exclude-dir=.next | wc -l)
if [ $TODOS -gt 0 ]; then
  echo "⚠️  Found $TODOS TODO/FIXME/HACK comments"
else
  echo "✅ No TODO comments found"
fi

# Verify environment variables
echo ""
echo "🔐 Checking environment variables..."
if [ -f .env ]; then
  echo "✅ .env file exists"
else
  echo "❌ .env file missing"
  exit 1
fi

echo ""
echo "========================================="
echo "Pre-deployment Check Summary"
echo "========================================="
echo "✅ All critical checks passed!"
echo ""
echo "Ready to deploy to Vercel 🚀"