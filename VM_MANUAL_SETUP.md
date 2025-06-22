# Manual VM Setup Commands

Since SSH automation is timing out, please run these commands manually on your VM:

## 1. SSH to your VM
```bash
ssh anand@35.225.189.208
```

## 2. Check if claudecode user has the files
```bash
sudo ls -la /home/claudecode/ganger-platform/
```

## 3. Copy files to anand user (if needed)
```bash
sudo cp -r /home/claudecode/ganger-platform ~/
sudo chown -R anand:anand ~/ganger-platform
```

## 4. Install pnpm
```bash
cd ~/ganger-platform
npm install -g pnpm
pnpm --version
```

## 5. Install all dependencies
```bash
pnpm install
```

## 6. Build shared packages
```bash
pnpm --filter "./packages/types" build
pnpm --filter "./packages/utils" build
pnpm --filter "./packages/config" build
pnpm --filter "./packages/cache" build
pnpm --filter "./packages/db" build
pnpm --filter "./packages/auth" build
pnpm --filter "./packages/ui" build
pnpm --filter "./packages/integrations" build
```

## 7. Copy environment file
```bash
cp .env.example .env
# Edit .env with your production values
nano .env
```

## 8. Update nginx configuration
```bash
sudo cp nginx-ganger-apps.conf /etc/nginx/sites-available/ganger-apps
sudo ln -sf /etc/nginx/sites-available/ganger-apps /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Deploy your first app (EOS L10)
```bash
# Build the app
pnpm --filter eos-l10 build

# Start with PM2
pm2 start ecosystem.config.js --only eos-l10

# Save PM2 state
pm2 save

# Check status
pm2 status
pm2 logs eos-l10
```

## 10. Test the deployment
```bash
# Test locally
curl http://localhost:3012/

# Test through nginx
curl http://localhost:8888/l10/
```

Your app should now be accessible at:
https://staff.gangerdermatology.com/l10

## Next Steps

To deploy more apps:
```bash
# Deploy all apps
./deploy-all-apps.sh

# Or deploy individually
pnpm --filter [app-name] build
pm2 start ecosystem.config.js --only [app-name]
```

## Troubleshooting

If you get dependency errors:
```bash
# Clear cache and reinstall
rm -rf node_modules
pnpm install --force
```

If PM2 fails to start an app:
```bash
# Check the logs
pm2 logs [app-name] --lines 100

# Try running directly
cd apps/[app-name]
pnpm start
```