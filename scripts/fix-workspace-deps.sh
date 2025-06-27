#!/bin/bash

# Fix workspace dependencies for npm compatibility
# Converts workspace:* to file:../../packages/* format

set -e

echo "🔧 Fixing workspace dependencies for npm compatibility..."

# Fix root package.json
if [ -f "package.json" ]; then
    echo "Fixing root package.json..."
    sed -i 's/"workspace:\*"/"*"/g' package.json
fi

# Fix all app package.json files
for app_dir in apps/*/; do
    if [ -f "$app_dir/package.json" ]; then
        echo "Fixing $app_dir/package.json..."
        # Convert workspace:* to file: protocol
        sed -i 's|"@ganger/\([^"]*\)": "workspace:\*"|"@ganger/\1": "file:../../packages/\1"|g' "$app_dir/package.json"
    fi
done

# Fix all package package.json files
for pkg_dir in packages/*/; do
    if [ -f "$pkg_dir/package.json" ]; then
        echo "Fixing $pkg_dir/package.json..."
        # Convert workspace:* to file: protocol for packages
        sed -i 's|"@ganger/\([^"]*\)": "workspace:\*"|"@ganger/\1": "file:../\1"|g' "$pkg_dir/package.json"
    fi
done

echo "✅ Workspace dependencies fixed!"
echo ""
echo "Now you can run:"
echo "  npm install --legacy-peer-deps"
echo "  npm run build:eos-l10"