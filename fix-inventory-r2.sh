#!/bin/bash

echo "🔧 Fixing Inventory R2 Uploads"
echo "=============================="
echo ""

export CLOUDFLARE_API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"

# Navigate to inventory app
cd /mnt/q/Projects/ganger-platform/apps/inventory

# Upload files without the inventory prefix
echo "📤 Re-uploading files to R2 without prefix..."

find out -type f | while read file; do
    # Get relative path from out directory
    relative_path="${file#out/}"
    
    # Skip if empty
    [ -z "$relative_path" ] && continue
    
    # Determine content type
    case "$file" in
        *.html) content_type="text/html" ;;
        *.css) content_type="text/css" ;;
        *.js) content_type="application/javascript" ;;
        *.json) content_type="application/json" ;;
        *.png) content_type="image/png" ;;
        *.jpg|*.jpeg) content_type="image/jpeg" ;;
        *.svg) content_type="image/svg+xml" ;;
        *.ico) content_type="image/x-icon" ;;
        *) content_type="application/octet-stream" ;;
    esac
    
    # Upload WITHOUT the inventory prefix
    echo -n "  Uploading $relative_path... "
    npx wrangler r2 object put "inventory-management-production/$relative_path" --file "$file" --content-type "$content_type" 2>/dev/null && echo "✓" || echo "✗"
done

echo ""
echo "✅ Files re-uploaded without inventory prefix"
echo ""
echo "📝 Testing with: https://staff.gangerdermatology.com/inventory"