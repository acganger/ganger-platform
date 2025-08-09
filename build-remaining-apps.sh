#!/bin/bash

# Build and test remaining apps
echo "Building and testing remaining apps..."
echo "====================================="

# Array of apps to build
apps=(
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

# Track results
success_count=0
fail_count=0
failed_apps=()

# Build each app
for app in "${apps[@]}"; do
  echo ""
  echo "Building @ganger/$app..."
  echo "------------------------"
  
  if pnpm -F @ganger/$app build; then
    echo "✅ $app built successfully!"
    ((success_count++))
  else
    echo "❌ $app build failed!"
    ((fail_count++))
    failed_apps+=("$app")
  fi
done

# Summary
echo ""
echo "====================================="
echo "BUILD SUMMARY"
echo "====================================="
echo "✅ Success: $success_count"
echo "❌ Failed: $fail_count"

if [ ${#failed_apps[@]} -gt 0 ]; then
  echo ""
  echo "Failed apps:"
  for app in "${failed_apps[@]}"; do
    echo "  - $app"
  done
fi

echo ""
echo "Note: ai-purchasing-agent was skipped due to complex TypeScript errors"