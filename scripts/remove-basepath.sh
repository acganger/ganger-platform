#!/bin/bash

# Remove basePath configuration from all apps except staff portal
# This allows apps to work both standalone and via staff portal proxy

echo "Removing basePath configurations from Next.js apps..."

# List of all apps (excluding staff which may need special handling)
APPS=(
    "ai-receptionist"
    "batch-closeout"
    "call-center-ops"
    "checkin-kiosk"
    "clinical-staffing"
    "compliance-training"
    "component-showcase"
    "config-dashboard"
    "eos-l10"
    "handouts"
    "medication-auth"
    "pharma-scheduling"
    "platform-dashboard"
)

for app in "${APPS[@]}"; do
    config_file="apps/$app/next.config.js"
    
    if [ -f "$config_file" ]; then
        echo "Processing $app..."
        
        # Create a temporary file with the basePath section removed
        sed -i.bak '/\/\/ Dynamic path configuration/,/}),/c\  // No basePath needed - Vercel will handle routing via rewrites' "$config_file"
        
        # Also remove any standalone basePath/assetPrefix lines
        sed -i '/^[[:space:]]*basePath:/d' "$config_file"
        sed -i '/^[[:space:]]*assetPrefix:/d' "$config_file"
        
        # Clean up backup files
        rm -f "$config_file.bak"
    fi
done

echo "✅ BasePath configurations removed from all apps"