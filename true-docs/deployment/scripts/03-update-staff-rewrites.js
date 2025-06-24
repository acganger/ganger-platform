#!/usr/bin/env node

/**
 * ============================================================================
 * 03-update-staff-rewrites.js - Configure Staff Portal Router
 * ============================================================================
 * Purpose: Updates the Staff Portal's vercel.json with deployment URLs
 * Dependencies: Node.js, deployment-urls.json from previous step
 * Related Docs: ../02-deployment-plan.md (Phase 3)
 * Previous Script: 01-deploy-all-apps.sh
 * Next Script: Deploy staff portal manually with vercel CLI
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// Read deployment URLs
const deploymentUrlsPath = path.join(__dirname, '..', 'deployment-urls.json');
const staffVercelJsonPath = path.join(__dirname, '..', 'apps', 'staff', 'vercel.json');

if (!fs.existsSync(deploymentUrlsPath)) {
  console.error('❌ deployment-urls.json not found. Run vercel-deploy-all-apps.sh first.');
  process.exit(1);
}

const deploymentUrls = JSON.parse(fs.readFileSync(deploymentUrlsPath, 'utf8'));

// Create rewrites configuration
const rewrites = [];

// Map of app names to URL paths
const appPaths = {
  'inventory': '/inventory',
  'handouts': '/handouts',
  'checkin-kiosk': '/kiosk',
  'medication-auth': '/meds',
  'eos-l10': '/l10',
  'compliance-training': '/compliance',
  'clinical-staffing': '/staffing',
  'socials-reviews': '/socials',
  'config-dashboard': '/config',
  'integration-status': '/status',
  'ai-receptionist': '/ai-receptionist',
  'call-center-ops': '/call-center',
  'pharma-scheduling': '/reps',
  'component-showcase': '/showcase',
  'batch-closeout': '/batch'
};

// Generate rewrites for each app
Object.entries(appPaths).forEach(([appName, urlPath]) => {
  const deploymentUrl = deploymentUrls[appName];
  if (deploymentUrl) {
    rewrites.push({
      source: `${urlPath}/:path*`,
      destination: `${deploymentUrl}/:path*`
    });
  } else {
    console.warn(`⚠️  No deployment URL found for ${appName}`);
  }
});

// Add catch-all for staff portal itself
rewrites.push({
  source: '/:path*',
  destination: '/:path*'
});

// Create vercel.json configuration
const vercelConfig = {
  framework: 'nextjs',
  buildCommand: 'npm run build',
  outputDirectory: '.next',
  rewrites: rewrites,
  headers: [
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
  ]
};

// Write updated vercel.json
fs.writeFileSync(staffVercelJsonPath, JSON.stringify(vercelConfig, null, 2));

console.log('✅ Updated staff/vercel.json with deployment URLs');
console.log(`📝 ${rewrites.length - 1} app rewrites configured`);
console.log('');
console.log('Next step: Deploy the staff portal');
console.log('cd apps/staff && vercel --prod');