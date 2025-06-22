#!/bin/bash
# Test and debug the routing setup

echo "🔍 Testing and Debugging Routing"
echo "================================"
echo ""

# Test each layer
echo "1. Testing L10 app directly:"
curl -s http://localhost:3010/l10 | head -20

echo ""
echo "2. Testing through nginx:"
curl -s http://localhost:8888/l10 | head -20

echo ""
echo "3. Checking tunnel logs:"
sudo journalctl -u cloudflared-tunnel --no-pager | tail -20

echo ""
echo "4. Checking PM2 logs:"
pm2 logs eos-l10 --lines 10 --nostream

echo ""
echo "5. Testing with verbose curl:"
curl -v https://vm.gangerdermatology.com/l10 2>&1 | grep -E "(HTTP|Location|< )"

echo ""
echo "6. Checking if Next.js is serving correctly:"
# Test root path (since we're stripping /l10 in nginx)
curl -s http://localhost:3010/ | grep -E "(EOS|L10|title)" | head -5

echo ""
echo "7. Testing API endpoint directly:"
curl -s http://localhost:3010/api/health

echo ""
echo "8. Service status:"
echo "Nginx: $(sudo systemctl is-active nginx)"
echo "Tunnel: $(sudo systemctl is-active cloudflared-tunnel)"
echo "L10 App: $(pm2 status eos-l10 --no-color | grep eos-l10 | awk '{print $5}')"