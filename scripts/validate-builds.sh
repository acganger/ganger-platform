#!/bin/bash

# Vercel Build Validation Script
# Validates that all apps can build successfully before deployment

set -e

echo "🚀 Validating builds for all apps..."

# Array of apps to validate
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

# Track build results
FAILED_BUILDS=()
SUCCESSFUL_BUILDS=()

# Build each app
for APP in "${APPS[@]}"; do
  echo "Building @ganger/$APP..."
  
  if pnpm -F @ganger/$APP build > /dev/null 2>&1; then
    echo "✅ $APP build successful"
    SUCCESSFUL_BUILDS+=($APP)
  else
    echo "❌ $APP build failed"
    FAILED_BUILDS+=($APP)
  fi
done

echo ""
echo "========================================="
echo "Build Validation Summary"
echo "========================================="
echo "✅ Successful builds: ${#SUCCESSFUL_BUILDS[@]}"
echo "❌ Failed builds: ${#FAILED_BUILDS[@]}"

if [ ${#FAILED_BUILDS[@]} -gt 0 ]; then
  echo ""
  echo "Failed apps:"
  for APP in "${FAILED_BUILDS[@]}"; do
    echo "  - $APP"
  done
  exit 1
fi

echo ""
echo "🎉 All builds successful!"