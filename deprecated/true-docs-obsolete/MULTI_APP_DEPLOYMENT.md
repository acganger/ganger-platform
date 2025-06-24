# Multi-App VM Deployment Guide

## ✅ Verified Working Architecture

All apps deployed to one VM, accessible via `staff.gangerdermatology.com/app-name` with shared sessions.

## Infrastructure Setup (Already Complete)

- **VM**: 35.225.189.208 (Google Cloud)
- **Nginx**: Port 8888 with app routing
- **Cloudflare Tunnel**: vm.gangerdermatology.com → localhost:8888
- **Cloudflare Worker**: Proxies staff.gangerdermatology.com/[app] → tunnel

## Deploy Any App

### 1. Prepare Your App
```bash
# On local machine
cd /path/to/your/app
tar -czf app-name.tar.gz --exclude='node_modules' --exclude='.next' .
scp app-name.tar.gz anand@35.225.189.208:~/
```

### 2. Deploy on VM
```bash
# SSH to VM
ssh anand@35.225.189.208

# Extract app
mkdir -p ~/apps/app-name
cd ~/apps/app-name
tar -xzf ~/app-name.tar.gz
rm ~/app-name.tar.gz

# Configure for path routing
cat > next.config.js << 'EOF'
module.exports = {
  // No basePath needed - nginx handles routing
}
EOF

# Install and build
npm install
npm run build

# Create PM2 config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'app-name',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3010  // Use unique port for each app
    }
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

### 3. Add Nginx Route
```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/ganger-apps

# Add your app (before the final } bracket):
    location /app-name/ {
        proxy_pass http://localhost:3010/;  # Match your app's port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location = /app-name {
        return 301 /app-name/;
    }

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

## Port Assignments

| App | Port | Path |
|-----|------|------|
| L10 | 3010 | /l10 |
| Inventory | 3011 | /inventory |
| Handouts | 3012 | /handouts |
| Tickets | 3013 | /tickets |
| Staff | 3014 | /staff |
| Lunch | 3015 | /lunch |
| Pharma | 3016 | /pharma |
| Check-in | 3017 | /checkin |
| Meds | 3018 | /meds |

## Test Your Deployment
```bash
# On VM
curl http://localhost:PORT/
pm2 status

# From anywhere
curl https://staff.gangerdermatology.com/app-name/
```

## Troubleshooting

**App not loading?**
- Check PM2: `pm2 logs app-name`
- Test locally: `curl http://localhost:PORT/`
- Check nginx: `sudo nginx -t`
- Restart tunnel: `sudo systemctl restart cloudflared-tunnel`

**Session issues?**
- All apps must use same domain (staff.gangerdermatology.com)
- Set cookies with domain: `.gangerdermatology.com`

**Port conflicts?**
- Use unique ports for each app
- Check what's running: `pm2 list`

## Quick Deploy Script

Save as `deploy-app.sh` on VM:
```bash
#!/bin/bash
APP=$1
PORT=$2
tar -xzf ~/$APP.tar.gz -C ~/apps/$APP
cd ~/apps/$APP
npm install && npm run build
pm2 start --name $APP npm -- start -- -p $PORT
pm2 save
```

Usage: `./deploy-app.sh app-name 3011`