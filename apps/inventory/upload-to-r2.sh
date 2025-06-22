#!/bin/bash

# Upload script for R2 bucket
set -e

export CLOUDFLARE_API_TOKEN=TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf
BUCKET_NAME="ganger-inventory-assets"

echo "📤 Uploading files to R2 bucket: $BUCKET_NAME"

# Function to determine content type
get_content_type() {
    case "$1" in
        *.html) echo "text/html" ;;
        *.css) echo "text/css" ;;
        *.js) echo "application/javascript" ;;
        *.json) echo "application/json" ;;
        *.png) echo "image/png" ;;
        *.jpg|*.jpeg) echo "image/jpeg" ;;
        *.gif) echo "image/gif" ;;
        *.svg) echo "image/svg+xml" ;;
        *.ico) echo "image/x-icon" ;;
        *.woff) echo "font/woff" ;;
        *.woff2) echo "font/woff2" ;;
        *.ttf) echo "font/ttf" ;;
        *.eot) echo "application/vnd.ms-fontobject" ;;
        *) echo "application/octet-stream" ;;
    esac
}

# Upload all files
cd out
for file in $(find . -type f); do
    key=${file#./}
    content_type=$(get_content_type "$key")
    echo "Uploading: $key (type: $content_type)"
    wrangler r2 object put "$BUCKET_NAME/$key" --file="$file" --content-type="$content_type" || echo "Failed: $key"
done

echo "✅ Upload complete!"