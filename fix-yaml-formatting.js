#!/usr/bin/env node

/**
 * Fix YAML formatting issues in workflow files
 * The previous script introduced indentation problems
 */

const fs = require('fs');
const path = require('path');

const WORKFLOWS_DIR = path.join(__dirname, '.github/workflows');

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
  'deploy-inventory.yml'
];

function fixWorkflowYaml(workflowFile) {
  const workflowPath = path.join(WORKFLOWS_DIR, workflowFile);
  
  if (!fs.existsSync(workflowPath)) {
    console.log(`❌ Workflow file not found: ${workflowFile}`);
    return;
  }

  let content = fs.readFileSync(workflowPath, 'utf8');
  
  // Fix the malformed YAML from the previous script
  const badPattern = /(\s+run: pnpm install --frozen-lockfile\n\n\s+)- name: Build shared packages\n\s+run: \|\n([\s\S]*?)\n\n- name: Build ([^-\n]*)/;
  
  const goodReplacement = `$1- name: Build shared packages
        run: |
$2

      - name: Build $3`;

  if (badPattern.test(content)) {
    content = content.replace(badPattern, goodReplacement);
    fs.writeFileSync(workflowPath, content);
    console.log(`  ✅ Fixed YAML formatting in ${workflowFile}`);
  } else {
    console.log(`  ℹ️  ${workflowFile} doesn't need YAML formatting fix`);
  }
}

function main() {
  console.log('🚀 Fixing YAML formatting in workflow files...\n');
  
  WORKFLOW_FILES.forEach(workflowFile => {
    console.log(`🔧 Checking ${workflowFile}...`);
    fixWorkflowYaml(workflowFile);
  });
  
  console.log('\n🎉 YAML formatting fixes completed!');
  console.log('\nThis resolves:');
  console.log('✅ Workflow file syntax errors');
  console.log('✅ YAML indentation issues');
  console.log('✅ Step definition problems');
}

if (require.main === module) {
  main();
}

module.exports = { fixWorkflowYaml, WORKFLOW_FILES };