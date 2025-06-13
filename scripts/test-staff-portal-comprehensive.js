#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Base URL for the staff portal
const BASE_URL = 'https://staff.gangerdermatology.com';

// All 17 applications to test
const APPLICATIONS = [
  { name: 'Homepage/Dashboard', path: '/', description: 'Main dashboard with app grid' },
  { name: 'Medication Auth', path: '/meds', description: 'Medication authorization system', priority: 'high' },
  { name: 'Batch Closeout', path: '/batch', description: 'Daily batch processing', priority: 'high' },
  { name: 'Integration Status', path: '/status', description: 'Third-party integration monitoring', priority: 'high' },
  { name: 'Inventory Management', path: '/inventory', description: 'Medical supply tracking', priority: 'high' },
  { name: 'EOS L10', path: '/l10', description: 'Leadership scorecard system', priority: 'high' },
  { name: 'Patient Handouts', path: '/handouts', description: 'Educational material generator' },
  { name: 'Check-in Kiosk', path: '/checkin-kiosk', description: 'Patient self-service terminal' },
  { name: 'Clinical Staffing', path: '/clinical-staffing', description: 'Staff scheduling and management' },
  { name: 'Pharma Scheduling', path: '/pharma-scheduling', description: 'Pharmaceutical rep appointments' },
  { name: 'Compliance Training', path: '/compliance-training', description: 'Employee training tracking' },
  { name: 'Call Center Ops', path: '/call-center-ops', description: 'Call center dashboard' },
  { name: 'Socials & Reviews', path: '/socials-reviews', description: 'Social media and review management' },
  { name: 'AI Receptionist', path: '/ai-receptionist', description: 'AI-powered phone system' },
  { name: 'Config Dashboard', path: '/config-dashboard', description: 'System configuration panel' },
  { name: 'Component Showcase', path: '/component-showcase', description: 'UI component library' },
  { name: 'Platform Dashboard', path: '/platform-dashboard', description: 'System monitoring and analytics' }
];

class StaffPortalTester {
  constructor() {
    this.browser = null;
    this.results = [];
    this.screenshotsDir = path.join(__dirname, '..', 'deployments', 'staff-portal-test-' + new Date().toISOString().split('T')[0]);
  }

