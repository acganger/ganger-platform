# R2 Setup Guide - Superior Asset Storage

## 🚀 Why R2 > KV for Dashboard Applications

Your enhanced API token now includes **Workers R2 Storage:Edit** permissions, which enables the superior storage solution:

### **R2 Advantages:**
- ✅ **No size limits** (KV has 25MB per value limit)
- ✅ **Better performance** for static file serving
- ✅ **Lower costs** for file storage
- ✅ **Purpose-built** for static assets
- ✅ **Simpler integration** with Workers

---

## **Step 1: Enable R2 in Cloudflare Dashboard**

### Manual Dashboard Setup (Required)
1. **Log into Cloudflare Dashboard**
2. **Go to R2 Object Storage** (in left sidebar)
3. **Click "Enable R2"** 
4. **Accept pricing** (very low cost for your use case)
5. **Verify R2 is enabled**

*Note: This step requires manual dashboard action even with API permissions*

---

## **Step 2: Create R2 Buckets**

Once R2 is enabled, use these commands:

### For EOS L10
```bash
export CLOUDFLARE_API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"
export CLOUDFLARE_ACCOUNT_ID="68d0160c9915efebbbecfddfd48cddab"
npx wrangler r2 bucket create ganger-eos-l10-assets
```

### For Other Applications  
```bash
npx wrangler r2 bucket create ganger-inventory-assets
npx wrangler r2 bucket create ganger-handouts-assets
npx wrangler r2 bucket create ganger-checkin-assets
npx wrangler r2 bucket create ganger-medication-assets
npx wrangler r2 bucket create ganger-pharma-assets
```

---

## **Step 3: Upload Assets to R2**

### Method A: Automated Upload (Recommended)
```bash
# Upload Next.js build output to R2
cd apps/eos-l10
npm run build
npx wrangler r2 object put ganger-eos-l10-assets --file=out --recursive
```

### Method B: Deployment Integration
Add to your deployment scripts:
```bash
# In your CI/CD or deployment process
npm run build
npx wrangler r2 object put ganger-[app]-assets --file=out --recursive
npx wrangler deploy --env production
```

---

## **Step 4: Update Worker Configuration**

### wrangler.toml Changes
```toml
# Replace KV namespace with R2 bucket
[[env.production.r2_buckets]]
binding = "STATIC_ASSETS"
bucket_name = "ganger-eos-l10-assets"

# Remove KV namespace binding
# [[env.production.kv_namespaces]]
# binding = "STATIC_CONTENT_V2" 
# id = "..."
```

### Worker Code Updates
```javascript
// Replace getAssetFromKV with R2 direct access
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      let pathname = url.pathname;

      // Health check
      if (pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          app: 'eos-l10-r2',
          storage: 'r2',
          timestamp: new Date().toISOString()
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      // Handle Next.js routing
      if (pathname === '/') pathname = '/index.html';
      else if (!pathname.includes('.') && !pathname.endsWith('/')) {
        pathname = pathname + '/index.html';
      }
      else if (pathname.endsWith('/') && pathname !== '/') {
        pathname = pathname + 'index.html';
      }

      // Remove leading slash for R2 key
      const key = pathname.startsWith('/') ? pathname.slice(1) : pathname;
      
      // Get object from R2
      const object = await env.STATIC_ASSETS.get(key);
      
      if (!object) {
        // Try index.html for SPA routing
        const indexObject = await env.STATIC_ASSETS.get('index.html');
        if (indexObject) {
          return new Response(indexObject.body, {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'public, max-age=86400',
            }
          });
        }
        return new Response(`App - Page not found: ${pathname}`, { status: 404 });
      }

      // Determine content type
      let contentType = 'application/octet-stream';
      if (key.endsWith('.html')) contentType = 'text/html';
      else if (key.endsWith('.js')) contentType = 'application/javascript';
      else if (key.endsWith('.css')) contentType = 'text/css';
      else if (key.endsWith('.json')) contentType = 'application/json';
      else if (key.endsWith('.png')) contentType = 'image/png';
      else if (key.endsWith('.jpg') || key.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (key.endsWith('.svg')) contentType = 'image/svg+xml';

      return new Response(object.body, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        }
      });

    } catch (error) {
      return new Response(`App - Error: ${error.message}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};
```

---

## **Step 5: Deploy R2-Enabled Applications**

### Complete Deployment Process
```bash
# 1. Build application
cd apps/[app-name]
npm run build

# 2. Upload to R2
npx wrangler r2 object put ganger-[app]-assets --file=out --recursive

# 3. Deploy worker
cd ../../workers/[app-name]-static
npx wrangler deploy --env production

# 4. Update staff router
cd ../staff-router
npx wrangler deploy --env production

# 5. Test deployment
curl -s https://staff.gangerdermatology.com/[app] | head -10
```

---

## **Benefits After R2 Migration**

### **Performance Improvements**
- **Faster asset serving** (purpose-built for files)
- **Better caching** at Cloudflare edge
- **No KV limitations** on file sizes

### **Operational Benefits**
- **Simpler debugging** (direct file access)
- **Better monitoring** (R2 analytics)
- **Cost efficiency** (cheaper than KV for files)

### **Development Benefits**  
- **Easier asset management** (upload/download files directly)
- **Standard file operations** (no key-value abstractions)
- **Better tooling** (R2 dashboard, CLI commands)

---

## **Migration Timeline**

### **Immediate (Current Setup)**
- ✅ **KV approach working** for new deployments
- ✅ **Enhanced API token** ready for R2
- ✅ **Deployment template** includes R2 instructions

### **Phase 1: Enable R2** (Manual dashboard step)
- Enable R2 in Cloudflare Dashboard
- Create initial buckets for priority applications

### **Phase 2: Migrate Applications** (Per application)
- Update worker configurations
- Upload assets to R2
- Deploy and test

### **Phase 3: Standardize** (All applications)
- All new applications use R2 by default
- KV approach deprecated for static assets

---

**Next Action Required**: Enable R2 in your Cloudflare Dashboard to unlock superior asset storage for all dashboard applications.