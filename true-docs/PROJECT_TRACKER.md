# Ganger Platform - Deployment Tracker

*Essential deployment information for 17 Next.js applications*  
*Last Updated: January 2025*

---

## 🚀 Deployment Architecture

### Platform: Vercel Distributed Architecture
- **20+ Individual Vercel Projects**: Each app deploys independently
- **Staff Portal Router**: Uses vercel.json rewrites to proxy requests
- **Unified Domain**: All staff apps accessible via `staff.gangerdermatology.com/[appname]`
- **Public Apps**: Separate domains for external access

### How It Works
```
staff.gangerdermatology.com (Router)
├── /inventory → inventory-xyz.vercel.app
├── /handouts → handouts-xyz.vercel.app
├── /l10 → eos-l10-xyz.vercel.app
└── ... (15+ more apps)
```

### Deployment Process
```bash
# Use automated scripts
cd true-docs/deployment/scripts

# 1. Deploy all apps individually
./01-deploy-all-apps.sh

# 2. Update staff portal rewrites
node 03-update-staff-rewrites.js

# 3. Deploy staff portal router
cd apps/staff && vercel --prod
```

---

## 📱 Application Routing & Status

### 🏢 Staff Portal Apps (15 apps at staff.gangerdermatology.com)

| App | Folder | Route | Description |
|-----|--------|-------|-------------|
| **Staff Dashboard** | `apps/staff` | `/` | Main portal & app launcher |
| **Inventory** | `apps/inventory` | `/inventory` | Medical supply tracking |
| **Handouts** | `apps/handouts` | `/handouts` | Patient education (staff view) |
| **EOS L10** | `apps/eos-l10` | `/l10` | Team management |
| **Batch Closeout** | `apps/batch-closeout` | `/batch` | Financial processing |
| **Compliance Training** | `apps/compliance-training` | `/compliance` | Staff training |
| **Clinical Staffing** | `apps/clinical-staffing` | `/clinical-staffing` | Provider scheduling |
| **Config Dashboard** | `apps/config-dashboard` | `/config` | Platform configuration |
| **Integration Status** | `apps/integration-status` | `/integration-status` | Monitoring |
| **AI Receptionist** | `apps/ai-receptionist` | `/ai-receptionist` | Phone agent management |
| **Call Center Ops** | `apps/call-center-ops` | `/call-center` | Call management |
| **Medication Auth** | `apps/medication-auth` | `/medication-auth` | Prior auth (staff) |
| **Pharma Scheduling** | `apps/pharma-scheduling` | `/pharma` or `/lunch` | Rep scheduling (staff) |
| **Socials Reviews** | `apps/socials-reviews` | `/socials` | Review management |
| **Component Showcase** | `apps/component-showcase` | `/components` | UI library reference |

### 🌐 Public-Facing Apps (2 separate deployments)

| App | Folder | Domain | Description |
|-----|--------|--------|-------------|
| **Pharma Portal** | `apps/pharma-scheduling` | `lunch.gangerdermatology.com` | Pharma reps book appointments |
| **Patient Kiosk** | `apps/checkin-kiosk` | `kiosk.gangerdermatology.com` | Patient self check-in |

### 🚧 Future Public Portals

| App | Folder | Planned Domain | Description |
|-----|--------|----------------|-------------|
| **Patient Handouts** | `apps/handouts` | `handouts.gangerdermatology.com` | Patient material access |
| **Platform Dashboard** | `apps/platform-dashboard` | Internal use only | System monitoring |

---

## 🔧 Vercel Project Configuration

### Standard Configuration for Each App
```
Project Name: ganger-[app-name]
Domain: [app-name]-[hash].vercel.app
Root Directory: apps/[app-name]
Build Command: cd ../.. && npm run build:[app-name]
Install Command: cd ../.. && npm install
Output Directory: .next
Framework Preset: Next.js
```

### Staff Portal Router Configuration
```
Project Name: ganger-staff-portal
Domain: staff.gangerdermatology.com
Contains: vercel.json with rewrites to all other apps
Role: Central router/proxy
```

### Example Rewrites in Staff Portal vercel.json
```json
{
  "rewrites": [
    { "source": "/inventory/(.*)", "destination": "https://inventory-xyz.vercel.app/$1" },
    { "source": "/l10/(.*)", "destination": "https://eos-l10-xyz.vercel.app/$1" },
    // ... more rewrites for each app
  ]
}
```

### Essential next.config.js
```javascript
module.exports = {
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  transpilePackages: [
    '@ganger/ui',
    '@ganger/auth',
    '@ganger/db',
    '@ganger/utils',
    '@ganger/config'
  ]
}
```

