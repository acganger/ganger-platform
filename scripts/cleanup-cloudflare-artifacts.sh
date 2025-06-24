#!/bin/bash

# ============================================================================
# Cleanup Cloudflare Workers Artifacts
# ============================================================================
# This script removes all Cloudflare Workers-related files from the apps
# to ensure clean Vercel deployment
# ============================================================================

# Remove set -e to continue on errors
# set -e

echo "🧹 Cleaning up Cloudflare Workers artifacts..."
echo ""

# Counter for removed files
REMOVED_COUNT=0

# Function to remove files safely
remove_file() {
  if [ -f "$1" ]; then
    rm "$1"
    echo "  ✅ Removed: $1"
    REMOVED_COUNT=$((REMOVED_COUNT + 1))
  fi
}

# List of apps
APPS=(
  "ai-receptionist" "batch-closeout" "call-center-ops" "checkin-kiosk"
  "clinical-staffing" "compliance-training" "component-showcase" 
  "config-dashboard" "eos-l10" "handouts" "integration-status"
  "inventory" "medication-auth" "pharma-scheduling" "platform-dashboard"
  "socials-reviews" "staff"
)

echo "📋 Removing Cloudflare Workers files from all apps..."
echo ""

for app in "${APPS[@]}"; do
  APP_DIR="apps/$app"
  
  if [ -d "$APP_DIR" ]; then
    echo "🔍 Cleaning $app..."
    
    # Remove wrangler configuration files
    remove_file "$APP_DIR/wrangler.jsonc"
    remove_file "$APP_DIR/wrangler.toml"
    
    # Remove worker files
    remove_file "$APP_DIR/worker.js"
    remove_file "$APP_DIR/worker.ts"
    
    # Remove Cloudflare deploy scripts
    remove_file "$APP_DIR/deploy.sh"
    
    # Remove other deployment configs that might conflict
    remove_file "$APP_DIR/netlify.toml"
    remove_file "$APP_DIR/railway.toml"
    
    # Remove Cloudflare-specific directories
    if [ -d "$APP_DIR/.wrangler" ]; then
      rm -rf "$APP_DIR/.wrangler"
      echo "  ✅ Removed: $APP_DIR/.wrangler/"
      REMOVED_COUNT=$((REMOVED_COUNT + 1))
    fi
    
    echo ""
  fi
done

echo "📋 Updating package.json files to remove Cloudflare dependencies..."
echo ""

# Remove @cloudflare/workers-types from devDependencies
for app in "${APPS[@]}"; do
  PACKAGE_JSON="apps/$app/package.json"
  
  if [ -f "$PACKAGE_JSON" ]; then
    # Check if it contains cloudflare workers-types
    if grep -q "@cloudflare/workers-types" "$PACKAGE_JSON"; then
      # Remove the line with @cloudflare/workers-types
      sed -i '/@cloudflare\/workers-types/d' "$PACKAGE_JSON"
      echo "  ✅ Updated: $PACKAGE_JSON (removed @cloudflare/workers-types)"
      REMOVED_COUNT=$((REMOVED_COUNT + 1))
    fi
  fi
done

echo ""
echo "🎉 Cleanup complete!"
echo "📊 Removed $REMOVED_COUNT Cloudflare artifacts"
echo ""
echo "✨ Your apps are now clean and ready for Vercel deployment!"