# EOS L10 - VM Deployment Instructions

## On Your Google VM:

### 1. Install Node.js (if not already installed)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Clone or copy the built app
```bash
# Option A: Clone the entire repo
git clone https://github.com/yourusername/ganger-platform.git
cd ganger-platform/apps/eos-l10

# Option B: Copy just this app via rsync
rsync -avz --exclude='node_modules' /path/to/eos-l10/ user@vm-ip:/home/user/eos-l10/
```

### 3. Install dependencies
```bash
npm install --production
```

### 4. Run the app
```bash
./start-production.sh
# Or use PM2 for process management:
npm install -g pm2
pm2 start npm --name "eos-l10" -- start
```

### 5. Set up Cloudflare Tunnel (for secure access)
```bash
# Install cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create eos-l10

# Create config
cat > ~/.cloudflared/config.yml << EOFCONFIG
tunnel: eos-l10
credentials-file: /home/user/.cloudflared/[tunnel-id].json

ingress:
  - hostname: l10-vm.gangerdermatology.com
    service: http://localhost:3010
  - service: http_status:404
EOFCONFIG

# Run tunnel
cloudflared tunnel run eos-l10
```

### 6. Update your Worker to proxy to the VM
In your clean architecture worker, update the L10 route to proxy to the tunnel:
```javascript
if (path.startsWith('/l10')) {
  return fetch('https://l10-vm.gangerdermatology.com' + path, {
    headers: request.headers
  });
}
```

## The app will be accessible at:
- Direct VM: http://your-vm-ip:3010
- Via Cloudflare: https://staff.gangerdermatology.com/l10
