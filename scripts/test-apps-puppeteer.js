#!/usr/bin/env node

/**
 * Comprehensive Puppeteer Testing Script for Ganger Platform Applications
 * 
 * This script systematically tests all Next.js applications in the platform by:
 * - Starting each application on a unique port
 * - Taking screenshots of key pages
 * - Checking for console errors and 404s
 * - Testing basic navigation functionality
 * - Generating detailed test reports
 */

const puppeteer = require('puppeteer');
const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const execAsync = util.promisify(exec);

// Configuration
const PROJECT_ROOT = '/mnt/q/Projects/ganger-platform';
const APPTEST_DIR = path.join(PROJECT_ROOT, 'apptest');
const APPS_DIR = path.join(PROJECT_ROOT, 'apps');

// Applications to test with their assigned ports
const APPLICATIONS = [
  { name: 'ai-receptionist', port: 3001 },
  { name: 'batch-closeout', port: 3002 },
  { name: 'call-center-ops', port: 3003 },
  { name: 'checkin-kiosk', port: 3004 },
  { name: 'clinical-staffing', port: 3005 },
  { name: 'compliance-training', port: 3006 },
  { name: 'component-showcase', port: 3007 },
  { name: 'config-dashboard', port: 3008 },
  { name: 'eos-l10', port: 3009 },
  { name: 'handouts', port: 3010 },
  { name: 'integration-status', port: 3011 },
  { name: 'inventory', port: 3012 },
  { name: 'medication-auth', port: 3013 },
  { name: 'pharma-scheduling', port: 3014 },
  { name: 'platform-dashboard', port: 3015 },
  { name: 'socials-reviews', port: 3016 },
  { name: 'staff', port: 3017 }
];

// Test configuration
const TEST_CONFIG = {
  timeout: 30000, // 30 seconds per app
  headless: true,
  viewport: { width: 1920, height: 1080 },
  screenshotQuality: 90
};

class AppTester {
  constructor() {
    this.results = [];
    this.runningProcesses = new Map();
    this.browser = null;
  }

  /**
   * Initialize the testing environment
   */
  async initialize() {
    console.log('🚀 Initializing Puppeteer Testing Environment...\n');
    
    // Create apptest directory structure
    await this.createDirectoryStructure();
    
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    console.log('✅ Browser launched successfully');
  }

  /**
   * Create directory structure for test results
   */
  async createDirectoryStructure() {
    for (const app of APPLICATIONS) {
      const appDir = path.join(APPTEST_DIR, app.name);
      await fs.mkdir(appDir, { recursive: true });
      await fs.mkdir(path.join(appDir, 'screenshots'), { recursive: true });
      await fs.mkdir(path.join(appDir, 'logs'), { recursive: true });
    }
    console.log('✅ Created directory structure for all applications');
  }

  /**
   * Check if an application can be built
   */
  async checkBuildStatus(appName) {
    const appPath = path.join(APPS_DIR, appName);
    
    try {
      console.log(`🔍 Checking build status for ${appName}...`);
      
      // Check if package.json exists
      const packageJsonPath = path.join(appPath, 'package.json');
      try {
        await fs.access(packageJsonPath);
      } catch (error) {
        return {
          canBuild: false,
          error: 'package.json not found',
          details: `No package.json found at ${packageJsonPath}`
        };
      }

      // Try to build the application
      const { stdout, stderr } = await execAsync('npm run build', {
        cwd: appPath,
        timeout: 120000 // 2 minutes timeout for build
      });

      return {
        canBuild: true,
        buildOutput: stdout,
        buildErrors: stderr
      };

    } catch (error) {
      return {
        canBuild: false,
        error: error.message,
        details: error.stderr || error.stdout || 'Unknown build error'
      };
    }
  }

