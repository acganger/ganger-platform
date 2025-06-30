# Ganger Platform Dependency Strategy

## Overview
This document outlines the refined dependency management strategy for the Ganger Platform monorepo, addressing lockfile conflicts and optimizing for Vercel deployments.

## Strategy

### 1. Shared Runtime Dependencies (`@ganger/deps`)
- Contains commonly used runtime dependencies across all apps
- Excludes edge-incompatible libraries (googleapis, puppeteer, mysql2, etc.)
- Located at `packages/deps/`

### 2. Next.js Core Dependencies
Each app maintains its own:
- `next`
- `react`
- `react-dom`

This ensures Next.js optimizations work correctly and allows apps to use different Next.js versions if needed.

### 3. App-Specific Dependencies
Apps that need edge-incompatible or specialized libraries declare them directly:
```json
{
  "dependencies": {
    "next": "^14.2.29",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@ganger/deps": "workspace:*",
    // App-specific deps
    "googleapis": "^131.0.0",
    "mysql2": "^3.9.0"
  }
}
```

### 4. Development Dependencies
Shared dev tools are managed at the root `package.json` level:
- TypeScript
- ESLint
- Testing libraries
- Build tools

## Benefits
1. **Reduced lockfile conflicts** - Single source of truth for shared deps
2. **Edge Runtime compatibility** - Apps can opt-in to heavy dependencies
3. **Clear dependency ownership** - Easy to see what each app needs
4. **Vercel optimization** - Next.js deps remain at app level

## Migration Guide
When updating an app to use this strategy:

1. Keep Next.js core deps in the app's package.json
2. Add `"@ganger/deps": "workspace:*"` for shared runtime deps
3. Add any app-specific edge-incompatible deps directly
4. Remove all other dependencies that are now in @ganger/deps

## Vercel Configuration
All apps should use this standard `vercel.json`:
```json
{
  "installCommand": "cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm -F @ganger/[app-name] build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NODE_ENV": "development"
  }
}
```

The `--no-frozen-lockfile` flag is temporarily needed until we fully migrate all apps and update the lockfile.