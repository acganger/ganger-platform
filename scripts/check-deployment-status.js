#!/usr/bin/env node

/**
 * Check Deployment Status
 * 
 * This script checks the deployment status of all apps using the Vercel API
 * Requires VERCEL_TOKEN environment variable
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load app configuration
const appConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'app-config.json'), 'utf8'));

// Check for Vercel token
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN environment variable not set');
  console.error('Set it with: export VERCEL_TOKEN=your-token');
  process.exit(1);
}

// Vercel API configuration
const VERCEL_API = 'https://api.vercel.com';
const headers = {
  'Authorization': `Bearer ${VERCEL_TOKEN}`,
  'Content-Type': 'application/json'
};

// Helper to make API requests
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: path,
      method: 'GET',
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Get project deployments
async function getProjectDeployments(projectName) {
  try {
    // First, try to find the project
    const projects = await makeRequest('/v9/projects');
    const project = projects.projects?.find(p => 
      p.name === projectName || 
      p.name === `ganger-${projectName}` ||
      p.name === `@ganger/${projectName}`
    );

    if (!project) {
      return { error: 'Project not found' };
    }

    // Get latest deployment
    const deployments = await makeRequest(`/v6/deployments?projectId=${project.id}&limit=1`);
    if (deployments.deployments && deployments.deployments.length > 0) {
      const latest = deployments.deployments[0];
      return {
        url: latest.url,
        state: latest.state,
        created: new Date(latest.created).toLocaleString(),
        ready: latest.ready,
        error: latest.error
      };
    }

    return { error: 'No deployments found' };
  } catch (error) {
    return { error: error.message };
  }
}

// Main function
async function checkDeploymentStatus() {
  console.log('🔍 Checking Ganger Platform Deployment Status');
  console.log('=============================================\n');

  const results = [];

  // Check each app
  for (const [appKey, appInfo] of Object.entries(appConfig.apps)) {
    process.stdout.write(`Checking ${appInfo.name}...`);
    
    const status = await getProjectDeployments(appKey);
    
    results.push({
      app: appKey,
      name: appInfo.name,
      ...status
    });

    if (status.error) {
      process.stdout.write(` ❌\n`);
    } else if (status.state === 'READY') {
      process.stdout.write(` ✅\n`);
    } else if (status.state === 'ERROR') {
      process.stdout.write(` 🔴\n`);
    } else {
      process.stdout.write(` ⏳\n`);
    }
  }

  // Display results
  console.log('\n📊 Deployment Summary');
  console.log('====================\n');

  // Group by status
  const ready = results.filter(r => r.state === 'READY');
  const errors = results.filter(r => r.state === 'ERROR' || r.error);
  const building = results.filter(r => r.state === 'BUILDING');
  const notFound = results.filter(r => r.error === 'Project not found');

  if (ready.length > 0) {
    console.log(`✅ Deployed (${ready.length}):`);
    ready.forEach(r => {
      console.log(`   ${r.name}: https://${r.url}`);
      console.log(`      Last deploy: ${r.created}`);
    });
    console.log('');
  }

  if (building.length > 0) {
    console.log(`⏳ Building (${building.length}):`);
    building.forEach(r => {
      console.log(`   ${r.name}`);
    });
    console.log('');
  }

  if (errors.length > 0) {
    console.log(`❌ Errors (${errors.length}):`);
    errors.forEach(r => {
      console.log(`   ${r.name}: ${r.error || 'Deployment failed'}`);
    });
    console.log('');
  }

  if (notFound.length > 0) {
    console.log(`❓ Not Found (${notFound.length}):`);
    notFound.forEach(r => {
      console.log(`   ${r.name}`);
    });
    console.log('');
  }

  // Summary stats
  console.log('📈 Statistics:');
  console.log(`   Total apps: ${Object.keys(appConfig.apps).length}`);
  console.log(`   Deployed: ${ready.length}`);
  console.log(`   Errors: ${errors.filter(r => r.state === 'ERROR').length}`);
  console.log(`   Not deployed: ${notFound.length}`);
}

// Run the check
checkDeploymentStatus().catch(console.error);