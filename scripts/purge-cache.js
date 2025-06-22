#!/usr/bin/env node

const https = require('https');

// Configuration from environment
const CLOUDFLARE_API_TOKEN = 'TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf';
const CLOUDFLARE_ZONE_ID = 'ba76d3d3f41251c49f0365421bd644a5';
const CLOUDFLARE_ACCOUNT_ID = '68d0160c9915efebbbecfddfd48cddab';

// URLs to purge
const urlsToPurge = [
  'https://staff.gangerdermatology.com/inventory',
  'https://staff.gangerdermatology.com/inventory/*',
  'https://staff.gangerdermatology.com/handouts',
  'https://staff.gangerdermatology.com/handouts/*',
  'https://staff.gangerdermatology.com/meds',
  'https://staff.gangerdermatology.com/meds/*',
  'https://staff.gangerdermatology.com/kiosk',
  'https://staff.gangerdermatology.com/kiosk/*'
];

// Function to purge cache
async function purgeCache(urls) {
  const data = JSON.stringify({
    files: urls
  });

  const options = {
    hostname: 'api.cloudflare.com',
    path: `/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(`Cloudflare API error: ${JSON.stringify(response.errors)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Main execution
async function main() {
  try {
    console.log('Starting cache purge for medical app routes...');
    console.log(`Account ID: ${CLOUDFLARE_ACCOUNT_ID}`);
    console.log(`Zone ID: ${CLOUDFLARE_ZONE_ID}`);
    console.log(`API Token: ${CLOUDFLARE_API_TOKEN.substring(0, 10)}...`);
    console.log('\nPurging the following URLs:');
    urlsToPurge.forEach(url => console.log(`  - ${url}`));
    
    const result = await purgeCache(urlsToPurge);
    
    console.log('\n✅ Cache purge successful!');
    console.log(`Purge ID: ${result.result.id}`);
    console.log('\nDetails:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\n❌ Cache purge failed:', error.message);
    if (error.message.includes('Authentication error')) {
      console.error('\n🔑 Token validation failed. The token may need cache purge permissions.');
      console.error('Please ensure the Cloudflare API token has the following permissions:');
      console.error('  - Zone:Cache Purge:Purge');
      console.error('  - Zone:Zone:Read');
    }
    process.exit(1);
  }
}

// Run the script
main();