#!/bin/bash

# Remove edge runtime declarations for Vercel compatibility
# The edge runtime was used for Cloudflare Workers but causes issues with Vercel

echo "🔧 Removing edge runtime declarations from all apps..."

# Find all files with edge runtime and comment them out
find apps -name "*.tsx" -o -name "*.ts" | while read file; do
  if grep -q "runtime.*=.*'edge'" "$file"; then
    echo "  Updating: $file"
    # Comment out the edge runtime line
    sed -i "s/^export const runtime = 'edge';/\/\/ export const runtime = 'edge'; \/\/ Removed for Vercel compatibility/" "$file"
  fi
done

echo "✅ Edge runtime declarations removed"
echo ""
echo "Note: These were used for Cloudflare Workers deployment."
echo "Vercel uses its own edge runtime which is configured differently."