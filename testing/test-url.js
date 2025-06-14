const https = require('https');

function testURL(url) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Testing: ${url}`);
    
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const title = data.match(/<title>(.*?)<\/title>/i);
        const hasL10Dashboard = data.includes('Team Performance Dashboard') || 
                               data.includes('EOS L10 Meeting Dashboard');
        const hasScorecard = data.includes('Scorecard');
        const hasSidebar = data.includes('sidebar') || data.includes('lg:w-72');
        const hasCompassElements = data.includes('Weekly Performance') && 
                                  data.includes('85%') && 
                                  data.includes('Goals Met');
        const hasBasicGrid = data.includes('17 applications') || 
                            data.includes('Staff Management Portal');
        
        resolve({
          url,
          status: res.statusCode,
          title: title ? title[1] : 'No title found',
          hasL10Dashboard,
          hasScorecard,
          hasSidebar,
          hasCompassElements,
          hasBasicGrid,
          contentLength: data.length
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
  });
}

async function runTests() {
  console.log('🚀 Testing Compass template URLs...\n');
  
  try {
    const result = await testURL('https://staff.gangerdermatology.com/l10/compass');
    
    console.log(`📄 Status: ${result.status}`);
    console.log(`📋 Title: ${result.title}`);
    console.log(`📏 Content Length: ${result.contentLength} characters`);
    console.log(`\n🔍 Template Analysis:`);
    console.log(`   ${result.hasL10Dashboard ? '✅' : '❌'} Has L10 Dashboard`);
    console.log(`   ${result.hasScorecard ? '✅' : '❌'} Has Scorecard Section`);
    console.log(`   ${result.hasSidebar ? '✅' : '❌'} Has Sidebar Navigation`);
    console.log(`   ${result.hasCompassElements ? '✅' : '❌'} Has Compass Elements`);
    console.log(`   ${result.hasBasicGrid ? '❌' : '✅'} NOT Basic Grid`);
    
    const isCompassTemplate = result.hasL10Dashboard && result.hasScorecard && result.hasSidebar;
    
    console.log(`\n🎯 Result: ${isCompassTemplate ? '✅ COMPASS TEMPLATE DETECTED!' : '❌ Basic grid layout detected'}`);
    
    if (!isCompassTemplate && result.hasBasicGrid) {
      console.log(`⚠️  The route may not be deployed yet or there's a caching issue.`);
      console.log(`💡 The Worker needs to be deployed with the new routing logic.`);
    }
    
  } catch (error) {
    console.error('❌ Error testing URL:', error.message);
  }
}

runTests();