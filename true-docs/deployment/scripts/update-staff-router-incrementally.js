#!/usr/bin/env node

/**
 * Update Staff Router Incrementally
 * Updates vercel.json rewrites as new apps are deployed
 */

const fs = require('fs');
const path = require('path');

// Mapping of app names to their deployed URLs
const deployedApps = {
  // Currently deployed (Phase 1)
  'inventory': 'https://ganger-inventory-ganger.vercel.app',
  'handouts': 'https://ganger-handouts-ganger.vercel.app',
  'compliance-training': 'https://ganger-compliance-training-ganger.vercel.app',
  'clinical-staffing': 'https://ganger-clinical-staffing-ganger.vercel.app',
  'config-dashboard': 'https://ganger-config-dashboard-ganger.vercel.app',
  'checkin-kiosk': 'https://ganger-checkin-kiosk-ganger.vercel.app',
  'platform-dashboard': 'https://ganger-platform-dashboard-ganger.vercel.app',
  
  // To be deployed (will be updated as they come online)
  // Phase 2
  'eos-l10': null,
  'batch-closeout': null,
  
  // Phase 3
  'integration-status': null,
  'pharma-scheduling': null,
  
  // Phase 4
  'socials-reviews': null,
  'ai-receptionist': null,
  
  // Phase 5
  'call-center-ops': null,
  'medication-auth': null,
  
  // Phase 6
  'component-showcase': null,
};

// Route mappings
const routeMappings = {
  'inventory': '/inventory/:path*',
  'handouts': '/handouts/:path*',
  'compliance-training': '/compliance/:path*',
  'clinical-staffing': '/clinical-staffing/:path*',
  'config-dashboard': '/config/:path*',
  'checkin-kiosk': '/kiosk/:path*',
  'platform-dashboard': '/platform-dashboard/:path*',
  'eos-l10': '/l10/:path*',
  'batch-closeout': '/batch/:path*',
  'integration-status': '/status/:path*',
  'pharma-scheduling': ['/pharma/:path*', '/lunch/:path*'], // Multiple routes
  'socials-reviews': '/socials/:path*',
  'ai-receptionist': '/ai-receptionist/:path*',
  'call-center-ops': '/call-center/:path*',
  'medication-auth': '/medication-auth/:path*',
  'component-showcase': '/components/:path*',
};

// Update function
function updateStaffRouter(newlyDeployedApps) {
  console.log('🚀 Updating Staff Router Configuration...\n');
  
  // Update the deployed apps
  newlyDeployedApps.forEach(({ app, url }) => {
    deployedApps[app] = url;
    console.log(`✅ Added: ${app} -> ${url}`);
  });
  
  // Generate rewrites
  const rewrites = [];
  
  Object.entries(deployedApps).forEach(([app, url]) => {
    const routes = Array.isArray(routeMappings[app]) ? routeMappings[app] : [routeMappings[app]];
    
    routes.forEach(route => {
      if (url) {
        // App is deployed - route to it
        rewrites.push({
          source: route,
          destination: `${url}${route}`
        });
      } else {
        // App not deployed yet - show coming soon
        rewrites.push({
          source: route,
          destination: `/coming-soon?app=${app}`
        });
      }
    });
  });
  
  // Create vercel.json content
  const vercelConfig = {
    installCommand: "cd ../.. && npm install",
    buildCommand: "cd ../.. && npm run build:staff",
    outputDirectory: "apps/staff/.next",
    framework: null,
    rewrites: rewrites
  };
  
  // Write to file
  const vercelPath = path.join(__dirname, '../../../apps/staff/vercel.json');
  fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2));
  
  console.log('\n📝 Updated apps/staff/vercel.json');
  
  // Show deployment status
  console.log('\n📊 Deployment Status:');
  console.log('====================');
  
  const deployed = Object.values(deployedApps).filter(url => url !== null).length;
  const total = Object.keys(deployedApps).length;
  
  console.log(`✅ Deployed: ${deployed}/${total}`);
  console.log(`⏳ Coming Soon: ${total - deployed}/${total}`);
  console.log(`📈 Progress: ${Math.round((deployed/total) * 100)}%`);
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Commit the changes: git add apps/staff/vercel.json && git commit -m "feat: Update staff router with new deployments"');
  console.log('2. Push to deploy: git push origin main');
  console.log('3. Monitor deployment at: https://vercel.com/ganger/ganger-staff');
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node update-staff-router-incrementally.js <app-name> <deployment-url> [<app-name2> <deployment-url2>...]');
    console.log('\nExample:');
    console.log('  node update-staff-router-incrementally.js eos-l10 https://ganger-eos-l10-abc123.vercel.app batch-closeout https://ganger-batch-closeout-xyz789.vercel.app');
    console.log('\nCurrent deployment status:');
    
    Object.entries(deployedApps).forEach(([app, url]) => {
      console.log(`  ${app}: ${url || 'NOT DEPLOYED'}`);
    });
    
    process.exit(0);
  }
  
  // Parse arguments
  const updates = [];
  for (let i = 0; i < args.length; i += 2) {
    if (i + 1 < args.length) {
      updates.push({
        app: args[i],
        url: args[i + 1]
      });
    }
  }
  
  updateStaffRouter(updates);
}

module.exports = { updateStaffRouter };