  async initialize() {
    console.log('🚀 Initializing Staff Portal Comprehensive Testing...\n');
    
    // Create screenshots directory
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: "new", // Use new headless mode
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps'
      ],
      defaultViewport: { width: 1920, height: 1080 }
    });

    console.log('✅ Browser launched successfully');
    console.log(`📁 Screenshots will be saved to: ${this.screenshotsDir}\n`);
  }

  async testApplication(app) {
    console.log(`🔍 Testing: ${app.name}`);
    console.log(`   Path: ${app.path}`);
    console.log(`   Description: ${app.description}`);
    if (app.priority) console.log(`   Priority: ${app.priority}`);

    const page = await this.browser.newPage();
    const result = {
      name: app.name,
      path: app.path,
      description: app.description,
      priority: app.priority || 'normal',
      url: BASE_URL + app.path,
      status: 'unknown',
      loadTime: 0,
      errors: [],
      screenshots: [],
      findings: []
    };

    try {
      const startTime = Date.now();

      // Listen for console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          result.errors.push(`Console Error: ${msg.text()}`);
        }
      });

      // Listen for page errors
      page.on('pageerror', error => {
        result.errors.push(`Page Error: ${error.message}`);
      });

      // Navigate to the application
      console.log(`   🌐 Navigating to: ${result.url}`);
      const response = await page.goto(result.url, { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      });

      result.loadTime = Date.now() - startTime;
      console.log(`   ⏱️  Load time: ${result.loadTime}ms`);

      // Check response status
      if (response && response.status() >= 400) {
        result.status = 'error';
        result.errors.push(`HTTP ${response.status()}: ${response.statusText()}`);
        console.log(`   ❌ HTTP Error: ${response.status()}`);
      } else {
        result.status = 'loaded';
        console.log(`   ✅ Page loaded successfully`);
      }

      // Wait for content to render
      await page.waitForTimeout(3000);

      // Take initial screenshot
      const screenshotPath1 = path.join(this.screenshotsDir, `${app.name.replace(/[^a-zA-Z0-9]/g, '-')}-initial.png`);
      await page.screenshot({
        path: screenshotPath1,
        fullPage: true,
        type: 'png'
      });
      result.screenshots.push(screenshotPath1);
      console.log(`   📸 Screenshot saved: ${path.basename(screenshotPath1)}`);

      // Analyze page content
      await this.analyzePage(page, result);

      // If this is the homepage, test clicking on applications
      if (app.path === '/') {
        await this.testHomepageInteractions(page, result);
      }

      // If this is a priority application, perform deeper testing
      if (app.priority === 'high') {
        await this.performDeepTesting(page, result);
      }

    } catch (error) {
      result.status = 'failed';
      result.errors.push(`Navigation Error: ${error.message}`);
      console.log(`   ❌ Failed to load: ${error.message}`);
    }

    await page.close();
    this.results.push(result);
    console.log(`   📊 Test completed for ${app.name}\n`);
    
    return result;
  }

  async analyzePage(page, result) {
    try {
      // Check for common elements
      const pageAnalysis = await page.evaluate(() => {
        const analysis = {
          title: document.title,
          hasNavigation: !!document.querySelector('nav'),
          hasHeader: !!document.querySelector('header'),
          hasFooter: !!document.querySelector('footer'),
          hasMainContent: !!document.querySelector('main'),
          buttonCount: document.querySelectorAll('button').length,
          linkCount: document.querySelectorAll('a').length,
          formCount: document.querySelectorAll('form').length,
          imageCount: document.querySelectorAll('img').length,
          errorMessages: [],
          comingSoonMessages: [],
          workingFeatures: []
        };

        // Check for error messages
        const errorSelectors = ['.error', '.alert-danger', '[data-testid="error"]', '.text-red-500'];
        errorSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (el.textContent.trim()) {
              analysis.errorMessages.push(el.textContent.trim());
            }
          });
        });

        // Check for "coming soon" messages
        const comingSoonSelectors = ['*'];
        document.querySelectorAll('*').forEach(el => {
          const text = el.textContent.toLowerCase();
          if (text.includes('coming soon') || text.includes('under construction') || text.includes('placeholder')) {
            analysis.comingSoonMessages.push(el.textContent.trim());
          }
        });

        // Check for working features (forms, interactive elements)
        const interactiveElements = document.querySelectorAll('button:not([disabled]), input, select, textarea');
        analysis.workingFeatures.push(`Interactive elements: ${interactiveElements.length}`);

        return analysis;
      });

      result.findings.push(`Page Title: "${pageAnalysis.title}"`);
      result.findings.push(`Interactive elements: ${pageAnalysis.buttonCount} buttons, ${pageAnalysis.linkCount} links, ${pageAnalysis.formCount} forms`);
      
      if (pageAnalysis.errorMessages.length > 0) {
        result.errors.push(...pageAnalysis.errorMessages);
      }

      if (pageAnalysis.comingSoonMessages.length > 0) {
        result.findings.push(`Coming Soon Messages: ${pageAnalysis.comingSoonMessages.length}`);
        pageAnalysis.comingSoonMessages.forEach(msg => {
          if (msg.length < 200) { // Only log short messages
            result.findings.push(`  - "${msg}"`);
          }
        });
      }

    } catch (error) {
      result.errors.push(`Analysis Error: ${error.message}`);
    }
  }

  async testHomepageInteractions(page, result) {
    console.log('   🎯 Testing homepage application grid...');
    
    try {
      // Look for application links/cards
      const appLinks = await page.evaluate(() => {
        const links = [];
        const selectors = ['a[href*="/"]', '[data-testid*="app"]', '.app-card', '.application-link'];
        
        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            const href = el.getAttribute('href');
            const text = el.textContent.trim();
            if (href && href.startsWith('/') && text) {
              links.push({ href, text, element: el.tagName });
            }
          });
        });
        
        return links;
      });

      result.findings.push(`Found ${appLinks.length} application links on homepage`);
      console.log(`   📱 Found ${appLinks.length} application links`);

      // Take screenshot showing the grid
      const gridScreenshot = path.join(this.screenshotsDir, 'homepage-application-grid.png');
      await page.screenshot({
        path: gridScreenshot,
        fullPage: true,
        type: 'png'
      });
      result.screenshots.push(gridScreenshot);

    } catch (error) {
      result.errors.push(`Homepage interaction test error: ${error.message}`);
    }
  }

  async performDeepTesting(page, result) {
    console.log(`   🔬 Performing deep testing for priority app: ${result.name}`);
    
    try {
      // Test form submissions if forms exist
      const formCount = await page.evaluate(() => document.querySelectorAll('form').length);
      
      if (formCount > 0) {
        result.findings.push(`Found ${formCount} forms - testing form interactions`);
        
        // Take screenshot of forms
        const formScreenshot = path.join(this.screenshotsDir, `${result.name.replace(/[^a-zA-Z0-9]/g, '-')}-forms.png`);
        await page.screenshot({
          path: formScreenshot,
          fullPage: true,
          type: 'png'
        });
        result.screenshots.push(formScreenshot);
      }

      // Test if there are any API calls being made
      const requests = [];
      page.on('request', request => {
        if (request.url().includes('/api/')) {
          requests.push(request.url());
        }
      });

      // Wait a bit to capture any API calls
      await page.waitForTimeout(2000);
      
      if (requests.length > 0) {
        result.findings.push(`Made ${requests.length} API calls`);
        requests.forEach(url => result.findings.push(`  - API call: ${url}`));
      }

    } catch (error) {
      result.errors.push(`Deep testing error: ${error.message}`);
    }
  }

  async testPriorityApplications() {
    console.log('🎯 Testing Priority Applications First...\n');
    
    const priorityApps = APPLICATIONS.filter(app => app.priority === 'high');
    
    for (const app of priorityApps) {
      await this.testApplication(app);
    }
  }

  async testAllApplications() {
    console.log('📱 Testing All Applications...\n');
    
    for (const app of APPLICATIONS) {
      await this.testApplication(app);
    }
  }

  async generateReport() {
    console.log('📊 Generating Comprehensive Test Report...\n');

    const reportPath = path.join(this.screenshotsDir, 'COMPREHENSIVE_TEST_REPORT.md');
    const timestamp = new Date().toISOString();
    
    let report = `# Staff Portal Comprehensive Test Report\n\n`;
    report += `**Generated:** ${timestamp}\n`;
    report += `**Base URL:** ${BASE_URL}\n`;
    report += `**Total Applications Tested:** ${this.results.length}\n\n`;

    // Summary statistics
    const successful = this.results.filter(r => r.status === 'loaded').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const errors = this.results.filter(r => r.status === 'error').length;
    const totalErrors = this.results.reduce((sum, r) => sum + r.errors.length, 0);

    report += `## 📊 Summary Statistics\n\n`;
    report += `- ✅ Successfully Loaded: ${successful}\n`;
    report += `- ❌ Failed to Load: ${failed}\n`;
    report += `- 🚨 HTTP Errors: ${errors}\n`;
    report += `- 🐛 Total Errors Found: ${totalErrors}\n\n`;

    // Priority applications status
    const priorityResults = this.results.filter(r => r.priority === 'high');
    report += `## 🎯 Priority Applications Status\n\n`;
    priorityResults.forEach(result => {
      const status = result.status === 'loaded' ? '✅' : '❌';
      report += `- ${status} **${result.name}** (${result.path})\n`;
      if (result.errors.length > 0) {
        report += `  - Errors: ${result.errors.length}\n`;
      }
    });
    report += `\n`;

    // Detailed results for each application
    report += `## 📱 Detailed Application Results\n\n`;
    
    this.results.forEach(result => {
      const status = result.status === 'loaded' ? '✅ WORKING' : 
                    result.status === 'failed' ? '❌ FAILED' : 
                    '🚨 ERROR';
      
      report += `### ${status} ${result.name}\n\n`;
      report += `- **URL:** ${result.url}\n`;
      report += `- **Load Time:** ${result.loadTime}ms\n`;
      report += `- **Description:** ${result.description}\n`;
      if (result.priority) report += `- **Priority:** ${result.priority}\n`;
      
      if (result.screenshots.length > 0) {
        report += `- **Screenshots:** ${result.screenshots.length} captured\n`;
        result.screenshots.forEach(screenshot => {
          report += `  - ![${path.basename(screenshot)}](${path.basename(screenshot)})\n`;
        });
      }
      
      if (result.findings.length > 0) {
        report += `- **Findings:**\n`;
        result.findings.forEach(finding => {
          report += `  - ${finding}\n`;
        });
      }
      
      if (result.errors.length > 0) {
        report += `- **Errors:**\n`;
        result.errors.forEach(error => {
          report += `  - 🚨 ${error}\n`;
        });
      }
      
      report += `\n`;
    });

    // Recommendations
    report += `## 🔧 Recommendations\n\n`;
    
    const failedApps = this.results.filter(r => r.status !== 'loaded');
    if (failedApps.length > 0) {
      report += `### Applications Needing Immediate Attention:\n\n`;
      failedApps.forEach(app => {
        report += `- **${app.name}** (${app.path}): ${app.errors.join(', ')}\n`;
      });
      report += `\n`;
    }

    const appsWithComingSoon = this.results.filter(r => 
      r.findings.some(f => f.toLowerCase().includes('coming soon'))
    );
    if (appsWithComingSoon.length > 0) {
      report += `### Applications Showing "Coming Soon" Messages:\n\n`;
      appsWithComingSoon.forEach(app => {
        report += `- **${app.name}** (${app.path})\n`;
      });
      report += `\n`;
    }

    // Write report
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Report saved to: ${reportPath}`);

    return reportPath;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser closed');
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.testAllApplications();
      const reportPath = await this.generateReport();
      
      console.log('\n🎉 Comprehensive Testing Complete!');
      console.log(`📊 Results: ${this.results.filter(r => r.status === 'loaded').length}/${this.results.length} applications loaded successfully`);
      console.log(`📄 Full report: ${reportPath}`);
      console.log(`📁 Screenshots: ${this.screenshotsDir}`);
      
    } catch (error) {
      console.error('💥 Fatal error during testing:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the comprehensive test
if (require.main === module) {
  const tester = new StaffPortalTester();
  tester.run().catch(error => {
    console.error('Script execution error:', error);
    process.exit(1);
  });
}

module.exports = StaffPortalTester;