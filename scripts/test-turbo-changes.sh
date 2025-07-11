#!/bin/bash

# Test Turborepo Change Detection
# This script tests that Turborepo correctly identifies changed apps

echo "🧪 Testing Turborepo Change Detection"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📋 Current git status:"
git status --short
echo ""

echo "🔍 Checking what Turborepo detects as changed..."
echo ""

# Dry run to see what would be built
echo "Build tasks that would run:"
npx turbo run build --dry-run --filter="...[HEAD^1]" 2>/dev/null | grep -E "• @ganger/" | awk '{print $2}' | sed 's/@ganger\///' | sort | uniq || echo "No changes detected"

echo ""
echo "Lint tasks that would run:"
npx turbo run lint --dry-run --filter="...[HEAD^1]" 2>/dev/null | grep -E "• @ganger/" | awk '{print $2}' | sed 's/@ganger\///' | sort | uniq || echo "No changes detected"

echo ""
echo "Type-check tasks that would run:"
npx turbo run type-check --dry-run --filter="...[HEAD^1]" 2>/dev/null | grep -E "• @ganger/" | awk '{print $2}' | sed 's/@ganger\///' | sort | uniq || echo "No changes detected"

echo ""
echo -e "${YELLOW}💡 Tip:${NC} Use 'pnpm build:changed' to build only changed apps"
echo -e "${YELLOW}💡 Tip:${NC} Use 'pnpm verify:changed' to verify only changed apps"
echo ""

# Show affected files
echo "📁 Files changed since last commit:"
git diff --name-only HEAD^1 HEAD 2>/dev/null || echo "No previous commit to compare"
echo ""

echo -e "${GREEN}✅ Test complete!${NC}"