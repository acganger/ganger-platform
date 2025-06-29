#!/bin/bash

# Script to add turbo-ignore to all apps' vercel.json files
# This prevents unnecessary rebuilds for unchanged apps

echo "🚀 Adding turbo-ignore to all apps..."

# List of all apps
apps=(
  "ai-receptionist"
  "batch-closeout"
  "call-center-ops"
  "checkin-kiosk"
  "clinical-staffing"
  "compliance-training"
  "component-showcase"
  "config-dashboard"
  "deployment-helper"
  "eos-l10"
  "handouts"
  "integration-status"
  "inventory"
  "llm-demo"
  "medication-auth"
  "pharma-scheduling"
  "platform-dashboard"
  "socials-reviews"
  "staff"
)

# Function to update vercel.json
update_vercel_json() {
  local app=$1
  local app_name="@ganger/$app"
  local vercel_file="apps/$app/vercel.json"
  
  echo "Processing $app..."
  
  # Check if vercel.json exists
  if [ ! -f "$vercel_file" ]; then
    echo "  Creating new vercel.json for $app"
    cat > "$vercel_file" << EOF
{
  "ignoreCommand": "cd ../.. && npx turbo-ignore $app_name",
  "installCommand": "cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile && pnpm run build:packages",
  "buildCommand": "cd ../.. && pnpm -F $app_name build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
EOF
  else
    # Check if ignoreCommand already exists
    if grep -q "ignoreCommand" "$vercel_file"; then
      echo "  ✓ ignoreCommand already exists in $app"
    else
      echo "  Adding ignoreCommand to existing vercel.json for $app"
      # Use jq to add ignoreCommand to existing JSON
      jq '. + {"ignoreCommand": "cd ../.. && npx turbo-ignore '"$app_name"'"}' "$vercel_file" > "$vercel_file.tmp" && mv "$vercel_file.tmp" "$vercel_file"
    fi
  fi
}

# Update all apps
for app in "${apps[@]}"; do
  update_vercel_json "$app"
done

echo "✅ Completed adding turbo-ignore to all apps!"
echo ""
echo "Next steps:"
echo "1. Review the changes with: git diff"
echo "2. Commit with: git add apps/*/vercel.json && git commit -m 'feat: Add turbo-ignore to prevent unnecessary rebuilds'"
echo "3. Push to trigger deployments: git push origin main"