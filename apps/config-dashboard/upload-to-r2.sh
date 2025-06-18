#!/bin/bash

# Upload script for config-dashboard static files to R2
BUCKET_NAME="config-dashboard-staging"
API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"
ACCOUNT_ID="68d0160c9915efebbbecfddfd48cddab"

echo "🚀 Uploading config-dashboard static files to R2 bucket: $BUCKET_NAME"

# Function to get content type
get_content_type() {
    local file="$1"
    case "${file##*.}" in
        html) echo "text/html" ;;
        css) echo "text/css" ;;
        js) echo "application/javascript" ;;
        json) echo "application/json" ;;
        png) echo "image/png" ;;
        jpg|jpeg) echo "image/jpeg" ;;
        gif) echo "image/gif" ;;
        svg) echo "image/svg+xml" ;;
        ico) echo "image/x-icon" ;;
        woff) echo "font/woff" ;;
        woff2) echo "font/woff2" ;;
        ttf) echo "font/ttf" ;;
        eot) echo "application/vnd.ms-fontobject" ;;
        *) echo "application/octet-stream" ;;
    esac
}

# Function to upload file
upload_file() {
    local file_path="$1"
    local key="$2"
    local content_type=$(get_content_type "$file_path")
    
    echo "📁 Uploading: $key"
    
    curl -X PUT \
        "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2/buckets/$BUCKET_NAME/objects/$key" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: $content_type" \
        --data-binary "@$file_path" \
        --silent \
        --output /dev/null \
        --write-out "Status: %{http_code}\n"
}

# Upload all files, excluding node_modules
find out -type f -not -path "*/node_modules/*" | while read file; do
    # Remove 'out/' prefix to get the key
    key="${file#out/}"
    
    # Skip empty keys
    if [[ -n "$key" ]]; then
        upload_file "$file" "$key"
    fi
done

echo "✅ Upload complete!"