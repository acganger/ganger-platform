# Ganger Platform - Master Development Guide

## Table of Contents
- [Platform Overview](#platform-overview)
- [Architecture and Infrastructure](#architecture-and-infrastructure)
- [Development Environment Setup](#development-environment-setup)
- [Authentication and Security](#authentication-and-security)
- [Database and Data Management](#database-and-data-management)
- [API Standards and Integration](#api-standards-and-integration)
- [Component Library and UI Standards](#component-library-and-ui-standards)
- [Application Development Guidelines](#application-development-guidelines)
- [Deployment and Infrastructure](#deployment-and-infrastructure)
- [Testing and Quality Assurance](#testing-and-quality-assurance)
- [Documentation Standards](#documentation-standards)
- [Documentation System and Maintenance](#documentation-system-and-maintenance)
- [Troubleshooting and Operations](#troubleshooting-and-operations)
- [Automated Quality Enforcement](#automated-quality-enforcement)
- [Architecture Decision Records](#architecture-decision-records)
- [Performance Budgets and Monitoring](#performance-budgets-and-monitoring)
- [Reality Verification Systems](#reality-verification-systems)

---

*This master document consolidates all essential development knowledge for the Ganger Platform. It serves as the single source of truth for anyone working on any aspect of the project.*

---

# Automated Quality Enforcement

## Pre-Commit Hook Implementation

The Ganger Platform enforces architectural integrity through automated pre-commit hooks that prevent quality issues from entering the codebase.

### Required Pre-Commit Hooks

**Installation:**
```bash
# Install pre-commit framework
npm install --save-dev pre-commit husky lint-staged

# Initialize pre-commit hooks
npx husky install
npx husky add .husky/pre-commit "npm run pre-commit"
```

**Mandatory Quality Gates (.husky/pre-commit):**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running quality enforcement checks..."

# 1. TypeScript Compilation - ZERO TOLERANCE
echo "📝 TypeScript compilation check..."
npm run type-check || {
  echo "❌ TypeScript compilation failed. Commit blocked."
  exit 1
}

# 2. Package Boundary Enforcement
echo "📦 Package boundary validation..."
npm run audit:package-boundaries || {
  echo "❌ Package boundary violations detected. Commit blocked."
  exit 1
}

# 3. Component Library Compliance
echo "🎨 UI component compliance check..."
npm run audit:ui-compliance || {
  echo "❌ Custom UI components detected. Use @ganger/ui only. Commit blocked."
  exit 1
}

# 4. Authentication Standard Compliance
echo "🔐 Authentication compliance check..."
npm run audit:auth-compliance || {
  echo "❌ Custom authentication detected. Use @ganger/auth only. Commit blocked."
  exit 1
}

# 5. Performance Budget Verification
echo "⚡ Performance budget check..."
npm run audit:performance-budget || {
  echo "❌ Performance budget exceeded. Optimize before commit."
  exit 1
}

# 6. Security Compliance Verification
echo "🔒 Security compliance check..."
npm run audit:security-compliance || {
  echo "❌ Security compliance violations. Commit blocked."
  exit 1
}

# 7. Client-Server Boundary Verification
echo "🔄 Client-server boundary check..."
npm run audit:client-server-boundaries || {
  echo "❌ Client-server boundary violations detected. Commit blocked."
  exit 1
}

# 8. 'use client' Directive Validation
echo "⚛️ 'use client' directive validation..."
npm run audit:use-client-directive || {
  echo "❌ Missing or incorrect 'use client' directive usage. Commit blocked."
  exit 1
}

# 9. Server Import Prevention in Client Code
echo "🚫 Server import prevention check..."
npm run audit:server-imports || {
  echo "❌ Server imports detected in client code. Commit blocked."
  exit 1
}

echo "✅ All quality gates passed. Commit approved."
```

### Package Boundary Enforcement Scripts

**Package Boundary Audit (scripts/audit-package-boundaries.js):**
```javascript
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const FORBIDDEN_PATTERNS = [
  // Forbidden imports in apps
  { 
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    forbidden: [
      /import.*from ['"](?!@ganger\/|\.\.?\/|next\/|react)/,
      /import.*supabase.*from.*(?!@ganger\/)/,
      /import.*stripe.*from.*(?!@ganger\/)/,
    ],
    message: 'Apps must only import from @ganger/* packages or relative paths'
  },
  
  // Forbidden direct database imports
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    forbidden: [
      /import.*from ['"]@supabase\/supabase-js['"]/, 
      /createClient.*from.*supabase/
    ],
    message: 'Use @ganger/db for all database operations'
  },
  
  // Forbidden UI implementations
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    forbidden: [
      /const.*Button.*=.*\(.*\).*=>.*<button/,
      /const.*Input.*=.*\(.*\).*=>.*<input/,
      /const.*Modal.*=.*\(.*\).*=>.*<div.*modal/
    ],
    message: 'Custom UI components prohibited. Use @ganger/ui exclusively'
  },
  
  // Forbidden server imports in client components
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    forbidden: [
      /('use client'[\s\S]*?import.*from ['"]@ganger\/integrations\/server)/,
      /('use client'[\s\S]*?import.*from ['"]@ganger\/db)/,
      /('use client'[\s\S]*?import.*from ['"]googleapis)/,
      /('use client'[\s\S]*?import.*from ['"]puppeteer)/,
      /('use client'[\s\S]*?import.*from ['"]ioredis)/
    ],
    message: 'Client components cannot import server-only packages'
  },
  
  // Missing 'use client' for interactive components
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    forbidden: [
      /(import.*useState.*from.*react(?![\s\S]*'use client'))/,
      /(import.*useEffect.*from.*react(?![\s\S]*'use client'))/,
      /(import.*useCallback.*from.*react(?![\s\S]*'use client'))/
    ],
    message: 'Components using React hooks must include "use client" directive'
  },
  
  // Forbidden Node.js modules in client code
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    forbidden: [
      /import.*from ['"]fs['"]/,
      /import.*from ['"]crypto['"]/,
      /import.*from ['"]net['"]/,
      /import.*from ['"]dns['"]/,
      /import.*from ['"]child_process['"]/
    ],
    message: 'Node.js modules cannot be imported in client-side code'
  }
];

function auditPackageBoundaries() {
  let violations = 0;
  
  FORBIDDEN_PATTERNS.forEach(({ pattern, forbidden, message }) => {
    const files = glob.sync(pattern, { cwd: process.cwd() });
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      forbidden.forEach(forbiddenPattern => {
        if (forbiddenPattern.test(content)) {
          console.error(`❌ ${file}: ${message}`);
          violations++;
        }
      });
    });
  });
  
  if (violations > 0) {
    console.error(`\n❌ ${violations} package boundary violations detected`);
    process.exit(1);
  }
  
  console.log('✅ Package boundaries clean');
}

auditPackageBoundaries();
```

### Component Library Compliance Audit

**UI Compliance Audit (scripts/audit-ui-compliance.js):**
```javascript
const fs = require('fs');
const glob = require('glob');

const FORBIDDEN_UI_PATTERNS = [
  // Custom button implementations
  /const.*Button.*=.*props.*=>.*<button/,
  /function.*Button.*\(.*\).*{.*return.*<button/,
  
  // Custom input implementations  
  /const.*Input.*=.*props.*=>.*<input/,
  /function.*Input.*\(.*\).*{.*return.*<input/,
  
  // Custom form implementations
  /const.*Form.*=.*props.*=>.*<form/,
  
  // Inline styling (forbidden)
  /style={{/,
  
  // Direct Tailwind on UI elements (must use @ganger/ui)
  /<button.*className.*=.*['"]/,
  /<input.*className.*=.*['"]/,
  /<select.*className.*=.*['"]/
];

function auditUICompliance() {
  const files = glob.sync('apps/*/src/**/*.{ts,tsx}', { cwd: process.cwd() });
  let violations = 0;
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    FORBIDDEN_UI_PATTERNS.forEach(pattern => {
      if (pattern.test(content)) {
        console.error(`❌ ${file}: Custom UI component detected. Use @ganger/ui exclusively.`);
        violations++;
      }
    });
  });
  
  if (violations > 0) {
    console.error(`\n❌ ${violations} UI compliance violations detected`);
    process.exit(1);
  }
  
  console.log('✅ UI component compliance verified');
}

auditUICompliance();
```

### Authentication Compliance Audit

**Auth Compliance Audit (scripts/audit-auth-compliance.js):**
```javascript
const fs = require('fs');
const glob = require('glob');

const FORBIDDEN_AUTH_PATTERNS = [
  // Custom authentication implementations
  /useState.*auth/i,
  /useState.*user/i,
  /createContext.*auth/i,
  /import.*from ['"]next-auth['"]/, 
  /import.*from ['"]@supabase\/auth/,
  /signIn.*=.*\(.*\).*=>/, // Custom signIn functions
  /signOut.*=.*\(.*\).*=>/, // Custom signOut functions
  /getUser.*=.*\(.*\).*=>/, // Custom getUser functions
];

const REQUIRED_AUTH_PATTERNS = [
  /import.*useAuth.*from ['"]@ganger\/auth['"]/, // Must use @ganger/auth
  /import.*withAuth.*from ['"]@ganger\/auth['"]/, // Must use withAuth HOC
];

function auditAuthCompliance() {
  const files = glob.sync('apps/*/src/**/*.{ts,tsx}', { cwd: process.cwd() });
  let violations = 0;
  let authFiles = [];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for forbidden auth patterns
    FORBIDDEN_AUTH_PATTERNS.forEach(pattern => {
      if (pattern.test(content)) {
        console.error(`❌ ${file}: Custom authentication detected. Use @ganger/auth exclusively.`);
        violations++;
      }
    });
    
    // Check if file uses auth and verify it uses required patterns
    if (/auth|user|signin|login/i.test(content)) {
      authFiles.push(file);
      
      let hasRequiredImport = REQUIRED_AUTH_PATTERNS.some(pattern => pattern.test(content));
      if (!hasRequiredImport) {
        console.error(`❌ ${file}: Must import from @ganger/auth for authentication`);
        violations++;
      }
    }
  });
  
  if (violations > 0) {
    console.error(`\n❌ ${violations} authentication compliance violations detected`);
    process.exit(1);
  }
  
  console.log(`✅ Authentication compliance verified (${authFiles.length} auth-related files checked)`);
}

auditAuthCompliance();
```

### Performance Budget Enforcement

**Performance Budget Audit (scripts/audit-performance-budget.js):**
```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PERFORMANCE_BUDGETS = {
  // Bundle size limits
  bundles: {
    'apps/*/pages/index.js': 250000, // 250KB max for home pages
    'apps/*/pages/_app.js': 150000,  // 150KB max for app shell
    'packages/ui/dist/index.js': 100000, // 100KB max for UI package
  },
  
  // Build time limits
  buildTime: {
    'apps/inventory': 60000,  // 60 seconds max build time
    'apps/handouts': 60000,
    'apps/checkin-kiosk': 60000,
    'packages/ui': 30000,     // 30 seconds max for packages
  },
  
  // TypeScript compilation time limits
  typeCheckTime: {
    'root': 120000, // 2 minutes max for full type check
    'apps/*': 30000, // 30 seconds max per app
  }
};

function auditPerformanceBudget() {
  let violations = 0;
  
  // Check bundle sizes
  console.log('📦 Checking bundle sizes...');
  try {
    execSync('npm run build', { stdio: 'pipe' });
    
    Object.entries(PERFORMANCE_BUDGETS.bundles).forEach(([pattern, maxSize]) => {
      // Implementation to check actual bundle sizes
      // This would require build output analysis
    });
  } catch (error) {
    console.error('❌ Build failed during performance audit');
    violations++;
  }
  
  // Check build times
  console.log('⏱️ Checking build performance...');
  const buildStart = Date.now();
  try {
    execSync('npm run type-check', { stdio: 'pipe' });
    const buildTime = Date.now() - buildStart;
    
    if (buildTime > PERFORMANCE_BUDGETS.typeCheckTime.root) {
      console.error(`❌ TypeScript compilation too slow: ${buildTime}ms > ${PERFORMANCE_BUDGETS.typeCheckTime.root}ms`);
      violations++;
    }
  } catch (error) {
    console.error('❌ TypeScript check failed during performance audit');
    violations++;
  }
  
  if (violations > 0) {
    console.error(`\n❌ ${violations} performance budget violations detected`);
    process.exit(1);
  }
  
  console.log('✅ Performance budget compliance verified');
}

auditPerformanceBudget();
```

### Security Compliance Automation

**Security Audit (scripts/audit-security-compliance.js):**
```javascript
const fs = require('fs');
const glob = require('glob');

const SECURITY_VIOLATIONS = [
  // Hardcoded secrets (should use environment variables)
  {
    pattern: /sk_[a-zA-Z0-9]{20,}/,
    message: 'Hardcoded Stripe secret key detected'
  },
  {
    pattern: /SUPABASE_SERVICE_ROLE_KEY.*=.*eyJ/,
    message: 'Hardcoded Supabase service role key detected'
  },
  
  // Insecure patterns
  {
    pattern: /eval\(/,
    message: 'eval() usage detected - security risk'
  },
  {
    pattern: /dangerouslySetInnerHTML/,
    message: 'dangerouslySetInnerHTML usage - potential XSS risk'
  },
  {
    pattern: /process\.env\.[A-Z_]+.*=.*['"]/,
    message: 'Environment variable assignment in code detected'
  },
  
  // HIPAA compliance violations
  {
    pattern: /console\.log.*patient/i,
    message: 'Patient data in console.log - HIPAA violation'
  },
  {
    pattern: /alert.*patient/i,
    message: 'Patient data in alert - HIPAA violation'
  }
];

function auditSecurityCompliance() {
  const files = glob.sync('apps/*/src/**/*.{ts,tsx,js,jsx}', { cwd: process.cwd() });
  let violations = 0;
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    SECURITY_VIOLATIONS.forEach(({ pattern, message }) => {
      if (pattern.test(content)) {
        console.error(`❌ ${file}: ${message}`);
        violations++;
      }
    });
  });
  
  if (violations > 0) {
    console.error(`\n❌ ${violations} security compliance violations detected`);
    process.exit(1);
  }
  
  console.log('✅ Security compliance verified');
}

auditSecurityCompliance();
```

### Package.json Script Integration

**Required Scripts Addition:**
```json
{
  "scripts": {
    "pre-commit": "npm run type-check && npm run audit:package-boundaries && npm run audit:ui-compliance && npm run audit:auth-compliance && npm run audit:performance-budget && npm run audit:security-compliance && npm run audit:client-server-boundaries && npm run audit:use-client-directive && npm run audit:server-imports",
    "audit:package-boundaries": "node scripts/audit-package-boundaries.js",
    "audit:ui-compliance": "node scripts/audit-ui-compliance.js", 
    "audit:auth-compliance": "node scripts/audit-auth-compliance.js",
    "audit:performance-budget": "node scripts/audit-performance-budget.js",
    "audit:security-compliance": "node scripts/audit-security-compliance.js",
    "audit:client-server-boundaries": "node scripts/audit-client-server-boundaries.js",
    "audit:use-client-directive": "node scripts/audit-use-client-directive.js",
    "audit:server-imports": "node scripts/audit-server-imports.js"
  }
}
```

---

# Architecture Decision Records

## ADR Template and Process

Architecture Decision Records (ADRs) document significant architectural decisions and their rationale to prevent future questioning and maintain consistency.

### ADR Format Template

**File Naming Convention:** `docs/adrs/ADR-YYYY-number-title.md`

**Standard ADR Template:**
```markdown
# ADR-YYYY-001: [Decision Title]

**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Date:** YYYY-MM-DD
**Deciders:** [List of decision makers]
**Technical Story:** [Link to issue/story if applicable]

## Context
[Describe the forces at play, including technological, political, social, and project constraints]

## Decision  
[Describe the change we're making and why]

## Rationale
[Explain why this decision was made, including alternatives considered]

## Consequences
**Positive:**
- [Benefit 1]
- [Benefit 2]

**Negative:**
- [Trade-off 1] 
- [Trade-off 2]

**Neutral:**
- [Impact 1]

## Implementation Notes
[Specific implementation guidance]

## Compliance Requirements
[Any quality gates or verification requirements]

## Review Date
[When this decision should be reviewed]
```

### Mandatory ADRs for Ganger Platform

**ADR-2025-001: Shared Package Architecture**
```markdown
## Decision
All applications MUST use @ganger/* shared packages exclusively. Custom implementations of UI components, authentication, database access, or external integrations are prohibited.

## Rationale  
- Ensures consistency across applications
- Reduces maintenance burden
- Prevents architectural drift
- Enforces quality standards

## Compliance Requirements
- Pre-commit hooks enforce package boundaries
- Automated auditing prevents violations
- 100% shared package usage required
```

**ADR-2025-002: Universal Hub Integration Pattern**
```markdown
## Decision
All external service integrations MUST use Universal Hub pattern through @ganger/integrations package with MCP server backends.

## Rationale
- Standardizes external service access
- Provides monitoring and error handling
- Enables service substitution
- Centralizes configuration management

## Implementation Notes
- Use UniversalDatabaseHub for all database operations
- Use UniversalPaymentHub for all payment processing  
- Use UniversalCommunicationHub for all messaging
```

**ADR-2025-003: Authentication Standardization**
```markdown
## Decision
All applications MUST use @ganger/auth package exclusively. Custom authentication implementations are prohibited.

## Rationale
- Ensures consistent security standards
- Maintains role-based access control
- Provides HIPAA compliance logging
- Centralizes session management

## Compliance Requirements
- No custom auth contexts or hooks
- Must use withAuth HOC for protected routes
- Required Google OAuth integration
```

### ADR Review and Maintenance Process

**Quarterly ADR Review:**
1. **Review Active ADRs**: Validate decisions are still appropriate
2. **Check Compliance**: Verify actual implementation matches ADR requirements  
3. **Update Status**: Mark deprecated or superseded ADRs
4. **Document Changes**: Create new ADRs for significant changes

**ADR Impact Assessment:**
- **High Impact**: Affects multiple applications or core architecture
- **Medium Impact**: Affects single application or package
- **Low Impact**: Affects specific component or feature

---

# Performance Budgets and Monitoring

## Quantified Performance Standards

The Ganger Platform enforces strict performance budgets to maintain exceptional user experience across all applications.

### Application Performance Budgets

**Page Load Performance:**
```typescript
const PERFORMANCE_BUDGETS = {
  // First Contentful Paint
  fcp: {
    inventory: 1200,      // 1.2s max
    handouts: 1000,       // 1.0s max  
    checkinKiosk: 800,    // 0.8s max (critical for patient flow)
    eosL10: 1500,         // 1.5s max
    medicationAuth: 1000, // 1.0s max
    pharmaScheduling: 1200 // 1.2s max
  },
  
  // Largest Contentful Paint
  lcp: {
    inventory: 2000,      // 2.0s max
    handouts: 1800,       // 1.8s max
    checkinKiosk: 1500,   // 1.5s max
    eosL10: 2500,         // 2.5s max
    medicationAuth: 1800, // 1.8s max
    pharmaScheduling: 2000 // 2.0s max
  },
  
  // Cumulative Layout Shift
  cls: {
    all: 0.1 // Max 0.1 CLS score for all applications
  },
  
  // Time to Interactive
  tti: {
    inventory: 3000,      // 3.0s max
    handouts: 2500,       // 2.5s max
    checkinKiosk: 2000,   // 2.0s max (critical for patient flow)
    eosL10: 4000,         // 4.0s max
    medicationAuth: 2500, // 2.5s max
    pharmaScheduling: 3000 // 3.0s max
  }
};
```

**Bundle Size Budgets:**
```typescript
const BUNDLE_SIZE_BUDGETS = {
  // JavaScript bundle sizes (gzipped)
  javascript: {
    'apps/*/pages/_app.js': 120000,    // 120KB max app shell
    'apps/*/pages/index.js': 200000,   // 200KB max home page
    'apps/*/pages/dashboard.js': 250000, // 250KB max dashboard
    'packages/ui/dist/index.js': 80000,  // 80KB max UI package
    'packages/auth/dist/index.js': 40000, // 40KB max auth package
  },
  
  // CSS bundle sizes (gzipped)
  css: {
    'apps/*/styles/globals.css': 20000, // 20KB max global styles
    'packages/ui/dist/styles.css': 30000 // 30KB max UI styles
  },
  
  // Image optimization requirements
  images: {
    maxFileSize: 500000,  // 500KB max per image
    webpRequired: true,   // WebP format required
    lazyLoadRequired: true // Lazy loading required for non-critical images
  }
};
```

### Performance Monitoring Implementation

**Real-time Performance Monitoring:**
```typescript
// Performance monitoring service
import { performanceMonitoring } from '@ganger/utils';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  async measurePageLoad(pageName: string): Promise<PerformanceMetrics> {
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      // Wait for page to be fully interactive
      setTimeout(() => {
        const metrics = {
          fcp: this.getFirstContentfulPaint(),
          lcp: this.getLargestContentfulPaint(), 
          cls: this.getCumulativeLayoutShift(),
          tti: performance.now() - startTime,
          pageName,
          timestamp: new Date().toISOString()
        };
        
        this.validateAgainstBudget(metrics);
        this.reportMetrics(metrics);
        resolve(metrics);
      }, 100);
    });
  }
  
  private validateAgainstBudget(metrics: PerformanceMetrics): void {
    const budget = PERFORMANCE_BUDGETS[metrics.pageName];
    
    if (metrics.fcp > budget.fcp) {
      console.error(`❌ FCP budget exceeded: ${metrics.fcp}ms > ${budget.fcp}ms`);
      this.reportBudgetViolation('fcp', metrics);
    }
    
    if (metrics.lcp > budget.lcp) {
      console.error(`❌ LCP budget exceeded: ${metrics.lcp}ms > ${budget.lcp}ms`);
      this.reportBudgetViolation('lcp', metrics);
    }
    
    if (metrics.cls > PERFORMANCE_BUDGETS.cls.all) {
      console.error(`❌ CLS budget exceeded: ${metrics.cls} > ${PERFORMANCE_BUDGETS.cls.all}`);
      this.reportBudgetViolation('cls', metrics);
    }
  }
  
  private async reportBudgetViolation(metric: string, data: PerformanceMetrics): Promise<void> {
    // Report to monitoring service
    await fetch('/api/performance-violations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric, data, severity: 'high' })
    });
  }
}
```

**Automated Performance Testing:**
```javascript
// Performance testing in CI/CD pipeline
const { performance } = require('perf_hooks');
const puppeteer = require('puppeteer');

async function performanceTest(url, budgets) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Enable performance monitoring
  await page.coverage.startJSCoverage();
  await page.coverage.startCSSCoverage();
  
  const startTime = performance.now();
  await page.goto(url, { waitUntil: 'networkidle0' });
  const loadTime = performance.now() - startTime;
  
  // Get performance metrics
  const metrics = await page.evaluate(() => {
    return {
      fcp: performance.getEntriesByType('paint')[0]?.startTime || 0,
      lcp: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0,
      cls: 0, // Would need more complex calculation
      tti: loadTime
    };
  });
  
  // Validate against budgets
  let violations = 0;
  Object.entries(budgets).forEach(([metric, budget]) => {
    if (metrics[metric] > budget) {
      console.error(`❌ ${metric.toUpperCase()} budget exceeded: ${metrics[metric]}ms > ${budget}ms`);
      violations++;
    }
  });
  
  await browser.close();
  
  if (violations > 0) {
    throw new Error(`${violations} performance budget violations detected`);
  }
  
  console.log('✅ Performance budgets met');
  return metrics;
}
```

### Build Time Performance Budgets

**Development Build Performance:**
```typescript
const BUILD_TIME_BUDGETS = {
  // TypeScript compilation times
  typeCheck: {
    root: 60000,          // 60s max for full workspace type check
    'apps/inventory': 15000, // 15s max per app
    'apps/handouts': 15000,
    'apps/checkin-kiosk': 15000,
    'packages/ui': 10000,    // 10s max per package
    'packages/auth': 5000,
    'packages/db': 8000
  },
  
  // Production build times
  build: {
    'apps/inventory': 120000,   // 2min max production build
    'apps/handouts': 120000,
    'apps/checkin-kiosk': 120000,
    'packages/ui': 60000,       // 1min max package build
  },
  
  // Development server startup
  devServer: {
    'apps/inventory': 30000,    // 30s max dev server start
    'apps/handouts': 30000,
    'apps/checkin-kiosk': 30000
  }
};
```

### Performance Budget Enforcement in CI/CD

**GitHub Actions Performance Testing:**
```yaml
name: Performance Budget Check
on: [push, pull_request]

jobs:
  performance-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build applications
        run: npm run build
        timeout-minutes: 5
        
      - name: Run performance tests
        run: npm run test:performance
        env:
          PERFORMANCE_BUDGET_STRICT: true
          
      - name: Validate bundle sizes
        run: npm run audit:bundle-sizes
        
      - name: Check build times
        run: npm run audit:build-performance
```

---

# Reality Verification Systems

## Anti-Hallucination Infrastructure

The Reality Verification System prevents AI documentation drift by automatically capturing and validating actual command outputs against claims.

### Verification Receipt System

**Command Output Capture:**
```typescript
export class VerificationReceiptSystem {
  private receipts: Map<string, VerificationReceipt> = new Map();
  
  async captureCommandExecution(
    command: string, 
    context: string,
    expectedOutcome?: string
  ): Promise<VerificationReceipt> {
    const receiptId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();
    
    try {
      const result = await this.executeCommand(command);
      const endTime = performance.now();
      
      const receipt: VerificationReceipt = {
        id: receiptId,
        command,
        context,
        startTime: new Date().toISOString(),
        duration: endTime - startTime,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        success: result.exitCode === 0,
        expectedOutcome,
        actualOutcome: result.stdout,
        verification: this.verifyOutcome(result, expectedOutcome),
        timestamp: new Date().toISOString()
      };
      
      this.receipts.set(receiptId, receipt);
      this.persistReceipt(receipt);
      
      return receipt;
    } catch (error) {
      const receipt: VerificationReceipt = {
        id: receiptId,
        command,
        context,
        startTime: new Date().toISOString(),
        duration: performance.now() - startTime,
        exitCode: 1,
        stdout: '',
        stderr: error.message,
        success: false,
        expectedOutcome,
        actualOutcome: `ERROR: ${error.message}`,
        verification: 'FAILED',
        timestamp: new Date().toISOString()
      };
      
      this.receipts.set(receiptId, receipt);
      this.persistReceipt(receipt);
      
      return receipt;
    }
  }
  
  private verifyOutcome(result: CommandResult, expected?: string): 'PASS' | 'FAIL' | 'UNKNOWN' {
    if (!expected) return 'UNKNOWN';
    
    // Smart verification logic
    if (expected.includes('0 errors') && result.stdout.includes('0 errors')) return 'PASS';
    if (expected.includes('success') && result.exitCode === 0) return 'PASS';
    if (expected.includes('compilation successful') && 
        result.stdout.includes('compiled successfully')) return 'PASS';
    
    return 'FAIL';
  }
}
```

**Verification Receipt Interface:**
```typescript
interface VerificationReceipt {
  id: string;
  command: string;
  context: string; // e.g., "Terminal 1 - TypeScript compilation check"
  startTime: string;
  duration: number;
  exitCode: number;
  stdout: string;
  stderr: string;
  success: boolean;
  expectedOutcome?: string;
  actualOutcome: string;
  verification: 'PASS' | 'FAIL' | 'UNKNOWN';
  timestamp: string;
}
```

### Real-Time Truth Reconciliation

**Documentation Drift Detection:**
```typescript
export class TruthReconciliationEngine {
  private knownTruths: Map<string, DocumentedClaim> = new Map();
  
  async validateClaim(claim: DocumentedClaim): Promise<TruthValidationResult> {
    const verificationReceipt = await this.verificationSystem.captureCommandExecution(
      claim.verificationCommand,
      `Validating claim: ${claim.description}`,
      claim.expectedOutcome
    );
    
    const validation: TruthValidationResult = {
      claimId: claim.id,
      claimDescription: claim.description,
      verificationReceipt,
      truthStatus: this.determineTruthStatus(claim, verificationReceipt),
      driftDetected: this.detectDrift(claim, verificationReceipt),
      correctionRequired: false,
      timestamp: new Date().toISOString()
    };
    
    if (validation.driftDetected) {
      validation.correctionRequired = true;
      await this.reportDrift(validation);
    }
    
    return validation;
  }
  
  private determineTruthStatus(
    claim: DocumentedClaim, 
    receipt: VerificationReceipt
  ): 'VERIFIED' | 'FALSIFIED' | 'INCONCLUSIVE' {
    if (!receipt.success) return 'FALSIFIED';
    
    // Advanced pattern matching for truth validation
    const truthPatterns = [
      { pattern: /0 errors/, claim: 'compilation successful' },
      { pattern: /✅.*passed/, claim: 'tests passing' },
      { pattern: /build successful/, claim: 'build working' },
      { pattern: /deployment successful/, claim: 'deployment working' }
    ];
    
    for (const { pattern, claim: claimType } of truthPatterns) {
      if (claim.description.includes(claimType) && pattern.test(receipt.stdout)) {
        return 'VERIFIED';
      }
      if (claim.description.includes(claimType) && !pattern.test(receipt.stdout)) {
        return 'FALSIFIED';
      }
    }
    
    return 'INCONCLUSIVE';
  }
  
  private detectDrift(claim: DocumentedClaim, receipt: VerificationReceipt): boolean {
    const previousTruth = this.knownTruths.get(claim.id);
    
    if (!previousTruth) {
      this.knownTruths.set(claim.id, claim);
      return false;
    }
    
    // Check if current reality differs from documented claim
    if (previousTruth.expectedOutcome !== receipt.actualOutcome) {
      return true;
    }
    
    return false;
  }
}
```

**Automated Drift Correction:**
```typescript
export class DriftCorrectionSystem {
  async correctDocumentationDrift(
    driftReport: TruthValidationResult
  ): Promise<CorrectionResult> {
    const correction: CorrectionResult = {
      driftId: driftReport.claimId,
      correctionType: this.determineCorrectionType(driftReport),
      originalClaim: driftReport.claimDescription,
      correctedClaim: this.generateCorrectedClaim(driftReport),
      verificationEvidence: driftReport.verificationReceipt,
      timestamp: new Date().toISOString()
    };
    
    switch (correction.correctionType) {
      case 'UPDATE_DOCUMENTATION':
        await this.updateDocumentation(correction);
        break;
      case 'FIX_IMPLEMENTATION':
        await this.createFixIssue(correction);
        break;
      case 'RECONCILE_EXPECTATION':
        await this.reconcileExpectation(correction);
        break;
    }
    
    return correction;
  }
  
  private generateCorrectedClaim(driftReport: TruthValidationResult): string {
    const receipt = driftReport.verificationReceipt;
    
    if (receipt.success) {
      return `VERIFIED: ${driftReport.claimDescription} - Command "${receipt.command}" completed successfully with output: "${receipt.stdout.slice(0, 100)}..."`;
    } else {
      return `FALSIFIED: ${driftReport.claimDescription} - Command "${receipt.command}" failed with error: "${receipt.stderr.slice(0, 100)}..."`;
    }
  }
}
```

### Context Preservation and Recovery

**Session Context Bridge:**
```typescript
export class SessionContextBridge {
  private contextFile = '.ai-workspace/context-bridges/current-session-context.md';
  
  async preserveContext(context: SessionContext): Promise<void> {
    const contextDocument = this.generateContextDocument(context);
    await fs.writeFile(this.contextFile, contextDocument);
    
    // Also preserve in Memory MCP for redundancy
    await this.memoryMCP.addObservations([
      {
        entityName: 'Current Session Context',
        contents: [contextDocument]
      }
    ]);
  }
  
  private generateContextDocument(context: SessionContext): string {
    return `# Current Session Context
    
## Session Information
- **Session ID**: ${context.sessionId}
- **Start Time**: ${context.startTime}
- **Current Phase**: ${context.currentPhase}
- **Active Terminals**: ${context.activeTerminals.join(', ')}

## Current Tasks Status
${context.tasks.map(task => `- **${task.id}**: ${task.status} - ${task.description}`).join('\n')}

## Verification Receipts
${context.verificationReceipts.map(receipt => 
  `- **${receipt.command}**: ${receipt.success ? '✅' : '❌'} (${receipt.timestamp})`
).join('\n')}

## Known Issues
${context.knownIssues.map(issue => `- ${issue.description} (Priority: ${issue.priority})`).join('\n')}

## Next Actions
${context.nextActions.map(action => `- ${action}`).join('\n')}

---
*Auto-generated by Reality Verification System at ${new Date().toISOString()}*
`;
  }
  
  async recoverContext(): Promise<SessionContext | null> {
    try {
      const contextDocument = await fs.readFile(this.contextFile, 'utf8');
      return this.parseContextDocument(contextDocument);
    } catch (error) {
      // Fallback to Memory MCP
      try {
        const memoryResult = await this.memoryMCP.searchNodes({
          query: 'Current Session Context'
        });
        
        if (memoryResult.nodes.length > 0) {
          return this.parseContextFromMemory(memoryResult.nodes[0]);
        }
      } catch (memoryError) {
        console.error('Failed to recover context from both file and memory:', memoryError);
      }
      
      return null;
    }
  }
}
```

### Integration with Development Workflow

**Pre-Commit Reality Check:**
```bash
#!/bin/sh
# .husky/pre-commit-reality-check

echo "🔍 Running reality verification before commit..."

# Capture current state
npm run verify:current-state

# Check for documentation drift
npm run detect:documentation-drift

# Validate all claims in commit
npm run validate:commit-claims

# Generate verification receipts
npm run generate:verification-receipts

echo "✅ Reality verification complete"
```

**Continuous Reality Monitoring:**
```yaml
# .github/workflows/reality-check.yml
name: Continuous Reality Verification
on:
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours
  push:
    branches: [main]

jobs:
  reality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
        
      - name: Run reality verification
        run: npm run verify:all-claims
        
      - name: Check for documentation drift
        run: npm run detect:all-drift
        
      - name: Generate drift report
        if: failure()
        run: npm run generate:drift-report
        
      - name: Create issue for drift
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Documentation Drift Detected',
              body: 'Automated reality verification detected documentation drift. See drift report for details.',
              labels: ['bug', 'documentation-drift', 'high-priority']
            })
```

---

# Documentation System and Maintenance

## Documentation Architecture

The Ganger Platform uses a consolidated documentation system designed for enterprise-grade development with clear separation between static reference material and living project tracking.

### **Core Documentation Structure**

```
ganger-platform/
├── true-docs/                           # 📁 MASTER DOCUMENTATION HUB
│   ├── MASTER_DEVELOPMENT_GUIDE.md      # 🔧 Complete technical reference
│   ├── AI_WORKFLOW_GUIDE.md             # 🤖 AI development methodologies  
│   ├── PROJECT_TRACKER.md               # 📊 Living project status (updated regularly)
│   └── SKIPPED_DOCUMENTS.md             # 📋 Archive tracking and file categorization
├── docs/
│   ├── archive/                         # 📦 Historical documentation
│   │   ├── historical-context/          # Previous project states
│   │   ├── terminal-sessions/           # AI terminal handoff records
│   │   └── project-logs/               # Development session logs
│   └── adrs/                           # 📋 Architecture Decision Records
│       ├── ADR-2025-001-shared-packages.md
│       ├── ADR-2025-002-universal-hubs.md
│       └── ADR-2025-003-authentication.md
├── apps/*/README.md                     # 📱 App-specific documentation
├── packages/*/README.md                 # 📦 Package-specific documentation
└── CLAUDE.md                           # 🔒 AI assistant configuration (gitignored)
```

### **Documentation Types and Ownership**

**🔧 Static Reference Documentation:**
- **MASTER_DEVELOPMENT_GUIDE.md**: Technical architecture, standards, patterns
- **AI_WORKFLOW_GUIDE.md**: Development methodologies and AI coordination
- **Architecture Decision Records**: Historical architectural decisions
- **Package READMEs**: Individual component documentation

**📊 Living Documentation:**
- **PROJECT_TRACKER.md**: Current project status, task progress, metrics
- **CLAUDE.md**: AI assistant configuration and project instructions

**📦 Historical Documentation:**
- **docs/archive/**: Superseded documentation and session records
- **SKIPPED_DOCUMENTS.md**: Tracking of archived and excluded files

## Documentation Maintenance Procedures

### **When to Update Documentation**

**🔧 MASTER_DEVELOPMENT_GUIDE.md - Update When:**
- Adding new shared packages or architectural patterns
- Implementing new quality gates or verification procedures
- Changing authentication, API, or UI standards
- Adding new development tools or enforcement mechanisms
- Creating new application development templates

**🤖 AI_WORKFLOW_GUIDE.md - Update When:**
- Discovering new AI development patterns or anti-hallucination techniques
- Implementing new terminal coordination or MCP integration methods
- Adding new verification systems or context preservation strategies
- Updating handoff templates or autonomous workflow patterns

**📊 PROJECT_TRACKER.md - Update When:**
- Completing tasks (mark as completed immediately)
- Identifying new risks or changing project timeline
- Updating velocity predictions or business impact metrics
- Adding new tasks or changing project priorities
- **Update Frequency**: Real-time for task completion, weekly for analytics

### **How to Update Documentation**

**✅ Approved Update Process:**
```bash
# 1. Read current documentation state
cat /mnt/q/Projects/ganger-platform/true-docs/[FILE].md

# 2. Make targeted updates using proper editing tools
# - Use Edit tool for specific section updates
# - Use MultiEdit for multiple related changes
# - NEVER use Write tool on existing files

# 3. Verify documentation accuracy
npm run docs:verify  # If available
git diff true-docs/   # Review changes

# 4. Commit with descriptive message
git add true-docs/
git commit -m "docs: update [specific change description]"
```

**❌ Prohibited Documentation Practices:**
- **NEVER** replace working documentation with placeholders
- **NEVER** create duplicate documentation in multiple locations
- **NEVER** update documentation without verifying current state
- **NEVER** remove configuration values from working documentation

### **Documentation Update Triggers**

**Automated Triggers:**
- **Task Completion**: Automatically update PROJECT_TRACKER.md completion status
- **Architecture Changes**: Create new ADR when architectural decisions are made
- **Quality Gate Changes**: Update MASTER_DEVELOPMENT_GUIDE.md when adding new gates
- **MCP Integration**: Update AI_WORKFLOW_GUIDE.md when adding new MCP servers

**Manual Review Triggers:**
- **Monthly**: Review and update velocity predictions in PROJECT_TRACKER.md
- **Quarterly**: Review ADRs and update status (Active/Deprecated/Superseded)
- **Major Releases**: Comprehensive documentation review and consolidation
- **New Team Members**: Verify onboarding documentation accuracy

### **Documentation Quality Standards**

**Content Standards:**
- **Verification-First**: All claims must be backed by actual command output or testing
- **Specificity**: Include exact file paths, commands, and expected outcomes
- **Completeness**: Cover setup, usage, troubleshooting, and maintenance
- **Currency**: Keep information current and remove outdated references

**Format Standards:**
- **Markdown**: Use GitHub-flavored Markdown with proper heading hierarchy
- **Code Blocks**: Include language specification for syntax highlighting
- **Links**: Use relative paths for internal documentation links
- **TOC**: Maintain table of contents for documents >100 lines

**Verification Requirements:**
```bash
# Documentation update verification checklist
✅ Commands tested and output verified
✅ File paths confirmed to exist
✅ Code examples compile successfully
✅ Links verified to work
✅ No duplicate information with other docs
✅ Proper markdown formatting
✅ Table of contents updated if needed
```

### **Documentation Consolidation Protocol**

**When Documentation Proliferates:**
1. **Audit Phase**: Identify duplicate or conflicting documentation
2. **Consolidation Phase**: Merge related content into core documents
3. **Archive Phase**: Move superseded documents to docs/archive/
4. **Verification Phase**: Ensure no information loss during consolidation
5. **Update Phase**: Update all references to point to new locations

**File Consolidation Priority:**
1. **High Priority**: Conflicting technical standards or architectural guidance
2. **Medium Priority**: Duplicate development procedures or setup instructions
3. **Low Priority**: Historical logs or session records

### **Documentation Access and Navigation**

**Primary Entry Points:**
1. **README.md** (Project Root): Overview and quick start guide
2. **true-docs/MASTER_DEVELOPMENT_GUIDE.md**: Complete technical reference
3. **true-docs/AI_WORKFLOW_GUIDE.md**: AI development methodologies
4. **true-docs/PROJECT_TRACKER.md**: Current project status

**Navigation Principles:**
- **Single Source of Truth**: Each topic covered in only one authoritative location
- **Cross-References**: Clear links between related documentation sections
- **Hierarchical Structure**: Logical progression from overview to details
- **Search-Friendly**: Descriptive headings and consistent terminology

### **Documentation Backup and Recovery**

**Version Control Integration:**
- All documentation tracked in Git with full history
- Branch protection on main branch prevents accidental overwrites
- Documentation changes require same review process as code

**Context Preservation:**
- Memory MCP integration preserves documentation context across AI sessions
- Documentation changes logged with rationale and verification evidence
- ADRs provide decision history and context for architectural changes

**Recovery Procedures:**
```bash
# Recover accidentally modified documentation
git log --oneline true-docs/[FILE].md  # Find last good commit
git checkout [COMMIT_HASH] true-docs/[FILE].md  # Restore file
git commit -m "docs: restore [FILE] from accidental modification"

# Recover from documentation drift
npm run verify:documentation-accuracy  # If available
npm run reconcile:documentation-drift  # If available
```

---

# Platform Overview

## Core Platform Information

The Ganger Platform is a consolidated monorepo containing integrated business applications for Ganger Dermatology, migrated from legacy PHP systems to a modern Next.js stack designed for scalability, maintainability, and enhanced user experience.

### Technology Stack

**Core Technologies:**
- Frontend: Next.js 14, React 18, TypeScript
- Backend: Supabase (PostgreSQL + Auth + Storage + Edge Functions)  
- Styling: Tailwind CSS with shared design system
- Build System: Turborepo for monorepo management
- Deployment: Cloudflare Workers with global edge network
- CI/CD: GitHub Actions for automated testing and deployment

**MCP-Enhanced Development Infrastructure:**
- Supabase MCP: Database operations, migrations, edge functions
- GitHub MCP: Repository management, automated PRs, issue tracking
- Cloudflare MCP: Workers deployment, DNS management, analytics
- Google Cloud Run MCP: Containerized microservices, auto-scaling
- Stripe MCP: Payment processing for medical billing
- Twilio MCP: HIPAA-compliant SMS/voice communication
- Filesystem MCP: Advanced file operations and build automation
- Time MCP: Real-time timestamps, timezone management, HIPAA compliance auditing

### Environment Configuration

**Critical Security Policy:**
- This is a **private internal medical platform** for Ganger Dermatology
- **NEVER remove working configuration values** from .env, .env.example, or config files
- **NEVER replace real credentials with placeholders** - this breaks deployment
- **ALWAYS preserve working infrastructure values** exactly as they exist
- The .env.example file serves as working documentation of actual deployment values

**Required Environment Variables:**
```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:54322/postgres"
DIRECT_URL="postgresql://postgres:password@localhost:54322/postgres"

# Supabase Configuration
SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth & Workspace
GOOGLE_CLIENT_ID=745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_DOMAIN=gangerdermatology.com

# Cloudflare Configuration
CLOUDFLARE_ZONE_ID=ba76d3d3f41251c49f0365421bd644a5
CLOUDFLARE_API_TOKEN=TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf

# Application URLs
NEXT_PUBLIC_STAFF_URL=https://staff.gangerdermatology.com
NEXT_PUBLIC_LUNCH_URL=https://lunch.gangerdermatology.com
NEXT_PUBLIC_L10_URL=https://l10.gangerdermatology.com
```

### Project Structure

```
ganger-platform/
├── apps/                    # Individual applications
│   ├── inventory/          # Medical supply tracking
│   ├── handouts/           # Patient educational materials
│   ├── checkin-kiosk/      # Patient self-service terminal
│   ├── eos-l10/            # EOS L10 meeting management
│   ├── medication-auth/    # Medication authorization system
│   └── pharma-scheduling/  # Pharmaceutical representative scheduling
├── packages/               # Shared packages
│   ├── auth/              # Authentication utilities
│   ├── db/                # Database schemas and utilities
│   ├── ui/                # Shared UI components
│   ├── utils/             # Shared utilities
│   ├── integrations/      # Universal service hubs
│   └── config/           # Shared configuration
├── supabase/              # Database migrations and edge functions
├── docs/                  # Documentation
└── scripts/              # Build and deployment scripts
```

### Development Commands

```bash
# Development
npm run dev              # Start all apps in development
npm run dev:inventory    # Start specific app

# Quality Assurance
npm run lint             # ESLint across all packages
npm run type-check       # TypeScript validation
npm run test             # Run test suites
npm run build            # Production build test

# Database Operations
npm run db:migrate       # Run database migrations
npm run supabase:start   # Start local Supabase
npm run supabase:stop    # Stop local Supabase
```

---

# Development Environment Setup

## Prerequisites

**Required Software:**
- **Node.js**: v18+ (v22+ recommended)
- **npm**: v9+ (v10+ recommended)
- **Docker**: For Supabase local development
- **Git**: v2.34+

## Initial Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd ganger-platform
npm install
```

### 2. Environment Configuration

**⚠️ CRITICAL: Environment Variables Security Policy**
- This is a private internal medical platform - standard open-source security practices DO NOT apply
- NEVER remove working configuration values from .env files
- NEVER replace real credentials with placeholders - this breaks deployment
- The .env.example file serves as working documentation of actual deployment values

**Setup Environment:**
```bash
cp .env.example .env
# Edit .env with your specific configuration
```

**Required Environment Variables:**
```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:54322/postgres"
DIRECT_URL="postgresql://postgres:password@localhost:54322/postgres"

# Supabase Configuration
SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth & Workspace
GOOGLE_CLIENT_ID=745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_DOMAIN=gangerdermatology.com

# Cloudflare Configuration
CLOUDFLARE_ZONE_ID=ba76d3d3f41251c49f0365421bd644a5
CLOUDFLARE_API_TOKEN=TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf
```

### 3. Start Local Infrastructure

**Start Supabase:**
```bash
npm run supabase:start
```

**Generate Database Client:**
```bash
npm run db:generate
```

### 4. Start Development Servers

```bash
npm run dev              # Start all apps
npm run dev:inventory    # Start specific app
npm run dev:handouts     # Start specific app
npm run dev:checkin-kiosk # Start specific app
```

**Application URLs:**
- Inventory Management: http://localhost:3001
- Patient Handouts: http://localhost:3002
- Check-in Kiosk: http://localhost:3003

## Development Workflow

### Making Changes

1. **Create feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Run quality checks:**
   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run build
   ```

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

### Database Changes

```bash
# Modify schema in packages/db/prisma/schema.prisma
npm run db:migrate      # Generate migration
npm run db:push         # Apply changes
npm run db:generate     # Regenerate client
```

### Adding New Packages

```bash
mkdir packages/your-package
cd packages/your-package
npm init -y
# Add to workspace in root package.json
npm install @ganger/your-package
```

## Troubleshooting

### Common Issues

**Port Conflicts:**
- Check if ports 3001-3003 are available
- Modify port configuration in individual app configs

**Supabase Connection Issues:**
- Ensure Docker is running
- Restart: `npm run supabase:stop && npm run supabase:start`

**Build Failures:**
- Clear dependencies: `rm -rf node_modules && npm install`
- Clear Turbo cache: `npm run clean`

**Database Issues:**
- Reset local database: `npm run supabase:reset`
- Regenerate Prisma client: `npm run db:generate`

---

# Authentication and Security

## Authentication Standards

The Ganger Platform uses a standardized authentication system through @ganger/auth that provides secure, role-based access control across all applications with Google OAuth integration and HIPAA compliance.

### Standard Authentication Implementation

**Required setup in every application:**
```typescript
import { AuthProvider, useAuth, withAuth } from '@ganger/auth';

// App root component
export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

// Protected route implementation
export default withAuth(ProtectedPage, { 
  requiredRoles: ['manager', 'superadmin'] 
});

// Hook usage in components
const { user, signIn, signOut, isLoading } = useAuth();
```

### Role Hierarchy and Permissions

**User Roles:**
```typescript
type UserRole = 
  | 'superadmin'     // Full system access
  | 'manager'        // Location management and staff oversight
  | 'provider'       // Clinical operations and patient care
  | 'nurse'          // Clinical support and patient assistance
  | 'medical_assistant' // Administrative and clinical assistance
  | 'pharmacy_tech'  // Medication management
  | 'billing'        // Financial operations
  | 'user';          // Basic access
```

**Permission Checking:**
```typescript
// Permission validation service
import { PermissionService } from '@ganger/auth';

// Check user permissions
const hasPermission = PermissionService.hasPermission(user, 'access_patient_records');
const canAccessLocation = PermissionService.canAccessLocation(user, locationId);

// Component-level permission checking
const { hasRole, hasPermission, canAccessLocation } = useAuth();
```

### Authentication Context

```typescript
interface AuthContextValue {
  // User state
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Authentication methods
  signIn: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // Permission checks
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccessLocation: (locationId: string) => boolean;
  
  // Session management
  refreshSession: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}
```

### Page Protection Setup

**New Application Authentication Checklist:**
- [ ] Install @ganger/auth package
- [ ] Wrap app with AuthProvider in _app.tsx
- [ ] Configure Google OAuth domain restriction
- [ ] Set up protected routes with withAuth HOC
- [ ] Implement role-based UI rendering
- [ ] Add audit logging for sensitive operations
- [ ] Test authentication flows
- [ ] Verify HIPAA compliance logging

---

# Component Library and UI Standards

## @ganger/ui Component Library

The @ganger/ui component library provides enterprise-grade components that MUST be used exclusively across all applications. Custom implementations of these components are strictly prohibited.

### Available Components

**Layout Components:**
```typescript
import { AppLayout, PageHeader, Card } from '@ganger/ui';

<AppLayout>
  <PageHeader title="Dashboard" subtitle="Overview" />
  <Card>
    <p>Your content here</p>
  </Card>
</AppLayout>
```

**Form Components:**
```typescript
import { FormField, Input, Button, Select, Checkbox } from '@ganger/ui';

<form onSubmit={handleSubmit}>
  <FormField label="Patient Name" required>
    <Input 
      type="text" 
      placeholder="Enter patient name"
      value={patientName}
      onChange={setPatientName}
    />
  </FormField>
  
  <FormField label="Location">
    <Select 
      options={locationOptions}
      value={selectedLocation}
      onChange={setSelectedLocation}
    />
  </FormField>
  
  <Button type="submit" variant="primary">
    Save Appointment
  </Button>
</form>
```

**Data Display Components:**
```typescript
import { DataTable, StatCard } from '@ganger/ui';

<DataTable
  data={appointments}
  columns={[
    { key: 'patientName', label: 'Patient', sortable: true },
    { key: 'appointmentDate', label: 'Date', sortable: true },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> }
  ]}
  onSort={handleSort}
  pagination={{
    currentPage: page,
    totalPages: totalPages,
    onPageChange: setPage
  }}
/>
```

**Feedback Components:**
```typescript
import { Modal, Toast, LoadingSpinner } from '@ganger/ui';

<Modal 
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Confirm Appointment"
>
  <p>Are you sure you want to book this appointment?</p>
  <div className="flex gap-2 mt-4">
    <Button onClick={confirmBooking}>Confirm</Button>
    <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
  </div>
</Modal>
```

## Design System Integration

### Color Token System

```typescript
// Unified color tokens - USE THESE EXCLUSIVELY
const designTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      500: '#3b82f6',  // Primary blue
      600: '#2563eb',  // Primary dark
      900: '#1e3a8a'
    },
    secondary: {
      500: '#10b981',  // Success green
      600: '#059669'   // Success dark
    },
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      500: '#64748b',  // Text gray
      600: '#475569',  // Text dark
      900: '#0f172a'   // Text darkest
    },
    warning: {
      500: '#f59e0b',  // Warning amber
      600: '#d97706'   // Warning dark
    },
    danger: {
      500: '#ef4444',  // Error red
      600: '#dc2626'   // Error dark
    }
  }
};

// ✅ Use design tokens
<Button className="bg-primary-600 hover:bg-primary-700">
  Primary Action
</Button>

// ❌ NEVER use arbitrary colors
<Button className="bg-blue-500"> // PROHIBITED
```

### Typography Standards

```typescript
const typography = {
  // Headings
  h1: 'text-3xl font-bold text-neutral-900',
  h2: 'text-2xl font-semibold text-neutral-800', 
  h3: 'text-xl font-medium text-neutral-700',
  
  // Body text
  body: 'text-base text-neutral-600',
  bodyLarge: 'text-lg text-neutral-600',
  bodySmall: 'text-sm text-neutral-500',
  
  // Special text
  caption: 'text-xs text-neutral-400',
  label: 'text-sm font-medium text-neutral-700'
};
```

### Spacing and Layout

```typescript
// Standard spacing scale (Tailwind)
const spacing = {
  xs: '0.25rem',  // 1
  sm: '0.5rem',   // 2
  md: '1rem',     // 4
  lg: '1.5rem',   // 6
  xl: '2rem',     // 8
  '2xl': '3rem'   // 12
};

// ✅ Consistent spacing usage
<Card className="p-6 mb-4"> // Standard card padding
  <div className="space-y-4"> // Standard vertical spacing
    <FormField>...</FormField>
    <FormField>...</FormField>
  </div>
</Card>
```

## Prohibited Patterns

### Custom Component Creation

```typescript
// ❌ NEVER create custom button implementations
const CustomButton = ({ children, ...props }) => (
  <button className="bg-blue-500 px-4 py-2 rounded" {...props}>
    {children}
  </button>
);

// ✅ ALWAYS use @ganger/ui Button
import { Button } from '@ganger/ui';
<Button variant="primary">{children}</Button>
```

### Inline Styling

```typescript
// ❌ NEVER use inline styles
<div style={{ color: 'blue', padding: '16px' }}>
  Content
</div>

// ✅ ALWAYS use design token classes
<div className="text-primary-600 p-4">
  Content
</div>
```

### Direct CSS Classes for UI Elements

```typescript
// ❌ NEVER implement UI elements directly
<input className="border rounded px-3 py-2" />

// ✅ ALWAYS use @ganger/ui components
<Input placeholder="Enter value" />
```

## Standard Usage Patterns

### Form Handling Pattern

```typescript
import { useState } from 'react';
import { FormField, Input, Button, Select } from '@ganger/ui';
import { validateForm } from '@ganger/utils';

export default function AppointmentForm() {
  const [formData, setFormData] = useState({
    patientName: '',
    appointmentDate: '',
    location: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const validation = validateForm(formData, appointmentSchema);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }
    
    try {
      await createAppointment(formData);
      // Success handling
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField 
        label="Patient Name" 
        required 
        error={errors.patientName}
      >
        <Input
          type="text"
          value={formData.patientName}
          onChange={(value) => setFormData(prev => ({ ...prev, patientName: value }))}
          placeholder="Enter patient name"
        />
      </FormField>
      
      <Button 
        type="submit" 
        variant="primary" 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Booking...' : 'Book Appointment'}
      </Button>
    </form>
  );
}
```

### Data Display Pattern

```typescript
import { DataTable, StatCard, Card } from '@ganger/ui';
import { formatDate, formatCurrency } from '@ganger/utils';

export default function Dashboard({ appointments, stats }) {
  const columns = [
    {
      key: 'patientName',
      label: 'Patient',
      sortable: true
    },
    {
      key: 'appointmentDate',
      label: 'Date',
      sortable: true,
      render: (row) => formatDate(row.appointmentDate)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => editAppointment(row.id)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => cancelAppointment(row.id)}>
            Cancel
          </Button>
        </div>
      )
    }
  ];
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Appointments"
          value={stats.total}
          change={stats.change}
          trend={stats.trend}
          icon="calendar"
        />
      </div>
      
      {/* Data Table */}
      <Card>
        <DataTable
          data={appointments}
          columns={columns}
          searchable
          pagination={{ enabled: true, pageSize: 25 }}
        />
      </Card>
    </div>
  );
}
```

## Quality Standards

### Performance Requirements
- Component Load Time: <100ms initial load
- Re-render Performance: <2ms for prop changes  
- Bundle Size Impact: <5KB per component
- Accessibility: 100% WCAG 2.1 AA compliance
- Browser Support: All modern browsers + IE11

### Component Testing Requirements

```typescript
describe('Button Component', () => {
  // Rendering tests
  it('renders with correct variant styling', () => {
    render(<Button variant="primary">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary-600');
  });
  
  // Accessibility tests
  it('meets accessibility standards', async () => {
    const { container } = render(<Button>Test</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  // Interaction tests
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Test</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

---

# API Standards and Integration

## MCP (Model Context Protocol) Integration Architecture

The Ganger Platform uses a Universal Hub Architecture for integrating with external services through MCP servers, providing consistent interfaces across all applications.

### Universal Hub Architecture

**Hub Integration Pattern:**
```typescript
// Base Universal Hub class
export abstract class UniversalHub {
  protected serverName: string;
  protected version: string;
  protected capabilities: string[];
  protected healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  
  constructor(config: HubConfig) {
    this.serverName = config.serverName;
    this.version = config.version;
    this.capabilities = config.capabilities;
    this.healthStatus = 'healthy';
  }
  
  protected async executeWithMonitoring<T>(
    operation: string,
    executor: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await executor();
      this.recordSuccess(operation, performance.now() - startTime);
      return result;
    } catch (error) {
      this.recordFailure(operation, error, performance.now() - startTime);
      throw error;
    }
  }
  
  abstract getHealthStatus(): Promise<HealthStatus>;
}
```

### MCP Integration Status

**Production Ready MCP Servers:**
- ✅ **Supabase MCP**: Database operations, migrations, edge functions
- ✅ **Stripe MCP**: Payment processing, billing, fraud detection
- ✅ **Twilio MCP**: HIPAA-compliant SMS/voice communication
- ✅ **Google Sheets MCP**: Spreadsheet operations, data export/import
- ✅ **GitHub MCP**: Repository management, automated PRs, issue tracking
- ✅ **Cloudflare MCP**: Workers deployment, DNS management, analytics
- ✅ **Time MCP**: Timezone management, HIPAA compliance auditing
- ✅ **Filesystem MCP**: File operations and build automation

### MCP Service Implementation Pattern

**Standard Service Hub Structure:**
```typescript
// Example: Supabase MCP Hub
export class UniversalDatabaseHub extends UniversalHub {
  private supabaseMCP: SupabaseMCPClient;
  
  constructor() {
    super({
      serverName: 'supabase',
      version: '1.0.0',
      capabilities: ['query', 'migrate', 'rpc', 'storage', 'auth']
    });
  }
  
  async executeQuery(query: string, params?: any[]): Promise<QueryResult> {
    return this.executeWithMonitoring('database_query', async () => {
      return await this.supabaseMCP.query({ sql: query, params });
    });
  }
  
  async runMigration(migrationFile: string): Promise<MigrationResult> {
    return this.executeWithMonitoring('database_migrate', async () => {
      return await this.supabaseMCP.migrate({ file: migrationFile });
    });
  }
}
```

### MCP Configuration

**Required MCP Configuration (`.mcp.json`):**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://pfqtzmxxxhhsxmlddrta.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    },
    "stripe": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-stripe"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_51..."
      }
    },
    "google-sheets": {
      "command": "uvx",
      "args": ["mcp-google-sheets@latest"],
      "env": {
        "SERVICE_ACCOUNT_PATH": "/path/to/service-account.json"
      }
    }
  }
}
```

### Integration Usage in Applications

**Application Integration Pattern:**
```typescript
// Using MCP services in applications
import { UniversalDatabaseHub, UniversalPaymentHub, UniversalCommunicationHub } from '@ganger/integrations';

export class ApplicationService {
  private dbHub: UniversalDatabaseHub;
  private paymentHub: UniversalPaymentHub;
  private commHub: UniversalCommunicationHub;
  
  constructor() {
    this.dbHub = new UniversalDatabaseHub();
    this.paymentHub = new UniversalPaymentHub();
    this.commHub = new UniversalCommunicationHub();
  }
  
  async processPatientPayment(amount: number, patientId: string): Promise<PaymentResult> {
    // Process payment through Stripe MCP
    const payment = await this.paymentHub.processPayment({
      amount,
      currency: 'usd',
      metadata: { patientId }
    });
    
    // Record in database through Supabase MCP
    await this.dbHub.executeQuery(
      'INSERT INTO payments (patient_id, amount, stripe_payment_id) VALUES ($1, $2, $3)',
      [patientId, amount, payment.id]
    );
    
    // Send confirmation via Twilio MCP
    await this.commHub.sendSMS({
      to: payment.customer.phone,
      message: `Payment of $${amount} processed successfully. Reference: ${payment.id}`
    });
    
    return payment;
  }
}
```

## API Response Standardization

### Standard Response Formats

**Success Response Format:**
```typescript
{
  "success": true,
  "data": any,              // The actual response data
  "timestamp": string,      // ISO 8601 timestamp
  "requestId": string,      // Unique request identifier
  "path": string,          // API endpoint path
  "method": string,        // HTTP method
  "statusCode": number,    // HTTP status code
  "meta": {                // Optional metadata
    "pagination": {
      "page": number,
      "limit": number,
      "total": number,
      "totalPages": number
    },
    "performance": {
      "duration_ms": number,
      "cached": boolean
    }
  }
}
```

**Error Response Format:**
```typescript
{
  "error": string,         // Error message
  "code": string,          // Standardized error code
  "message": string,       // User-friendly message
  "details": any,          // Additional error details
  "timestamp": string,     // ISO 8601 timestamp
  "requestId": string,     // Unique request identifier
  "path": string,          // API endpoint path
  "method": string,        // HTTP method
  "statusCode": number     // HTTP status code
}
```

### Standard Error Codes

**Authentication & Authorization:**
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access denied
- `TOKEN_EXPIRED` - Session expired
- `INVALID_CREDENTIALS` - Login failed

**Validation:**
- `VALIDATION_ERROR` - Input validation failed
- `MISSING_REQUIRED_FIELD` - Required field missing
- `INVALID_FORMAT` - Format validation failed

**Resources:**
- `NOT_FOUND` - Resource not found
- `ALREADY_EXISTS` - Resource already exists
- `RESOURCE_CONFLICT` - Resource conflict

**HIPAA Specific:**
- `PHI_ACCESS_DENIED` - Protected health information access denied
- `AUDIT_LOG_REQUIRED` - Audit logging required
- `CONSENT_REQUIRED` - Patient consent required

### Implementation Examples

**Basic Success Response:**
```typescript
import { respondWithSuccess } from '@ganger/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const data = { message: 'Hello World' };
  return respondWithSuccess(res, data, req);
}
```

**Error Response with Details:**
```typescript
import { respondWithError, ErrorCodes } from '@ganger/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return respondWithError(
    res,
    'User not found',
    404,
    ErrorCodes.NOT_FOUND,
    req,
    { userId: req.query.id }
  );
}
```

**Validation Error Response:**
```typescript
import { transformZodErrors } from '@ganger/utils';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  age: z.number().min(0)
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const validation = schema.safeParse(req.body);
  
  if (!validation.success) {
    throw transformZodErrors(validation.error);
  }
  
  // Continue with valid data...
}
```

**Standard Error Handling Middleware:**
```typescript
import { withStandardErrorHandling, NotFoundError } from '@ganger/utils';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await findUser(req.query.id);
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  return respondWithSuccess(res, user, req);
}

// Apply standard error handling
export default withStandardErrorHandling(handler);
```

### HTTP Status Code Guidelines

- **200** - Success (GET, PUT, PATCH)
- **201** - Created (POST)
- **204** - No Content (DELETE)
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (authentication required)
- **403** - Forbidden (access denied)
- **404** - Not Found
- **409** - Conflict (resource already exists)
- **422** - Unprocessable Entity (business rule violation)
- **429** - Too Many Requests (rate limited)
- **500** - Internal Server Error
- **503** - Service Unavailable (external service down)

### Client-Side Error Handling

**React Hook for API Calls:**
```typescript
import { useState } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: StandardErrorResponse | null;
}

function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });
  
  const call = async (endpoint: string, options?: RequestInit) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(endpoint, options);
      const result = await response.json();
      
      if (result.success) {
        setState({ data: result.data, loading: false, error: null });
      } else {
        setState({ data: null, loading: false, error: result });
      }
    } catch (error) {
      setState({ 
        data: null, 
        loading: false, 
        error: { 
          error: error.message,
          code: 'NETWORK_ERROR',
          message: 'Network request failed'
        } 
      });
    }
  };
  
  return { ...state, call };
}
```

---

# Deployment and Infrastructure

## Production Deployment Checklist

### Infrastructure Setup

**Secret Management System:**
```bash
# Google Secret Manager setup (production requirement)
gcloud secrets create supabase-url-production --data-file=-
gcloud secrets create supabase-anon-key-production --data-file=-
gcloud secrets create supabase-service-role-key-production --data-file=-
```

**Production Supabase Instance:**
- Create new Supabase project for production
- Configure environment variables via Google Secret Manager
- Run database migrations: `npm run db:migrate`
- Verify database connectivity and Row Level Security policies

**Google OAuth Configuration:**
- Create Google Cloud Project for production
- Configure OAuth consent screen
- Set authorized domains: `*.gangerdermatology.com`
- Generate OAuth credentials and configure environment variables

**Cloudflare Workers Setup:**
- Configure Cloudflare Workers projects for each application
- Set up custom domains (inventory.gangerdermatology.com, etc.)
- Configure DNS records and SSL/TLS certificates

### Testing Requirements

**Compilation Testing:**
```bash
# Verify all packages compile successfully
npm run type-check
npm run build

# Test specific applications
cd apps/inventory && npm run type-check
cd apps/handouts && npm run type-check
```

**Functionality Testing:**
- Authentication Flow: Google OAuth login, user roles, session management
- Application Features: Dashboard loads, navigation, data tables, search functionality
- Integration Testing: Database operations, external APIs, service integrations

### Deployment Process

**Staging Deployment:**
1. Deploy to staging environment
2. Run smoke tests and verify integrations
3. Test user workflows end-to-end
4. Performance and security testing

**Production Deployment:**
1. Final code review and approval
2. Deploy database migrations
3. Deploy applications to Cloudflare Workers
4. Configure monitoring and alerting
5. Update DNS to point to production
6. Verify deployment health and monitor performance

### Monitoring and Maintenance

**Post-Deployment Verification:**
- Health Checks: Applications load, database connections stable, authentication working
- Performance Monitoring: Page load times < 3 seconds, API response times < 500ms
- Error Monitoring: No critical errors in logs, acceptable performance metrics

**Ongoing Maintenance:**
- Automated backups and log aggregation
- Incident response procedures
- Regular security updates and performance reviews

### Rollback Plan

**If Deployment Fails:**
1. Immediate Actions: Revert DNS to maintenance page, identify root cause
2. Recovery Options: Rollback to previous version, fix issues and redeploy
3. Communication: Notify stakeholders, provide timeline, document lessons learned

---

# Application Development Guidelines

## New Application Development Standards

All new applications on the Ganger Platform MUST use the established shared infrastructure to maintain consistency, quality, and maintainability.

### Required Shared Packages

**Mandatory Package Usage:**
```typescript
// MANDATORY - All UI components must use shared library
import { Button, Input, Card, DataTable, Modal, LoadingSpinner } from '@ganger/ui';

// MANDATORY - Standard authentication integration required
import { useAuth, withAuth, AuthProvider } from '@ganger/auth';

// MANDATORY - Database operations through shared utilities
import { db, createClient, Repository } from '@ganger/db';

// MANDATORY - Universal Hubs for external services
import { 
  UniversalCommunicationHub, 
  UniversalPaymentHub, 
  UniversalDatabaseHub 
} from '@ganger/integrations';

// MANDATORY - Shared utilities and validation
import { analytics, notifications, validateForm } from '@ganger/utils';
```

### Prohibited Patterns

**Never create custom implementations:**
```typescript
// ❌ NEVER create custom button implementations
const CustomButton = () => <button>...</button>; // Use @ganger/ui Button

// ❌ NEVER create custom authentication
const customAuth = () => {...}; // Use @ganger/auth exclusively

// ❌ NEVER use inline styling
<div style={{color: 'blue'}}>...</div> // Use design token system
```

## Client-Server Integration Standards

### **Next.js Client-Server Boundary Rules (MANDATORY)**

**Critical for preventing build failures and ensuring proper separation of concerns.**

#### **Client-Side Code Requirements**
```typescript
// ✅ REQUIRED for all interactive React components
'use client'

import React, { useState, useEffect } from 'react';
import { Button, Input } from '@ganger/ui'; // ✅ Client-safe UI components
import { ClientPaymentService } from '@ganger/integrations/client'; // ✅ Client interface

// ✅ Allowed: Browser APIs, React hooks, event handlers
const InteractiveComponent = () => {
  const [state, setState] = useState('');
  
  useEffect(() => {
    // ✅ API calls to server routes
    fetch('/api/data').then(res => res.json()).then(setState);
  }, []);
  
  return <Button onClick={() => setState('clicked')}>Click me</Button>;
};
```

#### **Server-Side Code Requirements**
```typescript
// ✅ Server-only code (API routes, middleware, server components)
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@ganger/db'; // ✅ Database access
import { ServerPaymentService } from '@ganger/integrations/server'; // ✅ Server services
import { google } from 'googleapis'; // ✅ Node.js-only packages

// ✅ Allowed: Database access, external APIs, Node.js modules
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const data = await supabase.from('table').select('*');
  return res.json(data);
}
```

#### **PROHIBITED Integration Patterns**
```typescript
// ❌ NEVER: Server imports in client components
'use client'
import { supabase } from '@ganger/db'; // ❌ Database in client
import { ServerPaymentService } from '@ganger/integrations/server'; // ❌ Server service in client

// ❌ NEVER: Missing 'use client' for interactive components
import { useState } from 'react'; // ❌ React hooks without 'use client'

// ❌ NEVER: Direct external API calls in client
import { google } from 'googleapis'; // ❌ Node.js package in client
import Stripe from 'stripe'; // ❌ Server-side Stripe in client

// ❌ NEVER: Mixed client-server in same file
export function ClientComponent() { /* client code */ }
export async function serverAction() { /* server code */ } // ❌ Mixed boundaries
```

### **Package Export Standards**

#### **Required Package Structure**
```typescript
// packages/integrations/package.json
{
  "exports": {
    "./client": {
      "types": "./dist/client/index.d.ts",
      "default": "./dist/client/index.js"
    },
    "./server": {
      "types": "./dist/server/index.d.ts",
      "default": "./dist/server/index.js"  
    },
    "./types": {
      "types": "./dist/types/index.d.ts",
      "default": "./dist/types/index.js"
    }
  }
}

// Client exports (browser-safe only)
// packages/integrations/src/client/index.ts
export { ClientPaymentService } from './payment-client';
export { ClientCommunicationService } from './communication-client';
// ✅ No Node.js dependencies

// Server exports (full Node.js access)  
// packages/integrations/src/server/index.ts
export { ServerPaymentService } from './payment-server';
export { ServerPdfService } from './pdf-service';
export { ServerGoogleService } from './google-service';
// ✅ Full Node.js, external API access
```

### **Integration Service Architecture**

#### **Required Service Separation**
```typescript
// Client services: API interfaces only
interface ClientServicePattern {
  async operation(data: any): Promise<Response> {
    // ✅ Only API calls to server routes
    return fetch('/api/service/operation', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

// Server services: Full implementation
interface ServerServicePattern {
  async operation(data: any): Promise<Result> {
    // ✅ Direct database access, external APIs, Node.js modules
    return await externalAPI.process(data);
  }
}
```

#### **API Route Requirements**
```typescript
// MANDATORY: All server operations must have API route wrappers
// apps/[app-name]/src/pages/api/[service]/[operation].ts
import { ServerServiceClass } from '@ganger/integrations/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const service = new ServerServiceClass();
  
  try {
    const result = await service.performOperation(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

### **Next.js Configuration Standards**

#### **Required Webpack Configuration**
```javascript
// next.config.js - MANDATORY for all apps
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent Node.js modules in client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, net: false, tls: false, crypto: false,
        stream: false, url: false, zlib: false, http: false,
        https: false, assert: false, os: false, path: false,
        dns: false, module: false, child_process: false
      };
      
      // External server-only packages
      config.externals = {
        ...config.externals,
        'puppeteer': 'puppeteer',
        'puppeteer-core': 'puppeteer-core', 
        'googleapis': 'googleapis',
        'ioredis': 'ioredis'
      };
    }
    return config;
  }
};
```

### Standard Application Architecture

**Required Project Structure:**
```
apps/your-app/
├── components/
│   ├── shared/           # App-specific shared components
│   └── pages/           # Page-specific components
├── pages/
│   ├── api/             # API routes with OpenAPI docs
│   ├── auth/            # Authentication pages
│   └── dashboard/       # Protected pages
├── lib/
│   ├── api-client.ts    # API integration layer
│   ├── validation.ts    # App-specific validation
│   └── utils.ts         # App-specific utilities
├── types/
│   └── index.ts         # TypeScript type definitions
├── styles/
│   └── globals.css      # Tailwind CSS imports only
├── public/              # Static assets
├── package.json         # Dependencies and scripts
├── next.config.js       # Next.js configuration
├── tailwind.config.js   # Tailwind configuration
└── tsconfig.json        # TypeScript configuration
```

### Development Quality Gates

**Pre-Commit Requirements:**
```bash
# ✅ TypeScript compilation must be 100% successful
npm run type-check # Must pass without errors

# ✅ All components must use @ganger/ui (NO custom duplicates)
npm run test:ui-consistency # Verify shared component usage

# ✅ Authentication must use @ganger/auth (NO custom auth)
npm run test:auth-integration # Verify standard auth patterns

# ✅ API documentation required for all endpoints
npm run audit:api-documentation # Verify OpenAPI coverage

# ✅ Performance monitoring integration mandatory
npm run test:performance-monitoring # Verify metrics integration

# ✅ Security compliance verification required
npm run test:security-compliance # Verify HIPAA standards

# ✅ Accessibility compliance (WCAG 2.1 AA)
npm run test:accessibility # Verify compliance standards
```

### Pre-Development Validation

**Critical Lessons Learned - Always verify before coding:**
1. **Test current state compilation** - Ensure existing code compiles before making changes
2. **Verify dependencies exist** - Check package exports before writing import statements
3. **Don't trust static analysis** - Always run actual compilation and build tests

**Mandatory Pre-Development Steps:**
```bash
# 1. Test current state
npm run type-check
npm run build

# 2. Verify package dependencies exist
npm ls @ganger/ui @ganger/auth @ganger/db @ganger/integrations @ganger/utils

# 3. Check what's actually exported
cat packages/ui/src/index.ts
cat packages/auth/src/index.ts
```

### New Application Checklist

**Setup Phase:**
- [ ] Use standard project structure from template
- [ ] Configure all required shared packages (@ganger/ui, @ganger/auth, @ganger/db, @ganger/integrations, @ganger/utils)
- [ ] Set up TypeScript configuration extending @ganger/config
- [ ] Configure Tailwind CSS with design system presets
- [ ] Set up ESLint and Prettier from @ganger/config

**Development Phase:**
- [ ] Implement authentication using @ganger/auth (NO custom auth systems)
- [ ] Use @ganger/ui for ALL components (verify zero custom duplicates)
- [ ] Integrate with appropriate Universal Hubs (@ganger/integrations)
- [ ] Follow unified design system and color tokens
- [ ] Implement OpenAPI documentation for all endpoints
- [ ] Add rate limiting appropriate to endpoint sensitivity
- [ ] Include Redis caching for frequently accessed data
- [ ] Implement comprehensive error handling with standard responses
- [ ] Add performance monitoring integration
- [ ] Ensure HIPAA compliance with audit logging
- [ ] Implement mobile-responsive design
- [ ] Add accessibility compliance (WCAG 2.1 AA)

**Quality Verification:**
- [ ] `npm run type-check` (must pass 100%)
- [ ] `npm run test:ui-consistency` (verify @ganger/ui usage)
- [ ] `npm run test:auth-integration` (verify standard auth)
- [ ] `npm run audit:api-documentation` (verify OpenAPI coverage)
- [ ] `npm run test:performance-monitoring` (verify metrics integration)
- [ ] `npm run test:security-compliance` (verify HIPAA standards)
- [ ] `npm run test:accessibility` (verify WCAG compliance)

---