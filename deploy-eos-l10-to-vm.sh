#!/bin/bash
# Deploy EOS L10 app to Google VM

echo "🚀 EOS L10 App - Google VM Deployment Guide"
echo "==========================================="
echo ""
echo "This script will prepare your EOS L10 app for VM deployment."
echo ""

# Step 1: Fix the configuration
echo "📝 Step 1: Removing static export configuration..."
cd apps/eos-l10

# Remove static export if present
if grep -q "output: 'export'" next.config.js; then
  sed -i "s/output: 'export',/\/\/ output: 'export', \/\/ Disabled for VM deployment/g" next.config.js
  echo "✅ Removed static export configuration"
else
  echo "✅ No static export found (good!)"
fi

# Step 2: Create production build script
echo ""
echo "📝 Step 2: Creating production start script..."
cat > start-production.sh << 'EOF'
#!/bin/bash
# Production start script for EOS L10

# Load environment variables
export NODE_ENV=production
export PORT=3010
export NEXT_PUBLIC_SUPABASE_URL="https://pfqtzmxxxhhsxmlddrta.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTg1MjQsImV4cCI6MjA2NDY3NDUyNH0.v14_9iozO98QoNQq8JcaI9qMM6KKTlcWMYTkXyCDc5s"

echo "🚀 Starting EOS L10 on port $PORT..."
npm start
EOF
chmod +x start-production.sh

# Step 3: Build the app
echo ""
echo "📝 Step 3: Building the app for production..."
npm run build

# Step 4: Create VM deployment instructions
echo ""
echo "📝 Step 4: Creating VM deployment instructions..."
cat > VM_DEPLOYMENT.md << 'EOF'
# EOS L10 - VM Deployment Instructions

## On Your Google VM:

### 1. Install Node.js (if not already installed)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Clone or copy the built app
```bash
# Option A: Clone the entire repo
git clone https://github.com/yourusername/ganger-platform.git
cd ganger-platform/apps/eos-l10

# Option B: Copy just this app via rsync
rsync -avz --exclude='node_modules' /path/to/eos-l10/ user@vm-ip:/home/user/eos-l10/
```

### 3. Install dependencies
```bash
npm install --production
```

### 4. Run the app
```bash
./start-production.sh
# Or use PM2 for process management:
npm install -g pm2
pm2 start npm --name "eos-l10" -- start
```

### 5. Set up Cloudflare Tunnel (for secure access)
```bash
# Install cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create eos-l10

# Create config
cat > ~/.cloudflared/config.yml << EOFCONFIG
tunnel: eos-l10
credentials-file: /home/user/.cloudflared/[tunnel-id].json

ingress:
  - hostname: l10-vm.gangerdermatology.com
    service: http://localhost:3010
  - service: http_status:404
EOFCONFIG

# Run tunnel
cloudflared tunnel run eos-l10
```

### 6. Update your Worker to proxy to the VM
In your clean architecture worker, update the L10 route to proxy to the tunnel:
```javascript
if (path.startsWith('/l10')) {
  return fetch('https://l10-vm.gangerdermatology.com' + path, {
    headers: request.headers
  });
}
```

## The app will be accessible at:
- Direct VM: http://your-vm-ip:3010
- Via Cloudflare: https://staff.gangerdermatology.com/l10
EOF

echo ""
echo "✅ EOS L10 app is ready for VM deployment!"
echo ""
echo "📋 Next Steps:"
echo "1. Copy this directory to your VM"
echo "2. Follow the instructions in VM_DEPLOYMENT.md"
echo "3. The app will run on port 3010"
echo ""
echo "🎯 Quick test locally:"
echo "   cd apps/eos-l10"
echo "   npm run dev"
echo "   Open http://localhost:3000"