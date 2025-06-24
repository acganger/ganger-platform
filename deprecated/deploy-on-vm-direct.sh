#!/bin/bash
# Direct deployment script - Run this ON THE VM after uploading the package
# This script assumes eos-l10-vm-deploy.tar.gz is in the home directory

set -e  # Exit on any error

echo "🚀 EOS L10 Direct VM Deployment"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
APP_NAME="eos-l10"
APP_PORT="3010"
DEPLOY_DIR="/home/$USER/ganger-apps"

# Check if deployment package exists
echo -e "${BLUE}📋 Checking for deployment package...${NC}"
if [ ! -f "$HOME/eos-l10-vm-deploy.tar.gz" ]; then
    echo -e "${RED}❌ Error: eos-l10-vm-deploy.tar.gz not found in home directory!${NC}"
    echo ""
    echo "Please upload the file first using:"
    echo "  scp eos-l10-vm-deploy.tar.gz anand@35.225.189.208:~/"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Found deployment package${NC}"

# Step 1: Install Node.js if needed
echo -e "${BLUE}📦 Step 1: Checking Node.js...${NC}"
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 20 ]]; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}✅ Node.js installed${NC}"
else
    echo -e "${GREEN}✅ Node.js $(node -v) already installed${NC}"
fi

# Step 2: Install PM2 if needed
echo -e "${BLUE}📦 Step 2: Checking PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed${NC}"
else
    echo -e "${GREEN}✅ PM2 already installed${NC}"
fi

# Step 3: Create deployment directory
echo -e "${BLUE}📁 Step 3: Setting up deployment directory...${NC}"
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

# Step 4: Extract application
echo -e "${BLUE}📦 Step 4: Extracting application...${NC}"
tar -xzf ~/eos-l10-vm-deploy.tar.gz --strip-components=1
echo -e "${GREEN}✅ Application extracted${NC}"

# Step 5: Navigate to app directory
cd eos-l10

# Step 6: Create logs directory
mkdir -p logs

# Step 7: Install dependencies
echo -e "${BLUE}📦 Step 5: Installing dependencies...${NC}"
echo "This may take a few minutes..."
npm install --production
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 8: Build the application
echo -e "${BLUE}🔨 Step 6: Building application...${NC}"
npm run build
echo -e "${GREEN}✅ Build complete${NC}"

# Step 9: Stop any existing instance
echo -e "${BLUE}🛑 Step 7: Cleaning up old instances...${NC}"
pm2 stop eos-l10 2>/dev/null || true
pm2 delete eos-l10 2>/dev/null || true
echo -e "${GREEN}✅ Cleanup done${NC}"

# Step 10: Start with PM2
echo -e "${BLUE}🚀 Step 8: Starting application with PM2...${NC}"
pm2 start ecosystem.config.js
echo -e "${GREEN}✅ Application started${NC}"

# Step 11: Save PM2 configuration
echo -e "${BLUE}💾 Step 9: Saving PM2 configuration...${NC}"
pm2 save

# Step 12: Setup PM2 startup (optional - may require sudo password)
echo -e "${BLUE}🔧 Step 10: Setting up auto-start on reboot...${NC}"
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
echo -e "${GREEN}✅ Auto-start configured${NC}"

# Step 13: Clean up deployment package
echo -e "${BLUE}🧹 Step 11: Cleaning up...${NC}"
rm ~/eos-l10-vm-deploy.tar.gz
echo -e "${GREEN}✅ Cleanup complete${NC}"

# Step 14: Show status
echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo ""
echo -e "${BLUE}Application Status:${NC}"
pm2 status
echo ""
echo -e "${BLUE}Application URLs:${NC}"
echo "  Local test: http://localhost:$APP_PORT"
echo "  Direct access: http://$(curl -s ifconfig.me):$APP_PORT"
echo "  Via staff portal: https://staff.gangerdermatology.com/l10"
echo ""
echo -e "${BLUE}Useful PM2 Commands:${NC}"
echo "  pm2 logs eos-l10      - View application logs"
echo "  pm2 restart eos-l10   - Restart the application"
echo "  pm2 monit             - Monitor CPU/memory usage"
echo "  pm2 status            - Check application status"
echo ""
echo -e "${BLUE}Test the deployment:${NC}"
echo "  curl http://localhost:$APP_PORT"
echo ""
echo -e "${GREEN}✨ Your dynamic Next.js app is now running!${NC}"