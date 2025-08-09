# Ganger Platform - Claude Code Documentation

*Last Updated: August 8, 2025*  
*Platform Version: 2.0.2*  
*Maintained by: Claude Code & Anand Ganger*

The Ganger Platform is a private, medical-grade monorepo for Ganger Dermatology, hosting 22 Next.js 14 applications. Built with TypeScript, Supabase, and Vercel, it ensures HIPAA compliance, AI automation, and high-quality development.

## 🛡️ Development Principles

### Absolute Rules
- **No Shortcuts, Hacks, or Workarounds**: Quick fixes create technical debt. Fix issues properly.
- **Quality First**: No time constraints. Do it right the first time.
- **Understand Before Changing**: Read context, ask "why," and test one app before scaling changes.
- **AI Automation**: Automate everything possible. Humans only do what AI cannot (e.g., passwords, physical actions).

### 🚨 CRITICAL: Local Testing Requirements
**NEVER push code without local testing**
- Each failed deployment wastes hours and blocks feature usage

**Before EVERY push:**
1. Run `pnpm -F @ganger/[app-name] build` for ALL affected apps
2. Fix ALL TypeScript errors locally
3. Run `pnpm -F @ganger/[app-name] dev` and test in browser
4. Only push when everything works locally

### Vercel Local Testing (Added August 7, 2025)
**Test production builds locally with Vercel CLI**
- Vercel CLI installed globally: `npm install -g vercel`
- Apps linked to Vercel: `vercel link --token [TOKEN] --yes`
- Environment synced: `vercel pull --yes`

**Testing Commands**:
```bash
# Emulate Vercel's production environment locally
vercel dev --token [TOKEN]

# Build using Vercel's build process
vercel build --token [TOKEN]

# Standard Next.js production test
pnpm build && pnpm start
```

