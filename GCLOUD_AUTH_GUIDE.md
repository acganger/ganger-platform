# Google Cloud Authentication Guide for EOS L10 Deployment

## Quick Start

You have two deployment scripts available:

1. **`deploy-eos-l10-manual.sh`** - Uses gcloud CLI (recommended)
2. **`deploy-eos-l10-ssh.sh`** - Uses direct SSH (fallback option)

## Method 1: Using gcloud CLI (Recommended)

### Step 1: Install gcloud CLI (if not already installed)
```bash
# Check if gcloud is installed
gcloud version

# If not installed, download from:
# https://cloud.google.com/sdk/docs/install
```

### Step 2: Authenticate with Google Cloud

#### Option A: Browser-based authentication (easiest)
```bash
# This will open a browser for authentication
gcloud auth login

# Follow the prompts to authenticate with your Google account
# Make sure to use an account that has access to project: apigatewayproject-451519
```

#### Option B: Service Account Key (if you have one)
```bash
# If you have a service account key file
gcloud auth activate-service-account --key-file=path/to/your-key.json
```

### Step 3: Set the project
```bash
# Set the default project (already configured in your case)
gcloud config set project apigatewayproject-451519
```

### Step 4: Run the deployment
```bash
# From the ganger-platform directory
./deploy-eos-l10-manual.sh
```

## Method 2: Using SSH (Fallback)

If you cannot use gcloud but have SSH access to the VM:

### Prerequisites
- SSH key pair generated (`ssh-keygen -t rsa -b 4096`)
- Your public key added to the VM (contact VM admin if needed)

### Run deployment
```bash
# From the ganger-platform directory
./deploy-eos-l10-ssh.sh
```

## VM Details

- **VM Name**: aidev
- **VM IP**: 35.225.189.208
- **Zone**: us-central1-a
- **Project**: apigatewayproject-451519
- **User**: anand
- **App Port**: 3010

## Post-Deployment Access

### Direct access to the app:
```
http://35.225.189.208:3010
```

### SSH into the VM:
```bash
# Using gcloud
gcloud compute ssh anand@aidev --zone=us-central1-a --project=apigatewayproject-451519

# Using SSH directly
ssh anand@35.225.189.208
```

### Application Management Commands (run on VM):
```bash
# View logs
pm2 logs eos-l10

# Check status
pm2 status

# Restart app
pm2 restart eos-l10

# Monitor in real-time
pm2 monit
```

## Troubleshooting

### Authentication Issues
1. Make sure you're using an account with access to the GCP project
2. Check if you're in the correct project: `gcloud config get-value project`
3. List your authenticated accounts: `gcloud auth list`

### SSH Connection Issues
1. Verify your SSH key is added to the VM
2. Check firewall rules allow SSH (port 22)
3. Try verbose SSH: `ssh -v anand@35.225.189.208`

### Application Issues
1. Check PM2 logs: `pm2 logs eos-l10`
2. Verify Node.js version: `node -v` (should be v20+)
3. Check if port 3010 is accessible
4. Review application logs in `/home/anand/ganger-apps/eos-l10/logs/`

## Next Steps

After successful deployment:

1. Test the application at http://35.225.189.208:3010
2. Update the Cloudflare Worker to route l10.gangerdermatology.com to the VM
3. Configure SSL/TLS if needed
4. Set up monitoring and alerts

## Support

If you encounter issues:
1. Check the deployment script output for specific error messages
2. SSH into the VM and check PM2 logs
3. Verify all prerequisites are met
4. Contact the VM administrator for access issues