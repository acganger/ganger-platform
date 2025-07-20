#!/bin/bash

# Find all next.config.js files with ignoreBuildErrors: true and fix them
echo "Fixing TypeScript strict mode in all apps..."

apps=(
  "ai-purchasing-agent"
  "ai-receptionist"
  "batch-closeout"
  "call-center-ops"
  "clinical-staffing"
  "compliance-training"
  "consolidated-order-form"
  "eos-l10"
  "handouts"
)

for app in "${apps[@]}"; do
  config_file="/q/Projects/ganger-platform/apps/$app/next.config.js"
  
  if [ -f "$config_file" ]; then
    echo "Fixing $app..."
    
    # Replace ignoreBuildErrors: true with false
    sed -i 's/ignoreBuildErrors: true/ignoreBuildErrors: false/g' "$config_file"
    
    # Also check for the pattern with spaces
    sed -i 's/ignoreBuildErrors\s*:\s*true/ignoreBuildErrors: false/g' "$config_file"
  fi
done

echo "Done! TypeScript strict mode has been enabled in all apps."