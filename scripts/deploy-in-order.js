#!/usr/bin/env node

/**
 * Deploy apps in the correct order via Vercel API
 * Staff (router) must always deploy first
 */

const https = require('https');
const deploymentOrder = require('./deployment-order.json');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'RdwA23mHSvPcm9ptReM6zxjF';
const TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_wpY7PcIsYQNnslNN39o7fWvS';

async function triggerDeployment(projectName) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      name: projectName,
      target: 'production',
      gitSource: {
        type: 'github',
        ref: 'main'
      }
    });

    const options = {
      hostname: 'api.vercel.com',
      path: `/v13/deployments?teamId=${TEAM_ID}&forceNew=1`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Deployment failed for ${projectName}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function waitForDeployment(deploymentId, maxWaitTime = 600000) { // 10 minutes max
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const deployment = await checkDeploymentStatus(deploymentId);
    
    if (deployment.readyState === 'READY') {
      return deployment;
    } else if (deployment.readyState === 'ERROR' || deployment.readyState === 'CANCELED') {
      throw new Error(`Deployment ${deploymentId} failed with state: ${deployment.readyState}`);
    }
    
    // Wait 5 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  throw new Error(`Deployment ${deploymentId} timed out`);
}

async function checkDeploymentStatus(deploymentId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: `/v13/deployments/${deploymentId}?teamId=${TEAM_ID}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Failed to check deployment status: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('🚀 Starting ordered deployment process');
  console.log('=====================================\n');

  const apps = process.argv.slice(2);
  const appsToDeploy = apps.length > 0 ? apps : deploymentOrder.deploymentOrder;

  // Always ensure staff is first if it's in the list
  if (appsToDeploy.includes('staff') && appsToDisplay.indexOf('staff') !== 0) {
    const staffIndex = appsToDisplay.indexOf('staff');
    appsToDisplay.splice(staffIndex, 1);
    appsToDisplay.unshift('staff');
    console.log('⚠️  Reordered: Moving "staff" to first position (required as router)\n');
  }

  console.log('Deployment order:');
  appsToDisplay.forEach((app, index) => {
    const note = deploymentOrder.notes[app] || '';
    console.log(`${index + 1}. ${app} ${note ? `- ${note}` : ''}`);
  });
  console.log('');

  for (const app of appsToDisplay) {
    const projectName = app === 'staff' ? 'ganger-staff' : `ganger-${app}`;
    
    try {
      console.log(`\n🔄 Deploying ${projectName}...`);
      const deployment = await triggerDeployment(projectName);
      console.log(`   ✅ Deployment triggered: ${deployment.url}`);
      
      // For staff, wait until it's ready before proceeding
      if (app === 'staff') {
        console.log('   ⏳ Waiting for staff deployment to complete (required for routing)...');
        await waitForDeployment(deployment.id);
        console.log('   ✅ Staff deployment complete!');
      }
      
      // Small delay between deployments to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`   ❌ Failed to deploy ${projectName}: ${error.message}`);
      
      // If staff fails, stop everything
      if (app === 'staff') {
        console.error('\n🛑 Staff deployment failed - stopping all deployments');
        process.exit(1);
      }
    }
  }

  console.log('\n✅ All deployments triggered successfully!');
  console.log('\nNote: Deployments are running in parallel after staff. Check Vercel dashboard for status.');
}

main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});