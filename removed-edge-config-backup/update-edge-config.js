#!/usr/bin/env node

/**
 * Script to update Edge Config using Vercel API
 * Can be used in CI/CD pipelines for automated updates
 * 
 * Usage: node update-edge-config.js [--dry-run]
 */

const https = require('https');

// Configuration from environment variables
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_wpY7PcIsYQNnslNN39o7fWvS';
const EDGE_CONFIG_ID = 'ecfg_a1cpzdoogkmshw6hed5qhxcgd5m8';

// Check for required token
if (!VERCEL_TOKEN) {
  console.error('Error: VERCEL_TOKEN environment variable is required');
  process.exit(1);
}

// Check for dry-run mode
const isDryRun = process.argv.includes('--dry-run');

// App URL mappings - this should match your deployment URLs
const appUrls = {
  '/actions': 'https://ganger-actions.vercel.app',
  '/inventory': 'https://inventory-ganger.vercel.app',
  '/handouts': 'https://handouts-ganger.vercel.app',
  '/l10': 'https://eos-l10-ganger.vercel.app',
  '/batch': 'https://batch-closeout-ganger.vercel.app',
  '/compliance': 'https://compliance-training-ganger.vercel.app',
  '/clinical-staffing': 'https://clinical-staffing-ganger.vercel.app',
  '/config': 'https://config-dashboard-ganger.vercel.app',
  '/status': 'https://integration-status-ganger.vercel.app',
  '/ai-receptionist': 'https://ai-receptionist-ganger.vercel.app',
  '/call-center': 'https://call-center-ops-ganger.vercel.app',
  '/medication-auth': 'https://medication-auth-ganger.vercel.app',
  '/pharma': 'https://pharma-scheduling-ganger.vercel.app',
  '/lunch': 'https://pharma-scheduling-ganger.vercel.app',
  '/kiosk': 'https://checkin-kiosk-ganger.vercel.app',
  '/socials': 'https://socials-reviews-ganger.vercel.app',
  '/purchasing': 'https://ai-purchasing-agent-ganger.vercel.app',
  '/showcase': 'https://component-showcase-ganger.vercel.app',
  '/platform': 'https://platform-dashboard-ganger.vercel.app'
};

// Function to make HTTPS request
function makeRequest(options, data) {
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

// Function to update Edge Config
async function updateEdgeConfig() {
  const data = JSON.stringify({
    items: [
      {
        operation: 'update',
        key: 'appUrls',
        value: appUrls
      }
    ]
  });

  const options = {
    hostname: 'api.vercel.com',
    path: `/v1/edge-config/${EDGE_CONFIG_ID}/items?teamId=${TEAM_ID}`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  if (isDryRun) {
    console.log('DRY RUN - Would update Edge Config with:');
    console.log(JSON.stringify(appUrls, null, 2));
    return;
  }

  try {
    console.log('Updating Edge Config...');
    const response = await makeRequest(options, data);
    console.log('Successfully updated Edge Config!');
    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Failed to update Edge Config:', error.message);
    process.exit(1);
  }
}

// Function to verify Edge Config
async function verifyEdgeConfig() {
  const options = {
    hostname: 'api.vercel.com',
    path: `/v1/edge-config/${EDGE_CONFIG_ID}/item/appUrls?teamId=${TEAM_ID}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`
    }
  };

  try {
    console.log('\nVerifying Edge Config...');
    const response = await makeRequest(options);
    console.log('Current appUrls in Edge Config:');
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Failed to verify Edge Config:', error.message);
  }
}

// Main execution
async function main() {
  console.log('Edge Config Update Script');
  console.log('========================');
  console.log(`Edge Config ID: ${EDGE_CONFIG_ID}`);
  console.log(`Team ID: ${TEAM_ID}`);
  console.log(`Dry Run: ${isDryRun}\n`);

  await updateEdgeConfig();
  
  if (!isDryRun) {
    await verifyEdgeConfig();
  }
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});