#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Comprehensive Fix Verification Script');
console.log('=====================================\n');

let totalIssues = 0;
let criticalIssues = 0;

// Helper functions
function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}`);
    return true;
  } else {
    console.log(`❌ ${description} - File not found: ${filePath}`);
    totalIssues++;
    criticalIssues++;
    return false;
  }
}

function checkFileContent(filePath, pattern, description, critical = true) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${description} - File not found: ${filePath}`);
    totalIssues++;
    if (critical) criticalIssues++;
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  
  if (regex.test(content)) {
    console.log(`✅ ${description}`);
    return true;
  } else {
    console.log(`❌ ${description} - Pattern not found in ${filePath}`);
    totalIssues++;
    if (critical) criticalIssues++;
    return false;
  }
}

// Phase 1: Verify Routing Fixes
console.log('📋 Phase 1: Routing Configuration Verification\n');

// Check ganger-actions basePath
checkFileContent(
  'apps/ganger-actions/next.config.js',
  /basePath:\s*['"]\/actions['"]/,
  'ganger-actions has basePath: "/actions"'
);

// Check staff portal rewrites
const staffVercelPath = 'apps/ganger-staff/vercel.json';
if (fs.existsSync(staffVercelPath)) {
  const staffConfig = JSON.parse(fs.readFileSync(staffVercelPath, 'utf8'));
  const actionsRewrite = staffConfig.rewrites?.find(r => r.source === '/actions/:path*');
  
  if (actionsRewrite?.destination?.includes('/actions/:path*')) {
    console.log('✅ ganger-staff has correct /actions rewrite with basePath');
  } else {
    console.log('❌ ganger-staff /actions rewrite missing basePath in destination');
    totalIssues++;
    criticalIssues++;
  }
  
  // Check clinical-staffing fix
  const staffingRewrite = staffConfig.rewrites?.find(r => r.source === '/staffing/:path*');
  if (staffingRewrite?.destination?.includes('/clinical-staffing/:path*')) {
    console.log('✅ clinical-staffing /staffing route points to correct basePath');
  } else {
    console.log('❌ clinical-staffing /staffing route has incorrect destination');
    totalIssues++;
  }
}

// Phase 2: Verify Authentication Fixes
console.log('\n📋 Phase 2: Authentication Session Storage Verification\n');

// Check CookieStorage implementation
checkFile(
  'packages/auth/src/utils/CookieStorage.ts',
  'CookieStorage.ts exists'
);

checkFile(
  'packages/auth/src/utils/cookies.ts',
  'cookies.ts utilities exist'
);

// Check Supabase client configuration
checkFileContent(
  'packages/auth/src/supabase.ts',
  /import.*CookieStorage|gangerCookieStorage/,
  'Supabase client imports CookieStorage'
);

checkFileContent(
  'packages/auth/src/supabase.ts',
  /storage:\s*typeof\s+window.*gangerCookieStorage/,
  'Supabase client uses gangerCookieStorage'
);

// Check AuthProvider cookie session verification
checkFileContent(
  'packages/auth/src/context.tsx',
  /getCookie.*sb-pfqtzmxxxhhsxmlddrta-auth-token/,
  'AuthProvider checks for cookie session'
);

// Phase 3: Verify Deployment Configuration
console.log('\n📋 Phase 3: Deployment Configuration Verification\n');

// Check a sample of vercel.json files
const appsToCheck = ['ganger-actions', 'ganger-staff', 'inventory', 'clinical-staffing'];
let vercelConfigIssues = 0;

appsToCheck.forEach(app => {
  const vercelPath = `apps/${app}/vercel.json`;
  if (fs.existsSync(vercelPath)) {
    const config = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
    
    // Check NODE_ENV
    if (config.env?.NODE_ENV === 'production') {
      console.log(`✅ ${app}: NODE_ENV=production`);
    } else {
      console.log(`❌ ${app}: NODE_ENV not set to production`);
      vercelConfigIssues++;
    }
    
    // Check ENABLE_EXPERIMENTAL_COREPACK
    if (config.env?.ENABLE_EXPERIMENTAL_COREPACK === '1') {
      console.log(`✅ ${app}: ENABLE_EXPERIMENTAL_COREPACK=1`);
    } else {
      console.log(`❌ ${app}: Missing ENABLE_EXPERIMENTAL_COREPACK`);
      vercelConfigIssues++;
    }
    
    // Check for --no-frozen-lockfile
    if (config.installCommand?.includes('--no-frozen-lockfile')) {
      console.log(`❌ ${app}: Still has --no-frozen-lockfile`);
      vercelConfigIssues++;
    } else {
      console.log(`✅ ${app}: No --no-frozen-lockfile flag`);
    }
  }
});

totalIssues += vercelConfigIssues;
if (vercelConfigIssues > 0) criticalIssues += vercelConfigIssues;

// Phase 4: Build Tests
console.log('\n📋 Phase 4: Build Verification\n');

console.log('Testing critical package builds...');

try {
  console.log('Building @ganger/auth...');
  execSync('cd packages/auth && pnpm run build', { stdio: 'pipe' });
  console.log('✅ @ganger/auth builds successfully');
} catch (error) {
  console.log('❌ @ganger/auth build failed');
  totalIssues++;
  criticalIssues++;
}

// Phase 5: Routing Consistency Check
console.log('\n📋 Phase 5: Routing Consistency Verification\n');

try {
  const output = execSync('node scripts/verify-routing-consistency.js', { encoding: 'utf8' });
  if (output.includes('All routing configurations are consistent')) {
    console.log('✅ All routing configurations are consistent');
  } else {
    console.log('❌ Routing inconsistencies found');
    console.log(output);
    totalIssues++;
    criticalIssues++;
  }
} catch (error) {
  console.log('❌ Routing consistency check failed');
  totalIssues++;
}

// Summary
console.log('\n=====================================');
console.log('📊 Verification Summary');
console.log('=====================================\n');

if (totalIssues === 0) {
  console.log('✅ All fixes have been properly applied!');
  console.log('🚀 Ready for deployment');
} else {
  console.log(`❌ Found ${totalIssues} issue(s) (${criticalIssues} critical)`);
  console.log('\nPlease address these issues before deploying.');
}

// Exit with error code if critical issues found
process.exit(criticalIssues > 0 ? 1 : 0);