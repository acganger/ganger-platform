#!/bin/bash
# Restore working L10 test app

echo "🔧 Restoring Working L10 App"
echo "============================"
echo ""

cat > restore-on-vm.sh << 'SCRIPT'
#!/bin/bash
cd ~/ganger-apps

# Stop current broken app
pm2 stop eos-l10
pm2 delete eos-l10

# Restore the working test backup
rm -rf eos-l10
mv eos-l10-test-backup eos-l10
cd eos-l10

# Start it
pm2 start ecosystem.config.js
pm2 save

echo "✅ Working test app restored!"
pm2 status

# Test it
echo ""
echo "Testing..."
curl -s http://localhost:3010/ | grep -o "<h1[^>]*>.*</h1>" | sed 's/<[^>]*>//g'
SCRIPT

scp restore-on-vm.sh anand@35.225.189.208:~/

echo "Run on VM:"
echo "  chmod +x restore-on-vm.sh"
echo "  ./restore-on-vm.sh"