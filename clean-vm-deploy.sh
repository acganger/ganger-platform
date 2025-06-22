#!/bin/bash
# Clean VM Deployment - No workarounds, just what works

echo "🚀 Clean Ganger Platform Deployment"
echo "==================================="
echo ""

# Configuration
VM_USER="anand"
VM_IP="35.225.189.208"

# Step 1: Deploy code to VM
echo "📦 Deploying code to VM..."
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='.turbo' \
  --exclude='.git' \
  /mnt/q/Projects/ganger-platform/ \
  $VM_USER@$VM_IP:~/ganger-platform/

# Step 2: Create remote setup script
echo "📝 Creating setup script..."
cat > /tmp/remote-setup.sh << 'EOF'
#!/bin/bash
cd ~/ganger-platform

# Install dependencies
echo "Installing dependencies..."
pnpm install || npm install

# Build packages
echo "Building packages..."
npm run build:packages || echo "No package build script"

# Setup environment
[ ! -f .env ] && cp .env.example .env

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'PMEOF'
module.exports = {
  apps: [
    {
      name: 'eos-l10',
      cwd: './apps/eos-l10',
      script: 'npm',
      args: 'start',
      env: { PORT: 3012, NODE_ENV: 'production' }
    },
    {
      name: 'inventory',
      cwd: './apps/inventory',
      script: 'npm',
      args: 'start',
      env: { PORT: 3001, NODE_ENV: 'production' }
    },
    {
      name: 'handouts',
      cwd: './apps/handouts',
      script: 'npm',
      args: 'start',
      env: { PORT: 3002, NODE_ENV: 'production' }
    }
  ]
};
PMEOF

echo "✅ Setup complete!"
EOF

# Step 3: Copy and run setup
scp /tmp/remote-setup.sh $VM_USER@$VM_IP:~/
ssh $VM_USER@$VM_IP "chmod +x ~/remote-setup.sh"

echo ""
echo "✅ Deployment prepared!"
echo ""
echo "Now SSH to your VM and run:"
echo "  ssh $VM_USER@$VM_IP"
echo "  ./remote-setup.sh"
echo "  pnpm --filter eos-l10 build"
echo "  pm2 start ecosystem.config.js --only eos-l10"
echo ""
echo "Your app will be at: https://staff.gangerdermatology.com/l10"