#!/bin/bash
# Upload script - Run this from your LOCAL machine

echo "📤 Uploading EOS L10 to VM"
echo "=========================="
echo ""

# Check if package exists
if [ ! -f "eos-l10-vm-deploy.tar.gz" ]; then
    echo "❌ Error: eos-l10-vm-deploy.tar.gz not found!"
    echo "Please run the build script first."
    exit 1
fi

echo "📦 Package size: $(du -h eos-l10-vm-deploy.tar.gz | cut -f1)"
echo ""
echo "Uploading to VM..."
echo "Command: scp eos-l10-vm-deploy.tar.gz anand@35.225.189.208:~/"
echo ""

# Upload the package
scp eos-l10-vm-deploy.tar.gz anand@35.225.189.208:~/

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Upload successful!"
    echo ""
    # Also upload the deployment script
    echo "📤 Uploading deployment script..."
    scp deploy-on-vm-direct.sh anand@35.225.189.208:~/
    
    echo ""
    echo "✅ All files uploaded!"
    echo ""
    echo "Next steps:"
    echo "1. SSH into your VM:"
    echo "   ssh anand@35.225.189.208"
    echo ""
    echo "2. Run the deployment script:"
    echo "   chmod +x deploy-on-vm-direct.sh"
    echo "   ./deploy-on-vm-direct.sh"
else
    echo ""
    echo "❌ Upload failed!"
    echo "Please check your SSH connection and try again."
fi