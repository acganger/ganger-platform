#!/bin/bash

# Fix all file: references to workspace:* in package.json files

echo "Fixing package references in all apps..."

# Find all package.json files in apps directory
find apps -name "package.json" -type f | while read -r file; do
    echo "Fixing: $file"
    
    # Replace all file: references with workspace:*
    sed -i 's/"file:\.\.\/\.\.\/packages\/[^"]*"/"workspace:*"/g' "$file"
done

echo "Done! Now updating pnpm lockfile..."
npx pnpm@8.15.0 install

echo "Complete!"