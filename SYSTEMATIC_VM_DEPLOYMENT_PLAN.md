# 🚀 Systematic VM Deployment Plan - No Workarounds

## Overview
Deploy the entire Ganger Platform monorepo to Google VM with proper infrastructure setup. No shortcuts, hacks, or temporary fixes.

## 🎯 Goals
1. Deploy complete monorepo structure to VM
2. Install all dependencies ONCE at root level
3. Build all shared packages ONCE
4. Deploy each app systematically with shared dependencies
5. Maintain single source of truth for all code

## 📋 Pre-Deployment Checklist

### VM Requirements
- [x] Ubuntu 22.04 LTS
- [x] Node.js 20.x installed
- [x] PM2 installed globally
- [x] Nginx configured
- [x] Cloudflare Tunnel active
- [ ] Git installed
- [ ] pnpm installed globally

### Local Requirements
- [x] Complete monorepo at `/mnt/q/Projects/ganger-platform`
- [x] All apps building locally
- [x] SSH access to VM (35.225.189.208)

## 🏗️ Infrastructure Setup (One-Time)

### Step 1: Install pnpm on VM
```bash
# SSH to VM
ssh anand@35.225.189.208

# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

### Step 2: Clone Monorepo
```bash
# Create workspace directory
mkdir -p ~/ganger-platform
cd ~/ganger-platform

# Initialize git and add remote
git init
git remote add origin https://github.com/acganger/ganger-platform.git

# For now, we'll use rsync since repo might be private
exit
```

From local machine:
```bash
# Sync entire monorepo to VM (excluding node_modules)
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='dist' \
  /mnt/q/Projects/ganger-platform/ \
  anand@35.225.189.208:~/ganger-platform/
```

### Step 3: Install ALL Dependencies on VM
```bash
# SSH back to VM
ssh anand@35.225.189.208
cd ~/ganger-platform

# Install all dependencies at root with pnpm
pnpm install

# This will:
# - Install all root dependencies
# - Install all app dependencies
# - Install all package dependencies
# - Link all workspace packages properly
```

### Step 4: Build Shared Packages
```bash
# Build all packages first (they're dependencies for apps)
pnpm --filter "./packages/**" build

