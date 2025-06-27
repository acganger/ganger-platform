#!/bin/bash

# Restore workspace:* protocol for all apps

echo "🔄 Restoring workspace:* protocol for all apps..."

for app_dir in apps/*/; do
    if [ -f "$app_dir/package.json" ]; then
        app_name=$(basename "$app_dir")
        echo "✏️  Updating $app_name..."
        
        # Replace file: protocol with workspace:*
        sed -i 's|"@ganger/[^"]*": "file:../../packages/[^"]*"|&|g; s|"file:../../packages/[^"]*"|"workspace:*"|g' "$app_dir/package.json"
    fi
done

echo "✅ All apps restored to workspace:* protocol"