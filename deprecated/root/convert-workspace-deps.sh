#!/bin/bash

echo "Converting workspace:* dependencies to file: paths..."
echo "===================================================="

# Find all package.json files in apps directory
for pkg in apps/*/package.json; do
  if [ -f "$pkg" ]; then
    app_name=$(basename $(dirname "$pkg"))
    echo "Processing $app_name..."
    
    # Create a backup
    cp "$pkg" "$pkg.backup"
    
    # Convert workspace:* to file:../../packages/[package-name]
    # This uses sed to replace workspace:* with file paths
    sed -i.tmp \
      -e 's|"@ganger/auth": "workspace:\*"|"@ganger/auth": "file:../../packages/auth"|g' \
      -e 's|"@ganger/cache": "workspace:\*"|"@ganger/cache": "file:../../packages/cache"|g' \
      -e 's|"@ganger/config": "workspace:\*"|"@ganger/config": "file:../../packages/config"|g' \
      -e 's|"@ganger/db": "workspace:\*"|"@ganger/db": "file:../../packages/db"|g' \
      -e 's|"@ganger/docs": "workspace:\*"|"@ganger/docs": "file:../../packages/docs"|g' \
      -e 's|"@ganger/integrations": "workspace:\*"|"@ganger/integrations": "file:../../packages/integrations"|g' \
      -e 's|"@ganger/monitoring": "workspace:\*"|"@ganger/monitoring": "file:../../packages/monitoring"|g' \
      -e 's|"@ganger/types": "workspace:\*"|"@ganger/types": "file:../../packages/types"|g' \
      -e 's|"@ganger/ui": "workspace:\*"|"@ganger/ui": "file:../../packages/ui"|g' \
      -e 's|"@ganger/utils": "workspace:\*"|"@ganger/utils": "file:../../packages/utils"|g' \
      "$pkg"
    
    # Remove temporary file
    rm -f "$pkg.tmp"
    
    echo "  ✅ Converted workspace dependencies to file paths"
  fi
done

echo ""
echo "Done! All workspace:* dependencies have been converted to file: paths."
echo "This should allow npm install to work correctly on Vercel."