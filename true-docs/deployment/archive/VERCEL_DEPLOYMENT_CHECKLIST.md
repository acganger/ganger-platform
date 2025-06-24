# ✅ Vercel Deployment Checklist

Since the CLI is having issues with the monorepo structure, here's the correct approach:

## Option 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - https://vercel.com/ganger

2. **For Each App You Want to Deploy:**
   
   a. Click "Add New..." → "Project"
   
   b. Since GitHub is already connected, select "Import Git Repository"
   
   c. Find `acganger/ganger-platform` and click "Import"
   
   d. **CRITICAL Configuration**:
      - **Project Name**: `ganger-[app-name]` (e.g., `ganger-inventory`)
      - **Framework Preset**: Next.js (auto-detected)
      - **Root Directory**: Click "Edit" and select `apps/[app-name]` (e.g., `apps/inventory`)
      - **Build Command**: Leave as `turbo build` (Vercel will handle it)
      - **Output Directory**: Leave as default
      - **Install Command**: Leave as default (Vercel detects pnpm)
   
   e. **Environment Variables**: Already set at team level ✅
   
   f. Click "Deploy"

3. **Apps to Deploy** (in order):
   - `apps/eos-l10` → Project: `ganger-eos-l10`
   - `apps/inventory` → Project: `ganger-inventory`
   - `apps/handouts` → Project: `ganger-handouts`
   - `apps/checkin-kiosk` → Project: `ganger-checkin-kiosk`
   - `apps/medication-auth` → Project: `ganger-medication-auth`
   - `apps/clinical-staffing` → Project: `ganger-clinical-staffing`
   - `apps/pharma-scheduling` → Project: `ganger-pharma-scheduling`
   - `apps/staff` → Project: `ganger-staff`

## Option 2: Fix CLI Deployment

If you want to use CLI, we need to:

1. Remove the root vercel.json I created:
   ```bash
   rm vercel.json
   ```

2. Commit the removed app vercel.json files:
   ```bash
   git add -A
   git commit -m "Remove vercel.json files for proper monorepo deployment"
   git push
   ```

3. Use the import command for each app:
   ```bash
   cd apps/inventory
   vercel link --yes --project=ganger-inventory
   vercel --prod
   ```

## Verification Checklist

After deployment, verify each app:

- [ ] EOS L10: https://ganger-eos-l10.vercel.app
- [ ] Inventory: https://ganger-inventory.vercel.app
- [ ] Handouts: https://ganger-handouts.vercel.app
- [ ] Check-in Kiosk: https://ganger-checkin-kiosk.vercel.app
- [ ] Medication Auth: https://ganger-medication-auth.vercel.app
- [ ] Clinical Staffing: https://ganger-clinical-staffing.vercel.app
- [ ] Pharma Scheduling: https://ganger-pharma-scheduling.vercel.app
- [ ] Staff: https://ganger-staff.vercel.app

## Custom Domains

After verification, add custom domains in each project's settings:
1. Go to project → Settings → Domains
2. Add the custom domain (e.g., `inventory.gangerdermatology.com`)
3. Vercel will provide DNS instructions

## Why This Works

- Vercel automatically detects Turborepo and pnpm
- It runs `turbo build` which filters to the correct app
- Workspace dependencies are resolved automatically
- No complex configuration needed

## The deployment engineer was 100% right - Vercel just works with Next.js monorepos!