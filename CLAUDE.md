# Ganger Platform - Claude Code Documentation

*Last Updated: July 12, 2025*  
*Platform Version: 2.0.1*  
*Maintained by: Claude Code & Anand Ganger*

The Ganger Platform is a private, medical-grade monorepo for Ganger Dermatology, hosting 17 Next.js 14 applications. Built with TypeScript, Supabase, and Vercel, it ensures HIPAA compliance, AI automation, and high-quality development.

## 🛡️ Development Principles

### Absolute Rules
- **No Shortcuts, Hacks, or Workarounds**: Quick fixes create technical debt. Fix issues properly.
- **Quality First**: No time constraints. Do it right the first time.
- **Understand Before Changing**: Read context, ask “why,” and test one app before scaling changes.
- **AI Automation**: Automate everything possible. Humans only do what AI cannot (e.g., passwords, physical actions).

### Definition of "Complete"
A feature/app is complete only when:
- [ ] All imports resolve to existing files.
- [ ] Build succeeds: `pnpm -F @ganger/[app-name] build`.
- [ ] Type check passes: `pnpm -F @ganger/[app-name] type-check`.
- [ ] All API routes return data.
- [ ] Features work end-to-end in the browser.
- [ ] No mock data in production.
- [ ] All @ganger/* dependencies exist.

**Verification Commands**:
```bash
pnpm -F @ganger/[app-name] build
pnpm -F @ganger/[app-name] type-check
grep -r "@ganger" apps/[app-name]/src --include="*.ts" --include="*.tsx" | grep "from"
```

**Never** claim completion based on partial implementation or untested assumptions.

### AI Automation Principles
- Automate all possible tasks via API/CLI.
- Follow approved plans exactly; get approval for deviations.
- Use Vercel API with token, not npm/npx vercel.
- Check logs/errors via API before involving users.
- Efficiency: AI handles automatable tasks; humans handle only what’s required.

### Cost of Shortcuts
Shortcuts waste time:
- 1-hour proper fix vs. 10+ hours fixing a 10-minute hack.
- Each shortcut breaks automation and creates downstream issues.

## 🚀 Platform Overview

The Ganger Platform is a digital transformation for Ganger Dermatology, with 17 applications covering medical, staff, and business operations.

### Applications
| **Category**         | **App Name**            | **Path**                     | **Function**                              |
|-----------------------|-------------------------|------------------------------|-------------------------------------------|
| **Core Medical**      | Inventory Management    | `/inventory`                 | Medical supply tracking with barcode      |
|                       | Patient Handouts        | `/handouts`                  | Educational materials with QR scanning    |
|                       | Check-in Kiosk          | `/kiosk` (public: kiosk.gangerdermatology.com) | Patient self-service terminal |
|                       | Medication Authorization | `/medication-auth`          | Prior auth management                    |
|                       | EOS L10                 | `/l10`                      | Team management and EOS implementation   |
| **Staff Operations**  | Ganger Actions          | `/actions`                   | Employee forms & utility hub             |
|                       | Clinical Staffing       | `/clinical-staffing`         | Provider scheduling                      |
|                       | Call Center Operations  | `/call-center`               | Call management dashboard                |
|                       | Pharma Scheduling       | `/pharma` (public: lunch.gangerdermatology.com) | Rep visit coordination |
| **Business Systems**  | Batch Closeout          | `/batch`                     | Financial batch processing               |
|                       | Compliance Training     | `/compliance`                | Staff training platform                  |
|                       | Socials & Reviews       | `/socials`                   | Review management                        |
| **Infrastructure**    | Ganger Staff            | `/`                          | Platform router (not an app)             |
|                       | Platform Dashboard      | `/platform-dashboard`        | System overview                          |
|                       | Config Dashboard        | `/config`                    | Configuration management                 |
|                       | Integration Status      | `/status`                    | Integration monitoring                   |
|                       | Component Showcase      | `/component-showcase`        | UI component library                     |
|                       | AI Receptionist         | `/ai-receptionist`           | AI phone agent demo                      |

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
- **Never** modify app code to fix deployment; use config (e.g., `typescript: { ignoreBuildErrors: true }`).
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
- **App-Specific**: Edge-incompatible libraries in app’s `package.json`.
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
├── apps/                   # 17 apps (e.g., inventory, staff, ai-receptionist)
├── packages/              # Shared packages (auth, db, ui, etc.)
├── supabase/              # Database migrations, seed.sql
├── true-docs/             # Documentation (project_tracker.md, deployment/)
├── mcp-servers/           # MCP server configs
├── scripts/               # Build/deployment scripts
└── .github/               # CI/CD workflows
```

## 🚀 Deployment Readiness

### Status (July 12, 2025)
- **17 Apps**: Production-ready, independent Vercel projects.
- **Routing**: `ganger-staff` uses `vercel.json` rewrites.
- **Performance**: 3-5 min deployments for changed apps, <30s for cached builds.
- **Scripts**: Use `/true-docs/deployment/scripts/` for automation.

### Common Fixes
1. **API Clients**: Create inside functions, not module level.
2. **Auth in Static Pages**: Use `dynamic = 'force-dynamic'` or conditional rendering.
3. **Env Variables**: Use `NEXT_PUBLIC_` for client-side.
4. **Public Apps**: Avoid global staff auth.

## 📝 Documentation Rules
- **Single Source**: Update `/true-docs/` only; no new files.
- **No Status Reports**: Use timestamps (e.g., “As of July 12, 2025”).
- **Files**: `README.md` (overview), `DEPLOYMENT_GUIDE.md` (deployment), `CLAUDE.md` (AI instructions).