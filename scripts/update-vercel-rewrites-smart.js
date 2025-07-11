#!/usr/bin/env node

/**
 * Smart Update Vercel Rewrites for Staff Portal
 * 
 * This script intelligently updates the staff portal's vercel.json with
 * deployment URLs, only triggering a rebuild when necessary
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration for app routes and their aliases
const APP_CONFIG = {
  'inventory': {
    routes: ['/inventory'],
    description: 'Medical supply tracking'
  },
  'handouts': {
    routes: ['/handouts'],
    description: 'Patient education materials'
  },
  'eos-l10': {
    routes: ['/l10', '/eos-l10'],
    description: 'Team management meetings'
  },
  'batch-closeout': {
    routes: ['/batch', '/batch-closeout'],
    description: 'Financial batch processing'
  },
  'compliance-training': {
    routes: ['/compliance', '/compliance-training'],
    description: 'Staff training platform'
  },
  'clinical-staffing': {
    routes: ['/clinical-staffing', '/staffing'],
    description: 'Provider scheduling'
  },
  'config-dashboard': {
    routes: ['/config', '/config-dashboard'],
    description: 'Platform configuration'
  },
  'integration-status': {
    routes: ['/status', '/integration-status'],
    description: 'System monitoring'
  },
  'ai-receptionist': {
    routes: ['/ai-receptionist'],
    description: 'Automated phone agent'
  },
  'call-center-ops': {
    routes: ['/call-center', '/call-center-ops'],
    description: 'Call management dashboard'
  },
  'medication-auth': {
    routes: ['/medication-auth'],
    description: 'Prior authorization'
  },
  'pharma-scheduling': {
    routes: ['/pharma', '/lunch', '/pharma-scheduling'],
    description: 'Rep visit coordination'
  },
  'checkin-kiosk': {
    routes: ['/kiosk', '/checkin-kiosk'],
    description: 'Patient self-service'
  },
  'socials-reviews': {
    routes: ['/socials', '/socials-reviews'],
    description: 'Review management'
  },
  'component-showcase': {
    routes: ['/components', '/component-showcase'],
    description: 'UI components showcase'
  },
  'platform-dashboard': {
    routes: ['/platform', '/platform-dashboard'],
    description: 'System overview'
  },
  'ganger-actions': {
    routes: ['/actions'],
    description: 'Employee portal'
  }
};

// Paths
const deploymentUrlsFile = process.argv[2] || 'deployment-urls.txt';
const staffAppPath = path.join(__dirname, '..', 'apps', 'ganger-staff');
const vercelConfigPath = path.join(staffAppPath, 'vercel.json');
const appConfigPath = path.join(staffAppPath, 'config', 'app-urls.json');

// Helper function to calculate hash of an object
function calculateHash(obj) {
  return crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex');
}

// Parse deployment URLs from file
function parseDeploymentUrls() {
  const deploymentUrls = {};
  
  if (fs.existsSync(deploymentUrlsFile)) {
    const content = fs.readFileSync(deploymentUrlsFile, 'utf8');
    content.split('\n').forEach(line => {
      const [app, url] = line.split('=');
      if (app && url) {
        deploymentUrls[app.trim()] = url.trim();
      }
    });
  }
  
  return deploymentUrls;
}

// Load or create app URLs configuration
function loadAppUrls() {
  // Ensure config directory exists
  const configDir = path.join(staffAppPath, 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Load existing config or create new one
  if (fs.existsSync(appConfigPath)) {
    return JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
  }
  
  // Default configuration
  return {
    lastUpdated: new Date().toISOString(),
    urls: {}
  };
}

// Generate rewrites array based on current URLs
function generateRewrites(appUrls) {
  const rewrites = [];
  
  // Add rewrites for each app and its aliases
  Object.entries(APP_CONFIG).forEach(([app, config]) => {
    const url = appUrls[app];
    if (url) {
      // Add a rewrite for each route/alias with :path* parameter
      config.routes.forEach(route => {
        rewrites.push({
          source: `${route}/:path*`,
          destination: `${url}/:path*`
        });
      });
    }
  });
  
  // Sort rewrites for consistency
  rewrites.sort((a, b) => a.source.localeCompare(b.source));
  
  return rewrites;
}

// Main function
async function updateVercelRewrites() {
  console.log('🔍 Checking for deployment URL updates...\n');
  
  // Parse new deployment URLs
  const newDeploymentUrls = parseDeploymentUrls();
  
  if (Object.keys(newDeploymentUrls).length === 0) {
    console.log('⚠️  No deployment URLs found to process');
    return;
  }
  
  // Load current app URLs
  const appConfig = loadAppUrls();
  const currentUrls = appConfig.urls || {};
  
  // Check what has changed
  const changes = [];
  let hasChanges = false;
  
  Object.entries(newDeploymentUrls).forEach(([app, url]) => {
    if (currentUrls[app] !== url) {
      changes.push(`  ${app}: ${currentUrls[app] || 'none'} → ${url}`);
      hasChanges = true;
    }
  });
  
  if (!hasChanges) {
    console.log('✅ No URL changes detected - staff portal update not needed');
    return;
  }
  
  console.log('📝 URL changes detected:');
  changes.forEach(change => console.log(change));
  console.log('');
  
  // Update app URLs
  Object.assign(currentUrls, newDeploymentUrls);
  appConfig.urls = currentUrls;
  appConfig.lastUpdated = new Date().toISOString();
  
  // Generate new rewrites
  const rewrites = generateRewrites(currentUrls);
  
  // Load current vercel.json
  let vercelConfig = {};
  let currentRewritesHash = '';
  
  if (fs.existsSync(vercelConfigPath)) {
    vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    currentRewritesHash = calculateHash(vercelConfig.rewrites || []);
  }
  
  // Calculate new rewrites hash
  const newRewritesHash = calculateHash(rewrites);
  
  // Check if vercel.json needs updating
  if (currentRewritesHash === newRewritesHash) {
    console.log('✅ Vercel rewrites unchanged - staff portal rebuild not needed');
    
    // Still save the app URLs for future reference
    fs.writeFileSync(appConfigPath, JSON.stringify(appConfig, null, 2));
    return;
  }
  
  // Update vercel.json
  vercelConfig.rewrites = rewrites;
  
  // Ensure other required configurations
  if (!vercelConfig.framework) vercelConfig.framework = 'nextjs';
  if (!vercelConfig.buildCommand) vercelConfig.buildCommand = 'cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile && pnpm -F @ganger/ganger-staff build';
  if (!vercelConfig.outputDirectory) vercelConfig.outputDirectory = '.next';
  
  // Add security headers if not present
  if (!vercelConfig.headers) {
    vercelConfig.headers = [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' }
        ]
      }
    ];
  }
  
  // Write updated files
  fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
  fs.writeFileSync(appConfigPath, JSON.stringify(appConfig, null, 2));
  
  console.log('✅ Updated ganger-staff/vercel.json with new rewrites');
  console.log(`📝 ${rewrites.length} rewrites configured`);
  console.log('');
  console.log('Active routes:');
  
  Object.entries(APP_CONFIG).forEach(([app, config]) => {
    if (currentUrls[app]) {
      console.log(`  ${config.routes[0]} → ${app} (${config.description})`);
      if (config.routes.length > 1) {
        config.routes.slice(1).forEach(alias => {
          console.log(`    ↳ ${alias} (alias)`);
        });
      }
    }
  });
  
  console.log('\n✅ Staff portal rebuild required for routing updates');
}

// Run the update
updateVercelRewrites().catch(console.error);