# Deployment Engineer Questions - pnpm Monorepo Build Failure

## Context
We have a **Next.js 14 pnpm monorepo** with 17+ apps. Some apps deploy successfully, but our main `staff` app fails with:
```
Error: Command "cd ../.. && pnpm -F @ganger/staff build" exited with 1
```

## Specific Questions

### 1. pnpm Workspace Build Issues
Our `vercel.json` uses:
```json
{
  "installCommand": "cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile && pnpm -F @ganger/auth build && pnpm -F @ganger/db build ...",
  "buildCommand": "cd ../.. && pnpm -F @ganger/staff build"
}
```

**Questions:**
- Why might `pnpm -F @ganger/staff build` fail when other apps with identical configs succeed?
- How can we get detailed build logs beyond "exited with 1"?
- Is there a way to see the actual error output from the build process?

### 2. Debugging Vercel Build Environment
**Questions:**
- How can we SSH into or replicate Vercel's build environment locally?
- Can we run build commands with verbose logging (`pnpm -F @ganger/staff build --verbose`)?
- Are there environment variables we can set for more detailed error output?

### 3. Common pnpm Monorepo Issues on Vercel
**Questions:**
- Are there known issues with pnpm workspaces and certain package versions?
- Do we need `pnpm-lock.yaml` committed? (Currently using `--no-frozen-lockfile`)
- Should we use `shamefully-hoist=true` in `.npmrc` for Vercel?

### 4. Dependency Resolution
The staff app has these unique aspects:
- Uses middleware.ts with Edge Config
- Has more dependencies than other apps
- Takes longer to build locally

**Questions:**
- Could missing peer dependencies cause silent build failures?
- How does Vercel handle `workspace:*` dependencies in pnpm?
- Is there a package size limit that could cause builds to fail?

### 5. Build Command Alternatives
**Questions:**
- Should we use Turbo's remote caching with Vercel?
- Can we split the build into multiple steps for better error visibility?
- Example:
  ```json
  {
    "buildCommand": "cd ../.. && pnpm -F @ganger/staff type-check && pnpm -F @ganger/staff build:next"
  }
  ```

### 6. Edge Config and Middleware
The staff app uses Edge Config in middleware.ts:
```typescript
const edgeConfigUrl = process.env.EDGE_CONFIG || process.env.EDGE_CONFI;
```

**Questions:**
- Could middleware compilation issues cause build failures?
- Does Edge Config require special build configuration?
- Are there TypeScript settings that affect Edge Runtime compatibility?

## What We've Already Tried
1. ✅ Removed `@vercel/edge-config` package (using native fetch instead)
2. ✅ Verified all workspace dependencies in `transpilePackages`
3. ✅ Set `NODE_ENV=development` for devDependencies
4. ✅ Used `--no-frozen-lockfile` flag
5. ✅ Disabled TypeScript and ESLint errors in build

## Logs We Need
Please help us access:
1. Full stdout/stderr from the failed build command
2. Node.js version and memory usage during build
3. Which specific file/step causes the build to exit with code 1
4. Any differences in build environment between successful and failing apps

## Monorepo Structure
```
apps/
  staff/          # FAILS - main portal app
  inventory/      # SUCCESS - simple app
  handouts/       # SUCCESS - simple app
  ... (14 more apps)
packages/
  auth/
  db/
  ui/
  ... (6 more packages)
```

The failing app imports from all workspace packages, while successful apps typically import from 3-4 packages.