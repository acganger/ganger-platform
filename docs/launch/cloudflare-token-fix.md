# 🔧 Cloudflare API Token Permission Fix

## Problem Identified
Your current Cloudflare API token only has **zone-level permissions** but we need **account-level permissions** for Cloudflare Pages deployment automation.

## Current Token Permissions
- ✅ Zone: DNS records read/edit  
- ✅ Zone: SSL read
- ✅ Zone: Settings read
- ❌ Account: Pages read/edit (**MISSING**)
- ❌ Account: Workers read/edit (**MISSING**)

## Quick Fix (2 minutes)

### Option 1: Update Existing Token
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Find your token: `TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf`
3. Click **"Edit"**
4. Add these permissions:
   - **Cloudflare Pages:Edit** (Account level)
   - **Cloudflare Workers:Edit** (Account level)
   - **Account:Read** (Account level)
5. Click **"Continue to summary"** → **"Update Token"**

### Option 2: Create New Token (Recommended)
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**
3. Use **"Custom Token"** template
4. Set these permissions:

```
Account: Cloudflare Pages:Edit
Account: Cloudflare Workers:Edit  
Account: Account:Read
Zone: Zone:Read (gangerdermatology.com)
Zone: DNS:Edit (gangerdermatology.com)
Zone: Zone Settings:Edit (gangerdermatology.com)
```

5. Set **Account Resources**: Include → Your Account (MichiGanger)
6. Set **Zone Resources**: Include → gangerdermatology.com
7. Click **"Continue to summary"** → **"Create Token"**
8. **Copy the new token** and update GitHub secrets:

```bash
gh secret set CLOUDFLARE_API_TOKEN --body "YOUR_NEW_TOKEN"
```

## Current DNS Status ✅
Good news! DNS records are already configured:
- ✅ `staff.gangerdermatology.com` → `ganger-platform.pages.dev`
- ✅ `lunch.gangerdermatology.com` → `ganger-platform.pages.dev` 
- ✅ `l10.gangerdermatology.com` → `ganger-platform.pages.dev`

## Missing Records to Add
After fixing the token, we need these additional DNS records:
- `reps.gangerdermatology.com` → `reps-production.pages.dev`
- `kiosk.gangerdermatology.com` → `kiosk-production.pages.dev`

## Alternative: Manual Pages Setup
If you prefer not to update the token, we can:
1. **Manually create** 3 Pages projects in Cloudflare dashboard
2. **Connect to GitHub** repository via UI
3. **Use GitHub Actions** for deployment (will still work)

Would you like me to proceed with either approach?