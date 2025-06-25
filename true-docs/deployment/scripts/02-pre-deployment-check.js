#!/usr/bin/env node

/**
 * ============================================================================
 * 02-pre-deployment-check.js - Pre-deployment Validation
 * ============================================================================
 * Purpose: Validates each app against the deployment checklist
 * Dependencies: Node.js, filesystem access
 * Related Docs: ../03-deployment-checklist.md
 * Previous Script: Run before 01-deploy-all-apps.sh
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const APPS_DIR = path.join(__dirname, '..', '..', '..', 'apps');
const ISSUES = [];

// List of apps to check
const APPS = [
  'staff',
  'inventory',
  'handouts',
  'checkin-kiosk',
  'medication-auth',
  'eos-l10',
  'compliance-training',
  'clinical-staffing',
  'socials-reviews',
  'config-dashboard',
  'integration-status',
  'ai-receptionist',
  'call-center-ops',
  'pharma-scheduling',
  'component-showcase',
  'batch-closeout'
];

// Check functions
function checkApp(appName) {
  console.log(`\n🔍 Checking ${appName}...`);
  const appPath = path.join(APPS_DIR, appName);
  
  if (!fs.existsSync(appPath)) {
    ISSUES.push(`❌ ${appName}: App directory not found`);
    return;
  }

  // Check for demo files
  checkDemoFiles(appName, appPath);
  
  // Check package.json
  checkPackageJson(appName, appPath);
  
  // Check next.config.js
  checkNextConfig(appName, appPath);
  
  // Check for localhost references
  checkForLocalhost(appName, appPath);
  
  // Check for console.log statements
  checkForConsoleLogs(appName, appPath);
  
  // Check environment files
  checkEnvFiles(appName, appPath);
  
  // Check TypeScript build
  checkTypeScriptBuild(appName, appPath);
}

function checkDemoFiles(appName, appPath) {
  const demoPatterns = ['demo.tsx', 'demo.ts', 'example.tsx', 'example.ts', 'test.tsx'];
  const pagesDir = path.join(appPath, 'src', 'pages');
  const appDir = path.join(appPath, 'src', 'app');
  
  [pagesDir, appDir].forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = execSync(`find ${dir} -name "*.tsx" -o -name "*.ts"`, { encoding: 'utf8' })
        .split('\n')
        .filter(Boolean);
      
      files.forEach(file => {
        const basename = path.basename(file);
        if (demoPatterns.some(pattern => basename.includes(pattern))) {
          ISSUES.push(`⚠️  ${appName}: Demo file found: ${file}`);
        }
      });
    }
  });
}

function checkPackageJson(appName, appPath) {
  const pkgPath = path.join(appPath, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    ISSUES.push(`❌ ${appName}: package.json not found`);
    return;
  }
  
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  // Check name
  if (!pkg.name || !pkg.name.startsWith('@ganger/')) {
    ISSUES.push(`⚠️  ${appName}: package.json name should be @ganger/${appName}`);
  }
  
  // Check for Next.js
  if (!pkg.dependencies?.next && !pkg.devDependencies?.next) {
    ISSUES.push(`❌ ${appName}: Next.js not found in dependencies`);
  }
  
  // Check build script
  if (pkg.scripts?.build !== 'next build') {
    ISSUES.push(`⚠️  ${appName}: Non-standard build script: ${pkg.scripts?.build}`);
  }
}

function checkNextConfig(appName, appPath) {
  const configPath = path.join(appPath, 'next.config.js');
  if (!fs.existsSync(configPath)) {
    ISSUES.push(`⚠️  ${appName}: next.config.js not found`);
    return;
  }
  
  const config = fs.readFileSync(configPath, 'utf8');
  
  // Check for basePath configuration
  if (config.includes('basePath:')) {
    // Check if the app uses relative or absolute links
    const srcPath = path.join(appPath, 'src');
    try {
      const linkUsage = execSync(
        `grep -r "href=[\\"']/[^\\"']*[\\"']" ${srcPath} --include="*.tsx" --include="*.jsx" 2>/dev/null || true`,
        { encoding: 'utf8' }
      );
      
      if (linkUsage.includes('href="/"') || linkUsage.includes("href='/'")) {
        ISSUES.push(`💡 ${appName}: Has basePath but uses relative links - this is correct`);
      } else if (linkUsage.includes(`href="/${appName}/`)) {
        ISSUES.push(`⚠️  ${appName}: Has basePath but uses absolute links - consider removing basePath`);
      }
    } catch (e) {
      // Ignore errors
    }
  }
  
  // Check for ignoreBuildErrors
  if (config.includes('ignoreBuildErrors: true')) {
    ISSUES.push(`⚠️  ${appName}: TypeScript errors are being ignored`);
  }
}

function checkForLocalhost(appName, appPath) {
  try {
    const result = execSync(
      `grep -r "localhost" ${appPath}/src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true`,
      { encoding: 'utf8' }
    );
    
    if (result.trim()) {
      const lines = result.trim().split('\n').length;
      ISSUES.push(`⚠️  ${appName}: Found ${lines} localhost references`);
    }
  } catch (e) {
    // Grep returns non-zero if no matches, which is fine
  }
}

function checkForConsoleLogs(appName, appPath) {
  try {
    const result = execSync(
      `grep -r "console\\.log" ${appPath}/src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true`,
      { encoding: 'utf8' }
    );
    
    if (result.trim()) {
      const lines = result.trim().split('\n').length;
      ISSUES.push(`⚠️  ${appName}: Found ${lines} console.log statements`);
    }
  } catch (e) {
    // Grep returns non-zero if no matches, which is fine
  }
}

function checkEnvFiles(appName, appPath) {
  const envFiles = ['.env', '.env.local', '.env.development', '.env.test'];
  
  envFiles.forEach(envFile => {
    const envPath = path.join(appPath, envFile);
    if (fs.existsSync(envPath)) {
      ISSUES.push(`⚠️  ${appName}: Found ${envFile} - should not be committed`);
    }
  });
  
  // Check for .env.example
  const examplePath = path.join(appPath, '.env.example');
  if (!fs.existsSync(examplePath) && appName !== 'staff') {
    ISSUES.push(`💡 ${appName}: Consider adding .env.example`);
  }
}

function checkTypeScriptBuild(appName, appPath) {
  console.log(`  Building ${appName} to check for errors...`);
  try {
    execSync(`cd ${appPath} && npx tsc --noEmit`, { stdio: 'ignore' });
    console.log(`  ✅ TypeScript check passed`);
  } catch (e) {
    ISSUES.push(`❌ ${appName}: TypeScript build failed`);
  }
}

// Main execution
console.log('🚀 Pre-Deployment Check Starting...\n');

APPS.forEach(app => {
  checkApp(app);
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Pre-Deployment Check Summary\n');

if (ISSUES.length === 0) {
  console.log('✅ All checks passed! Ready for deployment.');
} else {
  console.log(`Found ${ISSUES.length} issues:\n`);
  ISSUES.forEach(issue => console.log(issue));
  
  const criticalIssues = ISSUES.filter(i => i.startsWith('❌')).length;
  const warnings = ISSUES.filter(i => i.startsWith('⚠️')).length;
  const suggestions = ISSUES.filter(i => i.startsWith('💡')).length;
  
  console.log(`\n❌ Critical: ${criticalIssues}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`💡 Suggestions: ${suggestions}`);
  
  if (criticalIssues > 0) {
    console.log('\n🛑 Fix critical issues before deployment!');
    process.exit(1);
  }
}

console.log('\n✨ Pre-deployment check complete!');