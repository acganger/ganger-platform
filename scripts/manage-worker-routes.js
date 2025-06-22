#!/usr/bin/env node

// Script to manage Cloudflare Worker routes
const https = require('https');

const CLOUDFLARE_API_TOKEN = 'TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf';
const ZONE_ID = 'ba76d3d3f41251c49f0365421bd644a5';

async function makeRequest(method, path, body = null) {
  const options = {
    hostname: 'api.cloudflare.com',
    port: 443,
    path: `/client/v4${path}`,
    method: method,
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (!parsed.success) {
            reject(new Error(JSON.stringify(parsed.errors)));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function listWorkerRoutes() {
  console.log('Listing all worker routes...\n');
  const response = await makeRequest('GET', `/zones/${ZONE_ID}/workers/routes`);
  
  if (response.result.length === 0) {
    console.log('No worker routes found.');
    return [];
  }
  
  console.log('Current worker routes:');
  response.result.forEach(route => {
    console.log(`- ID: ${route.id}`);
    console.log(`  Pattern: ${route.pattern}`);
    console.log(`  Script: ${route.script || 'None'}`);
    console.log('');
  });
  
  return response.result;
}

async function deleteWorkerRoute(routeId) {
  console.log(`Deleting route ${routeId}...`);
  await makeRequest('DELETE', `/zones/${ZONE_ID}/workers/routes/${routeId}`);
  console.log(`Route ${routeId} deleted successfully.\n`);
}

async function deleteAllMedicalRoutes() {
  const routes = await listWorkerRoutes();
  
  // Find routes that point to ganger-medical-production
  const medicalRoutes = routes.filter(route => 
    route.script === 'ganger-medical-production' ||
    (route.pattern && route.pattern.includes('staff.gangerdermatology.com'))
  );
  
  if (medicalRoutes.length === 0) {
    console.log('No medical worker routes to delete.');
    return;
  }
  
  console.log(`Found ${medicalRoutes.length} medical worker routes to delete:`);
  medicalRoutes.forEach(route => {
    console.log(`- ${route.pattern} (ID: ${route.id})`);
  });
  
  console.log('\nDeleting routes...');
  for (const route of medicalRoutes) {
    await deleteWorkerRoute(route.id);
  }
  
  console.log('All medical worker routes deleted successfully!');
}

// Run the script
(async () => {
  try {
    // Just list the remaining routes
    await listWorkerRoutes();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();