#!/bin/bash

# Script to add basePath configuration to all Next.js apps

echo "🔧 Adding basePath configuration to all apps..."
echo ""

# Define app mappings (app directory -> basePath)
declare -A APP_PATHS=(
  ["inventory"]="/inventory"
  ["handouts"]="/handouts"
  ["eos-l10"]="/l10"
  ["batch-closeout"]="/batch"
  ["compliance-training"]="/compliance"
  ["clinical-staffing"]="/clinical-staffing"
  ["config-dashboard"]="/config"
  ["integration-status"]="/status"
  ["ai-receptionist"]="/ai-receptionist"
  ["call-center-ops"]="/call-center"
  ["medication-auth"]="/medication-auth"
  ["pharma-scheduling"]="/pharma"
  ["checkin-kiosk"]="/kiosk"
  ["socials-reviews"]="/socials"
  ["component-showcase"]="/components"
  ["platform-dashboard"]="/platform-dashboard"
)

# Process each app
for app_dir in "${!APP_PATHS[@]}"; do
  base_path="${APP_PATHS[$app_dir]}"
  config_file="apps/$app_dir/next.config.js"
  
  if [ -f "$config_file" ]; then
    echo "📝 Processing $app_dir (basePath: $base_path)..."
    
    # Check if basePath already exists
    if grep -q "basePath:" "$config_file"; then
      echo "  ⚠️  basePath already configured, skipping..."
    else
      # Create backup
      cp "$config_file" "$config_file.backup"
      
      # Add basePath after reactStrictMode
      sed -i "/reactStrictMode:/a\\  basePath: '$base_path'," "$config_file"
      
      echo "  ✅ Added basePath: $base_path"
    fi
  else
    echo "❌ Config file not found: $config_file"
  fi
  echo ""
done

echo "✅ basePath configuration complete!"
echo ""
echo "Note: The staff app doesn't need a basePath as it's the root application."