### Environment Variables (Required for All Apps)
Copy all variables from CLAUDE.md to each Vercel project:
- Database URLs (Supabase)
- Authentication keys (Google OAuth)
- API tokens (various services)
- Public URLs for cross-app navigation

---

## 📋 Deployment Checklist

### Phase 1: Pre-Deployment Validation
1. [ ] Run `node true-docs/deployment/scripts/02-pre-deployment-check.js`
2. [ ] Fix any critical issues
3. [ ] Prepare deployment-env.secret file

### Phase 2: Deploy All Apps Individually
1. [ ] Run `./true-docs/deployment/scripts/01-deploy-all-apps.sh`
2. [ ] Script will create 20+ individual Vercel projects
3. [ ] Each app gets its own deployment URL
4. [ ] Environment variables added to each project

### Phase 3: Configure Staff Portal Router
1. [ ] Run `node true-docs/deployment/scripts/03-update-staff-rewrites.js`
2. [ ] This updates staff portal's vercel.json with all app URLs
3. [ ] Deploy staff portal: `cd apps/staff && vercel --prod`
4. [ ] Configure custom domain for staff.gangerdermatology.com

### Phase 4: Deploy Public Apps
1. [ ] Deploy pharma-scheduling to lunch.gangerdermatology.com
2. [ ] Deploy checkin-kiosk to kiosk.gangerdermatology.com
3. [ ] Configure custom domains in Vercel

---

## 🏗️ Shared Infrastructure

### Backend Packages (All Working)
- `@ganger/auth` - Authentication utilities
- `@ganger/db` - Database client (Prisma + Supabase)
- `@ganger/ui` - Shared React components
- `@ganger/utils` - Common utilities
- `@ganger/config` - Shared configurations

### Key Dependencies
- **Next.js 14** - All apps use same version
- **React 18.3.1** - Standardized across platform
- **TypeScript 5.x** - With relaxed build settings
- **Tailwind CSS** - Shared design system
- **Supabase** - Database and auth

---

## 🚨 Common Issues & Solutions

### Build Errors
```javascript
// Add to next.config.js
typescript: { ignoreBuildErrors: true }
eslint: { ignoreDuringBuilds: true }
```

### Workspace Dependencies
```javascript
// Ensure transpilePackages includes all @ganger/* packages
transpilePackages: ['@ganger/ui', '@ganger/auth', '@ganger/db', '@ganger/utils']
```

### Environment Variables
- Use same variable names across all apps
- Copy from CLAUDE.md exactly
- Set in Vercel dashboard, not in code

---

## 📊 Deployment Progress

### ✅ Phase 1: Individual App Deployments (20+ projects)
- [ ] inventory → inventory-[hash].vercel.app
- [ ] handouts → handouts-[hash].vercel.app
- [ ] eos-l10 → eos-l10-[hash].vercel.app
- [ ] batch-closeout → batch-closeout-[hash].vercel.app
- [ ] compliance-training → compliance-training-[hash].vercel.app
- [ ] clinical-staffing → clinical-staffing-[hash].vercel.app
- [ ] config-dashboard → config-dashboard-[hash].vercel.app
- [ ] integration-status → integration-status-[hash].vercel.app
- [ ] ai-receptionist → ai-receptionist-[hash].vercel.app
- [ ] call-center-ops → call-center-ops-[hash].vercel.app
- [ ] medication-auth → medication-auth-[hash].vercel.app
- [ ] socials-reviews → socials-reviews-[hash].vercel.app
- [ ] component-showcase → component-showcase-[hash].vercel.app
- [ ] platform-dashboard → platform-dashboard-[hash].vercel.app
- [ ] pharma-scheduling → pharma-scheduling-[hash].vercel.app
- [ ] checkin-kiosk → checkin-kiosk-[hash].vercel.app

### ✅ Phase 2: Staff Portal Router
- [ ] Deploy staff portal with vercel.json rewrites
- [ ] Configure staff.gangerdermatology.com domain
- [ ] Test all route proxying works correctly

### ✅ Phase 3: Public Domains
- [ ] Configure lunch.gangerdermatology.com → pharma-scheduling
- [ ] Configure kiosk.gangerdermatology.com → checkin-kiosk

---

## 📝 Notes

- All apps follow similar structure and deployment pattern
- Start with simplest apps to establish deployment pipeline
- Use staff portal's vercel.json as reference
- Each app can be deployed independently
- No complex build scripts needed - Vercel handles monorepo

---

*This tracker focuses on essential deployment information only. For detailed architecture and development guides, see other documentation.*