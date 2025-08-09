#!/bin/bash

# Build and test Group 1 (highest priority) apps
echo "Building Group 1 Apps (Highest Priority)"
echo "========================================"

# Group 1 apps
apps=(
  "batch-closeout"
  "checkin-kiosk"
  "eos-l10"
  "ganger-actions"
  "ganger-staff"
  "handouts"
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
echo "========================================"
echo "GROUP 1 BUILD SUMMARY"
echo "========================================"
echo "✅ Success: $success_count"
echo "❌ Failed: $fail_count"

if [ ${#failed_apps[@]} -gt 0 ]; then
  echo ""
  echo "Failed apps:"
  for app in "${failed_apps[@]}"; do
    echo "  - $app"
  done
fi