#!/bin/bash

# Fix assetPrefix issues for standalone deployment
# These apps were configured for subdirectory deployment but need to work standalone

echo "🔧 Fixing assetPrefix configuration for failed apps..."

# Apps that need fixing
apps=(
    "ai-receptionist"
    "pharma-scheduling"
    "socials-reviews"
    "integration-status"
)

for app in "${apps[@]}"; do
    config_file="apps/$app/next.config.js"
    
    if [ -f "$config_file" ]; then
        echo "Fixing $app..."
        
        # Comment out basePath and assetPrefix for standalone deployment
        sed -i.bak 's/^  basePath:/  \/\/ basePath:/' "$config_file"
        sed -i 's/^  assetPrefix:/  \/\/ assetPrefix:/' "$config_file"
        
        echo "✓ Fixed $app"
    else
        echo "⚠️  Config not found for $app"
    fi
done

echo ""
echo "✅ Configuration fixed!"
echo ""
echo "Next steps:"
echo "1. Commit the changes"
echo "2. Push to trigger rebuild"