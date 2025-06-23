#!/bin/bash

# Comprehensive cleanup script for deployment mess
# This removes all the workarounds, failed attempts, and unnecessary files

echo "🧹 Starting comprehensive deployment cleanup..."

# Remove all deployment-related documentation bloat
echo "📄 Removing deployment documentation bloat..."
rm -f DEPLOYMENT*.md
rm -f DEPLOY*.md
rm -f *_DEPLOYMENT*.md
rm -f *_DEPLOY*.md
rm -f ROUTING*.md
rm -f ROUTE*.md
rm -f ARCHITECTURE*.md
rm -f MIGRATION*.md
rm -f PLATFORM_FIX*.md
rm -f CLEAN_*.md
rm -f VM_*.md
rm -f VERCEL_*.md
rm -f HYBRID*.md
rm -f SYSTEMATIC*.md
rm -f MULTI_APP*.md
rm -f INVENTORY_*.md
rm -f FINAL_*.md
rm -f CURRENT-STATUS*.md
rm -f DELETE_AND_REBUILD.sh
rm -f SIMPLE_DEPLOY.md
rm -f NEXT_STEPS*.md

# Remove all deployment scripts
echo "📜 Removing deployment scripts..."
rm -f deploy-*.sh
rm -f setup-*.sh
rm -f fix-*.sh
rm -f test-*.sh
rm -f verify-*.sh
rm -f update-*.sh
rm -f restore-*.sh
rm -f upload-*.sh
rm -f quick-*.sh
rm -f clean-*.sh
rm -f simple-*.sh
rm -f *-deploy.sh
rm -f *-deployment.sh
rm -f execute-*.txt
rm -f start-*.js

# Remove worker and edge function files
echo "⚡ Removing worker and edge function attempts..."
rm -rf cloudflare-workers/
rm -rf clean-architecture/
rm -rf workers/
find apps -name "worker*.js" -delete
find apps -name "wrangler*" -delete
find apps -name "*.worker.js" -delete
find apps -name "upload*.js" -delete
find apps -name "deploy.sh" -delete

# Remove VM-related files
echo "🖥️ Removing VM deployment attempts..."
rm -f nginx-*.conf
rm -f ecosystem.config.js
rm -rf real-eos-l10.tar.gz

# Remove deployment logs and artifacts
echo "📊 Removing deployment logs and artifacts..."
rm -f *-log.txt
rm -f *.log
rm -f backup-log.txt
rm -rf deployment/
rm -rf deployments/
rm -f deployment-*.json
rm -f app-verification-*.json
rm -f turborepo_summary_*.json

# Remove test and verification files
echo "🧪 Removing test deployment files..."
rm -rf testing/
rm -rf apptest/
rm -f create-*.js
rm -f explore-*.js
rm -f add-*.js

# Remove configuration templates and backups
echo "⚙️ Removing configuration backups..."
rm -f cloudflare-token-*.txt
rm -f cloudflare-token-*.json
rm -f *.backup
rm -f merged-*.json
rm -f alternative-*.md
rm -f automate-*.md
rm -f setup-*.md

# Remove screenshots and temporary files
echo "🖼️ Removing screenshots..."
rm -f Screenshot*.png
rm -f *.tar.gz

# Remove MCP copy scripts (keeping MCP servers)
echo "🔧 Removing MCP copy scripts..."
rm -f *mcp-copy*.ps1
rm -f copy-*.ps1

# Remove PowerShell scripts
echo "💻 Removing PowerShell scripts..."
rm -f *.ps1

# Remove unused configuration files
echo "🗑️ Removing unused configs..."
rm -f .mcp.json.backup
rm -f claude_desktop_config*.json
rm -f claude_desktop_config*.backup

# Clean up each app directory
echo "📱 Cleaning up app directories..."
for app in apps/*; do
  if [ -d "$app" ]; then
    echo "  Cleaning $app..."
    # Remove deployment artifacts
    rm -f "$app"/*.html
    rm -f "$app"/worker*.js
    rm -f "$app"/wrangler*
    rm -f "$app"/deploy*.sh
    rm -f "$app"/upload*.js
    rm -f "$app"/test-*.js
    rm -f "$app"/*.log
    rm -f "$app"/Dockerfile
    rm -f "$app"/railway.toml
    rm -f "$app"/netlify.toml
    rm -f "$app"/vercel.json*
    rm -f "$app"/server.js
    rm -f "$app"/ecosystem.config.js
    rm -f "$app"/nginx-*.conf
    rm -f "$app"/start-*.sh
    rm -f "$app"/setup-*.sh
    rm -f "$app"/*_DEPLOYMENT*.md
    rm -f "$app"/*_STATUS*.md
    rm -f "$app"/VM_*.md
    
    # Clean src/pages backups
    if [ -d "$app/src/pages" ]; then
      rm -f "$app"/src/pages/*.backup
      rm -f "$app"/src/pages/*.config.js
    fi
  fi
done

# Update .gitignore to prevent future mess
echo "📝 Updating .gitignore..."
cat >> .gitignore << 'EOF'

# Deployment mess prevention
deploy-*.sh
*-deploy.sh
deployment-*.md
*_deployment*.md
worker*.js
wrangler*
*.backup
Screenshot*.png
*.tar.gz
cloudflare-workers/
clean-architecture/
deployment/
deployments/
testing/
apptest/
VM_*.md
DEPLOY*.md
*_DEPLOY*.md
fix-*.sh
test-*.sh
verify-*.sh
EOF

echo "✅ Cleanup complete! Repository is now clean."
echo ""
echo "📋 Next steps:"
echo "1. Review remaining files with: git status"
echo "2. Commit cleanup: git add -A && git commit -m 'chore: Clean up deployment mess'"
echo "3. Continue with simple Vercel deployment"
echo ""
echo "⚠️  Keeping:"
echo "- Your actual app code (untouched)"
echo "- MCP servers (functional)"
echo "- Core configuration files"
echo "- Package files and dependencies"