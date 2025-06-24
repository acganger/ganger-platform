#!/usr/bin/env node

/**
 * Fix Worker Configuration Issues
 * Corrects wrangler.jsonc files and deployment workflows to properly deploy Next.js as Workers
 */

const fs = require('fs');
const path = require('path');

const APPS_DIR = path.join(__dirname, 'apps');

// All apps that need Worker configuration fixes
const APPS = [
  'handouts', 'inventory', 'medication-auth', 'socials-reviews', 
  'platform-dashboard', 'eos-l10', 'pharma-scheduling', 'call-center-ops',
  'batch-closeout', 'clinical-staffing', 'compliance-training', 
  'config-dashboard', 'component-showcase', 'integration-status', 
  'ai-receptionist', 'checkin-kiosk'
];

function fixWranglerConfig(appDir, appName) {
  const wranglerPath = path.join(appDir, 'wrangler.jsonc');
  
  if (!fs.existsSync(wranglerPath)) {
    console.log(`  ℹ️  No wrangler.jsonc found in ${appName}`);
    return false;
  }
  
  const content = fs.readFileSync(wranglerPath, 'utf8');
  
  try {
    // Parse JSON with comments
    const config = JSON.parse(content.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''));
    
    let updated = false;
    
    // Fix main path if it points to wrong location
    if (config.main && config.main.includes('/index.js')) {
      config.main = '.vercel/output/static/_worker.js';
      updated = true;
      console.log(`  ✅ Fixed main path for ${appName}`);
    }
    
    // Fix build command to use proper script
    if (config.build && config.build.command) {
      if (!config.build.command.includes('build:cloudflare')) {
        config.build.command = 'pnpm run build:cloudflare';
        updated = true;
        console.log(`  ✅ Fixed build command for ${appName}`);
      }
    }
    
    if (updated) {
      fs.writeFileSync(wranglerPath, JSON.stringify(config, null, 2));
      return true;
    }
    
  } catch (error) {
    console.log(`  ❌ Error parsing wrangler.jsonc for ${appName}: ${error.message}`);
    return false;
  }
  
  return false;
}

function ensureBuildScript(appDir, appName) {
  const packagePath = path.join(appDir, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log(`  ❌ No package.json found in ${appName}`);
    return false;
  }
  
  const content = fs.readFileSync(packagePath, 'utf8');
  const packageJson = JSON.parse(content);
  
  let updated = false;
  
  // Ensure build:cloudflare script exists
  if (!packageJson.scripts['build:cloudflare']) {
    packageJson.scripts['build:cloudflare'] = 'next build && npx @cloudflare/next-on-pages';
    updated = true;
    console.log(`  ✅ Added build:cloudflare script to ${appName}`);
  }
  
  // Ensure @cloudflare/next-on-pages dependency exists
  if (!packageJson.dependencies['@cloudflare/next-on-pages'] && !packageJson.devDependencies['@cloudflare/next-on-pages']) {
    packageJson.devDependencies = packageJson.devDependencies || {};
    packageJson.devDependencies['@cloudflare/next-on-pages'] = '^1.13.12';
    updated = true;
    console.log(`  ✅ Added @cloudflare/next-on-pages dependency to ${appName}`);
  }
  
  if (updated) {
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    return true;
  }
  
  return false;
}

function processApp(appName) {
  const appDir = path.join(APPS_DIR, appName);
  
  if (!fs.existsSync(appDir)) {
    console.log(`❌ App directory not found: ${appName}`);
    return { processed: false, updated: false };
  }
  
  console.log(`\\n🔧 Processing ${appName}...`);
  
  let updated = false;
  
  // Fix wrangler configuration
  if (fixWranglerConfig(appDir, appName)) {
    updated = true;
  }
  
  // Ensure build scripts
  if (ensureBuildScript(appDir, appName)) {
    updated = true;
  }
  
  if (!updated) {
    console.log(`  ✅ ${appName} already properly configured`);
  }
  
  return { processed: true, updated };
}

function main() {
  console.log('🚀 Fixing Worker Configuration Issues...\\n');
  console.log('This fixes: Apps serving static HTML instead of running as Workers');
  console.log('Root cause: Incorrect wrangler.jsonc main paths and build commands\\n');
  
  let totalProcessed = 0;
  let totalUpdated = 0;
  
  APPS.forEach(appName => {
    const result = processApp(appName);
    if (result.processed) {
      totalProcessed++;
      if (result.updated) {
        totalUpdated++;
      }
    }
  });
  
  console.log('\\n📊 Summary:');
  console.log(`   📝 Total apps processed: ${totalProcessed}`);
  console.log(`   ✅ Apps updated: ${totalUpdated}`);
  console.log(`   ⚡ Worker configurations fixed`);
  
  if (totalUpdated > 0) {
    console.log('\\n🎉 Success! Worker configurations updated');
    console.log('\\nThis should fix the static page issue by ensuring proper Worker deployment');
    console.log('\\nNext steps:');
    console.log('1. Commit changes: git add . && git commit -m "Fix Worker configurations - proper _worker.js paths"');
    console.log('2. Deploy: gh workflow run "🚀 Deploy Platform Dashboard"');
    console.log('3. Verify apps now serve dynamic content instead of static HTML');
  } else {
    console.log('\\nℹ️  No changes needed - all configurations already correct');
  }
}

if (require.main === module) {
  main();
}

module.exports = { processApp, fixWranglerConfig, ensureBuildScript };