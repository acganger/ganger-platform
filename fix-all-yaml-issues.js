#!/usr/bin/env node

/**
 * Comprehensive YAML workflow fixing script
 * Fixes all indentation and formatting issues
 */

const fs = require('fs');
const path = require('path');

const WORKFLOWS_DIR = path.join(__dirname, '.github/workflows');

// All workflow files that need fixing
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

function validateAndFixWorkflow(workflowFile) {
  const workflowPath = path.join(WORKFLOWS_DIR, workflowFile);
  
  if (!fs.existsSync(workflowPath)) {
    console.log(`❌ Workflow file not found: ${workflowFile}`);
    return false;
  }

  let content = fs.readFileSync(workflowPath, 'utf8');
  let fixed = false;

  // Fix common YAML indentation issues
  const patterns = [
    // Fix malformed build shared packages step
    {
      pattern: /(\s+run: pnpm install --frozen-lockfile\s*\n\s*)\s+- name: Build shared packages\n\s+run: \|/g,
      replacement: '$1\n      - name: Build shared packages\n        run: |'
    },
    // Fix malformed app build step
    {
      pattern: /\n- name: Build ([^-\n]*)\n\s+run: \|/g,
      replacement: '\n\n      - name: Build $1\n        run: |'
    },
    // Fix inconsistent indentation for shared packages step
    {
      pattern: /\s+- name: Build shared packages\n\s+run: \|/g,
      replacement: '      - name: Build shared packages\n        run: |'
    }
  ];

  patterns.forEach(({pattern, replacement}) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      fixed = true;
    }
  });

  if (fixed) {
    fs.writeFileSync(workflowPath, content);
    console.log(`  ✅ Fixed YAML issues in ${workflowFile}`);
  }

  // Validate YAML structure
  const lines = content.split('\n');
  let hasErrors = false;
  
  lines.forEach((line, index) => {
    // Check for common YAML errors
    if (line.match(/^\s{2,}\s+- name:/)) {
      console.log(`  ⚠️  Line ${index + 1}: Incorrect indentation for step`);
      hasErrors = true;
    }
    if (line.match(/^- name:/) && index > 0) {
      console.log(`  ⚠️  Line ${index + 1}: Step should be indented`);
      hasErrors = true;
    }
  });

  if (!hasErrors) {
    console.log(`  ✅ ${workflowFile} YAML structure looks good`);
  }

  return !hasErrors;
}

function main() {
  console.log('🚀 Comprehensive YAML workflow validation and fixing...\n');
  
  let allValid = true;
  
  WORKFLOW_FILES.forEach(workflowFile => {
    console.log(`🔧 Checking ${workflowFile}...`);
    const isValid = validateAndFixWorkflow(workflowFile);
    if (!isValid) {
      allValid = false;
    }
    console.log('');
  });
  
  if (allValid) {
    console.log('🎉 All workflow files are properly formatted!');
  } else {
    console.log('⚠️  Some workflow files still have issues - manual review needed');
  }
  
  console.log('\nNext: Commit fixes and test deployments');
}

if (require.main === module) {
  main();
}

module.exports = { validateAndFixWorkflow, WORKFLOW_FILES };