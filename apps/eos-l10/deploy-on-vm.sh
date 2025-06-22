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
