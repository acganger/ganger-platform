# Ganger Platform - Claude Code Documentation

*Last Updated: August 5, 2025*  
*Platform Version: 2.0.2*  
*Maintained by: Claude Code & Anand Ganger*

The Ganger Platform is a private, medical-grade monorepo for Ganger Dermatology, hosting 22 Next.js 14 applications. Built with TypeScript, Supabase, and Vercel, it ensures HIPAA compliance, AI automation, and high-quality development.

## 🚨 Database Schema Notes

**CRITICAL**: The actual production database schema differs from what many apps expect:
- The main user table is `profiles` NOT `users`
- Apps should query `profiles` table for user data
- The `profiles` table uses `id` as the primary key (matching auth.users.id)
- Other key tables: `app_configurations`, `api_metrics`, `error_logs`

Always verify table names against production schema before making queries.

## 🛡️ Development Principles

### Absolute Rules
- **No Shortcuts, Hacks, or Workarounds**: Quick fixes create technical debt. Fix issues properly.
- **Quality First**: No time constraints. Do it right the first time.
- **Understand Before Changing**: Read context, ask "why," and test one app before scaling changes.
- **AI Automation**: Automate everything possible. Humans only do what AI cannot (e.g., passwords, physical actions).
- **Build, Don't Remove**: When fixing "unused" variables, implement placeholder functionality instead of removing code. See [TypeScript Error Handling Approach](#-typescript-error-handling-approach) section.

### 🚨 CRITICAL: Local Testing Requirements
**NEVER push code without local testing**
- Each failed deployment wastes hours and blocks feature usage

**Before EVERY push:**
1. Run `pnpm -F @ganger/[app-name] build` for ALL affected apps
2. Fix ALL TypeScript errors locally
3. Run `pnpm -F @ganger/[app-name] dev` and test in browser
4. Only push when everything works locally

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
6. **Unused imports/variables**: Remove immediately - they cause build warnings
7. **Auth destructuring**: Use `useStaffAuth()` without destructuring if values aren't used
8. **Null checks**: Always check optional chaining with `?.` or provide defaults with `|| []`
9. **Function signatures**: Match the expected arguments (e.g., `exportMetricsToPDF()` takes no args)
10. **TSConfig**: Add `"downlevelIteration": true` if using ES6 features with ES5 target

## 🚀 Platform Overview

The Ganger Platform is a digital transformation for Ganger Dermatology, with 22 applications covering medical, staff, and business operations.

### Applications
| **Category**         | **App Name**            | **Path**                     | **Dev Port** | **Function**                              |
|-----------------------|-------------------------|------------------------------|--------------|-------------------------------------------|
| **Core Medical**      | Inventory Management    | `/inventory`                 | 4015         | Medical supply tracking with barcode      |
|                       | Patient Handouts        | `/handouts`                  | 4013         | Educational materials with QR scanning    |
|                       | Check-in Kiosk          | `/kiosk` (public: kiosk.gangerdermatology.com) | 4005 | Patient self-service terminal |
|                       | Medication Authorization | `/medication-auth`          | 4017         | Prior auth management                    |
|                       | EOS L10                 | `/l10`                      | 4011         | Team management and EOS implementation   |
| **Staff Operations**  | Ganger Actions          | `/actions`                   | 4012         | Employee forms & utility hub             |
|                       | Clinical Staffing       | `/clinical-staffing`         | 4006         | Provider scheduling                      |
|                       | Call Center Operations  | `/call-center`               | 4004         | Call management dashboard                |
|                       | Pharma Scheduling       | `/pharma` (public: lunch.gangerdermatology.com) | 4018 | Rep visit coordination |
| **Business Systems**  | Batch Closeout          | `/batch`                     | 4003         | Financial batch processing               |
|                       | Compliance Training     | `/compliance`                | 4007         | Staff training platform                  |
|                       | Socials & Reviews       | `/socials`                   | 4020         | Review management                        |
| **Infrastructure**    | Ganger Staff            | `/`                          | 4000         | Platform router (main entry point)       |
|                       | Platform Dashboard      | `/platform-dashboard`        | 4019         | System overview                          |
|                       | Config Dashboard        | `/config`                    | 4009         | Configuration management                 |
|                       | Integration Status      | `/status`                    | 4014         | Integration monitoring                   |
|                       | Component Showcase      | `/component-showcase`        | 4008         | UI component library                     |
|                       | AI Receptionist         | `/ai-receptionist`           | 4002         | AI phone agent demo                      |
| **AI & Demos**        | AI Purchasing Agent     | `/ai-purchasing`             | 4001         | AI procurement assistant                  |
|                       | LLM Demo                | `/llm-demo`                  | 4016         | Language model demonstrations             |
|                       | Consolidated Order Form | `/order-form`                | 4010         | Unified ordering interface                |

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

### Status (August 5, 2025)
- **22 Apps**: Production-ready with 100% TypeScript compilation success.
- **Database**: Fixed schema alignment (profiles table, not users).
- **APIs**: Real integrations implemented (Google, Stripe, Twilio).
- **Deployment**: Automated scripts for all apps (`scripts/deploy-all-apps.sh`).
- **Monitoring**: GitHub Actions health checks running hourly.
- **Performance**: Turborepo optimized (5-10x faster builds).

