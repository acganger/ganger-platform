#!/usr/bin/env node

/**
 * Verify working apps with Puppeteer
 * Tests that apps are interactive Workers, not static pages
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

// Apps to test and their expected URLs
const APPS_TO_TEST = [
  {
    name: 'Platform Dashboard',
    url: 'https://staff.gangerdermatology.com/dashboard',
    workerUrl: 'https://ganger-platform-dashboard-prod.workers.dev',
    expectedElements: ['.dashboard', '[data-testid="dashboard"]', 'h1', 'button'],
    apiEndpoints: ['/dashboard/api/dashboard', '/dashboard/api/search']
  },
  {
    name: 'EOS L10',
    url: 'https://staff.gangerdermatology.com/l10', 
    workerUrl: 'https://ganger-l10-staff-v3.workers.dev',
    expectedElements: ['.l10', '[data-testid="l10"]', 'h1', 'button'],
    apiEndpoints: ['/l10/api/health']
  },
  {
    name: 'Handouts',
    url: 'https://staff.gangerdermatology.com/handouts',
    workerUrl: 'https://ganger-handouts-prod.workers.dev',
    expectedElements: ['.handouts', '[data-testid="handouts"]', 'h1', 'button'],
    apiEndpoints: ['/handouts/api/health']
  }
];

class AppVerifier {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async init() {
    console.log('🚀 Initializing Puppeteer for app verification...\n');
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Set a user agent
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Set viewport
    await this.page.setViewport({ width: 1280, height: 720 });
    
    console.log('✅ Puppeteer initialized successfully');
  }

  async testApp(app) {
    console.log(`\n🧪 Testing ${app.name}...`);
    console.log(`   URL: ${app.url}`);
    
    const result = {
      name: app.name,
      url: app.url,
      isWorking: false,
      isInteractive: false,
      hasContent: false,
      apiWorking: false,
      loadTime: 0,
      errors: [],
      details: {}
    };

    try {
      const startTime = Date.now();
      
      // Test the main app URL
      console.log(`   📡 Loading ${app.url}...`);
      
      const response = await this.page.goto(app.url, {
        waitUntil: 'networkidle2',
        timeout: 15000
      });
      
      const loadTime = Date.now() - startTime;
      result.loadTime = loadTime;
      
      console.log(`   ⏱️  Load time: ${loadTime}ms`);
      
      // Check if page loaded successfully
      if (!response || !response.ok()) {
        const status = response ? response.status() : 'No response';
        result.errors.push(`Failed to load: HTTP ${status}`);
        console.log(`   ❌ Failed to load: HTTP ${status}`);
        
        // Try the direct worker URL as fallback
        if (app.workerUrl) {
          console.log(`   🔄 Trying direct worker URL: ${app.workerUrl}`);
          const workerResponse = await this.page.goto(app.workerUrl, {
            waitUntil: 'networkidle2',
            timeout: 10000
          });
          
          if (workerResponse && workerResponse.ok()) {
            result.isWorking = true;
            result.details.workerDirectAccess = true;
            console.log(`   ✅ Direct worker access successful`);
          }
        }
      } else {
        result.isWorking = true;
        console.log(`   ✅ Page loaded successfully`);
      }

      // Wait a moment for any JavaScript to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for expected content
      console.log(`   🔍 Checking for interactive content...`);
      
      const pageContent = await this.page.content();
      const pageText = await this.page.evaluate(() => document.body.textContent || '');
      
      // Check if it's a static page vs interactive app
      const isStaticPage = pageContent.includes('<!DOCTYPE html>') && 
                          !pageContent.includes('_next') && 
                          !pageContent.includes('__NEXT_DATA__') &&
                          pageText.length < 500;
      
      if (isStaticPage) {
        result.errors.push('Appears to be static page, not interactive app');
        console.log(`   ⚠️  Appears to be static page, not interactive app`);
      } else {
        result.hasContent = true;
        console.log(`   ✅ Has dynamic content`);
      }

      // Test for interactive elements
      let interactiveElements = 0;
      
      for (const selector of app.expectedElements) {
        try {
          const elements = await this.page.$$(selector);
          if (elements.length > 0) {
            interactiveElements += elements.length;
            console.log(`   ✅ Found ${elements.length} element(s): ${selector}`);
          }
        } catch (error) {
          // Element not found, that's ok
        }
      }
      
      if (interactiveElements > 0) {
        result.isInteractive = true;
        result.details.interactiveElements = interactiveElements;
        console.log(`   ✅ Found ${interactiveElements} interactive elements`);
      } else {
        result.errors.push('No interactive elements found');
        console.log(`   ❌ No expected interactive elements found`);
      }

      // Test API endpoints
      console.log(`   🔌 Testing API endpoints...`);
      let workingApis = 0;
      
      for (const endpoint of app.apiEndpoints) {
        try {
          const apiUrl = app.url + endpoint.replace(app.url.split('/').pop(), '');
          console.log(`     Testing: ${apiUrl}`);
          
          const apiResponse = await this.page.evaluate(async (url) => {
            try {
              const response = await fetch(url);
              return {
                ok: response.ok,
                status: response.status,
                hasJson: response.headers.get('content-type')?.includes('application/json')
              };
            } catch (error) {
              return { ok: false, error: error.message };
            }
          }, apiUrl);
          
          if (apiResponse.ok) {
            workingApis++;
            console.log(`     ✅ API working: ${endpoint}`);
          } else {
            console.log(`     ❌ API failed: ${endpoint} (${apiResponse.status || apiResponse.error})`);
          }
        } catch (error) {
          console.log(`     ❌ API test error: ${endpoint} - ${error.message}`);
        }
      }
      
      if (workingApis > 0) {
        result.apiWorking = true;
        result.details.workingApis = workingApis;
        console.log(`   ✅ ${workingApis}/${app.apiEndpoints.length} APIs working`);
      }

      // Overall assessment
      if (result.isWorking && result.hasContent && result.isInteractive) {
        console.log(`   🎉 ${app.name} is working as interactive app!`);
      } else if (result.isWorking && result.hasContent) {
        console.log(`   ⚠️  ${app.name} is working but may have limited interactivity`);
      } else if (result.isWorking) {
        console.log(`   ⚠️  ${app.name} loads but appears to be static`);
      } else {
        console.log(`   ❌ ${app.name} is not working properly`);
      }

    } catch (error) {
      result.errors.push(`Test error: ${error.message}`);
      console.log(`   ❌ Test error: ${error.message}`);
    }

    this.results.push(result);
    return result;
  }

  async generateReport() {
    console.log('\n📊 VERIFICATION REPORT');
    console.log('========================\n');

    let workingApps = 0;
    let interactiveApps = 0;
    let totalApps = this.results.length;

    this.results.forEach(result => {
      if (result.isWorking) workingApps++;
      if (result.isInteractive) interactiveApps++;

      console.log(`${result.name}:`);
      console.log(`  Status: ${result.isWorking ? '✅ Working' : '❌ Not Working'}`);
      console.log(`  Interactive: ${result.isInteractive ? '✅ Yes' : '❌ No'}`);
      console.log(`  Load Time: ${result.loadTime}ms`);
      
      if (result.details.interactiveElements) {
        console.log(`  Elements Found: ${result.details.interactiveElements}`);
      }
      
      if (result.details.workingApis) {
        console.log(`  Working APIs: ${result.details.workingApis}`);
      }
      
      if (result.errors.length > 0) {
        console.log(`  Issues: ${result.errors.join(', ')}`);
      }
      
      console.log('');
    });

    console.log('SUMMARY:');
    console.log(`📱 Working Apps: ${workingApps}/${totalApps} (${Math.round(workingApps/totalApps*100)}%)`);
    console.log(`⚡ Interactive Apps: ${interactiveApps}/${totalApps} (${Math.round(interactiveApps/totalApps*100)}%)`);

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalApps,
        workingApps,
        interactiveApps,
        successRate: Math.round(workingApps/totalApps*100)
      },
      results: this.results
    };

    fs.writeFileSync('app-verification-report.json', JSON.stringify(report, null, 2));
    console.log('\n💾 Detailed report saved to: app-verification-report.json');

    if (interactiveApps === totalApps) {
      console.log('\n🎉 SUCCESS: All apps are working as interactive Workers!');
      return true;
    } else if (workingApps === totalApps) {
      console.log('\n⚠️  PARTIAL SUCCESS: All apps load but some may need interactivity fixes');
      return false;
    } else {
      console.log('\n❌ ISSUES: Some apps are not working properly');
      return false;
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('\n🧹 Cleanup completed');
    }
  }
}

async function main() {
  const verifier = new AppVerifier();
  
  try {
    await verifier.init();
    
    for (const app of APPS_TO_TEST) {
      await verifier.testApp(app);
    }
    
    const success = await verifier.generateReport();
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await verifier.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = { AppVerifier, APPS_TO_TEST };