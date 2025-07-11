#!/usr/bin/env node

/**
 * Script to trigger a deployment for ganger-staff via Vercel API
 * Usage: node scripts/trigger-deployment.js
 */

const https = require('https');

// Configuration
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'RdwA23mHSvPcm9ptReM6zxjF';
const TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_wpY7PcIsYQNnslNN39o7fWvS';
const PROJECT_NAME = 'ganger-staff';

// Function to make HTTPS request
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`API Error (${res.statusCode}): ${JSON.stringify(response)}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Get project details to find the git repo
async function getProject() {
  const options = {
    hostname: 'api.vercel.com',
    path: `/v9/projects/${PROJECT_NAME}?teamId=${TEAM_ID}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`
    }
  };

  try {
    return await makeRequest(options);
  } catch (error) {
    console.error('Failed to get project details:', error.message);
    throw error;
  }
}

// Trigger a deployment
async function triggerDeployment() {
  const project = await getProject();
  
  const data = JSON.stringify({
    name: PROJECT_NAME,
    gitSource: {
      type: 'github',
      org: project.link.org,
      repo: project.link.repo,
      ref: 'main'
    },
    target: 'production',
    source: 'cli'
  });

  const options = {
    hostname: 'api.vercel.com',
    path: `/v13/deployments?teamId=${TEAM_ID}`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  try {
    const response = await makeRequest(options, data);
    return response;
  } catch (error) {
    console.error('Failed to trigger deployment:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('Triggering Deployment for ganger-staff');
  console.log('=====================================\n');

  try {
    console.log('Getting project details...');
    const project = await getProject();
    console.log(`✅ Found project: ${project.name}`);
    console.log(`   Repository: ${project.link.org}/${project.link.repo}`);

    console.log('\nTriggering new deployment...');
    const deployment = await triggerDeployment();
    
    console.log(`✅ Deployment triggered successfully!`);
    console.log(`   ID: ${deployment.id}`);
    console.log(`   URL: https://${deployment.url}`);
    console.log(`   Status: ${deployment.readyState}`);
    
    console.log('\n📝 Monitor deployment at:');
    console.log(`   https://vercel.com/${TEAM_ID}/${PROJECT_NAME}/${deployment.id}`);
    console.log('\n⏱️  Deployment usually takes 2-3 minutes.');
    console.log('   Check https://staff.gangerdermatology.com after completion.');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check if the project name is correct');
    console.log('2. Verify the Vercel token has deployment permissions');
    console.log('3. Check the Vercel dashboard for more details');
  }
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});