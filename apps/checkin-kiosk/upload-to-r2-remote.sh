#!/bin/bash

# Upload Check-in Kiosk files to R2 bucket (remote)
set -e

export CLOUDFLARE_API_TOKEN=TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf

echo "📦 Uploading Check-in Kiosk files to R2 production bucket (remote)..."

cd out

# Count total files
TOTAL=$(find . -type f | wc -l)
COUNT=0

# Upload all files to remote R2
find . -type f | while read file; do
    # Remove leading ./ from file path
    key=${file#./}
    COUNT=$((COUNT + 1))
    
    # Determine content type
    case "$file" in
        *.html) CONTENT_TYPE="text/html";;
        *.js) CONTENT_TYPE="application/javascript";;
        *.css) CONTENT_TYPE="text/css";;
        *.json) CONTENT_TYPE="application/json";;
        *.png) CONTENT_TYPE="image/png";;
        *.jpg|*.jpeg) CONTENT_TYPE="image/jpeg";;
        *.svg) CONTENT_TYPE="image/svg+xml";;
        *.ico) CONTENT_TYPE="image/x-icon";;
        *) CONTENT_TYPE="application/octet-stream";;
    esac
    
    echo "[$COUNT/$TOTAL] Uploading: $key"
    npx wrangler r2 object put ganger-checkin-kiosk-production/"$key" --file="$file" --content-type="$CONTENT_TYPE" --remote 2>&1 | grep -E "(Uploading|Creating|Success|Error)" || true
done

echo "✅ Upload completed!"

# Verify a key file was uploaded (with remote flag)
echo "🔍 Verifying upload..."
npx wrangler r2 object get ganger-checkin-kiosk-production/index.html --file /tmp/verify-index.html --remote 2>&1 > /dev/null && echo "✅ Verification successful!" || echo "❌ Verification failed!"

# Check file size to confirm
if [ -f /tmp/verify-index.html ]; then
    SIZE=$(stat -c%s /tmp/verify-index.html 2>/dev/null || stat -f%z /tmp/verify-index.html 2>/dev/null)
    echo "📊 Verified file size: $SIZE bytes"
    rm /tmp/verify-index.html
fi