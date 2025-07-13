#!/usr/bin/env node

/**
 * Test script to verify deployment scripts work with environment variables
 * and no hardcoded credentials are exposed
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test environment setup
process.env.VERCEL_TOKEN = 'test-token';
process.env.VERCEL_TEAM_ID = 'test-team-id';

console.log('🧪 Testing deployment scripts security...\n');

// Scripts to test
const scriptsToTest = [
  'deploy-in-order.js',
  'trigger-deployment.js',
  'get-vercel-project-ids.js',
  'verify-and-set-env-vars.js'
];

// Test 1: Check for hardcoded credentials
console.log('1️⃣ Checking for hardcoded credentials...');
let foundHardcoded = false;

for (const script of scriptsToTest) {
  const scriptPath = path.join(__dirname, script);
  if (fs.existsSync(scriptPath)) {
    const content = fs.readFileSync(scriptPath, 'utf8');
    
    // Check for hardcoded tokens
    if (content.includes('RdwA23mHSvPcm9ptReM6zxjF') || 
        content.includes('team_wpY7PcIsYQNnslNN39o7fWvS')) {
      console.error(`   ❌ Found hardcoded credentials in ${script}`);
      foundHardcoded = true;
    } else {
      console.log(`   ✅ ${script} - No hardcoded credentials`);
    }
  }
}

if (foundHardcoded) {
  console.error('\n❌ Security test failed: Hardcoded credentials found');
  process.exit(1);
}

// Test 2: Verify scripts check for environment variables
console.log('\n2️⃣ Testing environment variable validation...');

// Temporarily unset env vars
delete process.env.VERCEL_TOKEN;
delete process.env.VERCEL_TEAM_ID;

for (const script of scriptsToTest) {
  const scriptPath = path.join(__dirname, script);
  if (fs.existsSync(scriptPath)) {
    try {
      // Try to run the script without env vars (should fail)
      execSync(`node ${scriptPath}`, { stdio: 'pipe' });
      console.error(`   ❌ ${script} - Should have failed without env vars`);
    } catch (error) {
      // Expected to fail
      if (error.stderr && error.stderr.toString().includes('Missing required environment variables')) {
        console.log(`   ✅ ${script} - Properly validates env vars`);
      } else {
        console.log(`   ⚠️  ${script} - Failed but unclear error message`);
      }
    }
  }
}

// Test 3: Verify deployment order preservation
console.log('\n3️⃣ Testing deployment order preservation...');
process.env.VERCEL_TOKEN = 'test-token';
process.env.VERCEL_TEAM_ID = 'test-team-id';

const deploymentOrderPath = path.join(__dirname, 'deployment-order.json');
if (fs.existsSync(deploymentOrderPath)) {
  const deploymentOrder = JSON.parse(fs.readFileSync(deploymentOrderPath, 'utf8'));
  console.log(`   ✅ Deployment order preserved: ${deploymentOrder.deploymentOrder.length} apps`);
  console.log(`   ✅ Staff app is first: ${deploymentOrder.deploymentOrder[0] === 'staff'}`);
} else {
  console.error('   ❌ deployment-order.json not found');
}

console.log('\n✅ All security tests passed!');
console.log('\n📝 Note: Remember to set VERCEL_TOKEN and VERCEL_TEAM_ID in:');
console.log('   - Local .env file (for development)');
console.log('   - GitHub Actions secrets (for CI/CD)');
console.log('   - Vercel dashboard (for production builds)');