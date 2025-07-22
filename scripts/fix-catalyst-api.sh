#!/bin/bash

# Script to fix API differences after migrating to Catalyst UI
# Usage: ./scripts/fix-catalyst-api.sh [app-name]

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

echo "Fixing Catalyst UI API usage in $APP_NAME..."

# Fix cn imports to clsx
echo "1. Fixing cn imports to clsx..."
find "$APP_PATH/src" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak "s/import { cn } from '@ganger\/ui-catalyst'/import { clsx as cn } from '@ganger\/ui-catalyst'/g" {} \;
find "$APP_PATH/src" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak "s/import { cn, /import { clsx as cn, /g" {} \;

# Fix Button variant prop
echo "2. Fixing Button variant props..."
# variant="primary" -> color="blue"
find "$APP_PATH/src" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/variant="primary"/color="blue"/g' {} \;
# variant="secondary" -> outline
find "$APP_PATH/src" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/variant="secondary"/outline/g' {} \;
# variant="ghost" -> plain
find "$APP_PATH/src" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/variant="ghost"/plain/g' {} \;
# variant="destructive" -> color="red"
find "$APP_PATH/src" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/variant="destructive"/color="red"/g' {} \;
# variant="outline" -> outline
find "$APP_PATH/src" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/variant="outline"/outline/g' {} \;

# Fix Badge variant prop  
echo "3. Fixing Badge variant props..."
# Badge doesn't have variant in Catalyst, need to use className
find "$APP_PATH/src" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/variant="primary"/className="bg-blue-100 text-blue-800"/g' {} \;
find "$APP_PATH/src" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/variant="secondary"/className="bg-gray-100 text-gray-800"/g' {} \;
find "$APP_PATH/src" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/variant="success"/className="bg-green-100 text-green-800"/g' {} \;
find "$APP_PATH/src" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/variant="warning"/className="bg-yellow-100 text-yellow-800"/g' {} \;
find "$APP_PATH/src" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/variant="destructive"/className="bg-red-100 text-red-800"/g' {} \;

# Clean up backup files
echo "4. Cleaning up backup files..."
find "$APP_PATH/src" -name "*.bak" -delete

echo "API fixes complete!"
echo ""
echo "Note: Some fixes may require manual adjustment:"
echo "- Dynamic variant props need manual conversion"
echo "- Badge size props might need adjustment"
echo "- Review and test the changes before committing"