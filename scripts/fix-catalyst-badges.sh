#!/bin/bash

# Script to fix Badge component usage for Catalyst UI
# Badge doesn't support variant prop, must use className

APP_NAME=$1

if [ -z "$APP_NAME" ]; then
  echo "Usage: $0 <app-name>"
  exit 1
fi

APP_PATH="apps/$APP_NAME"

echo "Fixing Badge components in $APP_NAME..."

# Create a temporary file with Badge color mapping functions
cat << 'EOF' > /tmp/badge-fix.awk
BEGIN {
    # Define color mappings
    color["primary"] = "bg-blue-100 text-blue-800"
    color["secondary"] = "bg-gray-100 text-gray-800"
    color["success"] = "bg-green-100 text-green-800"
    color["warning"] = "bg-yellow-100 text-yellow-800"
    color["destructive"] = "bg-red-100 text-red-800"
    color["error"] = "bg-red-100 text-red-800"
    color["info"] = "bg-blue-100 text-blue-800"
}

{
    line = $0
    
    # Handle Badge with variant prop
    if (match(line, /<Badge[^>]*variant=["']([^"']+)["'][^>]*>/, arr)) {
        variant = arr[1]
        if (variant in color) {
            # Replace variant with className
            gsub(/variant=["'][^"']+["']/, "className=\"" color[variant] "\"", line)
        }
    }
    
    # Handle Badge with dynamic variant prop
    if (match(line, /<Badge[^>]*variant=\{([^}]+)\}[^>]*>/, arr)) {
        # This needs manual fixing - mark it
        gsub(/<Badge/, "<Badge /* TODO: Fix dynamic variant */", line)
    }
    
    print line
}
EOF

# Process all TypeScript files
find "$APP_PATH/src" -type f \( -name "*.tsx" -o -name "*.ts" \) | while read file; do
    awk -f /tmp/badge-fix.awk "$file" > "$file.tmp" && mv "$file.tmp" "$file"
done

# Fix duplicate className attributes
echo "Fixing duplicate className attributes..."
find "$APP_PATH/src" -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i.bak 's/className="[^"]*" className="[^"]*"/className=""/g' {} \;

# Clean up backup files
find "$APP_PATH/src" -name "*.bak" -delete
rm -f /tmp/badge-fix.awk

echo "Badge fixes complete!"