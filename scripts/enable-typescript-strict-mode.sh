#!/bin/bash

# Enable TypeScript strict mode across all apps
# This script:
# 1. Removes ignoreBuildErrors from next.config.js
# 2. Enables strict mode in tsconfig.json

echo "🔧 Enabling TypeScript strict mode across all apps..."

# Counter for tracking changes
changed_count=0

# Function to update next.config.js
update_next_config() {
    local file=$1
    if [ -f "$file" ]; then
        # Check if file contains ignoreBuildErrors: true
        if grep -q "ignoreBuildErrors: true" "$file"; then
            echo "  ✓ Removing ignoreBuildErrors from $file"
            # Remove the line with ignoreBuildErrors: true
            sed -i '/ignoreBuildErrors: true,/d' "$file"
            # Also remove the typescript object if it's empty
            sed -i ':a;N;$!ba;s/typescript: {\s*\n\s*},//g' "$file"
            ((changed_count++))
        fi
    fi
}

# Function to update tsconfig.json
update_tsconfig() {
    local file=$1
    if [ -f "$file" ]; then
        echo "  ✓ Enabling strict mode in $file"
        # Use jq to update the JSON file
        if command -v jq &> /dev/null; then
            # Create a temporary file
            tmp=$(mktemp)
            # Update strict to true
            jq '.compilerOptions.strict = true' "$file" > "$tmp" && mv "$tmp" "$file"
            ((changed_count++))
        else
            echo "  ⚠️  jq not installed, manually update $file"
        fi
    fi
}

# Process all apps
for app_dir in apps/*/; do
    if [ -d "$app_dir" ]; then
        app_name=$(basename "$app_dir")
        echo "Processing $app_name..."
        
        # Update next.config.js
        update_next_config "$app_dir/next.config.js"
        
        # Update tsconfig.json
        update_tsconfig "$app_dir/tsconfig.json"
    fi
done

echo ""
echo "✅ TypeScript strict mode enablement complete!"
echo "📊 Modified $changed_count files"
echo ""
echo "⚠️  IMPORTANT: Apps may now have TypeScript errors that need to be fixed."
echo "Run 'pnpm run type-check:changed' to see all errors."