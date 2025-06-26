# 🚀 Deploy Staff Portal NOW - Manual Steps

Since we need the Vercel token, here are the manual steps to deploy the staff portal immediately:

## Option 1: Using Vercel Dashboard (Easiest)

### Step 1: Go to Vercel
1. Open https://vercel.com/new
2. Sign in with your account

### Step 2: Import Project
1. Click "Import Git Repository"
2. Select `acganger/ganger-platform`
3. Configure import:
   - **Project Name**: `ganger-staff`
   - **Framework Preset**: Next.js
   - **Root Directory**: Click "Edit" and set to `apps/staff`
   - **Build and Output Settings**:
     - Build Command: `cd ../.. && npm run build:staff`
     - Output Directory: `apps/staff/.next`
     - Install Command: `cd ../.. && npm install`

### Step 3: Configure Environment Variables
1. Click "Environment Variables"
2. Add all variables from your `.env` file
3. Make sure to set them for: Production, Preview, Development

### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete (3-5 minutes)

### Step 5: Add Custom Domain
1. Once deployed, go to Project Settings → Domains
2. Add `staff.gangerdermatology.com`
3. Vercel will verify and configure it automatically

## Option 2: Using Vercel CLI

### Step 1: Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy from apps/staff directory
```bash
cd apps/staff
vercel --prod
```

When prompted:
- Set up and deploy: Y
- Which scope: Select your team
- Link to existing project? N
- Project name: ganger-staff
- Directory: ./
- Override settings? Y
  - Build Command: `cd ../.. && npm run build:staff`
  - Output Directory: `apps/staff/.next`
  - Development Command: `next dev`

### Step 4: Add Domain
```bash
vercel domains add staff.gangerdermatology.com
```

## Option 3: Get Vercel Token and Run Automated Script

### Step 1: Get your Vercel Token
1. Go to https://vercel.com/account/tokens
2. Create a new token with full access
3. Copy the token

### Step 2: Set Environment Variables
```bash
export VERCEL_TOKEN="your-token-here"
export VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"
```

### Step 3: Run Automated Deployment
```bash
cd /mnt/q/Projects/ganger-platform
./true-docs/deployment/scripts/deploy-staff-portal-automated.sh
```

## What Happens After Deployment

Once deployed successfully:
1. **staff.gangerdermatology.com** will be live
2. Beta testers can access:
   - 7 working applications
   - Professional "Coming Soon" pages for pending apps
3. You can share with your testing cohort immediately

## Next: Deploy Phase 2 Apps

After staff portal is live, deploy EOS L10 and Batch Closeout:
```bash
./true-docs/deployment/scripts/fix-and-deploy-phase2-apps.sh
```

---

**Choose Option 1 (Vercel Dashboard) for the quickest deployment without needing tokens!**