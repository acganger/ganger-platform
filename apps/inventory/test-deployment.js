#!/usr/bin/env node

/**
 * Test deployment of inventory management app
 * Verify worker and static assets are working
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

async function testDeployment() {
  console.log('🧪 Testing inventory management deployment...\n');
  
  const tests = [
    {
      name: 'Health Check Endpoint',
      url: 'https://inventory.gangerdermatology.com/health'
    },
    {
      name: 'Main Page (Index)',
      url: 'https://inventory.gangerdermatology.com/'
    },
    {
      name: 'Dashboard Page',
      url: 'https://inventory.gangerdermatology.com/dashboard'
    },
    {
      name: 'Auth Login Page',
      url: 'https://inventory.gangerdermatology.com/auth/login'
    },
    {
      name: 'API Metrics Endpoint',
      url: 'https://inventory.gangerdermatology.com/api/metrics'
    }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      console.log(`📍 URL: ${test.url}`);
      
      const result = await makeRequest(test.url);
      
      if (result.statusCode === 200) {
        console.log(`✅ PASS - Status: ${result.statusCode}`);
        
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
          console.log(`🔒 Security headers present: ${foundHeaders.length}/${securityHeaders.length}`);
        }
        
        // Check content type
        if (result.headers['content-type']) {
          console.log(`📄 Content-Type: ${result.headers['content-type']}`);
        }
        
        passedTests++;
      } else {
        console.log(`❌ FAIL - Status: ${result.statusCode}`);
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
    console.log('\n🎉 All tests passed! Inventory management app is successfully deployed.');
    console.log('🌐 Live at: https://inventory.gangerdermatology.com');
  } else {
    console.log('\n⚠️  Some tests failed. Check the deployment configuration.');
  }
  
  return passedTests === totalTests;
}

// Run the test
testDeployment()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });