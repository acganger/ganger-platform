#!/usr/bin/env node

/**
 * Fix Static Prerendering Issue
 * Adds Edge Runtime configuration to main page files to prevent static prerendering
 * Ensures apps run as interactive Workers instead of static HTML
 */

const fs = require('fs');
const path = require('path');

const APPS_DIR = path.join(__dirname, 'apps');

// All apps that need fixing
const APPS = [
  'handouts', 'inventory', 'medication-auth', 'socials-reviews', 
  'platform-dashboard', 'eos-l10', 'pharma-scheduling', 'call-center-ops',
  'batch-closeout', 'clinical-staffing', 'compliance-training', 
  'config-dashboard', 'component-showcase', 'integration-status', 
  'ai-receptionist', 'checkin-kiosk'
];

function findMainPageFiles(appDir) {
  const pageFiles = [];
  
  // Check for App Router page files
  const appPageFile = path.join(appDir, 'app', 'page.tsx');
  if (fs.existsSync(appPageFile)) {
    pageFiles.push(appPageFile);
  }
  
  // Check for src/app page files
  const srcAppPageFile = path.join(appDir, 'src', 'app', 'page.tsx');
  if (fs.existsSync(srcAppPageFile)) {
    pageFiles.push(srcAppPageFile);
  }
  
  // Check for Pages Router index files
  const pagesIndexFile = path.join(appDir, 'src', 'pages', 'index.tsx');
  if (fs.existsSync(pagesIndexFile)) {
    pageFiles.push(pagesIndexFile);
  }
  
  return pageFiles;
}

function addEdgeRuntimeToPage(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`  ❌ File not found: ${filePath}`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if Edge Runtime is already configured
  if (content.includes("runtime = 'edge'") || content.includes('runtime: "edge"')) {
    // Check if force-dynamic is also present
    if (!content.includes("dynamic = 'force-dynamic'")) {
      // Add force-dynamic
      const updatedContent = content.replace(
        /export const runtime = 'edge';/,
        "export const runtime = 'edge';\nexport const dynamic = 'force-dynamic';"
      );
      fs.writeFileSync(filePath, updatedContent);
      console.log(`  ✅ Added force-dynamic: ${path.basename(filePath)}`);
      return true;
    }
    console.log(`  ✅ Already has Edge Runtime + force-dynamic: ${path.basename(filePath)}`);
    return false;
  }
  
  // Find the best place to add Edge Runtime export
  let updatedContent;
  
  if (content.includes("'use client'")) {
    // Add after 'use client' and imports
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find the last import or 'use client' line
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("'use client'") || 
          lines[i].includes('"use client"') ||
          lines[i].trim().startsWith('import ')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() === '') {
        // Skip empty lines after imports
        continue;
      } else {
        // Found first non-import, non-empty line
        break;
      }
    }
    
    // Insert Edge Runtime export with force-dynamic
    lines.splice(insertIndex, 0, '', '// Cloudflare Workers Edge Runtime', "export const runtime = 'edge';", "export const dynamic = 'force-dynamic';");
    updatedContent = lines.join('\n');
  } else {
    // Add at the beginning for non-client components
    updatedContent = `// Cloudflare Workers Edge Runtime\nexport const runtime = 'edge';\nexport const dynamic = 'force-dynamic';\n\n${content}`;
  }
  
  fs.writeFileSync(filePath, updatedContent);
  console.log(`  ✅ Added Edge Runtime: ${path.basename(filePath)}`);
  return true;
}

function fixLayoutFiles(appDir) {
  const layoutFiles = [
    path.join(appDir, 'app', 'layout.tsx'),
    path.join(appDir, 'src', 'app', 'layout.tsx')
  ];
  
  let fixed = 0;
  
  layoutFiles.forEach(layoutFile => {
    if (fs.existsSync(layoutFile)) {
      if (addEdgeRuntimeToPage(layoutFile)) {
        fixed++;
      }
    }
  });
  
  return fixed;
}

function processApp(appName) {
  const appDir = path.join(APPS_DIR, appName);
  
  if (!fs.existsSync(appDir)) {
    console.log(`❌ App directory not found: ${appName}`);
    return { processed: 0, added: 0 };
  }
  
  console.log(`\n🔧 Processing ${appName}...`);
  
  const pageFiles = findMainPageFiles(appDir);
  let added = 0;
  
  if (pageFiles.length === 0) {
    console.log(`  ℹ️  No main page files found in ${appName}`);
    return { processed: 0, added: 0 };
  }
  
  console.log(`  📋 Found ${pageFiles.length} main page file(s)`);
  
  pageFiles.forEach(pageFile => {
    if (addEdgeRuntimeToPage(pageFile)) {
      added++;
    }
  });
  
  // Also fix layout files
  const layoutFixed = fixLayoutFiles(appDir);
  if (layoutFixed > 0) {
    console.log(`  🎨 Fixed ${layoutFixed} layout file(s)`);
    added += layoutFixed;
  }
  
  return { processed: pageFiles.length, added };
}

function main() {
  console.log('🚀 Fixing Static Prerendering Issues...\n');
  console.log('This fixes: Apps being served as static HTML instead of interactive Workers');
  console.log('Root cause: Main page files missing Edge Runtime configuration\n');
  
  let totalProcessed = 0;
  let totalAdded = 0;
  
  APPS.forEach(appName => {
    const result = processApp(appName);
    totalProcessed += result.processed;
    totalAdded += result.added;
  });
  
  console.log('\n📊 Summary:');
  console.log(`   📝 Total page files processed: ${totalProcessed}`);
  console.log(`   ✅ Edge Runtime configurations added: ${totalAdded}`);
  console.log(`   ⚡ Apps configured for Workers runtime`);
  
  if (totalAdded > 0) {
    console.log('\n🎉 Success! Main pages now configured for Edge Runtime');
    console.log('\nThis should prevent static prerendering and ensure apps run as interactive Workers');
    console.log('\nNext steps:');
    console.log('1. Commit changes: git add . && git commit -m "Fix static prerendering - add Edge Runtime to pages"');
    console.log('2. Deploy: gh workflow run deploy-platform-dashboard-clean.yml');
    console.log('3. Verify with curl that pages now serve dynamic content');
  } else {
    console.log('\nℹ️  No changes needed - all pages already configured');
  }
}

if (require.main === module) {
  main();
}

module.exports = { processApp, addEdgeRuntimeToPage, findMainPageFiles };