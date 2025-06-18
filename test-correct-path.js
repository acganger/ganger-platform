#!/usr/bin/env node

/**
 * Test inventory app at correct path: staff.gangerdermatology.com/inventory
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

async function testCorrectPath() {
  console.log('🧪 Testing inventory app at correct path...\n');
  
  const tests = [
    {
      name: 'Staff Portal Main Page',
      url: 'https://staff.gangerdermatology.com/'
    },
    {
      name: 'Inventory App Root',
      url: 'https://staff.gangerdermatology.com/inventory'
    },
    {
      name: 'Inventory Dashboard',
      url: 'https://staff.gangerdermatology.com/inventory/dashboard'
    },
    {
      name: 'Inventory Auth Login',
      url: 'https://staff.gangerdermatology.com/inventory/auth/login'
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
        
        // Check content type
        if (result.headers['content-type']) {
          console.log(`📄 Content-Type: ${result.headers['content-type']}`);
        }
        
        // Show response size
        console.log(`📏 Response size: ${result.data.length} bytes`);
        
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
          console.log(`🔒 Security headers: ${foundHeaders.length}/${securityHeaders.length}`);
        }
        
        // Check if it looks like the inventory app (for inventory paths)
        if (test.url.includes('/inventory')) {
          if (result.data.includes('inventory') || result.data.includes('Inventory')) {
            console.log(`📦 Inventory content detected`);
          } else {
            console.log(`⚠️  May not be serving inventory app content`);
          }
        }
        
        passedTests++;
      } else {
        console.log(`❌ FAIL - Status: ${result.statusCode}`);
        console.log(`📝 Response (first 200 chars):`, result.data.substring(0, 200));
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
    console.log('\n🎉 All tests passed! Inventory app correctly deployed at staff.gangerdermatology.com/inventory');
  } else if (passedTests > 0) {
    console.log('\n⚠️  Some tests passed. Check specific failures above.');
  } else {
    console.log('\n❌ All tests failed. Check DNS and deployment configuration.');
  }
  
  return passedTests === totalTests;
}

// Run the test
testCorrectPath()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });