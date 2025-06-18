#!/usr/bin/env node

/**
 * Add Edge Runtime to all API routes across all apps
 * Resolves: "routes were not configured to run with the Edge Runtime" errors
 */

const fs = require('fs');
const path = require('path');

const APPS_DIR = path.join(__dirname, 'apps');

// All apps that need Edge Runtime configuration  
const APPS = [
  'handouts', 'inventory', 'medication-auth', 'socials-reviews', 
  'platform-dashboard', 'eos-l10', 'pharma-scheduling', 'call-center-ops',
  'batch-closeout', 'clinical-staffing', 'compliance-training', 
  'config-dashboard', 'component-showcase', 'integration-status', 
  'ai-receptionist', 'checkin-kiosk'
];

function findApiRoutes(appDir) {
  const routes = [];
  
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        scanDir(fullPath);
      } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.js'))) {
        // Check if it's an API route (in api/ directory or contains route handlers)
        if (fullPath.includes('/api/') || fullPath.includes('/route.')) {
          routes.push(fullPath);
        }
      }
    }
  }
  
  // Scan both src/pages/api and src/app directories for API routes
  scanDir(path.join(appDir, 'src', 'pages', 'api'));
  scanDir(path.join(appDir, 'src', 'app'));
  
  // Also scan app/ directory directly (App Router)
  scanDir(path.join(appDir, 'app'));
  
  return routes;
}

function addEdgeRuntime(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`  ❌ File not found: ${filePath}`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if Edge Runtime is already configured
  if (content.includes("runtime = 'edge'") || content.includes('runtime: "edge"')) {
    console.log(`  ✅ Already has Edge Runtime: ${path.basename(filePath)}`);
    return false;
  }
  
  // Add Edge Runtime export at the end of the file
  const edgeRuntimeExport = '\n// Cloudflare Workers Edge Runtime\nexport const runtime = \'edge\';\n';
  const updatedContent = content + edgeRuntimeExport;
  
  fs.writeFileSync(filePath, updatedContent);
  console.log(`  ✅ Added Edge Runtime: ${path.basename(filePath)}`);
  return true;
}

function processApp(appName) {
  const appDir = path.join(APPS_DIR, appName);
  
  if (!fs.existsSync(appDir)) {
    console.log(`❌ App directory not found: ${appName}`);
    return { processed: 0, added: 0 };
  }
  
  console.log(`\n🔧 Processing ${appName}...`);
  
  const apiRoutes = findApiRoutes(appDir);
  let added = 0;
  
  if (apiRoutes.length === 0) {
    console.log(`  ℹ️  No API routes found in ${appName}`);
    return { processed: 0, added: 0 };
  }
  
  console.log(`  📋 Found ${apiRoutes.length} API route(s)`);
  
  apiRoutes.forEach(route => {
    if (addEdgeRuntime(route)) {
      added++;
    }
  });
  
  return { processed: apiRoutes.length, added };
}

function main() {
  console.log('🚀 Adding Edge Runtime to all API routes...\n');
  console.log('This fixes: "routes were not configured to run with the Edge Runtime" errors');
  
  let totalProcessed = 0;
  let totalAdded = 0;
  
  APPS.forEach(appName => {
    const result = processApp(appName);
    totalProcessed += result.processed;
    totalAdded += result.added;
  });
  
  console.log('\n📊 Summary:');
  console.log(`   📝 Total API routes processed: ${totalProcessed}`);
  console.log(`   ✅ Edge Runtime configurations added: ${totalAdded}`);
  console.log(`   ⚡ Apps ready for Cloudflare Workers deployment`);
  
  if (totalAdded > 0) {
    console.log('\n🎉 Success! All API routes now configured for Edge Runtime');
    console.log('\nNext steps:');
    console.log('1. Commit changes: git add . && git commit -m "Add Edge Runtime to API routes"');
    console.log('2. Test deployment: gh workflow run deploy-platform-dashboard-clean.yml');
    console.log('3. Verify with Puppeteer once deployed');
  } else {
    console.log('\nℹ️  No changes needed - all routes already configured');
  }
}

if (require.main === module) {
  main();
}

module.exports = { processApp, addEdgeRuntime, findApiRoutes };