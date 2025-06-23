#!/bin/bash
set -e

echo "🚀 Setting up EOS L10 on VM..."

# Install Node.js 20 if needed
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 20 ]]; then
    echo "📦 Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally if needed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Create logs directory
mkdir -p logs

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build the application
echo "🔨 Building application..."
npm run build

# Stop existing instance if running
pm2 stop eos-l10 2>/dev/null || true
pm2 delete eos-l10 2>/dev/null || true

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

echo "✅ Setup complete!"
echo "Application running at: http://localhost:3010"
echo ""
echo "Useful commands:"
echo "  pm2 status       - Check app status"
echo "  pm2 logs eos-l10 - View logs"
echo "  pm2 restart eos-l10 - Restart app"
echo "  pm2 monit        - Monitor app"
