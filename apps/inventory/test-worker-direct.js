#!/usr/bin/env node

/**
 * Test inventory worker deployment directly via workers.dev domain
 * This bypasses DNS issues and tests the actual worker functionality
 */

const https = require('https');

function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);

    https.get(url, (res) => {
      clearTimeout(timer);
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    }).on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function testWorkerDirect() {
  console.log('🧪 Testing inventory worker directly...\n');
  
  const workerUrl = 'https://ganger-inventory-production.68d0160c9915efebbbecfddfd48cddab.workers.dev';
  
  const tests = [
    {
      name: 'Health Check Endpoint',
      path: '/health'
    },
    {
      name: 'API Metrics Endpoint',
      path: '/api/metrics'
    },
    {
      name: 'Main Page (Static Asset)',
      path: '/'
    }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const fullUrl = workerUrl + test.path;
      console.log(`🔍 Testing: ${test.name}`);
      console.log(`📍 URL: ${fullUrl}`);
      
      const result = await makeRequest(fullUrl);
      
      if (result.statusCode === 200) {
        console.log(`✅ PASS - Status: ${result.statusCode}`);
        
        // Show response for API endpoints
        if (test.path.includes('api') || test.path.includes('health')) {
          try {
            const jsonData = JSON.parse(result.data);
            console.log(`📝 Response:`, JSON.stringify(jsonData, null, 2));
          } catch (e) {
            console.log(`📝 Response (first 200 chars):`, result.data.substring(0, 200));
          }
        } else {
          console.log(`📄 Content-Type: ${result.headers['content-type']}`);
          console.log(`📏 Response size: ${result.data.length} bytes`);
        }
        
        // Check for security headers
        const securityHeaders = [
          'x-frame-options',
          'x-content-type-options',
          'x-xss-protection',
          'referrer-policy',
          'strict-transport-security'
        ];
        
        const foundHeaders = securityHeaders.filter(header => 
          result.headers[header] || result.headers[header.toUpperCase()]
        );
        
        if (foundHeaders.length > 0) {
          console.log(`🔒 Security headers: ${foundHeaders.join(', ')}`);
        }
        
        passedTests++;
      } else {
        console.log(`❌ FAIL - Status: ${result.statusCode}`);
        console.log(`📝 Response:`, result.data.substring(0, 200));
      }
      
    } catch (error) {
      console.log(`❌ FAIL - Error: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Summary
  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 Worker deployment successful!');
    console.log('🔗 Worker URL:', workerUrl);
    console.log('⚠️  DNS configuration needed for custom domain');
  } else {
    console.log('\n⚠️  Some worker tests failed. Check worker configuration.');
  }
  
  return passedTests === totalTests;
}

// Run the test
testWorkerDirect()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });