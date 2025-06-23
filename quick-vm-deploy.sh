#!/bin/bash
# Quick VM Deploy - Works with minimal configuration

echo "🚀 Quick VM Deployment for EOS L10"
echo "=================================="
echo ""
echo "This script prepares everything for manual deployment."
echo ""

# Create deployment package
echo "📦 Creating deployment package..."
cd apps/eos-l10

# Create .env.production
cat > .env.production << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTg1MjQsImV4cCI6MjA2NDY3NDUyNH0.v14_9iozO98QoNQq8JcaI9qMM6KKTlcWMYTkXyCDc5s
EOF

# Create ecosystem file for PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'eos-l10',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3010
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOF

# Create simple deploy script
cat > deploy-on-vm.sh << 'EOF'
#!/bin/bash
# Run this script ON YOUR VM

echo "🚀 Deploying EOS L10 on VM..."

# 1. Install dependencies if needed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 2. Install PM2 if needed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# 3. Install app dependencies
echo "📦 Installing app dependencies..."
npm install

# 4. Build the app
echo "🔨 Building app..."
npm run build

# 5. Start with PM2
echo "🚀 Starting app with PM2..."
pm2 start ecosystem.config.js

# 6. Save PM2 config
pm2 save
pm2 startup systemd -u $USER --hp /home/$USER

echo "✅ Deployment complete!"
echo "App running on: http://localhost:3010"
echo ""
echo "Useful commands:"
echo "  pm2 status     - Check app status"
echo "  pm2 logs       - View logs"
echo "  pm2 restart eos-l10 - Restart app"
EOF
chmod +x deploy-on-vm.sh

# Create nginx config
cat > nginx-config.conf << 'EOF'
# Add this to your nginx sites-available/default or create new site

# For subdomain (l10.yourdomain.com)
server {
    listen 80;
    server_name l10.yourdomain.com;

    location / {
        proxy_pass http://localhost:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# For path-based routing (yourdomain.com/l10)
location /l10 {
    proxy_pass http://localhost:3010;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
EOF

# Create package tarball
echo "📦 Creating deployment package..."
cd ../..
tar -czf eos-l10-deploy.tar.gz \
    --exclude='apps/eos-l10/node_modules' \
    --exclude='apps/eos-l10/.next' \
    --exclude='apps/eos-l10/out' \
    apps/eos-l10

echo ""
echo "✅ Deployment package ready!"
echo ""
echo "📋 Manual deployment steps:"
echo ""
echo "1. Copy package to your VM:"
echo "   scp eos-l10-deploy.tar.gz user@your-vm-ip:~/"
echo ""
echo "2. SSH to your VM:"
echo "   ssh user@your-vm-ip"
echo ""
echo "3. Extract and deploy:"
echo "   tar -xzf eos-l10-deploy.tar.gz"
echo "   cd apps/eos-l10"
echo "   ./deploy-on-vm.sh"
echo ""
echo "4. Configure nginx (optional):"
echo "   sudo cp nginx-config.conf /etc/nginx/sites-available/eos-l10"
echo "   sudo ln -s /etc/nginx/sites-available/eos-l10 /etc/nginx/sites-enabled/"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "📦 Package location: ./eos-l10-deploy.tar.gz"
echo "📝 Nginx config: ./apps/eos-l10/nginx-config.conf"