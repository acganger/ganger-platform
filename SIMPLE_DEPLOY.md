# Simple VM Deployment - No BS, Just Works

## One Command Deploy

Run this from your local machine:

```bash
cd /mnt/q/Projects/ganger-platform
./clean-vm-deploy.sh
```

This will:
1. Sync your code to the VM
2. Create a setup script on the VM
3. Tell you exactly what to run

## On the VM

After running the deploy script, SSH in and run:

```bash
ssh anand@35.225.189.208
./remote-setup.sh

# Deploy L10
cd ~/ganger-platform
pnpm --filter eos-l10 build
pm2 start ecosystem.config.js --only eos-l10

# Deploy more apps
pnpm --filter inventory build
pm2 start ecosystem.config.js --only inventory

pnpm --filter handouts build
pm2 start ecosystem.config.js --only handouts
```

## That's it

No workarounds. No hacks. No 500 config files.

Just:
1. Real monorepo with shared dependencies
2. PM2 for process management
3. Nginx already configured
4. Apps accessible at staff.gangerdermatology.com/[app-name]

## If you need to update nginx

The nginx config is already set up, but if you need to add more apps:

```bash
sudo nano /etc/nginx/sites-available/ganger-apps
# Add your location block
sudo nginx -t && sudo systemctl reload nginx
```