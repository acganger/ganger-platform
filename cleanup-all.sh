#!/bin/bash
# Clean up local and remote project directories

echo "🧹 Cleaning Up Project"
echo "====================="
echo ""

# Clean up local project root
echo "📁 Cleaning local project root..."
rm -f deploy-to-google-vm.sh
rm -f fix-deployment-vm.sh
rm -f complete-fix-vm.sh
rm -f debug-and-fix-l10.sh
rm -f fix-typescript-vm.sh
rm -f test-l10-app.sh
rm -f final-fix-tsconfig.sh
rm -f create-working-l10.sh
rm -f deploy-fresh-l10.sh
rm -f auto-deploy-vm.sh
rm -f deploy-via-gcloud-metadata.sh
rm -f COMPLETE_VM_DEPLOYMENT.sh
rm -f test-vm-connectivity.sh
rm -f fix-l10-basepath.sh
rm -f update-nginx-config.sh
rm -f fix-l10-routing-final.sh
rm -f debug-nginx-error.sh
rm -f check-and-fix-vm.sh
rm -f setup-multi-app-vm.sh
rm -f update-worker-for-vm.js
rm -f update-worker-for-vm-complete.js
rm -f update-worker-fix.js
rm -f eos-l10-vm-deploy.tar.gz
rm -f eos-l10-deploy.tar.gz
rm -f nginx-site.conf
rm -rf remote-setup.sh

echo "✅ Local cleanup complete"

# Create script to clean VM
cat > cleanup-vm.sh << 'EOF'
#!/bin/bash
echo "🧹 Cleaning VM home directory..."
cd ~
rm -f deploy-on-vm-direct.sh
rm -f fix-deployment-vm.sh
rm -f complete-fix-vm.sh
rm -f debug-and-fix-l10.sh
rm -f fix-typescript-vm.sh
rm -f test-l10-app.sh
rm -f final-fix-tsconfig.sh
rm -f create-working-l10.sh
rm -f deploy-fresh-l10.sh
rm -f fix-l10-basepath.sh
rm -f update-nginx-config.sh
rm -f fix-l10-routing-final.sh
rm -f debug-nginx-error.sh
rm -f check-and-fix-vm.sh
rm -f setup-multi-app-vm.sh
rm -f test-and-debug-routing.sh
rm -f ecosystem.dev.config.js
rm -f update-on-vm.sh
echo "✅ VM cleanup complete"
ls -la ~/ | grep -E "\.sh$|\.tar\.gz$" | wc -l
echo "scripts remaining in home"
EOF

echo ""
echo "📤 Uploading cleanup script to VM..."
scp cleanup-vm.sh anand@35.225.189.208:~/
ssh anand@35.225.189.208 "chmod +x cleanup-vm.sh && ./cleanup-vm.sh && rm cleanup-vm.sh"
rm cleanup-vm.sh

echo ""
echo "✅ All cleanup complete!"