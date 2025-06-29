# 🚀 Multi-App Setup Guide

## Overview
Set up 20+ apps on one VM, all accessible through `staff.gangerdermatology.com/app-name`

## Step 1: Upload Setup Script to VM
```bash
scp setup-multi-app-vm.sh anand@35.225.189.208:~/
```

## Step 2: SSH to VM and Run Setup
```bash
ssh anand@35.225.189.208
chmod +x setup-multi-app-vm.sh
./setup-multi-app-vm.sh
```

This will:
- Install nginx
- Install cloudflared
- Configure nginx to route apps
- Create the directory structure

## Step 3: Set Up Cloudflare Tunnel

### 3.1 Login to Cloudflare (on VM)
```bash
cloudflared tunnel login
```
(This opens a browser - authorize it)

### 3.2 Create Tunnel
```bash
cloudflared tunnel create ganger-apps
```

### 3.3 Get Tunnel ID
```bash
cloudflared tunnel list
```
Copy the ID (looks like: a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6)

### 3.4 Create Config File
```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Add this content (replace YOUR_TUNNEL_ID):
```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/anand/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: vm.gangerdermatology.com
    service: http://localhost:8080
  - service: http_status:404
```

### 3.5 Route DNS
```bash
cloudflared tunnel route dns ganger-apps vm.gangerdermatology.com
```

### 3.6 Start Tunnel Service
```bash
sudo systemctl enable cloudflared-tunnel
sudo systemctl start cloudflared-tunnel
sudo systemctl status cloudflared-tunnel
```

## Step 4: Update Cloudflare Worker

Update your worker with the code from `update-cloudflare-worker-for-tunnel.js`:
```bash
cd cloudflare-workers
# Update staff-router.js with the tunnel routing code
wrangler deploy staff-router.js --name staff-portal-router-production-production --compatibility-date 2024-01-01
```

## Step 5: Deploy Apps

Your L10 app is already running on port 3010. For other apps:

```bash
# Deploy inventory app
./deploy-app-template.sh inventory 3011 /inventory

# Deploy handouts app  
./deploy-app-template.sh handouts 3012 /handouts

# Deploy tickets app
./deploy-app-template.sh tickets 3013 /tickets

# etc...
```

## App Port Mapping

| App | Port | Path | URL |
|-----|------|------|-----|
| L10 | 3010 | /l10 | staff.gangerdermatology.com/l10 |
| Inventory | 3011 | /inventory | staff.gangerdermatology.com/inventory |
| Handouts | 3012 | /handouts | staff.gangerdermatology.com/handouts |
| Tickets | 3013 | /tickets | staff.gangerdermatology.com/tickets |
| Lunch | 3014 | /lunch | staff.gangerdermatology.com/lunch |
| Pharma | 3015 | /pharma | staff.gangerdermatology.com/pharma |
| Check-in | 3016 | /checkin | staff.gangerdermatology.com/checkin |
| Meds Auth | 3017 | /meds | staff.gangerdermatology.com/meds |

## Testing

Once the tunnel is running:
```bash
# Test nginx
curl http://localhost:8080/l10

# Test tunnel (from your local machine)
curl https://vm.gangerdermatology.com/l10

# Test through Cloudflare Worker
curl https://staff.gangerdermatology.com/l10
```

## Benefits
- ✅ Single domain (staff.gangerdermatology.com)
- ✅ Shared sessions across all apps
- ✅ One login for all apps
- ✅ Easy to add new apps
- ✅ All apps behind Cloudflare CDN
- ✅ Centralized nginx routing
- ✅ One tunnel for all apps