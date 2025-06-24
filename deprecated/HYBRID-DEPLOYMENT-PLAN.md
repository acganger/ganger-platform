# Hybrid Deployment Plan - Best of Both Worlds

## Overview
Use Cloudflare Workers for routing/static content and VM for dynamic apps.
This minimizes costs while maximizing simplicity.

## Architecture

```
Cloudflare Edge (Free)
├─ staff.gangerdermatology.com (Router Worker)
│  ├─ /inventory → proxy to VM:3001
│  ├─ /handouts → proxy to VM:3002  
│  ├─ /meds → static worker (simple app)
│  └─ /kiosk → proxy to VM:3003

Google VM ($20/month)
├─ Inventory App (Port 3001) - Complex, needs database
├─ Handouts App (Port 3002) - Complex, needs auth
└─ Kiosk App (Port 3003) - Complex, needs Stripe

Cloudflare Tunnel (Free)
└─ Secure connection from VM to Cloudflare Edge
```

## Benefits
- ✅ Apps work exactly like in development
- ✅ Full Next.js features (SSR, API routes, etc.)
- ✅ Cloudflare AI/LLM access via Workers
- ✅ Minimal cost increase ($20/month)
- ✅ Simple deployment (just `npm start`)
- ✅ Can migrate apps between VM/Workers as needed

## Quick Setup

### 1. On Google VM:
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your repo
git clone https://github.com/yourusername/ganger-platform
cd ganger-platform

# Install dependencies
npm install

# Start apps
cd apps/inventory && PORT=3001 npm start &
cd apps/handouts && PORT=3002 npm start &
cd apps/checkin-kiosk && PORT=3003 npm start &
```

### 2. Install Cloudflare Tunnel:
```bash
# Install cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create ganger-apps

# Configure tunnel (config.yml)
cat > ~/.cloudflared/config.yml << EOF
tunnel: ganger-apps
credentials-file: /home/user/.cloudflared/[tunnel-id].json

ingress:
  - hostname: vm.gangerdermatology.com
    service: http://localhost:3001
  - service: http_status:404
EOF

# Run tunnel
cloudflared tunnel run ganger-apps
```

### 3. Update Worker to Proxy:
```javascript
// In your staff router worker
if (path.startsWith('/inventory')) {
  // Proxy to VM via tunnel
  return fetch('https://vm.gangerdermatology.com' + path, {
    headers: request.headers
  });
}
```

## Cost Breakdown
- Cloudflare Workers: $0 (free tier)
- Cloudflare Tunnel: $0 (free)
- Google VM: $20/month (e2-small)
- **Total: $20/month**

## Simplicity Win
- No complex edge adapters
- No build process changes
- Apps work exactly as built
- Easy to debug and maintain