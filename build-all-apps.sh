#!/bin/bash

# Build all apps in the monorepo and track their status
echo "Building all apps in the Ganger Platform monorepo..."
echo "============================================="

# Array to track build results
declare -A build_results

# List of all apps
apps=(
  "ai-purchasing-agent"
  "ai-receptionist"
  "batch-closeout"
  "call-center-ops"
  "checkin-kiosk"
  "clinical-staffing"
  "compliance-training"
  "component-showcase"
  "config-dashboard"
  "consolidated-order-form"
  "eos-l10"
  "ganger-actions"
  "ganger-staff"
  "handouts"
  "integration-status"
  "inventory"
  "llm-demo"
  "medication-auth"
  "pharma-scheduling"
  "platform-dashboard"
  "socials-reviews"
)

# Build each app
for app in "${apps[@]}"; do
  echo ""
  echo "Building @ganger/$app..."
  echo "------------------------"
  
  if pnpm -F @ganger/$app build 2>&1 | tee /tmp/build-$app.log; then
    build_results[$app]="✅ SUCCESS"
    echo "✅ $app built successfully!"
  else
    build_results[$app]="❌ FAILED"
    echo "❌ $app build failed!"
  fi
done

# Summary
echo ""
echo "============================================="
echo "BUILD SUMMARY"
echo "============================================="

success_count=0
fail_count=0

for app in "${apps[@]}"; do
  echo "${build_results[$app]} - $app"
  if [[ ${build_results[$app]} == "✅ SUCCESS" ]]; then
    ((success_count++))
  else
    ((fail_count++))
  fi
done

echo ""
echo "Total: ${#apps[@]} apps"
echo "✅ Success: $success_count"
echo "❌ Failed: $fail_count"
echo ""

if [ $fail_count -gt 0 ]; then
  echo "Failed apps need attention!"
  exit 1
else
  echo "All apps built successfully! 🎉"
  exit 0
fi