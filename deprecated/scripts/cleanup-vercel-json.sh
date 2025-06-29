#!/bin/bash

# Script to remove ignoreCommand from all vercel.json files

echo "🧹 Removing ignoreCommand from all vercel.json files..."

# Find all vercel.json files with ignoreCommand
for file in apps/*/vercel.json; do
  if [ -f "$file" ] && grep -q "ignoreCommand" "$file"; then
    echo "Cleaning $file..."
    # Use sed to remove the ignoreCommand line and any trailing comma
    sed -i.bak '/"ignoreCommand":/d' "$file"
    # Clean up any double commas that might result
    sed -i 's/,\s*,/,/g' "$file"
    # Remove trailing comma before closing brace
    sed -i 's/,\s*}/}/g' "$file"
    # Remove backup file
    rm "${file}.bak"
  fi
done

echo "✅ Cleanup complete!"