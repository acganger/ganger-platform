#!/usr/bin/env node

/**
 * Update Edge Config via Vercel API
 * Auto-generated from edge-config-items.json
 */

const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID || 'ecfg_9tfqi8n0qyjyf91c5vknz2y0drlv';

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN environment variable not set');
  process.exit(1);
}

const appUrls = {
  "inventory": "https://ganger-inventory.vercel.app",
  "handouts": "https://ganger-handouts.vercel.app",
  "l10": "https://ganger-eos-l10.vercel.app",
  "eos-l10": "https://ganger-eos-l10.vercel.app",
  "batch": "https://ganger-batch-closeout.vercel.app",
  "batch-closeout": "https://ganger-batch-closeout.vercel.app",
  "compliance": "https://ganger-compliance-training.vercel.app",
  "compliance-training": "https://ganger-compliance-training.vercel.app",
  "clinical-staffing": "https://ganger-clinical-staffing.vercel.app",
  "config": "https://ganger-config-dashboard.vercel.app",
  "config-dashboard": "https://ganger-config-dashboard.vercel.app",
  "status": "https://ganger-integration-status.vercel.app",
  "integration-status": "https://ganger-integration-status.vercel.app",
  "ai-receptionist": "https://ganger-ai-receptionist.vercel.app",
  "call-center": "https://ganger-call-center-ops.vercel.app",
  "call-center-ops": "https://ganger-call-center-ops.vercel.app",
  "medication-auth": "https://ganger-medication-auth.vercel.app",
  "pharma": "https://ganger-pharma-scheduling.vercel.app",
  "pharma-scheduling": "https://ganger-pharma-scheduling.vercel.app",
  "lunch": "https://ganger-pharma-scheduling.vercel.app",
  "kiosk": "https://ganger-checkin-kiosk.vercel.app",
  "checkin-kiosk": "https://ganger-checkin-kiosk.vercel.app",
  "socials": "https://ganger-socials-reviews.vercel.app",
  "socials-reviews": "https://ganger-socials-reviews.vercel.app",
  "component-showcase": "https://ganger-component-showcase.vercel.app",
  "platform-dashboard": "https://ganger-platform-dashboard.vercel.app"
};

// Create the request to update Edge Config
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
  path: `/v1/edge-config/${EDGE_CONFIG_ID}/items${VERCEL_TEAM_ID ? '?teamId=' + VERCEL_TEAM_ID : ''}`,
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🔄 Updating Edge Config with correct Vercel URLs...');

const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Edge Config updated successfully!');
      console.log('\nUpdated URLs:');
      Object.entries(appUrls).forEach(([route, url]) => {
        console.log(`  ${route}: ${url}`);
      });
    } else {
      console.error(`❌ Failed to update Edge Config: ${res.statusCode}`);
      console.error(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error);
});

req.write(data);
req.end();
