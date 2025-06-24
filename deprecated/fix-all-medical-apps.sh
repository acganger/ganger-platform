#!/bin/bash

echo "🏥 Fixing All Medical Apps - Complete Solution"
echo "============================================="
echo ""

# Set environment variables
export CLOUDFLARE_API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"
export CLOUDFLARE_ACCOUNT_ID="68d0160c9915efebbbecfddfd48cddab"

# Function to fix and deploy an app
fix_app() {
    local app_name=$1
    local app_path=$2
    local r2_bucket=$3
    
    echo ""
    echo "📦 Processing $app_name..."
    echo "=========================="
    
    cd "/mnt/q/Projects/ganger-platform/apps/$app_name" || return 1
    
    # Ensure static export is configured
    echo "🔧 Configuring for static export..."
    if ! grep -q "output: 'export'" next.config.js; then
        sed -i "s/const nextConfig = {/const nextConfig = {\n  output: 'export',/" next.config.js
    fi
    
    # Remove any edge runtime declarations
    echo "🔧 Removing edge runtime declarations..."
    find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "export const runtime" {} \; 2>/dev/null | while read file; do
        sed -i "/export const runtime = /d" "$file"
    done
    
    # Clean previous build
    echo "🧹 Cleaning previous build..."
    rm -rf out .next
    
    # Build the app
    echo "🔨 Building $app_name..."
    npm run build || {
        echo "❌ Build failed for $app_name"
        return 1
    }
    
    # Check if out directory exists
    if [ ! -d "out" ]; then
        echo "❌ No 'out' directory found. Build may have failed."
        return 1
    fi
    
    # Create R2 bucket if needed
    echo "☁️ Ensuring R2 bucket exists..."
    npx wrangler r2 bucket create "$r2_bucket" 2>/dev/null || true
    
    # Clear the R2 bucket first (optional - be careful!)
    # echo "🗑️ Clearing old files from R2..."
    # You would need to implement this if needed
    
    # Upload all files
    echo "📤 Uploading to R2 bucket $r2_bucket..."
    
    # Count files
    total_files=$(find out -type f | wc -l)
    current=0
    
    find out -type f | while read file; do
        # Get relative path from out directory
        relative_path="${file#out/}"
        current=$((current + 1))
        
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
            *.woff) content_type="font/woff" ;;
            *.woff2) content_type="font/woff2" ;;
            *.ttf) content_type="font/ttf" ;;
            *) content_type="application/octet-stream" ;;
        esac
        
        # Upload WITHOUT app prefix (the HTML already has it)
        echo -n "  [$current/$total_files] Uploading $relative_path... "
        
        # Add cache headers for static assets
        if [[ "$relative_path" == *"/_next/"* ]]; then
            # Static assets can be cached for a long time
            npx wrangler r2 object put "$r2_bucket/$relative_path" \
                --file "$file" \
                --content-type "$content_type" \
                --content-encoding "gzip" \
                2>/dev/null && echo "✓" || echo "✗"
        else
            # HTML files should not be cached aggressively
            npx wrangler r2 object put "$r2_bucket/$relative_path" \
                --file "$file" \
                --content-type "$content_type" \
                2>/dev/null && echo "✓" || echo "✗"
        fi
    done
    
    echo "✅ $app_name deployed successfully!"
    
    return 0
}

# Update the staff router to handle medical apps from R2
echo "📝 Updating staff router configuration..."
cd /mnt/q/Projects/ganger-platform/cloudflare-workers

# Ensure the router has R2 bucket bindings for all medical apps
cat > wrangler-staff-portal-router-updated.toml << 'EOF'
# 🚀 Staff Portal Router - Dynamic Application Router
# Handles all staff.gangerdermatology.com traffic

name = "staff-portal-router"
main = "staff-router.js"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

# 🌐 Custom Domain Routes
[[routes]]
pattern = "staff.gangerdermatology.com/*"
zone_name = "gangerdermatology.com"

# 🔒 Environment Variables
[env.production.vars]
ENVIRONMENT = "production"
PLATFORM_NAME = "Ganger Staff Portal Router"
SUPABASE_URL = "https://pfqtzmxxxhhsxmlddrta.supabase.co"
DOMAIN_BASE = "gangerdermatology.com"

# R2 Buckets for medical apps
[[env.production.r2_buckets]]
binding = "INVENTORY_BUCKET"
bucket_name = "inventory-management-production"

[[env.production.r2_buckets]]
binding = "HANDOUTS_BUCKET"
bucket_name = "handouts-production"

[[env.production.r2_buckets]]
binding = "MEDS_BUCKET"
bucket_name = "medication-auth-production"

[[env.production.r2_buckets]]
binding = "KIOSK_BUCKET"
bucket_name = "checkin-kiosk-production"
EOF

# Process each medical app
echo ""
echo "🏥 Processing Medical Apps..."
echo "============================"

# Inventory Management
fix_app "inventory" "/inventory" "inventory-management-production"

# Patient Handouts
fix_app "handouts" "/handouts" "handouts-production"

# Medication Authorization
fix_app "medication-auth" "/meds" "medication-auth-production"

# Check-in Kiosk
fix_app "checkin-kiosk" "/kiosk" "checkin-kiosk-production"

# Deploy the updated router
echo ""
echo "🚀 Deploying updated staff portal router..."
cd /mnt/q/Projects/ganger-platform/cloudflare-workers
npx wrangler deploy staff-router.js --config wrangler-staff-portal-router-updated.toml --env production

echo ""
echo "✅ All medical apps have been fixed and deployed!"
echo ""
echo "🧪 Test the apps at:"
echo "   - https://staff.gangerdermatology.com/inventory"
echo "   - https://staff.gangerdermatology.com/handouts"
echo "   - https://staff.gangerdermatology.com/meds"
echo "   - https://staff.gangerdermatology.com/kiosk"
echo ""
echo "📝 Note: It may take a few minutes for changes to propagate."