# This builds in dependency order:
# 1. @ganger/types
# 2. @ganger/utils
# 3. @ganger/config
# 4. @ganger/cache
# 5. @ganger/db
# 6. @ganger/auth
# 7. @ganger/ui
# 8. @ganger/integrations
```

### Step 5: Create PM2 Ecosystem File
```bash
cat > ~/ganger-platform/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    // Medical Apps (Port 3001-3010)
    {
      name: 'inventory',
      cwd: './apps/inventory',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3001,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'handouts',
      cwd: './apps/handouts',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3002,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'checkin-kiosk',
      cwd: './apps/checkin-kiosk',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3003,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'medication-auth',
      cwd: './apps/medication-auth',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3004,
        NODE_ENV: 'production'
      }
    },
    
    // Operations Apps (Port 3011-3020)
    {
      name: 'clinical-staffing',
      cwd: './apps/clinical-staffing',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3011,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'eos-l10',
      cwd: './apps/eos-l10',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3012,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'pharma-scheduling',
      cwd: './apps/pharma-scheduling',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3013,
        NODE_ENV: 'production'
      }
    },
    
    // Analytics Apps (Port 3021-3030)
    {
      name: 'batch-closeout',
      cwd: './apps/batch-closeout',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3021,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'billing-ops',
      cwd: './apps/billing-ops',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3022,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'compliance-training',
      cwd: './apps/compliance-training',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3023,
        NODE_ENV: 'production'
      }
    },
    
    // Research Apps (Port 3031-3040)
    {
      name: 'treatment-outcomes',
      cwd: './apps/treatment-outcomes',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3031,
        NODE_ENV: 'production'
      }
    },
    
    // Administrative Apps (Port 3041-3050)
    {
      name: 'ai-receptionist',
      cwd: './apps/ai-receptionist',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3041,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'demo',
      cwd: './apps/demo',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3042,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'inventory-order-flow',
      cwd: './apps/inventory-order-flow',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3043,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'staff',
      cwd: './apps/staff',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3044,
        NODE_ENV: 'production'
      }
    },
    
    // Legacy Apps (Port 3051-3060)
    {
      name: 'lunch',
      cwd: './legacy-a2hosting-apps/lunch',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3051,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'legacy-staff',
      cwd: './legacy-a2hosting-apps/staff',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3052,
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF
```

### Step 6: Update Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/ganger-apps
```

Add all app routes:
```nginx
server {
    listen 8888;
    server_name localhost;
    
    # Medical Apps
    location /inventory/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /handouts/ {
        proxy_pass http://localhost:3002/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /checkin-kiosk/ {
        proxy_pass http://localhost:3003/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /medication-auth/ {
        proxy_pass http://localhost:3004/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Operations Apps
    location /clinical-staffing/ {
        proxy_pass http://localhost:3011/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /l10/ {
        proxy_pass http://localhost:3012/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /pharma-scheduling/ {
        proxy_pass http://localhost:3013/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Add all other apps following the same pattern...
    
    # Redirect rules
    location = /inventory { return 301 /inventory/; }
    location = /handouts { return 301 /handouts/; }
    location = /checkin-kiosk { return 301 /checkin-kiosk/; }
    location = /medication-auth { return 301 /medication-auth/; }
    location = /clinical-staffing { return 301 /clinical-staffing/; }
    location = /l10 { return 301 /l10/; }
    location = /pharma-scheduling { return 301 /pharma-scheduling/; }
    # Add redirects for all apps...
}
```

### Step 7: Create Environment File
```bash
cd ~/ganger-platform
cp .env.example .env
# Edit .env with production values
```

## 📦 App Deployment Process

### For Each App:

1. **Build the app**:
```bash
cd ~/ganger-platform
pnpm --filter [app-name] build
```

2. **Start with PM2**:
```bash
pm2 start ecosystem.config.js --only [app-name]
```

3. **Verify deployment**:
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs [app-name] --lines 50

# Test locally
curl http://localhost:[PORT]/
```

4. **Save PM2 state**:
```bash
pm2 save
```

## 🚀 Deployment Order

Deploy apps in this order to minimize dependencies:

1. **Shared Infrastructure First**:
   - Build all packages (already done in setup)

2. **Core Apps** (no external dependencies):
   - `demo` → Port 3042
   - `ai-receptionist` → Port 3041

3. **Medical Apps** (may depend on auth/db):
   - `inventory` → Port 3001
   - `handouts` → Port 3002
   - `checkin-kiosk` → Port 3003
   - `medication-auth` → Port 3004

4. **Operations Apps**:
   - `clinical-staffing` → Port 3011
   - `eos-l10` → Port 3012
   - `pharma-scheduling` → Port 3013

5. **Analytics Apps**:
   - `batch-closeout` → Port 3021
   - `billing-ops` → Port 3022
   - `compliance-training` → Port 3023

6. **Research Apps**:
   - `treatment-outcomes` → Port 3031

7. **Administrative Apps**:
   - `inventory-order-flow` → Port 3043
   - `staff` → Port 3044

8. **Legacy Apps** (if needed):
   - `lunch` → Port 3051
   - `legacy-staff` → Port 3052

## 🔧 Troubleshooting

### If an app fails to start:
1. Check logs: `pm2 logs [app-name]`
2. Verify port not in use: `lsof -i :[PORT]`
3. Check build output: `cd apps/[app-name] && pnpm build`
4. Verify env vars: `pm2 env [app-name]`

### If dependencies fail:
1. Clear pnpm cache: `pnpm store prune`
2. Reinstall: `rm -rf node_modules && pnpm install`
3. Check for version conflicts: `pnpm why [package-name]`

### If routing fails:
1. Test nginx: `sudo nginx -t`
2. Reload nginx: `sudo systemctl reload nginx`
3. Check tunnel: `sudo systemctl status cloudflared`

## 📝 Post-Deployment

1. **Update Cloudflare Worker Router**:
   - Update `staff-router.js` to proxy all apps through tunnel

2. **Test Each App**:
   - `https://staff.gangerdermatology.com/[app-name]`

3. **Monitor Performance**:
   - PM2 monitoring: `pm2 monit`
   - Check memory usage: `pm2 status`
   - Review logs: `pm2 logs`

4. **Set Up Backups**:
   - Database backups via Supabase
   - Code backups via Git
   - PM2 config backup: `pm2 save`

## ✅ Success Criteria

Each app should:
1. Build successfully with shared dependencies
2. Start without errors
3. Respond to health checks
4. Route correctly through nginx
5. Be accessible via public URL
6. Share authentication sessions
7. Connect to Supabase successfully

## 🚫 What We're NOT Doing

1. NO test apps or mock data
2. NO copying dependencies per app
3. NO workspace dependency workarounds
4. NO static exports
5. NO manual package linking
6. NO shortcuts or temporary fixes

This is the proper, systematic way to deploy a monorepo to a VM with shared dependencies and consistent infrastructure.