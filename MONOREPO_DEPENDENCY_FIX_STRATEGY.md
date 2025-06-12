# Monorepo Dependency Conflict Fix Strategy

## 🎯 IDENTIFIED PROBLEMATIC APPS

### Apps with React 18.2.0 (OUTDATED - Need Updates)
- ❌ `apps/call-center-ops`
- ❌ `apps/clinical-staffing` (PRIMARY ISSUE - 1000+ TypeScript errors)
- ❌ `apps/config-dashboard` 
- ❌ `apps/platform-dashboard`

### Apps with Working React 18.3.1 (CURRENT)
- ✅ `apps/compliance-training`
- ✅ `apps/eos-l10`
- ✅ `apps/handouts`
- ✅ `apps/inventory`
- ✅ `apps/medication-auth`
- ✅ `apps/pharma-scheduling`
- ✅ `apps/socials-reviews`

## 🔧 COMPREHENSIVE FIX STRATEGY

### Phase 1: Critical Fix - Clinical Staffing (IMMEDIATE)

```bash
cd apps/clinical-staffing

# Update core dependencies
npm install react@^18.3.1 react-dom@^18.3.1 next@^14.2.5 typescript@^5.8.3

# Update type definitions
npm install --save-dev @types/react@^19.1.6 @types/react-dom@^19.1.6

# Clear caches and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Phase 2: Fix Other Problematic Apps

#### call-center-ops
```bash
cd apps/call-center-ops
npm install react@^18.3.1 react-dom@^18.3.1
npm install --save-dev @types/react@^19.1.6 @types/react-dom@^19.1.6
```

#### config-dashboard
```bash
cd apps/config-dashboard  
npm install react@^18.3.1 react-dom@^18.3.1
npm install --save-dev @types/react@^19.1.6 @types/react-dom@^19.1.6
```

#### platform-dashboard
```bash
cd apps/platform-dashboard
npm install react@^18.3.1 react-dom@^18.3.1  
npm install --save-dev @types/react@^19.1.6 @types/react-dom@^19.1.6
```

### Phase 3: Full Monorepo Cleanup

```bash
# From root directory
rm -rf node_modules package-lock.json
rm -rf apps/*/node_modules apps/*/package-lock.json
rm -rf packages/*/node_modules packages/*/package-lock.json

# Fresh install with updated dependencies
npm install

# Verify all apps compile
npm run type-check
```

## 🛡️ ISOLATION STRATEGIES

### 1. Centralized Dependency Management
Add to root `package.json`:

```json
{
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1", 
    "typescript": "5.8.3",
    "next": "14.2.5"
  },
  "overrides": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@types/react": "19.1.6",
    "@types/react-dom": "19.1.6"
  }
}
```

### 2. Shared Peer Dependencies
Update `packages/ui/package.json`:

```json
{
  "peerDependencies": {
    "react": ">=18.3.1",
    "react-dom": ">=18.3.1",
    "@types/react": ">=19.1.0"
  },
  "peerDependenciesMeta": {
    "@types/react": { "optional": false },
    "@types/react-dom": { "optional": false }
  }
}
```

### 3. Version Validation Script
Create `scripts/validate-dependencies.js`:

```javascript
const fs = require('fs');
const glob = require('glob');

const REQUIRED_VERSIONS = {
  react: '18.3.1',
  'react-dom': '18.3.1',
  typescript: '5.8.3',
  '@types/react': '19.1.6'
};

// Validate all package.json files
const packageFiles = glob.sync('apps/*/package.json');
let errors = [];

packageFiles.forEach(file => {
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  const appName = file.split('/')[1];
  
  Object.entries(REQUIRED_VERSIONS).forEach(([dep, version]) => {
    const actualVersion = pkg.dependencies?.[dep] || pkg.devDependencies?.[dep];
    if (actualVersion && !actualVersion.includes(version)) {
      errors.push(`${appName}: ${dep} should be ${version}, got ${actualVersion}`);
    }
  });
});

if (errors.length > 0) {
  console.error('❌ Dependency version conflicts found:');
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
} else {
  console.log('✅ All dependencies are properly versioned');
}
```

### 4. CI/CD Validation
Add to `.github/workflows/validate-deps.yml`:

```yaml
name: Validate Dependencies
on: [push, pull_request]

jobs:
  validate-deps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install
      - run: node scripts/validate-dependencies.js
      - run: npm run type-check
```

## 📊 EXPECTED RESULTS

### Before Fix
```
clinical-staffing: 1000+ TypeScript errors
call-center-ops:   Unknown errors  
config-dashboard:  Unknown errors
platform-dashboard: Unknown errors
```

### After Fix
```
All apps: 0 TypeScript errors
Consistent React 18.3.1 across monorepo
Unified type definitions @types/react@19.1.6
No more JSX/useState resolution failures
```

## 🚀 EXECUTION PLAN

1. **IMMEDIATE** (5 minutes): Fix clinical-staffing (eliminates 1000+ errors)
2. **SHORT-TERM** (15 minutes): Fix other 3 problematic apps
3. **MEDIUM-TERM** (30 minutes): Implement isolation strategies  
4. **LONG-TERM** (1 hour): Add validation automation

## ⚠️ RISK MITIGATION

### Potential Breaking Changes
- Some components may need minor React 18.3.1 adjustments
- Type definitions may require small interface updates
- Next.js 14.2.5 may have different behavior

### Rollback Strategy
```bash
# If issues arise, revert to previous working state
git stash
git checkout HEAD~1 -- apps/clinical-staffing/package.json
npm install
```

### Testing Protocol
1. Run `npm run type-check` after each app fix
2. Test dev server startup: `npm run dev`
3. Verify build process: `npm run build`
4. Check for runtime errors in browser

## 📝 DOCUMENTATION UPDATES

After successful fix, update:
- `README.md` - Dependency version requirements
- `CLAUDE.md` - Platform architecture notes
- Individual app READMEs - Version compatibility info

---

**Status**: Ready for implementation
**Priority**: CRITICAL (clinical-staffing blocking development)
**Estimated Time**: 1 hour for complete solution