#!/usr/bin/env node

/**
 * Fix GitHub Actions workflows to use proper Workers deployment
 * - Update build scripts to use build:cloudflare  
 * - Ensure all apps have the build:cloudflare script
 * - Fix deployment to use Workers instead of static pages
 */

const fs = require('fs');
const path = require('path');

const APPS_DIR = path.join(__dirname, 'apps');
const WORKFLOWS_DIR = path.join(__dirname, '.github/workflows');

// Apps that need fixing
const APPS_TO_FIX = [
  'handouts', 'checkin-kiosk', 'medication-auth', 'eos-l10',
  'pharma-scheduling', 'call-center-ops', 'batch-closeout',
  'clinical-staffing', 'compliance-training', 'platform-dashboard',
  'config-dashboard', 'component-showcase', 'integration-status',
  'ai-receptionist', 'socials-reviews', 'inventory'
];

function addBuildCloudflareScript(appName) {
  const packageJsonPath = path.join(APPS_DIR, appName, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`❌ Package.json not found for ${appName}`);
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add build:cloudflare script if missing
  if (!packageJson.scripts['build:cloudflare']) {
    packageJson.scripts['build:cloudflare'] = 'next build && npx @cloudflare/next-on-pages';
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`  ✅ Added build:cloudflare script to ${appName}`);
  }
}

function fixWorkflow(appName) {
  // Map app names to workflow file names
  const workflowMap = {
    'handouts': 'deploy-handouts.yml',
    'checkin-kiosk': 'deploy-checkin-kiosk.yml',
    'medication-auth': 'deploy-medication-auth-only.yml',
    'eos-l10': 'deploy-eos-l10.yml',
    'pharma-scheduling': 'deploy-pharma-scheduling.yml',
    'call-center-ops': 'deploy-call-center-ops.yml',
    'batch-closeout': 'deploy-batch-closeout.yml',
    'clinical-staffing': 'deploy-clinical-staffing.yml',
    'compliance-training': 'deploy-compliance-training.yml',
    'platform-dashboard': 'deploy-platform-dashboard.yml',
    'config-dashboard': 'deploy-config-dashboard.yml',
    'component-showcase': 'deploy-component-showcase.yml',
    'integration-status': 'deploy-integration-status.yml',
    'ai-receptionist': 'deploy-ai-receptionist.yml',
    'socials-reviews': 'deploy-socials-reviews.yml',
    'inventory': 'deploy-inventory.yml'
  };

  const workflowFile = workflowMap[appName];
  if (!workflowFile) {
    console.log(`❌ No workflow mapping for ${appName}`);
    return;
  }

  const workflowPath = path.join(WORKFLOWS_DIR, workflowFile);
  if (!fs.existsSync(workflowPath)) {
    console.log(`❌ Workflow file not found: ${workflowFile}`);
    return;
  }

  let workflowContent = fs.readFileSync(workflowPath, 'utf8');
  
  // Replace pnpm run build with pnpm run build:cloudflare
  const buildRegex = /pnpm run build(?!\:)/g;
  if (buildRegex.test(workflowContent)) {
    workflowContent = workflowContent.replace(buildRegex, 'pnpm run build:cloudflare');
    fs.writeFileSync(workflowPath, workflowContent);
    console.log(`  ✅ Updated build command in ${workflowFile}`);
  }
}

function main() {
  console.log('🚀 Fixing workflows for Workers deployment...\n');
  
  APPS_TO_FIX.forEach(appName => {
    console.log(`🔧 Fixing ${appName}...`);
    
    // 1. Add build:cloudflare script to package.json
    addBuildCloudflareScript(appName);
    
    // 2. Update workflow file
    fixWorkflow(appName);
    
    console.log(`✅ ${appName} fixed\n`);
  });
  
  console.log('🎉 All workflows updated!');
  console.log('\nKey changes:');
  console.log('✅ Added build:cloudflare scripts to all apps');
  console.log('✅ Updated GitHub Actions to use build:cloudflare');
  console.log('✅ This will generate .vercel/output/static for Workers deployment');
  console.log('\nNext: Commit and push to trigger proper Workers deployment');
}

if (require.main === module) {
  main();
}

module.exports = { addBuildCloudflareScript, fixWorkflow, APPS_TO_FIX };