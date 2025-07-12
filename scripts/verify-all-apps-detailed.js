#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Detailed Verification of All Apps');
console.log('=====================================\n');

const appsDir = path.join(__dirname, '..', 'apps');
const allApps = fs.readdirSync(appsDir).filter(dir => 
  fs.statSync(path.join(appsDir, dir)).isDirectory()
);

// Read staff portal routes
const staffVercelPath = path.join(appsDir, 'ganger-staff', 'vercel.json');
const staffConfig = JSON.parse(fs.readFileSync(staffVercelPath, 'utf8'));
const routedApps = new Set();

// Extract apps that are routed through staff portal
staffConfig.rewrites.forEach(rewrite => {
  const match = rewrite.destination.match(/https:\/\/ganger-([^.]+)\.vercel\.app/);
  if (match) {
    let appName = match[1];
    if (appName === 'actions') appName = 'ganger-actions';
    routedApps.add(appName);
  }
});

console.log(`Found ${allApps.length} apps total`);
console.log(`${routedApps.size} apps are routed through staff portal\n`);

// Verification results
const results = {
  routing: { passed: 0, failed: 0, issues: [] },
  deployment: { passed: 0, failed: 0, issues: [] },
  tailwind: { passed: 0, failed: 0, issues: [] }
};

// Check each app
allApps.forEach(app => {
  const appPath = path.join(appsDir, app);
  const isRouted = routedApps.has(app);
  
  console.log(`\n📁 Checking ${app}...`);
  
  // 1. Check routing configuration
  const nextConfigPath = path.join(appPath, 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    const hasBasePath = /basePath:\s*['"]/.test(nextConfig);
    
    if (isRouted && app !== 'ganger-staff') {
      if (hasBasePath) {
        console.log('  ✅ Routing: Has basePath (routed app)');
        results.routing.passed++;
      } else {
        console.log('  ❌ Routing: Missing basePath (routed app)');
        results.routing.failed++;
        results.routing.issues.push(`${app}: Missing basePath`);
      }
    } else if (!isRouted || app === 'ganger-staff') {
      if (!hasBasePath) {
        console.log('  ✅ Routing: No basePath (not routed/router app)');
        results.routing.passed++;
      } else {
        console.log('  ⚠️  Routing: Has basePath but not routed');
        results.routing.failed++;
        results.routing.issues.push(`${app}: Has basePath but not routed`);
      }
    }
  }
  
  // 2. Check deployment configuration
  const vercelJsonPath = path.join(appPath, 'vercel.json');
  if (fs.existsSync(vercelJsonPath)) {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    
    // Check NODE_ENV
    if (vercelConfig.env?.NODE_ENV === 'production') {
      console.log('  ✅ Deployment: NODE_ENV=production');
      results.deployment.passed++;
    } else {
      console.log('  ❌ Deployment: NODE_ENV not production');
      results.deployment.failed++;
      results.deployment.issues.push(`${app}: NODE_ENV not production`);
    }
    
    // Check Corepack
    if (vercelConfig.env?.ENABLE_EXPERIMENTAL_COREPACK === '1') {
      console.log('  ✅ Deployment: ENABLE_EXPERIMENTAL_COREPACK=1');
      results.deployment.passed++;
    } else {
      console.log('  ❌ Deployment: Missing ENABLE_EXPERIMENTAL_COREPACK');
      results.deployment.failed++;
      results.deployment.issues.push(`${app}: Missing ENABLE_EXPERIMENTAL_COREPACK`);
    }
    
    // Check for --no-frozen-lockfile
    if (!vercelConfig.installCommand?.includes('--no-frozen-lockfile')) {
      console.log('  ✅ Deployment: No --no-frozen-lockfile');
      results.deployment.passed++;
    } else {
      console.log('  ❌ Deployment: Has --no-frozen-lockfile');
      results.deployment.failed++;
      results.deployment.issues.push(`${app}: Has --no-frozen-lockfile`);
    }
  }
  
  // 3. Check Tailwind configuration
  const packageJsonPath = path.join(appPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps.tailwindcss) {
      const hasTailwindV4 = deps.tailwindcss.includes('4.0.0') || deps.tailwindcss.includes('4.1');
      const hasPostcssV4 = deps['@tailwindcss/postcss']?.includes('4.0.0') || deps['@tailwindcss/postcss']?.includes('4.1');
      
      if (hasTailwindV4 && hasPostcssV4) {
        console.log('  ✅ Tailwind: Using v4 with postcss plugin');
        results.tailwind.passed++;
      } else {
        console.log('  ⚠️  Tailwind: Version mismatch or missing postcss');
        results.tailwind.failed++;
        results.tailwind.issues.push(`${app}: Tailwind version issues`);
      }
    }
  }
});

// Summary
console.log('\n\n=====================================');
console.log('📊 Detailed Summary');
console.log('=====================================\n');

console.log('Routing Configuration:');
console.log(`  ✅ Passed: ${results.routing.passed}`);
console.log(`  ❌ Failed: ${results.routing.failed}`);
if (results.routing.issues.length > 0) {
  console.log('  Issues:');
  results.routing.issues.forEach(issue => console.log(`    - ${issue}`));
}

console.log('\nDeployment Configuration:');
console.log(`  ✅ Passed: ${results.deployment.passed}`);
console.log(`  ❌ Failed: ${results.deployment.failed}`);
if (results.deployment.issues.length > 0) {
  console.log('  Issues:');
  results.deployment.issues.forEach(issue => console.log(`    - ${issue}`));
}

console.log('\nTailwind Configuration:');
console.log(`  ✅ Passed: ${results.tailwind.passed}`);
console.log(`  ❌ Failed: ${results.tailwind.failed}`);
if (results.tailwind.issues.length > 0) {
  console.log('  Issues:');
  results.tailwind.issues.forEach(issue => console.log(`    - ${issue}`));
}

const totalIssues = results.routing.failed + results.deployment.failed + results.tailwind.failed;
console.log(`\nTotal Issues: ${totalIssues}`);

if (totalIssues === 0) {
  console.log('\n✅ All apps are properly configured!');
} else {
  console.log('\n❌ Some apps need attention before deployment.');
}