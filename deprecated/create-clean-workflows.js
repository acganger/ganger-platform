#!/usr/bin/env node

/**
 * Create clean working deployment workflows
 * Uses the successful EOS L10 pattern as template
 */

const fs = require('fs');
const path = require('path');

const WORKFLOWS_DIR = path.join(__dirname, '.github/workflows');
const TEMPLATE_PATH = path.join(__dirname, 'deploy-clean-template.yml');

// Apps to create clean workflows for
const APPS = [
  { name: 'Handouts', dir: 'handouts', basePath: 'handouts' },
  { name: 'Inventory', dir: 'inventory', basePath: 'inventory' },
  { name: 'Medication Auth', dir: 'medication-auth', basePath: 'meds' },
  { name: 'Socials Reviews', dir: 'socials-reviews', basePath: 'socials' },
  { name: 'Platform Dashboard', dir: 'platform-dashboard', basePath: 'dashboard' }
];

function createCleanWorkflow(app) {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  
  // Replace template variables
  const workflow = template
    .replace(/\{\{APP_NAME\}\}/g, app.name)
    .replace(/\{\{APP_DIR\}\}/g, app.dir)
    .replace(/\{\{BASE_PATH\}\}/g, app.basePath);
  
  const workflowPath = path.join(WORKFLOWS_DIR, `deploy-${app.dir}-clean.yml`);
  fs.writeFileSync(workflowPath, workflow);
  
  console.log(`✅ Created clean workflow for ${app.name}`);
}

function main() {
  console.log('🚀 Creating clean deployment workflows...\n');
  
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.log('❌ Template file not found');
    return;
  }
  
  APPS.forEach(app => {
    createCleanWorkflow(app);
  });
  
  console.log('\n🎉 Clean workflows created!');
  console.log('\nNext steps:');
  console.log('1. Test these clean workflows');
  console.log('2. If successful, replace the broken workflows');
  console.log('3. Verify apps deploy as interactive Workers');
}

if (require.main === module) {
  main();
}

module.exports = { createCleanWorkflow, APPS };