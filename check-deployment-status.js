#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Apps that should be accessible via the staff portal
const APPS_TO_CHECK = [
  { name: 'Staff Portal', url: 'https://staff.gangerdermatology.com/', expectedRedirect: false },
  { name: 'Inventory', url: 'https://staff.gangerdermatology.com/inventory', expectedRedirect: true },
  { name: 'Integration Status', url: 'https://staff.gangerdermatology.com/status', expectedRedirect: true },
  { name: 'Socials & Reviews', url: 'https://staff.gangerdermatology.com/socials', expectedRedirect: true },
  { name: 'EOS L10', url: 'https://staff.gangerdermatology.com/l10', expectedRedirect: true },
  { name: 'Handouts', url: 'https://staff.gangerdermatology.com/handouts', expectedRedirect: true },
  { name: 'Batch Closeout', url: 'https://staff.gangerdermatology.com/batch', expectedRedirect: true },
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, { timeout: 10000 }, (res) => {
      resolve({
        status: res.statusCode,
        headers: res.headers,
        statusMessage: res.statusMessage
      });
    }).on('error', (err) => {
      resolve({
        status: 'error',
        error: err.message
      });
    }).on('timeout', () => {
      resolve({
        status: 'timeout',
        error: 'Request timed out'
      });
    });
  });
}

async function checkDeploymentStatus() {
  console.log('🔍 Checking Deployment Status...');
  console.log('================================\n');
  
  const results = [];
  
  for (const app of APPS_TO_CHECK) {
    process.stdout.write(`Checking ${app.name}... `);
    const result = await checkUrl(app.url);
    
    let status = '❌ Failed';
    let details = '';
    
    if (result.status === 200) {
      status = '✅ Success';
      details = 'Accessible';
    } else if (result.status === 401) {
      status = '🔒 Auth Required';
      details = 'App deployed but requires authentication';
    } else if (result.status === 404) {
      status = '❌ Not Found';
      details = 'App not deployed or route not configured';
    } else if (result.status === 500 || result.status === 502) {
      status = '❌ Server Error';
      details = 'App deployed but has runtime errors';
    } else if (result.status === 301 || result.status === 302 || result.status === 307 || result.status === 308) {
      status = '➡️  Redirect';
      details = `Redirecting to: ${result.headers.location || 'unknown'}`;
    } else if (result.status === 'error') {
      status = '❌ Error';
      details = result.error;
    } else if (result.status === 'timeout') {
      status = '⏱️  Timeout';
      details = 'Request took too long';
    } else {
      status = `⚠️  Status ${result.status}`;
      details = result.statusMessage || '';
    }
    
    console.log(`${status} - ${details}`);
    
    results.push({
      app: app.name,
      url: app.url,
      status: result.status,
      statusText: status,
      details: details,
      timestamp: new Date().toISOString()
    });
  }
  
  // Summary
  console.log('\n📊 Summary');
  console.log('==========');
  
  const successful = results.filter(r => r.status === 200).length;
  const authRequired = results.filter(r => r.status === 401).length;
  const notFound = results.filter(r => r.status === 404).length;
  const errors = results.filter(r => r.status >= 500 || r.status === 'error' || r.status === 'timeout').length;
  
  console.log(`✅ Successful: ${successful}/${APPS_TO_CHECK.length}`);
  console.log(`🔒 Auth Required: ${authRequired}`);
  console.log(`❌ Not Found: ${notFound}`);
  console.log(`❌ Errors: ${errors}`);
  
  if (notFound > 0) {
    console.log('\n⚠️  Apps with 404 errors may still be building or need their routes configured in staff portal\'s vercel.json');
  }
  
  if (errors > 0) {
    console.log('\n❌ Apps with errors may have build failures. Check Vercel dashboard for build logs.');
  }
  
  console.log('\n📝 Note: The TypeScript dependency fix was just pushed. Apps may still be building.');
  console.log('Check https://vercel.com/gangers-projects for detailed build status.\n');
}

checkDeploymentStatus().catch(console.error);