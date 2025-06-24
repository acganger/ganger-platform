#!/usr/bin/env node

/**
 * Update Vercel Rewrites for Staff Portal
 * 
 * This script updates the staff portal's vercel.json with the
 * deployment URLs from other apps
 */

const fs = require('fs');
const path = require('path');

// Map of app names to their routes in the staff portal
const APP_ROUTES = {
  'inventory': '/inventory',
  'handouts': '/handouts',
  'eos-l10': '/l10',
  'batch-closeout': '/batch',
  'compliance-training': '/compliance',
  'clinical-staffing': '/clinical-staffing',
  'config-dashboard': '/config',
  'integration-status': '/integration-status',
  'ai-receptionist': '/ai-receptionist',
  'call-center-ops': '/call-center',
  'medication-auth': '/medication-auth',
  'pharma-scheduling': '/pharma',
  'socials-reviews': '/socials',
  'component-showcase': '/components',
  'platform-dashboard': '/platform'
};

// Read deployment URLs from file or arguments
const deploymentUrlsFile = process.argv[2] || 'deployment-urls.txt';
const vercelConfigPath = path.join(__dirname, '..', 'apps', 'staff', 'vercel.json');

// Parse deployment URLs
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

// Read existing vercel.json or create new one
let vercelConfig = {};
if (fs.existsSync(vercelConfigPath)) {
  vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
}

// Generate rewrites
const rewrites = [];

// Add rewrites for each app
Object.entries(APP_ROUTES).forEach(([app, route]) => {
  const deploymentUrl = deploymentUrls[app];
  if (deploymentUrl) {
    rewrites.push({
      source: `${route}/:path*`,
      destination: `${deploymentUrl}/:path*`
    });
  }
});

// Add catch-all for staff portal itself
rewrites.push({
  source: '/:path*',
  destination: '/:path*'
});

// Update vercel.json
vercelConfig.rewrites = rewrites;

// Add other required configurations
vercelConfig.framework = 'nextjs';
vercelConfig.buildCommand = 'cd ../.. && pnpm build:staff';
vercelConfig.installCommand = 'cd ../.. && pnpm install';
vercelConfig.outputDirectory = '.next';

// Add headers for security
vercelConfig.headers = [
  {
    source: '/(.*)',
    headers: [
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY'
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      }
    ]
  }
];

// Write updated vercel.json
fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));

console.log('✅ Updated staff/vercel.json with deployment URLs');
console.log(`📝 ${rewrites.length - 1} app rewrites configured`);
console.log('');
console.log('Configured routes:');
Object.entries(APP_ROUTES).forEach(([app, route]) => {
  if (deploymentUrls[app]) {
    console.log(`  ${route} → ${app}`);
  }
});