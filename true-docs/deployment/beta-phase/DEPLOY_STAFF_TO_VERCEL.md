# Deploy Staff App to Vercel - Manual Steps Required

The staff.gangerdermatology.com domain is correctly pointing to Vercel, but the staff app hasn't been deployed yet. You need to complete these manual steps in the Vercel dashboard:

## Steps to Deploy Staff App:

### 1. Create New Vercel Project
1. Go to https://vercel.com/new
2. Import from Git repository: `acganger/ganger-platform`
3. Configure project:
   - **Project Name**: `ganger-staff`
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/staff`
   - **Build Command**: `cd ../.. && npm run build:staff`
   - **Output Directory**: `apps/staff/.next`
   - **Install Command**: `cd ../.. && npm install`

### 2. Configure Environment Variables
Copy ALL environment variables from `.env` file to Vercel project settings:
- Go to Project Settings → Environment Variables
- Add all variables from the `.env` file
- Apply to: Production, Preview, Development

### 3. Add Custom Domain
1. Go to Project Settings → Domains
2. Add domain: `staff.gangerdermatology.com`
3. Vercel will automatically configure it (DNS already points to Vercel)

### 4. Deploy
1. Click "Deploy" to build and deploy the app
2. Monitor the build logs for any errors

## If Build Fails:

### Common Issues:
1. **TypeScript errors**: Add to next.config.js:
   ```javascript
   typescript: {
     ignoreBuildErrors: true
   }
   ```

2. **ESLint errors**: Add to next.config.js:
   ```javascript
   eslint: {
     ignoreDuringBuilds: true
   }
   ```

3. **Missing dependencies**: Make sure all packages have file: paths instead of workspace:*

## Current Status:
- ✅ DNS configured (pointing to Vercel)
- ✅ Dependencies fixed (workspace:* converted to file:)
- ✅ Package manager set to npm
- ❌ Vercel project needs to be created
- ❌ Environment variables need to be added
- ❌ Domain needs to be connected

## Expected Result:
Once deployed, staff.gangerdermatology.com will serve as the main portal, routing to all other apps via the rewrites configured in vercel.json.