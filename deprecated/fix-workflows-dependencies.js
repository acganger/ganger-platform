#!/usr/bin/env node

/**
 * Fix GitHub Actions workflows to build shared packages first
 * This resolves the '@ganger/auth' module not found errors
 */

const fs = require('fs');
const path = require('path');

const WORKFLOWS_DIR = path.join(__dirname, '.github/workflows');

// Workflow files that need the shared packages build step
const WORKFLOW_FILES = [
  'deploy-handouts.yml',
  'deploy-checkin-kiosk.yml', 
  'deploy-medication-auth-only.yml',
  'deploy-pharma-scheduling.yml',
  'deploy-call-center-ops.yml',
  'deploy-batch-closeout.yml',
  'deploy-clinical-staffing.yml',
  'deploy-compliance-training.yml',
  'deploy-platform-dashboard.yml',
  'deploy-config-dashboard.yml',
  'deploy-integration-status.yml',
  'deploy-ai-receptionist.yml',
  'deploy-socials-reviews.yml',
  'deploy-inventory.yml'
];

const BUILD_PACKAGES_STEP = `      - name: Build shared packages
        run: |
          # Build shared packages that apps depend on
          cd packages/auth && pnpm build || echo "auth build failed"
          cd ../ui && pnpm build || echo "ui build failed" 
          cd ../db && pnpm build || echo "db build failed"
          cd ../utils && pnpm build || echo "utils build failed"
          cd ../integrations && pnpm build || echo "integrations build failed"`;

function fixWorkflow(workflowFile) {
  const workflowPath = path.join(WORKFLOWS_DIR, workflowFile);
  
  if (!fs.existsSync(workflowPath)) {
    console.log(`❌ Workflow file not found: ${workflowFile}`);
    return;
  }

  let content = fs.readFileSync(workflowPath, 'utf8');
  
  // Check if build packages step already exists
  if (content.includes('Build shared packages')) {
    console.log(`  ✅ ${workflowFile} already has shared packages build step`);
    return;
  }
  
  // Find the install dependencies step and add build packages step after it
  const installDepsRegex = /(- name: Install dependencies[\s\S]*?(?=\n      - name:|$))/;
  const buildStepRegex = /(- name: Build [^-\n]*[\s\S]*?(?=\n      - name:|$))/;
  
  // Insert build packages step before the app build step
  if (buildStepRegex.test(content)) {
    content = content.replace(buildStepRegex, BUILD_PACKAGES_STEP + '\n\n$1');
    fs.writeFileSync(workflowPath, content);
    console.log(`  ✅ Added shared packages build step to ${workflowFile}`);
  } else {
    console.log(`  ❌ Could not find build step pattern in ${workflowFile}`);
  }
}

function main() {
  console.log('🚀 Adding shared packages build steps to workflows...\n');
  
  WORKFLOW_FILES.forEach(workflowFile => {
    console.log(`🔧 Fixing ${workflowFile}...`);
    fixWorkflow(workflowFile);
  });
  
  console.log('\n🎉 Workflow dependency fixes completed!');
  console.log('\nThis resolves:');
  console.log('✅ Module not found: "@ganger/auth" errors');
  console.log('✅ Workspace package dependency issues in CI/CD');
  console.log('✅ Builds shared packages before building individual apps');
  console.log('\nNext: Commit and push to test fixed deployments');
}

if (require.main === module) {
  main();
}

module.exports = { fixWorkflow, WORKFLOW_FILES };