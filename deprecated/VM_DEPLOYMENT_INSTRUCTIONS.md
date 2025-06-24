# EOS L10 VM Deployment Instructions

## 🚀 Quick Start

The deployment package `eos-l10-vm-deploy.tar.gz` (4.4MB) is ready with your dynamic Next.js app.

## 📋 Option 1: Using gcloud (Recommended)

1. **Authenticate with Google Cloud:**
   ```bash
   gcloud auth login
   ```

2. **Run the deployment script:**
   ```bash
   ./deploy-eos-l10-manual.sh
   ```

The script will:
- ✅ Verify authentication
- ✅ Upload the package to your VM
- ✅ Install Node.js and PM2
- ✅ Deploy and start the app
- ✅ Set up auto-restart

## 📋 Option 2: Manual SSH Deployment

If you have direct SSH access configured:

1. **Copy the package to your VM:**
   ```bash
   scp eos-l10-vm-deploy.tar.gz anand@35.225.189.208:~/
   ```

2. **SSH into your VM:**
   ```bash
   ssh anand@35.225.189.208
   ```

3. **Run these commands on the VM:**
   ```bash
   # Create apps directory
   mkdir -p ~/ganger-apps
   cd ~/ganger-apps
   
   # Extract application
   tar -xzf ~/eos-l10-vm-deploy.tar.gz --strip-components=1
   
   # Navigate to app
   cd eos-l10
   
   # Run setup script
   chmod +x setup-on-vm.sh
   ./setup-on-vm.sh
   
   # Clean up
   rm ~/eos-l10-vm-deploy.tar.gz
   ```

## 🔍 Verify Deployment

Once deployed, test the app:
```bash
curl http://35.225.189.208:3010
```

## 🌐 Update Cloudflare Worker

Add this to your clean architecture worker to route L10 traffic to the VM:

```javascript
// In your worker's request handler
if (path.startsWith('/l10')) {
  // Strip the /l10 prefix since the app runs at root on the VM
  const cleanPath = path.replace(/^\/l10/, '') || '/';
  const vmUrl = new URL(cleanPath, 'http://35.225.189.208:3010');
  
  // Copy query parameters
  const url = new URL(request.url);
  vmUrl.search = url.search;
  
  // Forward the request
  try {
    const response = await fetch(vmUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    });
    
    return new Response(response.body, response);
  } catch (error) {
    console.error('Error proxying to VM:', error);
    return new Response('Service temporarily unavailable', { status: 503 });
  }
}
```

## 📊 Managing the App

**Check status:**
```bash
pm2 status
```

**View logs:**
```bash
pm2 logs eos-l10
```

**Restart app:**
```bash
pm2 restart eos-l10
```

**Monitor performance:**
```bash
pm2 monit
```

## 🎯 What You Get

- ✅ **Dynamic Next.js app** with full server-side rendering
- ✅ **Database connections** to Supabase
- ✅ **Authentication** support
- ✅ **API routes** working properly
- ✅ **Auto-restart** on crashes via PM2
- ✅ **Production optimizations** enabled

## 📝 VM Access Details

- **IP**: 35.225.189.208
- **User**: anand
- **Project**: apigatewayproject-451519
- **Zone**: us-central1-a
- **App Port**: 3010

## 🚨 Troubleshooting

If you encounter issues:

1. **Check PM2 logs:**
   ```bash
   pm2 logs eos-l10 --lines 100
   ```

2. **Restart the app:**
   ```bash
   pm2 restart eos-l10
   ```

3. **Check Node.js version:**
   ```bash
   node -v  # Should be v20 or higher
   ```

4. **Verify port is not blocked:**
   ```bash
   sudo netstat -tlnp | grep 3010
   ```