#!/bin/bash
# Deploy the real EOS L10 app

echo "🚀 Deploying Real EOS L10 App"
echo "============================="
echo ""

# Package the real app
echo "📦 Creating deployment package..."
cd apps/eos-l10

# Ensure it's not using static export
sed -i "s/output: 'export',/\/\/ output: 'export',/g" next.config.js 2>/dev/null || true

# Remove basePath since nginx handles routing
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  // No basePath - nginx handles /l10 routing
}

module.exports = nextConfig
EOF

# Create production env
cat > .env.production << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTg1MjQsImV4cCI6MjA2NDY3NDUyNH0.v14_9iozO98QoNQq8JcaI9qMM6KKTlcWMYTkXyCDc5s
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA5ODUyNCwiZXhwIjoyMDY0Njc0NTI0fQ.F1sML4ob29QmG_-_zuG5o7mi4k9E2FAew3GDtXuLezo
EOF

# Package it
cd ../..
tar -czf real-eos-l10.tar.gz --exclude='apps/eos-l10/node_modules' --exclude='apps/eos-l10/.next' apps/eos-l10

echo "📤 Uploading to VM..."
scp real-eos-l10.tar.gz anand@35.225.189.208:~/

# Deploy on VM
echo "🔧 Deploying on VM..."
ssh anand@35.225.189.208 << 'DEPLOY_SCRIPT'
set -e

# Stop current app
pm2 stop eos-l10
pm2 delete eos-l10

# Backup current and extract new
cd ~/ganger-apps
mv eos-l10 eos-l10-test-backup
tar -xzf ~/real-eos-l10.tar.gz --strip-components=1
cd eos-l10

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build
echo "🔨 Building app..."
npm run build

# Start with PM2
echo "🚀 Starting app..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'eos-l10',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3010
    }
  }]
};
EOF

pm2 start ecosystem.config.js
pm2 save

# Cleanup
rm ~/real-eos-l10.tar.gz

echo "✅ Real EOS L10 deployed!"
pm2 status eos-l10
DEPLOY_SCRIPT

# Clean up local
rm real-eos-l10.tar.gz

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your real EOS L10 app is now live at:"
echo "  https://staff.gangerdermatology.com/l10"
echo "  https://vm.gangerdermatology.com/l10/"