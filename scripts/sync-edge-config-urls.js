#!/usr/bin/env node

/**
 * Sync Edge Config URLs
 * 
 * This script updates the Edge Config with the correct Vercel URLs
 * from edge-config-items.json
 */

const fs = require('fs');
const path = require('path');

// Load edge config items
const edgeConfigPath = path.join(__dirname, '..', 'edge-config-items.json');
const edgeConfig = JSON.parse(fs.readFileSync(edgeConfigPath, 'utf8'));

// Extract app URLs
const appUrls = edgeConfig.items[0].value;

// Create the update script content
const updateScript = `#!/usr/bin/env node

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

const appUrls = ${JSON.stringify(appUrls, null, 2)};

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
  path: \`/v1/edge-config/\${EDGE_CONFIG_ID}/items\${VERCEL_TEAM_ID ? '?teamId=' + VERCEL_TEAM_ID : ''}\`,
  method: 'PATCH',
  headers: {
    'Authorization': \`Bearer \${VERCEL_TOKEN}\`,
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
      console.log('\\nUpdated URLs:');
      Object.entries(appUrls).forEach(([route, url]) => {
        console.log(\`  \${route}: \${url}\`);
      });
    } else {
      console.error(\`❌ Failed to update Edge Config: \${res.statusCode}\`);
      console.error(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error);
});

req.write(data);
req.end();
`;

// Write the update script
const updateScriptPath = path.join(__dirname, 'update-edge-config-from-json.js');
fs.writeFileSync(updateScriptPath, updateScript);
fs.chmodSync(updateScriptPath, '755');

console.log('✅ Created update-edge-config-from-json.js');
console.log('');
console.log('To update Edge Config with correct URLs:');
console.log('1. Set environment variables:');
console.log('   export VERCEL_TOKEN=your-token');
console.log('   export VERCEL_TEAM_ID=your-team-id');
console.log('');
console.log('2. Run the update script:');
console.log('   node scripts/update-edge-config-from-json.js');
console.log('');
console.log('Current URLs in edge-config-items.json:');
Object.entries(appUrls).forEach(([route, url]) => {
  if (!url.includes('anand-gangers-projects') && !url.includes('git-main')) {
    console.log(`  ✅ ${route}: ${url}`);
  } else {
    console.log(`  ❌ ${route}: ${url} (outdated pattern)`);
  }
});