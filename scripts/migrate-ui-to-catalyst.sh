#!/bin/bash

# Script to migrate @ganger/ui imports to @ganger/ui-catalyst
# Usage: ./scripts/migrate-ui-to-catalyst.sh [app-name]

APP_NAME=$1

if [ -z "$APP_NAME" ]; then
  echo "Usage: $0 <app-name>"
  echo "Example: $0 ganger-actions"
  exit 1
fi

APP_PATH="apps/$APP_NAME"

if [ ! -d "$APP_PATH" ]; then
  echo "App directory $APP_PATH does not exist"
  exit 1
fi

echo "Starting UI migration for $APP_NAME..."

# Find all files using @ganger/ui (excluding @ganger/ui-catalyst)
FILES=$(find "$APP_PATH/src" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "@ganger/ui" {} \; | grep -v node_modules | sort | uniq)

if [ -z "$FILES" ]; then
  echo "No files found using @ganger/ui"
  exit 0
fi

echo "Found $(echo "$FILES" | wc -l) files to migrate:"
echo "$FILES"

# Process each file
for file in $FILES; do
  echo "Processing: $file"
  
  # Check if file already imports from @ganger/ui-catalyst
  if grep -q "@ganger/ui-catalyst" "$file"; then
    echo "  - File already uses @ganger/ui-catalyst, checking for mixed imports..."
    
    # Replace @ganger/ui imports with @ganger/ui-catalyst
    sed -i.bak "s/from '@ganger\/ui';/from '@ganger\/ui-catalyst';/g" "$file"
    sed -i.bak "s/from \"@ganger\/ui\";/from \"@ganger\/ui-catalyst\";/g" "$file"
    
    # Remove backup file
    rm "${file}.bak"
  else
    # Simple replacement for files that don't already use catalyst
    sed -i.bak "s/@ganger\/ui/@ganger\/ui-catalyst/g" "$file"
    rm "${file}.bak"
  fi
done

echo "Migration complete!"
echo ""
echo "Next steps:"
echo "1. Run: pnpm -F @ganger/$APP_NAME type-check"
echo "2. Check for any import errors"
echo "3. Test the app locally: pnpm -F @ganger/$APP_NAME dev"