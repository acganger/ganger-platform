# 🚀 VM Deployment Guide - Complete Monorepo Setup

## Overview
This guide deploys the entire Ganger Platform monorepo to your Google VM with:
- ✅ All dependencies installed ONCE at root level
- ✅ All shared packages built ONCE
- ✅ Each app running on its own port with PM2
- ✅ Nginx routing to all apps
- ✅ No workarounds, hacks, or temporary fixes

## Step 1: Deploy Monorepo to VM

From your local machine:
```bash
cd /mnt/q/Projects/ganger-platform
./deploy-monorepo-to-vm.sh
```

This syncs the entire monorepo to the VM (excluding node_modules and build artifacts).

## Step 2: SSH to VM and Setup

```bash
ssh anand@35.225.189.208
cd ~/ganger-platform
./setup-vm-deployment.sh
```

This will:
1. Check/install pnpm
2. Install ALL dependencies with `pnpm install`
3. Build all shared packages in order
4. Create PM2 ecosystem configuration
5. Set up environment variables

## Step 3: Configure Nginx

```bash
# Copy nginx config
sudo cp nginx-ganger-apps.conf /etc/nginx/sites-available/ganger-apps

# Enable the site (if not already)
sudo ln -sf /etc/nginx/sites-available/ganger-apps /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Step 4: Deploy Apps

### Option A: Deploy All Apps at Once
```bash
./deploy-all-apps.sh
```

### Option B: Deploy Apps Individually
```bash
# Build an app
pnpm --filter inventory build

# Start with PM2
pm2 start ecosystem.config.js --only inventory

# Check status
pm2 status
```

## Step 5: Update Cloudflare Worker

The staff router needs to proxy these paths through the tunnel:

```javascript
const VM_APPS = [
  '/inventory',
  '/handouts', 
  '/checkin-kiosk',
  '/medication-auth',
  '/clinical-staffing',
  '/l10',
  '/pharma-scheduling',
  '/batch-closeout',
  '/billing-ops',
  '/compliance-training',
  '/treatment-outcomes',
  '/ai-receptionist',
  '/demo',
  '/staff',
  '/lunch'
];

// In router logic:
if (VM_APPS.some(app => pathname.startsWith(app))) {
  const tunnelUrl = new URL(pathname, 'https://vm.gangerdermatology.com');
  // Proxy through tunnel...
}
```

## Port Assignments

| App Category | Port Range | Apps |
|-------------|------------|------|
| Medical | 3001-3010 | inventory, handouts, checkin-kiosk, medication-auth |
| Operations | 3011-3020 | clinical-staffing, eos-l10, pharma-scheduling |
| Analytics | 3021-3030 | batch-closeout, billing-ops, compliance-training |
| Research | 3031-3040 | treatment-outcomes |
| Administrative | 3041-3050 | ai-receptionist, demo, staff |
| Legacy | 3051-3060 | lunch, legacy-staff |

## Monitoring & Management

### View All Apps
```bash
pm2 status
```

### View Logs
```bash
# Single app
pm2 logs inventory

# All apps
pm2 logs

# Live monitoring
pm2 monit
```

### Restart Apps
```bash
# Single app
pm2 restart inventory

# All apps
pm2 restart all
```

### Update an App
```bash
# Pull latest code
git pull

# Rebuild
pnpm --filter inventory build

# Restart
pm2 restart inventory
```

## Troubleshooting

### App Won't Start
```bash
# Check logs
pm2 logs [app-name] --lines 50

# Check if port is in use
lsof -i :[PORT]

# Try building manually
cd apps/[app-name]
pnpm build
pnpm start
```

### Dependencies Issues
```bash
# Clear and reinstall
rm -rf node_modules
pnpm install

# Check for conflicts
pnpm why [package-name]
```

### Nginx Issues
```bash
# Test config
sudo nginx -t

# Check error log
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

## URLs

Once deployed, apps will be accessible at:
- https://staff.gangerdermatology.com/inventory
- https://staff.gangerdermatology.com/handouts
- https://staff.gangerdermatology.com/l10
- etc...

## Environment Variables

Make sure to update `.env` with production values for:
- Database URLs
- API keys
- Authentication secrets
- Service configurations

## Success Checklist

- [ ] Monorepo synced to VM
- [ ] Dependencies installed with pnpm
- [ ] All packages built successfully
- [ ] PM2 ecosystem file created
- [ ] Nginx configured and reloaded
- [ ] Apps deployed and running
- [ ] Cloudflare Worker updated
- [ ] Apps accessible via public URLs

## Notes

- This setup uses the REAL monorepo structure
- All workspace dependencies are properly resolved
- Each app shares the same node_modules at root
- PM2 manages all processes with automatic restarts
- Nginx handles path-based routing
- No static exports or workarounds needed