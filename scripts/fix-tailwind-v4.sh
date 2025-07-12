#!/bin/bash

# Script to fix Tailwind CSS v4 configuration in all apps
set -e

echo "🎨 Fixing Tailwind CSS v4 configuration for all apps..."

# List of apps (excluding ganger-staff which is already fixed)
apps=(
  "ai-receptionist"
  "batch-closeout"
  "call-center-ops"
  "checkin-kiosk"
  "clinical-staffing"
  "compliance-training"
  "component-showcase"
  "config-dashboard"
  "eos-l10"
  "ganger-actions"
  "handouts"
  "integration-status"
  "inventory"
  "medication-auth"
  "pharma-scheduling"
  "platform-dashboard"
  "socials-reviews"
)

for app in "${apps[@]}"; do
  echo "📦 Processing $app..."
  app_dir="apps/$app"
  
  # 1. Create tailwind.config.js
  cat > "$app_dir/tailwind.config.js" << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/auth/src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/utils/src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/deps/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
EOF

  # 2. Update globals.css to use @import "tailwindcss"
  if [ -f "$app_dir/src/styles/globals.css" ]; then
    # Check if it has the old @tailwind directives
    if grep -q "@tailwind" "$app_dir/src/styles/globals.css"; then
      # Replace the old directives with new import
      sed -i '/@tailwind base;/,/@tailwind utilities;/c\@import "tailwindcss";' "$app_dir/src/styles/globals.css"
      echo "  ✅ Updated globals.css"
    fi
  fi
  
  # 3. Create postcss.config.js if it doesn't exist or update it
  cat > "$app_dir/postcss.config.js" << 'EOF'
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
EOF

  # 4. Update package.json to move Tailwind to dependencies
  if [ -f "$app_dir/package.json" ]; then
    # Create a temporary file with the updated package.json
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('$app_dir/package.json', 'utf8'));
      
      // Ensure dependencies object exists
      if (!pkg.dependencies) pkg.dependencies = {};
      
      // Move Tailwind-related packages from devDependencies to dependencies
      const tailwindPackages = ['tailwindcss', '@tailwindcss/postcss', 'postcss'];
      
      tailwindPackages.forEach(pkgName => {
        if (pkg.devDependencies && pkg.devDependencies[pkgName]) {
          pkg.dependencies[pkgName] = pkg.devDependencies[pkgName];
          delete pkg.devDependencies[pkgName];
        }
      });
      
      // Add Tailwind packages if they don't exist
      if (!pkg.dependencies['tailwindcss']) {
        pkg.dependencies['tailwindcss'] = '^4.0.0-alpha.33';
      }
      if (!pkg.dependencies['@tailwindcss/postcss']) {
        pkg.dependencies['@tailwindcss/postcss'] = '^4.0.0-alpha.33';
      }
      if (!pkg.dependencies['postcss']) {
        pkg.dependencies['postcss'] = '^8.4.35';
      }
      
      fs.writeFileSync('$app_dir/package.json', JSON.stringify(pkg, null, 2) + '\n');
    "
    echo "  ✅ Updated package.json"
  fi
  
  # 5. Update vercel.json to remove --prod=false
  if [ -f "$app_dir/vercel.json" ]; then
    sed -i 's/--prod=false //' "$app_dir/vercel.json"
    echo "  ✅ Updated vercel.json"
  fi
  
  echo "  ✅ $app fixed!"
  echo ""
done

echo "✨ All apps have been updated for Tailwind CSS v4!"
echo "📝 Next steps: Commit and push changes"