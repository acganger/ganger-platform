#!/bin/bash

echo "🏥 Building and Deploying Medical Apps"
echo "====================================="
echo ""

# Set environment variables
export CLOUDFLARE_API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"
export CLOUDFLARE_ACCOUNT_ID="68d0160c9915efebbbecfddfd48cddab"

# Medical apps to build and deploy
APPS=("inventory" "handouts" "medication-auth" "checkin-kiosk")
R2_BUCKETS=("inventory-management-production" "handouts-production" "medication-auth-production" "checkin-kiosk-production")

# Function to build and upload app
build_and_upload_app() {
    local app=$1
    local bucket=$2
    local app_path=$3
    
    echo "📦 Processing $app..."
    echo "------------------------"
    
    # Navigate to app directory
    cd "/mnt/q/Projects/ganger-platform/apps/$app" || {
        echo "❌ Failed to navigate to $app directory"
        return 1
    }
    
    # Remove edge runtime declarations
    echo "🔧 Removing edge runtime declarations..."
    find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "export const runtime" {} \; | xargs -I {} sed -i "/export const runtime = 'edge'/d" {} 2>/dev/null || true
    find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "/export const runtime = 'experimental-edge'/d" {} 2>/dev/null || true
    
    # Build the app
    echo "🔨 Building $app..."
    npm run build || {
        echo "❌ Build failed for $app"
        return 1
    }
    
    # Check if out directory exists
    if [ ! -d "out" ]; then
        echo "❌ No 'out' directory found. Build may have failed for $app"
        return 1
    fi
    
    # Create R2 bucket if it doesn't exist
    echo "☁️ Creating R2 bucket $bucket if needed..."
    npx wrangler r2 bucket create "$bucket" 2>/dev/null || true
    
    # Upload files to R2
    echo "📤 Uploading files to R2 bucket $bucket..."
    
    # Upload all static files
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
        
        # Upload with proper path for basePath
        upload_path="$app_path/$relative_path"
        
        echo -n "  Uploading $upload_path... "
        npx wrangler r2 object put "$bucket/$upload_path" --file "$file" --content-type "$content_type" 2>/dev/null && echo "✓" || echo "✗"
    done
    
    echo "✅ $app deployed to R2 bucket $bucket"
    echo ""
    
    return 0
}

# Build and deploy each app
for i in ${!APPS[@]}; do
    app="${APPS[$i]}"
    bucket="${R2_BUCKETS[$i]}"
    
    # Determine the correct path
    case "$app" in
        "inventory") app_path="inventory" ;;
        "handouts") app_path="handouts" ;;
        "medication-auth") app_path="meds" ;;
        "checkin-kiosk") app_path="kiosk" ;;
    esac
    
    build_and_upload_app "$app" "$bucket" "$app_path"
done

echo ""
echo "🚀 All medical apps have been built and uploaded!"
echo ""
echo "📝 Next steps:"
echo "1. Deploy the staff-portal-router worker if not already deployed"
echo "2. Test the apps at:"
echo "   - https://staff.gangerdermatology.com/inventory"
echo "   - https://staff.gangerdermatology.com/handouts"
echo "   - https://staff.gangerdermatology.com/meds"
echo "   - https://staff.gangerdermatology.com/kiosk"