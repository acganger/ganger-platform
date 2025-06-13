#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

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

class SimpleStaffPortalTester {
  constructor() {
    this.results = [];
    this.reportsDir = path.join(__dirname, '..', 'deployments', 'staff-portal-simple-test-' + new Date().toISOString().split('T')[0]);
  }

  async initialize() {
    console.log('🚀 Initializing Simple Staff Portal Testing...\n');
    
    // Create reports directory
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }

    console.log(`📁 Reports will be saved to: ${this.reportsDir}\n`);
  }

  async testApplication(app) {
    console.log(`🔍 Testing: ${app.name}`);
    console.log(`   Path: ${app.path}`);
    console.log(`   Description: ${app.description}`);
    if (app.priority) console.log(`   Priority: ${app.priority}`);

    const result = {
      name: app.name,
      path: app.path,
      description: app.description,
      priority: app.priority || 'normal',
      url: BASE_URL + app.path,
      status: 'unknown',
      statusCode: 0,
      loadTime: 0,
      contentLength: 0,
      errors: [],
      findings: [],
      responseHeaders: {},
      hasContent: false,
      contentPreview: ''
    };

    return new Promise((resolve) => {
      const startTime = Date.now();
      
      console.log(`   🌐 Requesting: ${result.url}`);

      const req = https.get(result.url, { timeout: 15000 }, (res) => {
        result.loadTime = Date.now() - startTime;
        result.statusCode = res.statusCode;
        result.responseHeaders = res.headers;
        
        console.log(`   📊 Status: ${res.statusCode} | Load time: ${result.loadTime}ms`);

        if (res.statusCode >= 200 && res.statusCode < 300) {
          result.status = 'success';
        } else if (res.statusCode >= 300 && res.statusCode < 400) {
          result.status = 'redirect';
          result.findings.push(`Redirects to: ${res.headers.location || 'unknown'}`);
        } else if (res.statusCode >= 400) {
          result.status = 'error';
          result.errors.push(`HTTP ${res.statusCode}: ${res.statusMessage}`);
        }

        // Collect response body
        let body = '';
        res.on('data', chunk => {
          body += chunk;
        });

        res.on('end', () => {
          result.contentLength = body.length;
          result.hasContent = body.length > 0;
          result.contentPreview = body.substring(0, 500); // First 500 characters

          // Analyze content
          this.analyzeContent(body, result);

          console.log(`   📝 Content length: ${result.contentLength} bytes`);
          console.log(`   ✅ Test completed for ${app.name}\n`);

          this.results.push(result);
          resolve(result);
        });
      });

      req.on('error', (error) => {
        result.loadTime = Date.now() - startTime;
        result.status = 'failed';
        result.errors.push(`Request Error: ${error.message}`);
        
        console.log(`   ❌ Failed: ${error.message}`);
        console.log(`   ⏱️  Failed after: ${result.loadTime}ms\n`);

        this.results.push(result);
        resolve(result);
      });

      req.on('timeout', () => {
        req.destroy();
        result.loadTime = Date.now() - startTime;
        result.status = 'timeout';
        result.errors.push('Request timeout after 15 seconds');
        
        console.log(`   ⏰ Timeout after ${result.loadTime}ms\n`);

        this.results.push(result);
        resolve(result);
      });
    });
  }

  analyzeContent(body, result) {
    try {
      // Basic HTML analysis
      const lowerBody = body.toLowerCase();
      
      // Check for basic HTML structure
      result.findings.push(`Has HTML structure: ${lowerBody.includes('<html>') && lowerBody.includes('</html>')}`);
      result.findings.push(`Has head section: ${lowerBody.includes('<head>') && lowerBody.includes('</head>')}`);
      result.findings.push(`Has body section: ${lowerBody.includes('<body>') && lowerBody.includes('</body>')}`);

      // Check for Next.js application
      if (lowerBody.includes('__next') || lowerBody.includes('_next')) {
        result.findings.push('Next.js application detected');
      }

      // Check for React
      if (lowerBody.includes('react') || lowerBody.includes('__react')) {
        result.findings.push('React application detected');
      }

      // Check for error indicators
      const errorIndicators = [
        'error', '404', 'not found', 'server error', 'internal server error',
        'application error', 'something went wrong', 'page not found'
      ];
      
      errorIndicators.forEach(indicator => {
        if (lowerBody.includes(indicator)) {
          result.errors.push(`Content contains error indicator: "${indicator}"`);
        }
      });

      // Check for "coming soon" indicators
      const comingSoonIndicators = [
        'coming soon', 'under construction', 'placeholder', 'demo',
        'not yet implemented', 'work in progress'
      ];
      
      comingSoonIndicators.forEach(indicator => {
        if (lowerBody.includes(indicator)) {
          result.findings.push(`Content mentions: "${indicator}"`);
        }
      });

      // Check for common UI elements
      const uiElements = [
        { element: 'button', regex: /<button[^>]*>/gi },
        { element: 'form', regex: /<form[^>]*>/gi },
        { element: 'input', regex: /<input[^>]*>/gi },
        { element: 'link', regex: /<a[^>]*href/gi },
        { element: 'image', regex: /<img[^>]*>/gi }
      ];

      uiElements.forEach(({ element, regex }) => {
        const matches = body.match(regex);
        if (matches) {
          result.findings.push(`Contains ${matches.length} ${element}(s)`);
        }
      });

      // Extract title
      const titleMatch = body.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        result.findings.push(`Page title: "${titleMatch[1].trim()}"`);
      }

      // Check for application grid (homepage specific)
      if (result.path === '/') {
        const appLinks = body.match(/href=["'][^"']*\/[^"']*["']/gi);
        if (appLinks) {
          const uniqueLinks = [...new Set(appLinks.map(link => 
            link.match(/href=["']([^"']*)["']/)[1]
          ))].filter(href => href.startsWith('/') && href.length > 1);
          
          result.findings.push(`Found ${uniqueLinks.length} unique internal links`);
          if (uniqueLinks.length >= 10) {
            result.findings.push('Homepage appears to have application grid');
          }
        }
      }

    } catch (error) {
      result.errors.push(`Content analysis error: ${error.message}`);
    }
  }

  async testAllApplications() {
    console.log('📱 Testing All Applications...\n');
    
    for (const app of APPLICATIONS) {
      await this.testApplication(app);
    }
  }

  async generateReport() {
    console.log('📊 Generating Test Report...\n');

    const reportPath = path.join(this.reportsDir, 'SIMPLE_TEST_REPORT.md');
    const timestamp = new Date().toISOString();
    
    let report = `# Staff Portal Simple Test Report\n\n`;
    report += `**Generated:** ${timestamp}\n`;
    report += `**Base URL:** ${BASE_URL}\n`;
    report += `**Total Applications Tested:** ${this.results.length}\n\n`;

    // Summary statistics
    const successful = this.results.filter(r => r.status === 'success').length;
    const redirects = this.results.filter(r => r.status === 'redirect').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const errors = this.results.filter(r => r.status === 'error').length;
    const timeouts = this.results.filter(r => r.status === 'timeout').length;
    const totalErrors = this.results.reduce((sum, r) => sum + r.errors.length, 0);

    report += `## 📊 Summary Statistics\n\n`;
    report += `- ✅ Successful (2xx): ${successful}\n`;
    report += `- 🔄 Redirects (3xx): ${redirects}\n`;
    report += `- ❌ Client Errors (4xx): ${errors}\n`;
    report += `- 💥 Failed Requests: ${failed}\n`;
    report += `- ⏰ Timeouts: ${timeouts}\n`;
    report += `- 🐛 Total Issues Found: ${totalErrors}\n\n`;

    // Quick status overview
    report += `## 🎯 Quick Status Overview\n\n`;
    report += `| Application | Status | Response Time | Issues |\n`;
    report += `|-------------|--------|---------------|--------|\n`;
    
    this.results.forEach(result => {
      const status = result.status === 'success' ? '✅' : 
                    result.status === 'redirect' ? '🔄' : 
                    result.status === 'error' ? '❌' : 
                    result.status === 'timeout' ? '⏰' : '💥';
      
      const issues = result.errors.length > 0 ? `${result.errors.length} issues` : 'None';
      report += `| ${result.name} | ${status} ${result.statusCode} | ${result.loadTime}ms | ${issues} |\n`;
    });
    report += `\n`;

    // Priority applications focus
    const priorityResults = this.results.filter(r => r.priority === 'high');
    report += `## 🎯 Priority Applications Analysis\n\n`;
    priorityResults.forEach(result => {
      const status = result.status === 'success' ? '✅ WORKING' : '❌ NEEDS ATTENTION';
      report += `### ${status} ${result.name}\n\n`;
      report += `- **URL:** ${result.url}\n`;
      report += `- **Status Code:** ${result.statusCode}\n`;
      report += `- **Response Time:** ${result.loadTime}ms\n`;
      report += `- **Content Size:** ${result.contentLength} bytes\n`;
      
      if (result.findings.length > 0) {
        report += `- **Key Findings:**\n`;
        result.findings.forEach(finding => {
          report += `  - ${finding}\n`;
        });
      }
      
      if (result.errors.length > 0) {
        report += `- **Issues:**\n`;
        result.errors.forEach(error => {
          report += `  - 🚨 ${error}\n`;
        });
      }
      report += `\n`;
    });

    // Detailed results for all applications
    report += `## 📱 All Applications Detailed Results\n\n`;
    
    this.results.forEach(result => {
      const status = result.status === 'success' ? '✅ SUCCESS' : 
                    result.status === 'redirect' ? '🔄 REDIRECT' :
                    result.status === 'error' ? '❌ ERROR' : 
                    result.status === 'timeout' ? '⏰ TIMEOUT' : '💥 FAILED';
      
      report += `### ${status} ${result.name}\n\n`;
      report += `- **URL:** ${result.url}\n`;
      report += `- **Status Code:** ${result.statusCode}\n`;
      report += `- **Response Time:** ${result.loadTime}ms\n`;
      report += `- **Content Size:** ${result.contentLength} bytes\n`;
      report += `- **Has Content:** ${result.hasContent ? 'Yes' : 'No'}\n`;
      
      if (result.findings.length > 0) {
        report += `- **Findings:**\n`;
        result.findings.forEach(finding => {
          report += `  - ${finding}\n`;
        });
      }
      
      if (result.errors.length > 0) {
        report += `- **Issues:**\n`;
        result.errors.forEach(error => {
          report += `  - 🚨 ${error}\n`;
        });
      }
      
      if (result.contentPreview && result.hasContent) {
        report += `- **Content Preview:**\n`;
        report += `\`\`\`html\n${result.contentPreview.substring(0, 200)}...\n\`\`\`\n`;
      }
      
      report += `\n`;
    });

    // Recommendations
    report += `## 🔧 Recommendations\n\n`;
    
    const problemApps = this.results.filter(r => r.status !== 'success');
    if (problemApps.length > 0) {
      report += `### Applications Needing Immediate Attention:\n\n`;
      problemApps.forEach(app => {
        report += `- **${app.name}** (${app.path}): Status ${app.statusCode} - ${app.errors.join(', ')}\n`;
      });
      report += `\n`;
    }

    const slowApps = this.results.filter(r => r.loadTime > 3000);
    if (slowApps.length > 0) {
      report += `### Slow Loading Applications (>3s):\n\n`;
      slowApps.forEach(app => {
        report += `- **${app.name}**: ${app.loadTime}ms\n`;
      });
      report += `\n`;
    }

    // Write report
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Report saved to: ${reportPath}`);

    return reportPath;
  }

  async run() {
    try {
      await this.initialize();
      await this.testAllApplications();
      const reportPath = await this.generateReport();
      
      console.log('\n🎉 Simple Testing Complete!');
      console.log(`📊 Results: ${this.results.filter(r => r.status === 'success').length}/${this.results.length} applications responding successfully`);
      console.log(`📄 Full report: ${reportPath}`);
      
      // Show quick summary
      console.log('\n📋 Quick Summary:');
      const priorityApps = this.results.filter(r => r.priority === 'high');
      priorityApps.forEach(app => {
        const status = app.status === 'success' ? '✅' : '❌';
        console.log(`${status} ${app.name}: ${app.statusCode} (${app.loadTime}ms)`);
      });
      
    } catch (error) {
      console.error('💥 Fatal error during testing:', error);
    }
  }
}

// Run the simple test
if (require.main === module) {
  const tester = new SimpleStaffPortalTester();
  tester.run().catch(error => {
    console.error('Script execution error:', error);
    process.exit(1);
  });
}

module.exports = SimpleStaffPortalTester;