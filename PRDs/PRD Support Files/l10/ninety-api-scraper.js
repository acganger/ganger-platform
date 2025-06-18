/**
 * Ninety.io API Data Scraper
 * 
 * Focused approach: Capture API responses directly rather than relying on page navigation
 * This is more reliable and captures the actual data structures we need for migration
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class NinetyApiScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.outputDir = '/mnt/q/Projects/ganger-platform/PRDs/PRD Support files/l10/api-scrape-data';
    this.apiData = new Map();
    this.teamId = '65f5c6322caa0d001296501d'; // Known team ID from captured data
  }

  async initialize() {
    console.log('🚀 Initializing API-focused ninety.io scraper...');
    
    await fs.mkdir(this.outputDir, { recursive: true });
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 }
    });

    this.page = await this.browser.newPage();
    
    // Capture all API responses
    this.page.on('response', async (response) => {
      const url = response.url();
      
      if (url.includes('app.ninety.io/api/')) {
        try {
          const data = await response.json();
          await this.saveApiData(url, data);
          console.log(`📡 Captured: ${this.getEndpointName(url)}`);
        } catch (error) {
          // Some responses aren't JSON, skip them
        }
      }
    });
  }

  getEndpointName(url) {
    const urlObj = new URL(url);
    return urlObj.pathname.replace('/api/v4/', '') + (urlObj.search || '');
  }

  async saveApiData(url, data) {
    const endpointName = this.getEndpointName(url);
    const filename = this.sanitizeFilename(`${endpointName}.json`);
    const filepath = path.join(this.outputDir, filename);
    
    const apiResponse = {
      url: url,
      endpoint: endpointName,
      data: data,
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile(filepath, JSON.stringify(apiResponse, null, 2));
    this.apiData.set(endpointName, apiResponse);
  }

  async authenticate() {
    console.log('🔐 Authenticating with ninety.io...');
    
    await this.page.goto('https://app.ninety.io/', { waitUntil: 'networkidle0' });
    
    console.log('⏳ Please complete authentication manually...');
    console.log('   The scraper will automatically continue once you\'re logged in');
    
    // Wait for successful authentication
    await this.page.waitForFunction(() => {
      return window.location.pathname !== '/' || 
             document.querySelector('[data-testid*="authenticated"]') ||
             document.querySelector('.main-content') ||
             document.title.includes('My Ninety');
    }, { timeout: 300000 });
    
    console.log('✅ Successfully authenticated');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async triggerApiCalls() {
    console.log('🔍 Triggering comprehensive API data collection...');
    
    const urlsToVisit = [
      'https://app.ninety.io/my-ninety',
      'https://app.ninety.io/rocks',
      'https://app.ninety.io/issues',
      'https://app.ninety.io/scorecard',
      'https://app.ninety.io/todos',
      'https://app.ninety.io/meetings',
      'https://app.ninety.io/headlines',
      'https://app.ninety.io/vto',
      'https://app.ninety.io/data-v2/67335abc3d036570a6eca16e',
      'https://app.ninety.io/kpi-manager',
      'https://app.ninety.io/issues/short-term',
      'https://app.ninety.io/issues/long-term',
      'https://app.ninety.io/users'
    ];

    for (const url of urlsToVisit) {
      try {
        console.log(`  📄 Loading: ${url.split('/').pop()}`);
        await this.page.goto(url, { 
          waitUntil: 'networkidle0',
          timeout: 15000 
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.log(`  ⚠️ Timeout on ${url.split('/').pop()}, continuing...`);
      }
    }

    // Try to load more data by triggering specific API calls
    await this.triggerSpecificApiCalls();
  }

  async triggerSpecificApiCalls() {
    console.log('🎯 Triggering specific API endpoints...');
    
    // Execute JavaScript to trigger API calls
    try {
      await this.page.evaluate(async () => {
        // Try to trigger pagination and additional data loading
        const buttons = document.querySelectorAll('button, a');
        for (let i = 0; i < Math.min(buttons.length, 20); i++) {
          const btn = buttons[i];
          const text = btn.textContent?.toLowerCase() || '';
          
          if (text.includes('load more') || 
              text.includes('next') || 
              text.includes('view all') ||
              text.includes('expand')) {
            try {
              btn.click();
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (e) {
              // Continue with next button
            }
          }
        }
      });
    } catch (error) {
      console.log('  ⚠️ Could not trigger additional API calls via UI');
    }
  }

  async generateMigrationReport() {
    console.log('📊 Generating comprehensive migration report...');
    
    const report = {
      scrapingMetadata: {
        timestamp: new Date().toISOString(),
        totalApiEndpoints: this.apiData.size,
        teamId: this.teamId,
        scrapingMethod: 'API Response Capture'
      },
      apiEndpoints: Array.from(this.apiData.keys()),
      dataAnalysis: await this.analyzeScrapedData(),
      migrationRecommendations: this.generateMigrationRecommendations()
    };
    
    const reportPath = path.join(this.outputDir, 'migration-analysis-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    const markdownSummary = this.generateMarkdownSummary(report);
    const summaryPath = path.join(this.outputDir, 'API_SCRAPING_SUMMARY.md');
    await fs.writeFile(summaryPath, markdownSummary);
    
    console.log(`📋 Migration report saved to: ${reportPath}`);
    console.log(`📋 Summary report saved to: ${summaryPath}`);
    
    return report;
  }

  async analyzeScrapedData() {
    const analysis = {
      rocks: { count: 0, structure: null },
      issues: { count: 0, structure: null },
      scorecard: { count: 0, structure: null },
      todos: { count: 0, structure: null },
      meetings: { count: 0, structure: null },
      users: { count: 0, structure: null },
      teams: { count: 0, structure: null }
    };

    // Analyze captured API data
    for (const [endpoint, apiResponse] of this.apiData) {
      const data = apiResponse.data;
      
      if (endpoint.includes('Rocks')) {
        analysis.rocks.count += Array.isArray(data) ? data.length : (data.totalRecords || 0);
        if (!analysis.rocks.structure && data.length > 0) {
          analysis.rocks.structure = this.getDataStructure(data[0]);
        }
      }
      
      if (endpoint.includes('Issues') || endpoint.includes('IDS')) {
        analysis.issues.count += Array.isArray(data) ? data.length : (data.totalRecords || 0);
        if (!analysis.issues.structure && data.length > 0) {
          analysis.issues.structure = this.getDataStructure(data[0]);
        }
      }
      
      if (endpoint.includes('Scorecard') || endpoint.includes('Measurables')) {
        analysis.scorecard.count += Array.isArray(data) ? data.length : (data.totalRecords || 0);
        if (!analysis.scorecard.structure && data.length > 0) {
          analysis.scorecard.structure = this.getDataStructure(data[0]);
        }
      }
      
      if (endpoint.includes('Todos')) {
        analysis.todos.count += Array.isArray(data) ? data.length : (data.totalRecords || 0);
        if (!analysis.todos.structure && data.length > 0) {
          analysis.todos.structure = this.getDataStructure(data[0]);
        }
      }
      
      if (endpoint.includes('Users')) {
        analysis.users.count += Array.isArray(data) ? data.length : (data.totalRecords || 0);
        if (!analysis.users.structure && data.length > 0) {
          analysis.users.structure = this.getDataStructure(data[0]);
        }
      }
      
      if (endpoint.includes('Teams')) {
        analysis.teams.count += Array.isArray(data) ? data.length : (data.totalRecords || 0);
        if (!analysis.teams.structure && data.length > 0) {
          analysis.teams.structure = this.getDataStructure(data[0]);
        }
      }
    }

    return analysis;
  }

  getDataStructure(obj) {
    if (!obj || typeof obj !== 'object') return null;
    
    const structure = {};
    for (const [key, value] of Object.entries(obj)) {
      structure[key] = {
        type: Array.isArray(value) ? 'array' : typeof value,
        sample: Array.isArray(value) ? value.slice(0, 2) : 
                typeof value === 'string' ? value.substring(0, 100) :
                typeof value === 'object' ? Object.keys(value) : value
      };
    }
    return structure;
  }

  generateMigrationRecommendations() {
    return {
      databaseSchema: "Create PostgreSQL tables matching the captured API data structures",
      apiMigration: "Build REST APIs that mirror the ninety.io endpoints for seamless transition",
      dataSync: "Implement one-time data import followed by real-time sync during transition period",
      userInterface: "Build L10 app components that match existing ninety.io workflows",
      priority: "Focus on rocks, issues, and scorecard as core EOS components"
    };
  }

  generateMarkdownSummary(report) {
    return `# Ninety.io API Scraping Results

**Generated**: ${report.scrapingMetadata.timestamp}

## Scraping Summary

- **API Endpoints Captured**: ${report.scrapingMetadata.totalApiEndpoints}
- **Team ID**: ${report.scrapingMetadata.teamId}
- **Method**: ${report.scrapingMetadata.scrapingMethod}

## Data Analysis

### Rocks (Quarterly Goals)
- **Count**: ${report.dataAnalysis.rocks.count}
- **Structure**: ${report.dataAnalysis.rocks.structure ? 'Captured' : 'Pending'}

### Issues (IDS)
- **Count**: ${report.dataAnalysis.issues.count}
- **Structure**: ${report.dataAnalysis.issues.structure ? 'Captured' : 'Pending'}

### Scorecard/Measurables
- **Count**: ${report.dataAnalysis.scorecard.count}
- **Structure**: ${report.dataAnalysis.scorecard.structure ? 'Captured' : 'Pending'}

### Todos
- **Count**: ${report.dataAnalysis.todos.count}
- **Structure**: ${report.dataAnalysis.todos.structure ? 'Captured' : 'Pending'}

### Users
- **Count**: ${report.dataAnalysis.users.count}
- **Structure**: ${report.dataAnalysis.users.structure ? 'Captured' : 'Pending'}

### Teams
- **Count**: ${report.dataAnalysis.teams.count}
- **Structure**: ${report.dataAnalysis.teams.structure ? 'Captured' : 'Pending'}

## API Endpoints Captured

${report.apiEndpoints.map(endpoint => `- \`${endpoint}\``).join('\n')}

## Migration Recommendations

${Object.entries(report.migrationRecommendations).map(([key, value]) => `- **${key}**: ${value}`).join('\n')}

## Next Steps

1. **Review API Data Files** - Examine individual JSON files for complete data structures
2. **Update L10 App Schema** - Design database tables based on captured structures  
3. **Build Migration Scripts** - Create data import utilities
4. **Implement API Layer** - Build L10 app APIs matching ninety.io patterns
5. **Test Data Migration** - Verify data integrity and completeness

## Files Generated

All API responses saved to: \`${this.outputDir}\`

*This API scraping provides the foundation for accurate L10 app data migration.*
`;
  }

  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  }

  async run() {
    try {
      await this.initialize();
      await this.authenticate();
      await this.triggerApiCalls();
      const report = await this.generateMigrationReport();
      
      console.log('✅ API scraping completed successfully!');
      console.log(`📁 Data saved to: ${this.outputDir}`);
      console.log(`📊 Captured ${this.apiData.size} API endpoints`);
      
      return report;
      
    } catch (error) {
      console.error('❌ API scraping failed:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the API scraper
const scraper = new NinetyApiScraper();
scraper.run().catch(console.error);