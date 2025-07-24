#!/bin/bash

# TypeScript Type Validation Script
# Validates TypeScript types across all packages and apps

set -e

echo "🔍 Validating TypeScript types..."

# Validate packages
echo "📦 Checking packages..."
PACKAGES=(
  "auth"
  "cache"
  "config"
  "db"
  "deps"
  "integrations"
  "monitoring"
  "types"
  "ui"
  "ui-catalyst"
  "utils"
)

FAILED_PACKAGES=()
for PACKAGE in "${PACKAGES[@]}"; do
  echo -n "  Checking @ganger/$PACKAGE... "
  if pnpm -F @ganger/$PACKAGE type-check > /dev/null 2>&1; then
    echo "✅"
  else
    echo "❌"
    FAILED_PACKAGES+=($PACKAGE)
  fi
done

# Validate apps
echo ""
echo "🚀 Checking apps..."
APPS=(
  "ai-receptionist"
  "batch"
  "call-center"
  "clinical-staffing"
  "compliance"
  "component-showcase"
  "config"
  "handouts"
  "inventory"
  "kiosk"
  "l10"
  "medication-auth"
  "pharma"
  "platform-dashboard"
  "socials"
  "staff"
  "status"
)

FAILED_APPS=()
for APP in "${APPS[@]}"; do
  echo -n "  Checking @ganger/$APP... "
  if pnpm -F @ganger/$APP type-check > /dev/null 2>&1; then
    echo "✅"
  else
    echo "❌"
    FAILED_APPS+=($APP)
  fi
done

echo ""
echo "========================================="
echo "Type Check Summary"
echo "========================================="

if [ ${#FAILED_PACKAGES[@]} -eq 0 ] && [ ${#FAILED_APPS[@]} -eq 0 ]; then
  echo "✅ All type checks passed!"
else
  if [ ${#FAILED_PACKAGES[@]} -gt 0 ]; then
    echo "❌ Failed packages:"
    for PACKAGE in "${FAILED_PACKAGES[@]}"; do
      echo "  - @ganger/$PACKAGE"
    done
  fi
  
  if [ ${#FAILED_APPS[@]} -gt 0 ]; then
    echo "❌ Failed apps:"
    for APP in "${FAILED_APPS[@]}"; do
      echo "  - @ganger/$APP"
    done
  fi
  
  exit 1
fi