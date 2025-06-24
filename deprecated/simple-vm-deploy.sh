#!/bin/bash
# Simple VM deployment using standard SSH/SCP

echo "🚀 Simple VM Deployment for EOS L10"
echo "==================================="
echo ""

# VM Configuration
VM_IP="35.225.189.208"
VM_USER="anand"
APP_NAME="eos-l10"
APP_PORT="3010"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Deployment Configuration:${NC}"
echo "  VM IP: $VM_IP"
echo "  VM User: $VM_USER"
echo "  App: $APP_NAME"
echo "  Port: $APP_PORT"
echo ""

# Check if we have the deployment package
if [ ! -f "eos-l10-vm-deploy.tar.gz" ]; then
    echo -e "${RED}❌ Deployment package not found!${NC}"
    echo "Run deploy-to-google-vm.sh first to create the package."
    exit 1
fi

echo -e "${BLUE}📤 Uploading to VM...${NC}"
echo "Command: scp eos-l10-vm-deploy.tar.gz $VM_USER@$VM_IP:~/"
echo ""
echo -e "${GREEN}Manual steps to complete deployment:${NC}"
echo ""
echo "1. Copy the package to your VM:"
echo -e "${BLUE}   scp eos-l10-vm-deploy.tar.gz $VM_USER@$VM_IP:~/${NC}"
echo ""
echo "2. SSH into your VM:"
echo -e "${BLUE}   ssh $VM_USER@$VM_IP${NC}"
echo ""
echo "3. Run these commands on the VM:"
cat << 'EOF'
   # Create apps directory
   mkdir -p ~/ganger-apps
   cd ~/ganger-apps
   
   # Extract application
   tar -xzf ~/eos-l10-vm-deploy.tar.gz --strip-components=1
   
   # Navigate to app
   cd eos-l10
   
   # Run setup script
   chmod +x setup-on-vm.sh
   ./setup-on-vm.sh
   
   # Clean up
   rm ~/eos-l10-vm-deploy.tar.gz
EOF

echo ""
echo "4. Verify deployment:"
echo -e "${BLUE}   curl http://$VM_IP:$APP_PORT${NC}"
echo ""
echo "5. Update your Cloudflare Worker to proxy /l10 routes:"
echo -e "${BLUE}   View the code in: update-worker-for-vm.js${NC}"
echo ""
echo -e "${GREEN}✅ Instructions ready!${NC}"
echo ""
echo "Additional commands for managing the app on VM:"
echo "  pm2 status         - Check app status"
echo "  pm2 logs eos-l10   - View logs"
echo "  pm2 restart eos-l10 - Restart app"
echo "  pm2 monit          - Monitor app performance"