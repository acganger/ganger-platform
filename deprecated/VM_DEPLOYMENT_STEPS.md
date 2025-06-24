# 🚀 EOS L10 VM Deployment Steps

Since you have SSH access to your VM, follow these steps:

## Step 1: Upload Files (From Your Local Terminal)

```bash
# From the ganger-platform directory, upload the deployment package
scp eos-l10-vm-deploy.tar.gz anand@35.225.189.208:~/

# Also upload the deployment script
scp deploy-on-vm-direct.sh anand@35.225.189.208:~/
```

## Step 2: SSH to Your VM

```bash
ssh anand@35.225.189.208
```

## Step 3: Run the Deployment Script (On the VM)

```bash
# Make the script executable
chmod +x deploy-on-vm-direct.sh

# Run the deployment
./deploy-on-vm-direct.sh
```

## What the Script Will Do

1. ✅ Check for the deployment package
2. ✅ Install Node.js 20 (if needed)
3. ✅ Install PM2 globally (if needed)
4. ✅ Extract the application to `~/ganger-apps/eos-l10`
5. ✅ Install npm dependencies
6. ✅ Build the Next.js application
7. ✅ Start the app with PM2
8. ✅ Configure auto-restart on reboot
9. ✅ Clean up temporary files

## After Deployment

Your app will be accessible at:
- **Direct**: http://35.225.189.208:3010
- **Via Staff Portal**: https://staff.gangerdermatology.com/l10 (Worker already configured!)

## Useful Commands on the VM

```bash
# Check app status
pm2 status

# View logs
pm2 logs eos-l10

# Restart app
pm2 restart eos-l10

# Monitor performance
pm2 monit

# Test locally
curl http://localhost:3010
```

## Files You Need

Both files are in the current directory:
- `eos-l10-vm-deploy.tar.gz` - The application package (4.4MB)
- `deploy-on-vm-direct.sh` - The deployment script