### Common Fixes
1. **API Clients**: Create inside functions, not module level.
2. **Auth in Static Pages**: Use `dynamic = 'force-dynamic'` or conditional rendering.
3. **Env Variables**: Use `NEXT_PUBLIC_` for client-side.
4. **Public Apps**: Avoid global staff auth (kiosk, pharma apps need no authentication).
5. **Database Queries**: Always use `profiles` table instead of `users`.
6. **Check table existence**: Verify tables exist in dump.json before querying.
7. **TypeScript imports**: Use correct Next.js imports:
   - `import { useRouter } from 'next/navigation'` (App Router)
   - `import useRouter from 'next/router'` (Pages Router)
8. **Repository patterns**: Not all tables extend BaseEntity - audit_logs has no updated_at
9. **Package exports**: Always export types that other packages depend on
10. **Redis Fallback**: Always implement in-memory fallback when Redis fails
11. **Error Handling**: Use `error instanceof Error ? error.message : 'Unknown error'`
12. **Unused Variables**: Prefix with underscore (e.g., `_unusedVar`)
13. **Optional Properties**: Use non-null assertion (!) or provide defaults

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

## 📝 Documentation Rules
- **Single Source**: Update `/true-docs/` only; no new files.
- **No Status Reports**: Use timestamps (e.g., "As of August 1, 2025").
- **Files**: `README.md` (overview), `DEPLOYMENT_GUIDE.md` (deployment), `CLAUDE.md` (AI instructions).

## 🔧 TypeScript Error Handling Approach

### Handling "Unused" Variables in Placeholder Implementations
When encountering TypeScript TS6133 errors (unused variables), analyze the context before making changes:

#### ❌ INCORRECT Approach (Do NOT do this):
```typescript
// Bad: Simply prefixing with underscore
private async findExistingEmployee(_employeeId: string): Promise<any> {
  return null; // Placeholder
}

// Bad: Marking constructor params as unused when they'll be used later
constructor(_db: DatabaseClient, _config: Config) {
  // These will be used when implementation is complete
}
```

#### ✅ CORRECT Approach:
```typescript
// Good: Add TODO comment and basic implementation
private async findExistingEmployee(employeeId: string): Promise<any> {
  // TODO: Implement database query to find staff member by employee ID
  // This will use the database client (e.g., Supabase) once integrated
  console.log(`[Deputy] Searching for existing employee with ID: ${employeeId}`);
  
  // Example implementation structure:
  // const { data, error } = await supabase
  //   .from('staff_members')
  //   .select('*')
  //   .eq('employee_id', employeeId)
  //   .single();
  // return data;
  
  return null; // Placeholder until database integration is complete
}

// Good: Store constructor dependencies with TODO
export class HIPAAAuditTrail {
  private _db: ClinicalStaffingQueries; // TODO: Will be used when database methods are implemented
  private _encryptionKey: string; // TODO: Will be used for encryption when implemented
  
  constructor(db: ClinicalStaffingQueries, encryptionKey: string) {
    this._db = db;
    this._encryptionKey = encryptionKey;
  }
}

// Good: Create methods to use "unused" properties
export class StripeService {
  private stripePublishableKey: string;
  private baseUrl: string;
  
  // Add this method to use the properties
  getClientConfig(): { publishableKey: string; webhookUrl: string } {
    return {
      publishableKey: this.stripePublishableKey,
      webhookUrl: `${this.baseUrl}/api/webhooks/stripe`
    };
  }
}
```

### Categories of "Unused" Variables

1. **Constructor Dependencies** - Store for future use with TODO comment
2. **Placeholder Methods** - Add basic implementation with logging and example structure
3. **Configuration Properties** - Create getter methods to expose them
4. **Event Handler Parameters** - Keep if they might be used in full implementation
5. **Interface Compliance** - Keep to maintain interface contracts

### Key Principles
- **Analyze Before Changing**: Unused variables often indicate incomplete implementations, not unnecessary code
- **Add Value, Don't Remove**: Implement placeholders instead of marking as unused
- **Document Intent**: Use TODO comments to explain what the full implementation should do
- **Provide Examples**: Include commented example code showing the intended implementation
- **Return Appropriate Defaults**: Return empty arrays, null, or mock data as appropriate

### Common Patterns

#### Database Query Placeholders
```typescript
private async queryData(param: string): Promise<any[]> {
  // TODO: Implement actual database query
  console.log(`Querying data with param: ${param}`);
  
  // Example implementation:
  // const { data, error } = await this.db.query(...)
  // if (error) throw error;
  // return data;
  
  return []; // Return empty array until implemented
}
```

#### Configuration Methods
```typescript
// If you have unused config properties, add methods to access them
getConfiguration(): ConfigType {
  return {
    apiKey: this.apiKey,
    baseUrl: this.baseUrl,
    timeout: this.timeout
  };
}
```

#### Mock Implementations
```typescript
// For testing/development, return mock data
async createResource(data: any): Promise<any> {
  // TODO: Implement actual resource creation
  console.log('Creating resource:', data);
  
  return {
    id: `mock_${Date.now()}`,
    ...data,
    created_at: new Date().toISOString()
  };
}
```