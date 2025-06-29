#!/bin/bash

# Convert workspace:* to file: protocol for npm compatibility

echo "🔄 Converting workspace:* to file: protocol for all apps..."

for app_dir in apps/*/; do
    if [ -f "$app_dir/package.json" ]; then
        app_name=$(basename "$app_dir")
        echo "✏️  Updating $app_name..."
        
        # Replace workspace:* with file: protocol
        sed -i 's|"@ganger/auth": "workspace:\*"|"@ganger/auth": "file:../../packages/auth"|g' "$app_dir/package.json"
        sed -i 's|"@ganger/cache": "workspace:\*"|"@ganger/cache": "file:../../packages/cache"|g' "$app_dir/package.json"
        sed -i 's|"@ganger/config": "workspace:\*"|"@ganger/config": "file:../../packages/config"|g' "$app_dir/package.json"
        sed -i 's|"@ganger/db": "workspace:\*"|"@ganger/db": "file:../../packages/db"|g' "$app_dir/package.json"
        sed -i 's|"@ganger/docs": "workspace:\*"|"@ganger/docs": "file:../../packages/docs"|g' "$app_dir/package.json"
        sed -i 's|"@ganger/integrations": "workspace:\*"|"@ganger/integrations": "file:../../packages/integrations"|g' "$app_dir/package.json"
        sed -i 's|"@ganger/monitoring": "workspace:\*"|"@ganger/monitoring": "file:../../packages/monitoring"|g' "$app_dir/package.json"
        sed -i 's|"@ganger/types": "workspace:\*"|"@ganger/types": "file:../../packages/types"|g' "$app_dir/package.json"
        sed -i 's|"@ganger/ui": "workspace:\*"|"@ganger/ui": "file:../../packages/ui"|g' "$app_dir/package.json"
        sed -i 's|"@ganger/utils": "workspace:\*"|"@ganger/utils": "file:../../packages/utils"|g' "$app_dir/package.json"
    fi
done

echo "✅ All apps converted to file: protocol"