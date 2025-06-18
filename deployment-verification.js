/**
 * Ganger Platform Deployment Verification Script
 * 
 * Verifies all 17 applications are properly deployed and accessible
 * Tests both staff portal integration and individual app functionality
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class DeploymentVerifier {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      staffPortal: null,
      applications: [],
      summary: {
        total: 17,
        accessible: 0,
        errors: 0,
        warnings: 0
      }
    };
    
    // All 17 applications from Dev 6's completion report
    this.applications = [
      { name: 'Inventory Management', path: '/inventory', id: 'inventory' },
      { name: 'Handouts Generator', path: '/handouts', id: 'handouts' },
      { name: 'Check-in Kiosk', path: '/checkin', id: 'checkin-kiosk' },
      { name: 'Medication Authorization', path: '/meds', id: 'medication-auth' },
      { name: 'EOS L10', path: '/l10', id: 'eos-l10' },
      { name: 'Pharmaceutical Scheduling', path: '/reps', id: 'pharma-scheduling' },
      { name: 'Call Center Operations', path: '/phones', id: 'call-center-ops' },
      { name: 'Batch Closeout', path: '/batch', id: 'batch-closeout' },
      { name: 'Socials & Reviews', path: '/socials', id: 'socials-reviews' },
      { name: 'Clinical Staffing', path: '/staffing', id: 'clinical-staffing' },
      { name: 'Platform Dashboard', path: '/dashboard', id: 'platform-dashboard' },
      { name: 'Config Dashboard', path: '/config', id: 'config-dashboard' },
      { name: 'Component Showcase', path: '/showcase', id: 'component-showcase' },
      { name: 'Staff Management', path: '/', id: 'staff' },
      { name: 'Integration Status', path: '/status', id: 'integration-status' },
      { name: 'AI Receptionist', path: '/ai', id: 'ai-receptionist' },
      { name: 'Compliance Training', path: '/compliance', id: 'compliance-training' }
    ];
  }

  async initialize() {
    console.log('🚀 Initializing Ganger Platform deployment verification...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for verification
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set up request monitoring
    this.page.on('response', (response) => {
      const status = response.status();
      const url = response.url();
      
      if (status >= 400) {
        console.log(`⚠️ HTTP ${status}: ${url}`);
      }
    });

    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`🔴 Console Error: ${msg.text()}`);
      }
    });

    console.log('✅ Browser initialized for deployment verification');
  }

  async verifyStaffPortal() {
    console.log('\n📋 Verifying Staff Portal (staff.gangerdermatology.com)...');
    
    try {
      const response = await this.page.goto('https://staff.gangerdermatology.com', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      const status = response.status();
      console.log(`📡 Staff Portal Response: ${status}`);
      
      if (status === 200) {
        // Check for authentication
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const title = await this.page.title();
        const url = this.page.url();
        
        this.results.staffPortal = {
          accessible: true,
          status: status,
          title: title,
          finalUrl: url,
          requiresAuth: url.includes('accounts.google.com') || url.includes('auth'),
          timestamp: new Date().toISOString()
        };
        
        console.log(`✅ Staff Portal: ${title}`);
        console.log(`🔗 Final URL: ${url}`);
        
        if (this.results.staffPortal.requiresAuth) {
          console.log('🔐 Authentication required - this is expected');
        }
        
      } else {
        throw new Error(`HTTP ${status}`);
      }
      
    } catch (error) {
      console.log(`❌ Staff Portal Error: ${error.message}`);
      this.results.staffPortal = {
        accessible: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      this.results.summary.errors++;
    }
  }

  async verifyApplication(app) {
    console.log(`\n🔍 Verifying ${app.name} (${app.path})...`);
    
    const result = {
      name: app.name,
      path: app.path,
      id: app.id,
      accessible: false,
      status: null,
      title: null,
      error: null,
      timestamp: new Date().toISOString()
    };

    try {
      const url = `https://staff.gangerdermatology.com${app.path}`;
      console.log(`📡 Testing: ${url}`);
      
      const response = await this.page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 20000
      });
      
      result.status = response.status();
      console.log(`📊 Response: ${result.status}`);
      
      if (result.status === 200) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        result.title = await this.page.title();
        result.finalUrl = this.page.url();
        result.accessible = true;
        
        // Check for common error indicators
        const bodyText = await this.page.evaluate(() => document.body.textContent || '');
        const hasError = bodyText.toLowerCase().includes('error') || 
                        bodyText.toLowerCase().includes('not found') ||
                        bodyText.toLowerCase().includes('500') ||
                        bodyText.toLowerCase().includes('404');
        
        if (hasError) {
          result.warning = 'Page loaded but contains error text';
          this.results.summary.warnings++;
        }
        
        console.log(`✅ ${app.name}: ${result.title}`);
        this.results.summary.accessible++;
        
      } else if (result.status === 302 || result.status === 301) {
        result.accessible = true;
        result.title = await this.page.title();
        result.finalUrl = this.page.url();
        result.redirected = true;
        
        console.log(`↩️ ${app.name}: Redirected to ${result.finalUrl}`);
        this.results.summary.accessible++;
        
      } else {
        throw new Error(`HTTP ${result.status}`);
      }
      
    } catch (error) {
      console.log(`❌ ${app.name}: ${error.message}`);
      result.error = error.message;
      this.results.summary.errors++;
    }
    
    this.results.applications.push(result);
    return result;
  }

  async verifyHealthEndpoints() {
    console.log('\n🏥 Verifying Health Endpoints...');
    
    const healthEndpoints = [
      'https://staff.gangerdermatology.com/health',
      'https://staff.gangerdermatology.com/status/health',
      'https://staff.gangerdermatology.com/api/health'
    ];
    
    for (const endpoint of healthEndpoints) {
      try {
        console.log(`📡 Testing health endpoint: ${endpoint}`);
        
        const response = await this.page.goto(endpoint, {
          waitUntil: 'networkidle0',
          timeout: 10000
        });
        
        const status = response.status();
        console.log(`📊 Health endpoint ${endpoint}: ${status}`);
        
        if (status === 200) {
          const content = await this.page.content();
          console.log(`✅ Health endpoint working: ${endpoint}`);
        }
        
      } catch (error) {
        console.log(`⚠️ Health endpoint ${endpoint}: ${error.message}`);
      }
    }
  }

  async verifyDeploymentInfrastructure() {
    console.log('\n🏗️ Verifying Deployment Infrastructure...');
    
    // Test if this looks like Cloudflare Workers deployment
    try {
      await this.page.goto('https://staff.gangerdermatology.com', {
        waitUntil: 'networkidle0',
        timeout: 15000
      });
      
      // Check response headers for Cloudflare indicators
      const response = await this.page.evaluate(() => {
        return {
          userAgent: navigator.userAgent,
          location: window.location.href,
          // Performance timing
          loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart
        };
      });
      
      console.log(`⚡ Page load time: ${response.loadTime}ms`);
      
      if (response.loadTime < 3000) {
        console.log('✅ Fast loading time indicates good deployment');
      } else {
        console.log('⚠️ Slow loading time may indicate deployment issues');
      }
      
    } catch (error) {
      console.log(`⚠️ Infrastructure check error: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n📊 Generating Deployment Verification Report...');
    
    const report = {
      verificationMetadata: {
        timestamp: new Date().toISOString(),
        totalApplications: this.results.summary.total,
        accessibleApplications: this.results.summary.accessible,
        errors: this.results.summary.errors,
        warnings: this.results.summary.warnings,
        successRate: `${Math.round((this.results.summary.accessible / this.results.summary.total) * 100)}%`
      },
      staffPortal: this.results.staffPortal,
      applications: this.results.applications,
      recommendations: this.generateRecommendations()
    };
    
    // Save detailed report
    const reportPath = '/mnt/q/Projects/ganger-platform/deployment-verification-report.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    const markdownReport = this.generateMarkdownReport(report);
    const summaryPath = '/mnt/q/Projects/ganger-platform/DEPLOYMENT_VERIFICATION_SUMMARY.md';
    await fs.writeFile(summaryPath, markdownReport);
    
    console.log(`📋 Detailed report: ${reportPath}`);
    console.log(`📄 Summary report: ${summaryPath}`);
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.summary.errors > 0) {
      recommendations.push('CRITICAL: Some applications are not accessible - investigate deployment issues');
    }
    
    if (this.results.summary.warnings > 0) {
      recommendations.push('WARNING: Some applications show error content - verify application functionality');
    }
    
    if (!this.results.staffPortal?.accessible) {
      recommendations.push('CRITICAL: Staff portal is not accessible - check DNS and deployment');
    }
    
    if (this.results.summary.accessible === this.results.summary.total) {
      recommendations.push('SUCCESS: All applications are accessible - deployment verification complete');
    }
    
    return recommendations;
  }

  generateMarkdownReport(report) {
    return `# Ganger Platform Deployment Verification Report

**Generated**: ${report.verificationMetadata.timestamp}

## 📊 Executive Summary

- **Total Applications**: ${report.verificationMetadata.totalApplications}
- **Accessible Applications**: ${report.verificationMetadata.accessibleApplications}
- **Success Rate**: ${report.verificationMetadata.successRate}
- **Errors**: ${report.verificationMetadata.errors}
- **Warnings**: ${report.verificationMetadata.warnings}

## 🏠 Staff Portal Status

${report.staffPortal?.accessible ? '✅' : '❌'} **Staff Portal**: ${report.staffPortal?.accessible ? 'ACCESSIBLE' : 'NOT ACCESSIBLE'}
${report.staffPortal?.title ? `- **Title**: ${report.staffPortal.title}` : ''}
${report.staffPortal?.status ? `- **HTTP Status**: ${report.staffPortal.status}` : ''}
${report.staffPortal?.requiresAuth ? '- **Authentication**: Required (Expected)' : ''}
${report.staffPortal?.error ? `- **Error**: ${report.staffPortal.error}` : ''}

## 📱 Application Status

| Application | Status | HTTP | Title | Notes |
|-------------|---------|------|-------|-------|
${report.applications.map(app => 
  `| **${app.name}** | ${app.accessible ? '✅' : '❌'} | ${app.status || 'N/A'} | ${app.title || 'N/A'} | ${app.error || app.warning || 'OK'} |`
).join('\n')}

## 🔍 Detailed Analysis

### ✅ Accessible Applications
${report.applications.filter(app => app.accessible).map(app => 
  `- **${app.name}** (${app.path}): ${app.title}`
).join('\n') || 'None'}

### ❌ Inaccessible Applications  
${report.applications.filter(app => !app.accessible).map(app => 
  `- **${app.name}** (${app.path}): ${app.error}`
).join('\n') || 'None'}

### ⚠️ Applications with Warnings
${report.applications.filter(app => app.warning).map(app => 
  `- **${app.name}** (${app.path}): ${app.warning}`
).join('\n') || 'None'}

## 🎯 Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## 📋 Next Steps

${report.verificationMetadata.successRate === '100%' ? 
  `### ✅ Deployment Verification SUCCESSFUL
  
  All applications are accessible and properly deployed. The Ganger Platform deployment infrastructure is working correctly.
  
  **Ready for production use.**` :
  `### ⚠️ Deployment Issues Detected
  
  Some applications are not accessible or have issues. Review the detailed analysis above and:
  
  1. **Investigate inaccessible applications** - Check deployment logs and configuration
  2. **Fix warning conditions** - Verify application functionality
  3. **Test again** - Re-run verification after fixes
  4. **Update deployment procedures** - Document any issues found`
}

---

*Deployment verification completed on ${report.verificationMetadata.timestamp}*
*Generated by Ganger Platform Deployment Verification Script*
`;
  }

  async run() {
    try {
      await this.initialize();
      
      // Step 1: Verify staff portal
      await this.verifyStaffPortal();
      
      // Step 2: Verify each application
      console.log('\n🔍 Starting application verification...');
      for (const app of this.applications) {
        await this.verifyApplication(app);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause between tests
      }
      
      // Step 3: Verify health endpoints
      await this.verifyHealthEndpoints();
      
      // Step 4: Verify deployment infrastructure
      await this.verifyDeploymentInfrastructure();
      
      // Step 5: Generate report
      const report = await this.generateReport();
      
      // Summary
      console.log('\n🎯 DEPLOYMENT VERIFICATION COMPLETE');
      console.log(`📊 Success Rate: ${report.verificationMetadata.successRate}`);
      console.log(`✅ Accessible: ${report.verificationMetadata.accessibleApplications}/${report.verificationMetadata.totalApplications}`);
      console.log(`❌ Errors: ${report.verificationMetadata.errors}`);
      console.log(`⚠️ Warnings: ${report.verificationMetadata.warnings}`);
      
      if (report.verificationMetadata.successRate === '100%') {
        console.log('\n🎉 ALL APPLICATIONS SUCCESSFULLY DEPLOYED!');
      } else {
        console.log('\n⚠️ Some applications need attention - see report for details');
      }
      
      return report;
      
    } catch (error) {
      console.error('❌ Deployment verification failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the deployment verification
console.log('🚀 Starting Ganger Platform Deployment Verification...');
console.log('📋 Testing all 17 applications reported complete by Dev 6...');

const verifier = new DeploymentVerifier();
verifier.run()
  .then(report => {
    console.log('\n✅ Verification complete! Check the generated reports for details.');
  })
  .catch(error => {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  });