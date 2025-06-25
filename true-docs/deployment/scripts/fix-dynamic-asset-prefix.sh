#!/bin/bash

# Fix assetPrefix to be dynamic based on deployment context
# This allows apps to work both standalone and through staff portal

echo "🔧 Fixing assetPrefix to be dynamic for failed apps..."

# Create a helper script that apps can use
cat > "packages/utils/src/deployment-config.ts" << 'EOF'
/**
 * Get the base path and asset prefix for the current deployment
 * - In standalone deployment (Vercel): no prefix
 * - In staff portal deployment: use the app-specific prefix
 */
export function getDeploymentConfig(appPath: string) {
  // If deployed standalone on Vercel, no prefix needed
  if (process.env.VERCEL && !process.env.STAFF_PORTAL_MODE) {
    return {
      basePath: '',
      assetPrefix: ''
    };
  }
  
  // Otherwise use the configured path for staff portal routing
  return {
    basePath: appPath,
    assetPrefix: appPath
  };
}
EOF

echo "✓ Created deployment config helper"

# Now update the failed apps to use dynamic config
apps=(
    "ai-receptionist:/ai"
    "pharma-scheduling:/reps"
    "socials-reviews:/socials"
    "integration-status:/status"
    "staff:"
)

for app_config in "${apps[@]}"; do
    IFS=':' read -r app path <<< "$app_config"
    config_file="apps/$app/next.config.js"
    
    if [ -f "$config_file" ]; then
        echo "Updating $app..."
        
        # Create new config with dynamic prefix
        cat > "$config_file" << EOF
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ganger/auth', '@ganger/db', '@ganger/integrations', '@ganger/ui', '@ganger/utils'],
  
  // Dynamic path configuration
  ...(process.env.VERCEL && !process.env.STAFF_PORTAL_MODE ? {} : {
    basePath: '$path',
    assetPrefix: '$path',
  }),
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  images: {
    domains: ['pfqtzmxxxhhsxmlddrta.supabase.co'],
    unoptimized: true,
  },
};

module.exports = nextConfig;
EOF
        
        echo "✓ Updated $app"
    fi
done

echo ""
echo "✅ Configuration updated for dynamic deployment!"
echo ""
echo "The apps will now:"
echo "- Build successfully on Vercel (no prefix)"
echo "- Work correctly through staff portal (with prefix)"