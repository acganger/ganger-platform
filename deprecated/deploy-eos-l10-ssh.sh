#!/bin/bash
# SSH-based deployment script for EOS L10 to Google VM
# Use this if gcloud authentication is not available but you have SSH access

echo "🚀 EOS L10 SSH Deployment to Google VM"
echo "====================================="
echo ""

# VM Configuration
VM_IP="35.225.189.208"
VM_USER="anand"
APP_NAME="eos-l10"
APP_PORT="3010"
DEPLOY_DIR="/home/$VM_USER/ganger-apps"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Deployment Configuration:${NC}"
echo "  VM IP: $VM_IP"
echo "  VM User: $VM_USER"
echo "  App Port: $APP_PORT"
echo "  Deploy Directory: $DEPLOY_DIR"
echo ""

# Step 1: Check deployment package
echo -e "${BLUE}📋 Step 1: Checking deployment package...${NC}"
if [ ! -f "eos-l10-vm-deploy.tar.gz" ]; then
    echo -e "${RED}❌ Deployment package not found: eos-l10-vm-deploy.tar.gz${NC}"
    echo "Please run the build process first to create the deployment package."
    exit 1
else
    echo -e "${GREEN}✓ Deployment package found ($(du -h eos-l10-vm-deploy.tar.gz | cut -f1))${NC}"
fi

# Step 2: Test SSH connectivity
echo -e "${BLUE}📋 Step 2: Testing SSH connectivity...${NC}"
echo "Attempting to connect to $VM_USER@$VM_IP..."

if ssh -o ConnectTimeout=10 -o BatchMode=yes $VM_USER@$VM_IP "echo 'SSH connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${YELLOW}⚠️  SSH connection test failed${NC}"
    echo ""
    echo "This could mean:"
    echo "1. You don't have SSH key access set up"
    echo "2. The VM IP or username is incorrect"
    echo "3. Network connectivity issues"
    echo ""
    echo "To set up SSH key access:"
    echo "1. Generate an SSH key if you don't have one: ssh-keygen -t rsa -b 4096"
    echo "2. Add your public key to the VM using gcloud or the GCP console"
    echo "3. Or ask the VM administrator to add your public key"
    echo ""
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 3: Upload deployment package
echo -e "${BLUE}📤 Step 3: Uploading deployment package via SSH...${NC}"
echo "This may take a few minutes depending on your connection speed..."

if scp eos-l10-vm-deploy.tar.gz $VM_USER@$VM_IP:~/; then
    echo -e "${GREEN}✓ Upload successful${NC}"
else
    echo -e "${RED}❌ Upload failed${NC}"
    echo "Please check your SSH access and try again."
    exit 1
fi

# Step 4: Deploy on VM
echo -e "${BLUE}🔧 Step 4: Deploying on VM...${NC}"

# Create and execute remote deployment script
ssh $VM_USER@$VM_IP bash << 'REMOTE_SCRIPT'
#!/bin/bash
set -e

echo "🚀 Starting deployment on VM..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Create deployment directory
DEPLOY_DIR="/home/anand/ganger-apps"
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

# Extract application
echo -e "${BLUE}📦 Extracting application...${NC}"
tar -xzf ~/eos-l10-vm-deploy.tar.gz --strip-components=1

# Navigate to app directory
cd eos-l10

# Check Node.js version
echo -e "${BLUE}🔍 Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
node_version=$(node -v)
echo -e "${GREEN}✓ Node.js version: $node_version${NC}"

# Check PM2
echo -e "${BLUE}🔍 Checking PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${BLUE}📦 Installing PM2...${NC}"
    sudo npm install -g pm2
fi
echo -e "${GREEN}✓ PM2 installed${NC}"

# Create logs directory
mkdir -p logs

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install --production

# Build the application
echo -e "${BLUE}🔨 Building application...${NC}"
npm run build

# Stop existing instance if running
pm2 stop eos-l10 2>/dev/null || true
pm2 delete eos-l10 2>/dev/null || true

# Start with PM2
echo -e "${BLUE}🚀 Starting application with PM2...${NC}"
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup (may require sudo password)
echo -e "${BLUE}🔧 Setting up PM2 startup...${NC}"
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER || true

# Clean up
rm ~/eos-l10-vm-deploy.tar.gz

# Show status
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
pm2 status
echo ""
echo -e "${BLUE}Application URLs:${NC}"
echo "  Local: http://localhost:3010"
echo "  External: http://35.225.189.208:3010"
REMOTE_SCRIPT

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Remote deployment successful${NC}"
else
    echo -e "${RED}❌ Remote deployment failed${NC}"
    echo "You may need to SSH into the VM and troubleshoot."
    exit 1
fi

# Step 5: Verify deployment
echo -e "${BLUE}🔍 Step 5: Verifying deployment...${NC}"
echo "Testing application endpoint..."

# Give the app a moment to start
sleep 5

# Test the application
if curl -s -o /dev/null -w "%{http_code}" http://$VM_IP:$APP_PORT | grep -q "200\|304"; then
    echo -e "${GREEN}✓ Application is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Application may still be starting up${NC}"
    echo "Check the logs with: ssh $VM_USER@$VM_IP 'pm2 logs eos-l10'"
fi

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}Access Information:${NC}"
echo "  Direct URL: http://$VM_IP:$APP_PORT"
echo "  Staff Portal: https://staff.gangerdermatology.com/l10 (requires worker update)"
echo ""
echo -e "${BLUE}SSH Access:${NC}"
echo "  ssh $VM_USER@$VM_IP"
echo ""
echo -e "${BLUE}Application Management (run on VM):${NC}"
echo "  View logs: pm2 logs eos-l10"
echo "  Restart: pm2 restart eos-l10"
echo "  Monitor: pm2 monit"
echo "  Status: pm2 status"
echo ""
echo -e "${YELLOW}Note: To route traffic through staff.gangerdermatology.com/l10,${NC}"
echo -e "${YELLOW}update your Cloudflare Worker with the VM proxy configuration.${NC}"