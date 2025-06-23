# VM Setup Information Needed

To automate the deployment to your Google VM, I need the following information:

## 1. VM Access Details
- **VM IP Address**: `_______________` (e.g., 34.123.45.67)
- **SSH Username**: `_______________` (e.g., anand)
- **SSH Key Path**: `_______________` (e.g., ~/.ssh/google_compute_engine)

## 2. Current VM Setup
- **Is Node.js installed?**: Yes / No
- **If yes, version**: `_______________` (run `node --version`)
- **Is PM2 installed?**: Yes / No (for process management)
- **Is nginx installed?**: Yes / No (for reverse proxy)

## 3. Domain Configuration
- **Do you want to use Cloudflare Tunnel?**: Yes / No
- **If yes, subdomain preference**: `_______________` (e.g., l10-vm.gangerdermatology.com)
- **Or use direct IP with port?**: Yes / No

## 4. Deployment Preferences
- **GitHub repo URL**: `_______________` (for cloning on VM)
- **Or copy files via rsync?**: Yes / No
- **Preferred deployment directory**: `_______________` (e.g., /home/anand/apps)

## 5. Database/Services
- **Can VM access Supabase?**: Yes / No (test with ping)
- **Need any firewall rules?**: Yes / No
- **Port range available**: `_______________` (e.g., 3000-4000)

## Example Filled Form:
```
1. VM Access:
   - IP: 34.123.45.67
   - Username: anand
   - Key: ~/.ssh/google_compute_engine

2. VM Setup:
   - Node.js: Yes, v20.11.0
   - PM2: No
   - nginx: Yes

3. Domain:
   - Cloudflare Tunnel: Yes
   - Subdomain: apps.gangerdermatology.com

4. Deployment:
   - GitHub: https://github.com/acganger/ganger-platform
   - Directory: /home/anand/production

5. Services:
   - Supabase access: Yes
   - Firewall: No changes needed
   - Ports: 3000-4000 available
```

## Once you provide this info, I'll create:

1. **automated-deploy.sh** - Complete deployment script
2. **vm-setup.sh** - One-time VM setup script
3. **update-app.sh** - Script to update apps
4. **monitoring.sh** - Health check script

These scripts will:
- ✅ Set up the VM environment
- ✅ Deploy all your apps
- ✅ Configure process management
- ✅ Set up Cloudflare Tunnel (if desired)
- ✅ Handle updates and monitoring