  /**
   * Start a Next.js application on specified port
   */
  async startApplication(appName, port) {
    return new Promise((resolve, reject) => {
      const appPath = path.join(APPS_DIR, appName);
      
      console.log(`🚀 Starting ${appName} on port ${port}...`);
      
      // Start the application
      const child = spawn('npm', ['run', 'dev'], {
        cwd: appPath,
        env: { ...process.env, PORT: port },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let startupOutput = '';
      let hasStarted = false;
      
      const timeout = setTimeout(() => {
        if (!hasStarted) {
          reject(new Error(`Application ${appName} failed to start within timeout`));
        }
      }, TEST_CONFIG.timeout);

      child.stdout.on('data', (data) => {
        const output = data.toString();
        startupOutput += output;
        
        // Check for successful startup indicators
        if (output.includes('Ready') || output.includes('started server') || output.includes(`localhost:${port}`)) {
          if (!hasStarted) {
            hasStarted = true;
            clearTimeout(timeout);
            this.runningProcesses.set(appName, child);
            resolve({ process: child, output: startupOutput });
          }
        }
      });

      child.stderr.on('data', (data) => {
        startupOutput += data.toString();
      });

      child.on('error', (error) => {
        if (!hasStarted) {
          clearTimeout(timeout);
          reject(error);
        }
      });

      child.on('exit', (code) => {
        if (!hasStarted && code !== 0) {
          clearTimeout(timeout);
          reject(new Error(`Application ${appName} exited with code ${code}: ${startupOutput}`));
        }
      });
    });
  }

  /**
   * Wait for application to be ready
   */
  async waitForApplication(port, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`http://localhost:${port}`);
        if (response.status < 500) {
          return true;
        }
      } catch (error) {
        // Connection refused is expected while starting up
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return false;
  }

  /**
   * Test an individual application
   */
  async testApplication(appName, port) {
    console.log(`\n📱 Testing Application: ${appName}`);
    console.log(`🌐 Port: ${port}`);
    
    const testResult = {
      name: appName,
      port: port,
      timestamp: new Date().toISOString(),
      buildStatus: null,
      startupStatus: null,
      testResults: {},
      screenshots: [],
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Check build status
      console.log(`   📦 Checking build status...`);
      testResult.buildStatus = await this.checkBuildStatus(appName);
      
      if (!testResult.buildStatus.canBuild) {
        console.log(`   ❌ Build failed: ${testResult.buildStatus.error}`);
        testResult.errors.push(`Build failed: ${testResult.buildStatus.error}`);
        return testResult;
      }
      console.log(`   ✅ Build check passed`);

      // Step 2: Start application
      console.log(`   🚀 Starting application...`);
      try {
        const startResult = await this.startApplication(appName, port);
        testResult.startupStatus = { success: true, output: startResult.output };
        console.log(`   ✅ Application started successfully`);
      } catch (error) {
        console.log(`   ❌ Failed to start: ${error.message}`);
        testResult.startupStatus = { success: false, error: error.message };
        testResult.errors.push(`Startup failed: ${error.message}`);
        return testResult;
      }

      // Step 3: Wait for application to be ready
      console.log(`   ⏳ Waiting for application to be ready...`);
      const isReady = await this.waitForApplication(port);
      if (!isReady) {
        console.log(`   ❌ Application not ready after waiting`);
        testResult.errors.push('Application not ready after startup');
        return testResult;
      }
      console.log(`   ✅ Application is ready`);

      // Step 4: Run Puppeteer tests
      console.log(`   🧪 Running browser tests...`);
      await this.runBrowserTests(appName, port, testResult);

    } catch (error) {
      console.log(`   💥 Unexpected error: ${error.message}`);
      testResult.errors.push(`Unexpected error: ${error.message}`);
    } finally {
      // Clean up: Stop the application
      await this.stopApplication(appName);
    }

    return testResult;
  }

  /**
   * Run browser-based tests using Puppeteer
   */
  async runBrowserTests(appName, port, testResult) {
    const page = await this.browser.newPage();
    
    try {
      // Set viewport
      await page.setViewport(TEST_CONFIG.viewport);
      
      // Collect console logs and errors
      const consoleLogs = [];
      const pageErrors = [];
      
      page.on('console', msg => {
        consoleLogs.push({
          type: msg.type(),
          text: msg.text(),
          timestamp: new Date().toISOString()
        });
      });
      
      page.on('pageerror', error => {
        pageErrors.push({
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      });

      const baseUrl = `http://localhost:${port}`;
      
      // Test 1: Load main page
      console.log(`   📸 Testing main page...`);
      try {
        await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 15000 });
        
        // Take screenshot
        const mainScreenshotPath = path.join(APPTEST_DIR, appName, 'screenshots', '01-main-page.png');
        await page.screenshot({ 
          path: mainScreenshotPath, 
          quality: TEST_CONFIG.screenshotQuality,
          fullPage: true 
        });
        testResult.screenshots.push('01-main-page.png');
        
        // Check page title
        const title = await page.title();
        testResult.testResults.mainPage = {
          success: true,
          title: title,
          url: baseUrl,
          screenshot: '01-main-page.png'
        };
        
        console.log(`   ✅ Main page loaded: "${title}"`);
        
      } catch (error) {
        console.log(`   ❌ Main page failed: ${error.message}`);
        testResult.testResults.mainPage = {
          success: false,
          error: error.message
        };
        testResult.errors.push(`Main page error: ${error.message}`);
      }

      // Test 2: Check for common routes
      const commonRoutes = ['/', '/about', '/dashboard', '/settings', '/api/health'];
      
      for (const route of commonRoutes) {
        try {
          const response = await page.goto(`${baseUrl}${route}`, { 
            waitUntil: 'networkidle2', 
            timeout: 10000 
          });
          
          if (response.status() === 404) {
            testResult.warnings.push(`Route ${route} returns 404`);
          } else if (response.status() >= 500) {
            testResult.errors.push(`Route ${route} returns ${response.status()}`);
          }
          
        } catch (error) {
          // Route might not exist, that's okay
          testResult.warnings.push(`Route ${route} not accessible: ${error.message}`);
        }
      }

      // Test 3: Check for navigation elements
      console.log(`   🧭 Testing navigation...`);
      try {
        await page.goto(baseUrl, { waitUntil: 'networkidle2' });
        
        const navElements = await page.$$eval('nav a, [role="navigation"] a, .nav a', links => 
          links.map(link => ({
            text: link.textContent.trim(),
            href: link.href
          }))
        );
        
        testResult.testResults.navigation = {
          success: true,
          navigationLinks: navElements.length,
          links: navElements.slice(0, 10) // First 10 links
        };
        
        console.log(`   ✅ Found ${navElements.length} navigation links`);
        
      } catch (error) {
        testResult.testResults.navigation = {
          success: false,
          error: error.message
        };
      }

      // Test 4: Performance metrics
      console.log(`   ⚡ Measuring performance...`);
      try {
        const performanceMetrics = await page.evaluate(() => {
          const perfData = performance.getEntriesByType('navigation')[0];
          return {
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
            totalLoadTime: perfData.loadEventEnd - perfData.fetchStart
          };
        });
        
        testResult.testResults.performance = performanceMetrics;
        console.log(`   ✅ Performance measured - Load time: ${performanceMetrics.totalLoadTime}ms`);
        
      } catch (error) {
        testResult.warnings.push(`Performance measurement failed: ${error.message}`);
      }

      // Store console logs and errors
      testResult.testResults.consoleLogs = consoleLogs;
      testResult.testResults.pageErrors = pageErrors;
      
      if (pageErrors.length > 0) {
        console.log(`   ⚠️  Found ${pageErrors.length} page errors`);
        testResult.errors.push(...pageErrors.map(e => e.message));
      }

    } finally {
      await page.close();
    }
  }

  /**
   * Stop a running application
   */
  async stopApplication(appName) {
    const process = this.runningProcesses.get(appName);
    if (process) {
      console.log(`   🛑 Stopping ${appName}...`);
      process.kill('SIGTERM');
      this.runningProcesses.delete(appName);
      
      // Wait a moment for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport() {
    console.log('\n📊 Generating comprehensive test report...');
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalApps: this.results.length,
      successful: this.results.filter(r => r.errors.length === 0).length,
      failed: this.results.filter(r => r.errors.length > 0).length,
      withWarnings: this.results.filter(r => r.warnings.length > 0).length,
      results: this.results
    };

    // Generate JSON report
    const jsonReportPath = path.join(APPTEST_DIR, 'test-report.json');
    await fs.writeFile(jsonReportPath, JSON.stringify(summary, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(summary);
    const htmlReportPath = path.join(APPTEST_DIR, 'test-report.html');
    await fs.writeFile(htmlReportPath, htmlReport);

    // Generate individual app reports
    for (const result of this.results) {
      const appReportPath = path.join(APPTEST_DIR, result.name, 'report.json');
      await fs.writeFile(appReportPath, JSON.stringify(result, null, 2));
    }

    console.log(`✅ Reports generated:`);
    console.log(`   📋 Summary: ${jsonReportPath}`);
    console.log(`   🌐 HTML Report: ${htmlReportPath}`);
    console.log(`   📁 Individual reports in each app directory`);

    return summary;
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(summary) {
    const successRate = ((summary.successful / summary.totalApps) * 100).toFixed(1);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ganger Platform - Application Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .stat-card { text-align: center; padding: 20px; border-radius: 8px; border: 2px solid #e1e5e9; }
        .stat-card.success { border-color: #28a745; background: #f8fff9; }
        .stat-card.danger { border-color: #dc3545; background: #fff8f8; }
        .stat-card.warning { border-color: #ffc107; background: #fffdf5; }
        .stat-card h3 { margin: 0; font-size: 2em; }
        .stat-card p { margin: 10px 0 0 0; color: #666; }
        .results { padding: 0 30px 30px 30px; }
        .app-result { margin-bottom: 20px; border: 1px solid #e1e5e9; border-radius: 8px; overflow: hidden; }
        .app-header { padding: 15px 20px; background: #f8f9fa; border-bottom: 1px solid #e1e5e9; cursor: pointer; }
        .app-header h3 { margin: 0; display: flex; align-items: center; justify-content: space-between; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; }
        .status-success { background: #28a745; color: white; }
        .status-error { background: #dc3545; color: white; }
        .status-warning { background: #ffc107; color: #333; }
        .app-details { padding: 20px; display: none; }
        .app-details.active { display: block; }
        .detail-section { margin-bottom: 20px; }
        .detail-section h4 { margin: 0 0 10px 0; color: #333; }
        .error-list, .warning-list { list-style: none; padding: 0; }
        .error-list li, .warning-list li { padding: 8px 12px; margin: 5px 0; border-radius: 4px; }
        .error-list li { background: #fff5f5; border-left: 4px solid #dc3545; }
        .warning-list li { background: #fffbf0; border-left: 4px solid #ffc107; }
        .screenshot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
        .screenshot { border: 1px solid #e1e5e9; border-radius: 4px; overflow: hidden; }
        .screenshot img { width: 100%; height: 150px; object-fit: cover; }
        .screenshot p { padding: 10px; margin: 0; font-size: 0.9em; background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Ganger Platform Test Report</h1>
            <p>Generated on ${new Date(summary.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <h3>${summary.totalApps}</h3>
                <p>Total Applications</p>
            </div>
            <div class="stat-card success">
                <h3>${summary.successful}</h3>
                <p>Successful</p>
            </div>
            <div class="stat-card danger">
                <h3>${summary.failed}</h3>
                <p>Failed</p>
            </div>
            <div class="stat-card warning">
                <h3>${summary.withWarnings}</h3>
                <p>With Warnings</p>
            </div>
            <div class="stat-card">
                <h3>${successRate}%</h3>
                <p>Success Rate</p>
            </div>
        </div>
        
        <div class="results">
            <h2>Application Results</h2>
            ${summary.results.map(result => `
                <div class="app-result">
                    <div class="app-header" onclick="toggleDetails('${result.name}')">
                        <h3>
                            ${result.name}
                            <span class="status-badge ${result.errors.length > 0 ? 'status-error' : result.warnings.length > 0 ? 'status-warning' : 'status-success'}">
                                ${result.errors.length > 0 ? 'Failed' : result.warnings.length > 0 ? 'Warning' : 'Success'}
                            </span>
                        </h3>
                    </div>
                    <div class="app-details" id="details-${result.name}">
                        ${result.errors.length > 0 ? `
                            <div class="detail-section">
                                <h4>❌ Errors (${result.errors.length})</h4>
                                <ul class="error-list">
                                    ${result.errors.map(error => `<li>${error}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        ${result.warnings.length > 0 ? `
                            <div class="detail-section">
                                <h4>⚠️ Warnings (${result.warnings.length})</h4>
                                <ul class="warning-list">
                                    ${result.warnings.map(warning => `<li>${warning}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        ${result.screenshots.length > 0 ? `
                            <div class="detail-section">
                                <h4>📸 Screenshots (${result.screenshots.length})</h4>
                                <div class="screenshot-grid">
                                    ${result.screenshots.map(screenshot => `
                                        <div class="screenshot">
                                            <img src="${result.name}/screenshots/${screenshot}" alt="${screenshot}" onerror="this.style.display='none'">
                                            <p>${screenshot}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="detail-section">
                            <h4>📊 Test Details</h4>
                            <p><strong>Port:</strong> ${result.port}</p>
                            <p><strong>Build Status:</strong> ${result.buildStatus?.canBuild ? '✅ Success' : '❌ Failed'}</p>
                            <p><strong>Startup Status:</strong> ${result.startupStatus?.success ? '✅ Success' : '❌ Failed'}</p>
                            ${result.testResults?.performance ? `<p><strong>Load Time:</strong> ${result.testResults.performance.totalLoadTime}ms</p>` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    
    <script>
        function toggleDetails(appName) {
            const details = document.getElementById('details-' + appName);
            details.classList.toggle('active');
        }
    </script>
</body>
</html>`;
  }

  /**
   * Run tests for all applications
   */
  async runAllTests() {
    console.log(`🧪 Starting comprehensive test suite for ${APPLICATIONS.length} applications\n`);
    
    for (const app of APPLICATIONS) {
      const result = await this.testApplication(app.name, app.port);
      this.results.push(result);
      
      // Brief summary
      const status = result.errors.length > 0 ? '❌ FAILED' : 
                    result.warnings.length > 0 ? '⚠️  WARNING' : '✅ PASSED';
      console.log(`   ${status} ${app.name} (Port ${app.port})`);
    }
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    // Stop any remaining processes
    for (const [appName, process] of this.runningProcesses) {
      console.log(`   Stopping ${appName}...`);
      process.kill('SIGTERM');
    }
    
    // Close browser
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Browser closed');
    }
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      await this.initialize();
      await this.runAllTests();
      const summary = await this.generateReport();
      
      console.log('\n🎉 Testing Complete!');
      console.log(`📊 Results: ${summary.successful}/${summary.totalApps} applications passed`);
      console.log(`📁 Reports saved to: ${APPTEST_DIR}`);
      
      return summary;
      
    } catch (error) {
      console.error('💥 Fatal error during testing:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Command line execution
if (require.main === module) {
  const tester = new AppTester();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n⏹️  Received interrupt signal, cleaning up...');
    await tester.cleanup();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n⏹️  Received terminate signal, cleaning up...');
    await tester.cleanup();
    process.exit(0);
  });
  
  // Run the tests
  tester.run()
    .then(summary => {
      const exitCode = summary.failed > 0 ? 1 : 0;
      console.log(`\n${exitCode === 0 ? '✅' : '❌'} Exiting with code ${exitCode}`);
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { AppTester, APPLICATIONS, TEST_CONFIG };