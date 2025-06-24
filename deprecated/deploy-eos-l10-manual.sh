#!/bin/bash
# Manual deployment script for EOS L10 to Google VM
# This script handles authentication and deployment when service account key is not available

echo "🚀 EOS L10 Manual Deployment to Google VM"
echo "========================================"
echo ""

# VM Configuration
VM_IP="35.225.189.208"
VM_USER="anand"
VM_NAME="aidev"
VM_ZONE="us-central1-a"
PROJECT_ID="apigatewayproject-451519"

# App Configuration
APP_NAME="eos-l10"
APP_PORT="3010"
DEPLOY_DIR="/home/$VM_USER/ganger-apps"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}VM Details:${NC}"
echo "  Name: $VM_NAME"
echo "  IP: $VM_IP"
echo "  User: $VM_USER"
echo "  Zone: $VM_ZONE"
echo "  Project: $PROJECT_ID"
echo ""

# Step 1: Check gcloud authentication
echo -e "${BLUE}📋 Step 1: Checking gcloud authentication...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  No active gcloud authentication found.${NC}"
    echo ""
    echo "Please authenticate using one of these methods:"
    echo ""
    echo "Option 1: Browser-based authentication (recommended)"
    echo "  Run: gcloud auth login"
    echo ""
    echo "Option 2: Service account key (if available)"
    echo "  Run: gcloud auth activate-service-account --key-file=YOUR_KEY_FILE.json"
    echo ""
    echo "After authentication, run this script again."
    exit 1
else
    ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
    echo -e "${GREEN}✓ Authenticated as: $ACTIVE_ACCOUNT${NC}"
fi

# Step 2: Verify project access
echo -e "${BLUE}📋 Step 2: Verifying project access...${NC}"
if ! gcloud projects describe $PROJECT_ID &>/dev/null; then
    echo -e "${RED}❌ Cannot access project: $PROJECT_ID${NC}"
    echo "Please ensure your account has access to this project."
    exit 1
else
    echo -e "${GREEN}✓ Project access confirmed${NC}"
fi

# Step 3: Check deployment package
echo -e "${BLUE}📋 Step 3: Checking deployment package...${NC}"
if [ ! -f "eos-l10-vm-deploy.tar.gz" ]; then
    echo -e "${RED}❌ Deployment package not found: eos-l10-vm-deploy.tar.gz${NC}"
    echo "Please run the build process first to create the deployment package."
    exit 1
else
    echo -e "${GREEN}✓ Deployment package found ($(du -h eos-l10-vm-deploy.tar.gz | cut -f1))${NC}"
fi

# Step 4: Test VM connectivity
echo -e "${BLUE}📋 Step 4: Testing VM connectivity...${NC}"
if gcloud compute instances describe $VM_NAME --zone=$VM_ZONE --project=$PROJECT_ID &>/dev/null; then
    echo -e "${GREEN}✓ VM found and accessible${NC}"
else
    echo -e "${RED}❌ Cannot access VM: $VM_NAME${NC}"
    echo "Please check VM name, zone, and permissions."
    exit 1
fi

# Step 5: Upload deployment package
echo -e "${BLUE}📤 Step 5: Uploading deployment package to VM...${NC}"
echo "This may take a few minutes depending on your connection speed..."

if gcloud compute scp eos-l10-vm-deploy.tar.gz $VM_USER@$VM_NAME:~/ --zone=$VM_ZONE --project=$PROJECT_ID; then
    echo -e "${GREEN}✓ Upload successful${NC}"
else
    echo -e "${RED}❌ Upload failed${NC}"
    echo "Please check your permissions and network connection."
    exit 1
fi

# Step 6: Create and execute remote deployment script
echo -e "${BLUE}🔧 Step 6: Deploying on VM...${NC}"

# Create remote deployment script
cat > remote-deploy.sh << 'REMOTE_SCRIPT'
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
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  pm2 logs eos-l10     - View logs"
echo "  pm2 restart eos-l10  - Restart app"
echo "  pm2 monit           - Monitor app"
REMOTE_SCRIPT

# Execute remote deployment
echo "Executing deployment script on VM..."
if gcloud compute ssh $VM_USER@$VM_NAME --zone=$VM_ZONE --project=$PROJECT_ID --command="bash -s" < remote-deploy.sh; then
    echo -e "${GREEN}✓ Remote deployment successful${NC}"
else
    echo -e "${RED}❌ Remote deployment failed${NC}"
    echo "You may need to SSH into the VM and run the deployment manually."
    exit 1
fi

# Clean up local files
rm -f remote-deploy.sh

# Step 7: Verify deployment
echo -e "${BLUE}🔍 Step 7: Verifying deployment...${NC}"
echo "Testing application endpoint..."

# Give the app a moment to start
sleep 5

# Test the application
if curl -s -o /dev/null -w "%{http_code}" http://$VM_IP:$APP_PORT | grep -q "200\|304"; then
    echo -e "${GREEN}✓ Application is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Application may still be starting up${NC}"
    echo "Check the logs with: gcloud compute ssh $VM_USER@$VM_NAME --zone=$VM_ZONE --command='pm2 logs eos-l10'"
fi

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}Access Information:${NC}"
echo "  Direct URL: http://$VM_IP:$APP_PORT"
echo "  Staff Portal: https://staff.gangerdermatology.com/l10 (requires worker update)"
echo ""
echo -e "${BLUE}SSH Access:${NC}"
echo "  gcloud compute ssh $VM_USER@$VM_NAME --zone=$VM_ZONE --project=$PROJECT_ID"
echo ""
echo -e "${BLUE}Application Management:${NC}"
echo "  View logs: pm2 logs eos-l10"
echo "  Restart: pm2 restart eos-l10"
echo "  Monitor: pm2 monit"
echo ""
echo -e "${YELLOW}Note: To route traffic through staff.gangerdermatology.com/l10,${NC}"
echo -e "${YELLOW}update your Cloudflare Worker with the VM proxy configuration.${NC}"