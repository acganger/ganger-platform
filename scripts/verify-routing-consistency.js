#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the staff portal's vercel.json to get all routes
const staffVercelPath = path.join(__dirname, '..', 'apps', 'ganger-staff', 'vercel.json');
const staffConfig = JSON.parse(fs.readFileSync(staffVercelPath, 'utf8'));

// Extract all unique app names from rewrites
const appRoutes = new Map();

staffConfig.rewrites.forEach(rewrite => {
  // Extract app name from destination URL
  const match = rewrite.destination.match(/https:\/\/ganger-([^.]+)\.vercel\.app\/(.+?)(\/:\path\*)?$/);
  if (match) {
    let appName = match[1];
    // Handle special case where URL has different name than directory
    if (appName === 'actions') {
      appName = 'ganger-actions';
    }
    const basePath = '/' + match[2].replace('/:path*', '');
    
    if (!appRoutes.has(appName)) {
      appRoutes.set(appName, {
        routes: [],
        expectedBasePath: basePath
      });
    }
    
    appRoutes.get(appName).routes.push({
      source: rewrite.source.replace('/:path*', ''),
      destination: rewrite.destination
    });
  }
});

console.log('🔍 Checking routing consistency across all apps...\n');

// Check each app's configuration
let issuesFound = false;

appRoutes.forEach((config, appName) => {
  const appDir = path.join(__dirname, '..', 'apps', appName);
  const nextConfigPath = path.join(appDir, 'next.config.js');
  
  if (!fs.existsSync(nextConfigPath)) {
    console.log(`❌ App directory not found: ${appName}`);
    issuesFound = true;
    return;
  }
  
  // Read the app's next.config.js
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  const basePathMatch = nextConfigContent.match(/basePath:\s*['"]([^'"]+)['"]/);
  
  if (!basePathMatch) {
    console.log(`❌ ${appName}: Missing basePath in next.config.js`);
    console.log(`   Expected: basePath: '${config.expectedBasePath}'`);
    console.log(`   Routes: ${config.routes.map(r => r.source).join(', ')}`);
    issuesFound = true;
  } else {
    const actualBasePath = basePathMatch[1];
    
    // Check if all routes point to the correct basePath
    let hasInconsistentRoute = false;
    config.routes.forEach(route => {
      const routeBasePath = route.destination.match(/\.app\/([^/]+)/)?.[1];
      if (routeBasePath && '/' + routeBasePath !== actualBasePath) {
        if (!hasInconsistentRoute) {
          console.log(`⚠️  ${appName}: Inconsistent routing detected`);
          console.log(`   App basePath: '${actualBasePath}'`);
          hasInconsistentRoute = true;
        }
        console.log(`   Route ${route.source} points to '/${routeBasePath}' instead of '${actualBasePath}'`);
        issuesFound = true;
      }
    });
    
    if (!hasInconsistentRoute) {
      console.log(`✅ ${appName}: Routing is consistent (basePath: '${actualBasePath}')`);
    }
  }
});

// Check for apps that have basePath but aren't in the router
const appsDir = path.join(__dirname, '..', 'apps');
fs.readdirSync(appsDir).forEach(appDir => {
  if (appDir === 'ganger-staff') return; // Skip the router itself
  
  const nextConfigPath = path.join(appsDir, appDir, 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
    const basePathMatch = nextConfigContent.match(/basePath:\s*['"]([^'"]+)['"]/);
    
    if (basePathMatch && !appRoutes.has(appDir)) {
      console.log(`⚠️  ${appDir}: Has basePath '${basePathMatch[1]}' but not routed through staff portal`);
    }
  }
});

console.log('\n' + (issuesFound ? '❌ Issues found that need fixing!' : '✨ All routing configurations are consistent!'));