### Definition of "Complete"
A feature/app is complete only when:
- [ ] **LOCAL BUILD PASSES**: `pnpm -F @ganger/[app-name] build` succeeds
- [ ] **NO TYPESCRIPT ERRORS**: All type errors fixed (no `any` escape hatches)
- [ ] **RUNS LOCALLY**: `pnpm -F @ganger/[app-name] dev` works
- [ ] All imports resolve to existing files
- [ ] Type check passes: `pnpm -F @ganger/[app-name] type-check`
- [ ] All API routes tested with actual requests
- [ ] Features work end-to-end in LOCAL browser
- [ ] No mock data in production
- [ ] All @ganger/* dependencies exist and build

**Verification Commands**:
```bash
pnpm -F @ganger/[app-name] build
pnpm -F @ganger/[app-name] type-check
pnpm -F @ganger/[app-name] dev
grep -r "@ganger" apps/[app-name]/src --include="*.ts" --include="*.tsx" | grep "from"
```

**Never** claim completion based on partial implementation or untested assumptions.

### AI Automation Principles
- Automate all possible tasks via API/CLI.
- Follow approved plans exactly; get approval for deviations.
- Use Vercel API with token, not npm/npx vercel.
- Check logs/errors via API before involving users.
- Efficiency: AI handles automatable tasks; humans handle only what's required.

### Cost of Shortcuts
Shortcuts waste time:
- 1-hour proper fix vs. 10+ hours fixing a 10-minute hack.
- Each shortcut breaks automation and creates downstream issues.

**Time Investment**:
- 5 minutes of local testing saves hours of deployment debugging
- Finding errors locally = immediate fix
- Finding errors in deployment = investigate logs, guess at issues, multiple fix attempts

### Common TypeScript Errors (Fix Immediately)
1. **Error handling**: Always use `error instanceof Error ? error.message : 'Unknown error'`
2. **Object.entries**: Use explicit types `const entries = Object.entries(obj) as [string, Type][]`
3. **Dynamic properties**: Type as `const result: any = {}` or use proper interfaces
4. **Array methods**: Add types to parameters `.filter((item: any) => ...)`
5. **NEVER use** `typescript: { ignoreBuildErrors: true }` - fix the errors!
6. **Unused imports/variables**: 
   - Remove if truly unused
   - Prefix with underscore if intentionally unused: `const { user: _user } = useStaffAuth()`
   - For React imports: Only import when using JSX or React APIs
7. **Auth destructuring**: Use `useStaffAuth()` without destructuring if values aren't used
8. **Null checks**: Always check optional chaining with `?.` or provide defaults with `|| []`
9. **Function signatures**: Match the expected arguments (e.g., `exportMetricsToPDF()` takes no args)
10. **TSConfig**: Add `"downlevelIteration": true` if using ES6 features with ES5 target
11. **Array access**: Use non-null assertion when certain: `array[index]!`
12. **Optional parameters**: Use underscore prefix for unused parameters: `(_param: Type)`

## 🚀 Platform Overview

The Ganger Platform is a digital transformation for Ganger Dermatology, with 22 applications covering medical, staff, and business operations.

### Applications

#### Group 1 (Highest Priority - In Progress)
| **Category**         | **App Name**            | **Path**                     | **Dev Port** | **Function**                              |
|-----------------------|-------------------------|------------------------------|--------------|-------------------------------------------|
| **Business Systems**  | Batch Closeout          | `/batch`                     | 4003         | Financial batch processing               |
| **Core Medical**      | Check-in Kiosk          | `/kiosk` (public: kiosk.gangerdermatology.com) | 4005 | Patient self-service terminal |
|                       | EOS L10                 | `/l10`                      | 4011         | Team management and EOS implementation   |
| **Staff Operations**  | Ganger Actions          | `/actions`                   | 4012         | Employee forms & utility hub             |
| **Infrastructure**    | Ganger Staff            | `/`                          | 4000         | Platform router (main entry point)       |
| **Core Medical**      | Patient Handouts        | `/handouts`                  | 4013         | Educational materials with QR scanning    |
| **Business Systems**  | Socials & Reviews       | `/socials`                   | 4020         | Review management                        |

#### Group 2 (Medium Priority - Remaining)
| **Category**         | **App Name**            | **Path**                     | **Dev Port** | **Function**                              |
|-----------------------|-------------------------|------------------------------|--------------|-------------------------------------------|
| **Core Medical**      | Inventory Management    | `/inventory`                 | 4015         | Medical supply tracking with barcode      |
| **Staff Operations**  | Clinical Staffing       | `/clinical-staffing`         | 4006         | Provider scheduling                      |
|                       | Call Center Operations  | `/call-center`               | 4004         | Call management dashboard                |
| **Infrastructure**    | Platform Dashboard      | `/platform-dashboard`        | 4019         | System overview                          |
|                       | Config Dashboard        | `/config`                    | 4009         | Configuration management                 |
|                       | Component Showcase      | `/component-showcase`        | 4008         | UI component library                     |

#### Group 3 (Lower Priority - Remaining)
| **Category**         | **App Name**            | **Path**                     | **Dev Port** | **Function**                              |
|-----------------------|-------------------------|------------------------------|--------------|-------------------------------------------|
| **Infrastructure**    | AI Receptionist         | `/ai-receptionist`           | 4002         | AI phone agent demo                      |
| **AI & Demos**        | AI Purchasing Agent     | `/ai-purchasing`             | 4001         | AI procurement assistant                  |
| **Business Systems**  | Compliance Training     | `/compliance`                | 4007         | Staff training platform                  |
| **Infrastructure**    | Integration Status      | `/status`                    | 4014         | Integration monitoring                   |
| **AI & Demos**        | LLM Demo                | `/llm-demo`                  | 4016         | Language model demonstrations             |
| **Core Medical**      | Medication Authorization | `/medication-auth`          | 4017         | Prior auth management                    |
| **Staff Operations**  | Pharma Scheduling       | `/pharma` (public: lunch.gangerdermatology.com) | 4018 | Rep visit coordination |
| **AI & Demos**        | Consolidated Order Form | `/order-form`                | 4010         | Unified ordering interface                |

### Benefits
- **Performance**: Next.js SSR/SSG with Vercel CDN.
- **Scalability**: Serverless infrastructure.
- **Security**: Google OAuth, HIPAA-compliant.
- **Maintainability**: TypeScript, shared components.
- **Efficiency**: AI automation, pay-per-use hosting.

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS v4.
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **Build**: Turborepo for monorepo, pnpm.
- **Deployment**: Vercel with GitHub integration.
- **CI/CD**: GitHub Actions.
- **Infrastructure**: Cloudflare DNS, Google OAuth, Supabase analytics.
- **MCP Servers**: 8 servers (Supabase, GitHub, Cloudflare, Google Cloud Run, Stripe, Twilio, Filesystem, Time) for 400-600% faster development.

## 🚨 Deployment Rules

### Vercel Deployment
- **Platform**: Vercel, auto-triggered by Git push.
- **Build**: Standard `next build`.
- **Config**: Environment variables in Vercel dashboard only.
- **Routing**: `ganger-staff` uses `vercel.json` rewrites (no middleware).
- **Credentials** (for manual deployments):
  - `VERCEL_TOKEN`: Available in MCP server config
  - `VERCEL_TEAM_ID`: Available in MCP server config
  - Located in: `.claude/settings.json` under `mcpServers.vercel.env`

### Rules
- **ALWAYS** fix TypeScript errors properly - NEVER use `ignoreBuildErrors: true`
- **Test locally first** - deployment should never be where you discover errors
- **Never** add custom scripts or alternatives to Vercel.
- **Always** use Tailwind v4 PostCSS syntax: `'@tailwindcss/postcss': {}`.
- **Fix Failures**: Check Vercel logs, add config to skip errors, ensure env variables.

### Vercel.json Example (ganger-staff)
```json
{
  "rewrites": [
    { "source": "/inventory/:path*", "destination": "https://ganger-inventory.vercel.app/inventory/:path*" },
    // Add other app routes
  ]
}
```

### Tailwind v4 Config (All Apps)
```javascript
// tailwind.config.js
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/auth/src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/utils/src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/deps/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: { extend: {} },
  plugins: [],
};

// postcss.config.js
module.exports = {
  plugins: { '@tailwindcss/postcss': {} },
};
```

## 📦 Monorepo Dependency Strategy

### Structure
- **Shared Runtime**: `@ganger/deps` (common dependencies, no edge-incompatible libraries).
- **Next.js Core**: Each app has `next`, `react`, `react-dom`.
- **App-Specific**: Edge-incompatible libraries in app's `package.json`.
- **Dev Tools**: Shared in root `package.json` (TypeScript, ESLint).

### App package.json Example
```json
{
  "name": "@ganger/[app-name]",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.2.29",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwindcss": "^4.0.0-alpha.33",
    "@tailwindcss/postcss": "^4.0.0-alpha.33",
    "postcss": "^8.4.35",
    "@ganger/deps": "workspace:*",
    "@ganger/auth": "workspace:*",
    "@ganger/cache": "workspace:*",
    "@ganger/config": "workspace:*",
    "@ganger/db": "workspace:*",
    "@ganger/integrations": "workspace:*",
    "@ganger/monitoring": "workspace:*",
    "@ganger/types": "workspace:*",
    "@ganger/ui": "workspace:*",
    "@ganger/utils": "workspace:*"
  },
  "devDependencies": {
    "@ganger/config": "workspace:*"
  }
}
```

### Shared Packages
Reuse these to avoid duplication:
- **@ganger/auth**: Google OAuth, Supabase auth, permissions.
- **@ganger/cache**: Redis caching, performance optimization.
- **@ganger/config**: ESLint, TypeScript, Tailwind configs.
- **@ganger/db**: Type-safe queries, schema validation.
- **@ganger/integrations**: Twilio, Stripe, Google APIs, EHR.
- **@ganger/monitoring**: Health checks, performance tracking.
- **@ganger/ui**: Reusable components, design system.
- **@ganger/utils**: Formatting, validation, error handling.

## 🔒 Security & Configuration

### Private Medical Platform
- **Not Open Source**: Do not apply open-source security practices.
- **Configuration**: Preserve all `.env`, `.env.example`, and config values exactly.
- **Never** replace credentials with placeholders or sanitize working configs.

### Environment Variables
- Stored in root `.env` (production values, do not modify).
- Categories: Database, Supabase, Google OAuth, external services, app URLs, security.
- Example (Google OAuth):
  ```bash
  GOOGLE_CLIENT_ID=310418971046-skkrjvju66fid4r75lfdile2i8o8nrsd.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=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
  ```
- Copy all to Vercel dashboard for each project.

### Authentication
- **Google Workspace**: OAuth for staff.gangerdermatology.com, 24-hour sessions.
- **Supabase**: Encrypted tokens, CSRF protection, HTTPS only.
- **Access**: Staff, admin, guest roles with domain restrictions.

## 🗄️ Database Schema Notes

### Critical Schema Differences
- **Users Table**: The actual production database uses `profiles` table, NOT `users`
- **Authentication**: All user data is stored in `profiles` table with columns:
  - `id`, `email`, `full_name`, `avatar_url`, `role`, `department`, `position`, `phone`, `is_active`, `last_login`
- **Missing Tables**: Several tables referenced in code don't exist:
  - `users` → use `profiles`
  - `applications` → use `app_configurations`
  - `user_sessions` → use Supabase auth sessions
  - `platform_applications` → use `app_configurations`
  - `app_config_permissions` → use `app_permissions`
  - `api_usage_logs` → use `api_metrics`
  - `application_health` → use `app_configurations` or health checks
- **RPC Functions**: The following RPC functions don't exist and should be replaced with direct queries:
  - `check_user_app_permission`
  - `log_audit_event`
  - `get_app_permission`
  - `is_team_member`
- **Type Exports**: Database types have been updated:
  - `User` type → use `Profile` type
  - `Permission` type → use `AppPermission` type
  - `UserSession` type → removed (use Supabase auth)
  - Import from `@ganger/db` for all database types
- **Source of Truth**: Always check `/supabase/dump.json` for actual schema, not migration files

## 📚 Development Workflow

### Setup
```bash
git clone https://github.com/acganger/ganger-platform.git
cd ganger-platform
pnpm install
pnpm run supabase:start
pnpm run dev
```

### Key Commands
```bash
# Dev
pnpm run dev:[app-name]  # Start specific app
pnpm run dev:staff      # Start platform router

# Build & Verify
pnpm run build:changed   # Build changed apps
pnpm run verify:changed  # Verify changed apps
pnpm run lint:changed    # Lint changed code
pnpm run type-check:changed  # Type-check changed apps

# Deploy
pnpm run deploy:changed  # Deploy changed apps
bash scripts/verify-deployment-ready.sh  # Pre-deployment checks
```

### Pre-Push Checklist (MANDATORY)
Run this EVERY time before `git push`:
```bash
# 1. Build all changed apps
pnpm run build:changed

# 2. If any fail, fix ALL errors before proceeding
# 3. Test at least one app locally
pnpm -F @ganger/[primary-app] dev

# 4. Run the pre-deployment script
bash scripts/verify-deployment-ready.sh

# 5. Only push if ALL checks pass
```

### Pre-Deployment Verification
`verify-deployment-ready.sh` checks:
- Force-dynamic auth pages, correct imports, env variables, TypeScript, code quality.
- Outputs: ✓ (pass), ✗ (critical), ⚠ (warning).

## 🕰️ HIPAA Compliance (Time MCP)
- **Time MCP**: Provides HIPAA-compliant timestamps, timezone handling (America/New_York).
- Use Cases: Appointment scheduling, audit logging, record updates.
- Example:
  ```typescript
  const auditEntry = {
    action: 'patient_record_access',
    timestamp: getCurrentTime(), // 2025-07-12T13:15:00-04:00
    timezone: 'America/New_York',
    user_id: 'staff@gangerdermatology.com'
  };
  ```

## 📂 Project Structure
```
ganger-platform/
├── apps/                   # 22 apps (e.g., inventory, staff, ai-receptionist)
├── packages/              # Shared packages (auth, db, ui, etc.)
├── supabase/              # Database migrations, seed.sql
├── true-docs/             # Documentation (project_tracker.md, deployment/)
├── mcp-servers/           # MCP server configs
├── scripts/               # Build/deployment scripts
└── .github/               # CI/CD workflows
```

## 🚀 Deployment Readiness

### Status (August 1, 2025)
- **22 Apps**: Production-ready, independent Vercel projects.
- **Routing**: `ganger-staff` uses `vercel.json` rewrites.
- **Performance**: 3-5 min deployments for changed apps, <30s for cached builds.
- **Scripts**: Use `/true-docs/deployment/scripts/` for automation.

### Common Fixes
1. **API Clients**: Create inside functions, not module level.
2. **Auth in Static Pages**: Use `dynamic = 'force-dynamic'` or conditional rendering.
3. **Env Variables**: Use `NEXT_PUBLIC_` for client-side.
4. **Public Apps**: Avoid global staff auth.
5. **Database Queries**: Always use `profiles` table instead of `users`.
6. **Check table existence**: Verify tables exist in dump.json before querying.
7. **TypeScript imports**: Use correct Next.js imports:
   - `import { useRouter } from 'next/navigation'` (App Router)
   - `import useRouter from 'next/router'` (Pages Router)
8. **Repository patterns**: Not all tables extend BaseEntity - audit_logs has no updated_at
9. **Package exports**: Always export types that other packages depend on

### Node.js Module Errors
If you see errors like "Module not found: Can't resolve 'net'":
1. These are Node.js modules being imported client-side
2. Check if Redis/database clients are imported in pages/_app.tsx
3. Remove monitoring/Sentry imports from client code
4. Add webpack config to next.config.js:
```javascript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      dns: false, net: false, tls: false,
      fs: false, path: false, crypto: false,
    };
  }
  return config;
},
```

### Dev Server Notes
- All apps use ports 4000-4020 to avoid conflicts
- Main router (ganger-staff) runs on port 4000
- Some apps may exit immediately after starting - investigate middleware issues

### WSL Performance Optimization (Added August 8, 2025)
When using WSL2 with Windows-mounted drives, pnpm install can be extremely slow:
- **Problem**: pnpm install times out on `/mnt/` paths due to filesystem overhead
- **Solution**: Copy project to WSL native filesystem for development
```bash
# Copy to WSL native filesystem
mkdir -p ~/projects
rsync -av --exclude node_modules /mnt/q/Projects/ganger-platform/ ~/projects/ganger-platform/

# Work in native filesystem (12 seconds vs timeout)
cd ~/projects/ganger-platform
pnpm install

# Sync changes back when done
rsync -av --exclude node_modules --exclude .next --exclude dist ~/projects/ganger-platform/ /mnt/q/Projects/ganger-platform/
```

## 📝 Documentation Rules
- **Single Source**: Update `/true-docs/` only; no new files.
- **No Status Reports**: Use timestamps (e.g., "As of August 1, 2025").
- **Files**: `README.md` (overview), `DEPLOYMENT_GUIDE.md` (deployment), `CLAUDE.md` (AI instructions).