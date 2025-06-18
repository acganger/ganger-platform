# Ninety.io Comprehensive Scraping Instructions

## Overview
This document provides step-by-step instructions for scraping the ninety.io EOS platform account for Ganger Dermatology using the Puppeteer MCP server.

## Prerequisites

### 1. MCP Server Setup
Ensure the Puppeteer MCP server is properly configured in your Claude Desktop:

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "node",
      "args": ["/mnt/q/Projects/ganger-platform/mcp-servers/puppeteer/dist/index.js"]
    }
  }
}
```

### 2. Dependencies
Make sure Node.js and required packages are installed:

```bash
cd /mnt/q/Projects/ganger-platform/mcp-servers/puppeteer
npm install
npm run build
```

### 3. Google OAuth Access
Ensure you have access to the `anand@gangerdermatology.com` Google account with permissions to access the ninety.io platform.

## Execution Methods

### Method 1: Direct Script Execution
```bash
cd "/mnt/q/Projects/ganger-platform/PRDs/PRD Support files/l10"
node ninety-io-scraping-script.js
```

### Method 2: Through Puppeteer MCP Server
Use Claude Code to execute the scraping through the MCP interface:

1. Load the scraping script
2. Execute through the Puppeteer MCP server
3. Monitor progress and handle any authentication prompts

## Expected Output Structure

The scraping process will create the following directory structure:

```
/mnt/q/Projects/ganger-platform/PRDs/PRD Support files/l10/
├── raw-html/
│   ├── 01-login-page.html
│   ├── 02-authenticated-home.html
│   ├── dashboard-home.html
│   ├── rocks-section.html
│   ├── scorecard-section.html
│   ├── issues-section.html
│   ├── todos-section.html
│   ├── meetings-section.html
│   ├── headlines-section.html
│   ├── team-section.html
│   └── explored-*.html
├── screenshots/
│   ├── 01-login-page.png
│   ├── 02-authenticated-home.png
│   ├── dashboard-overview.png
│   ├── rocks-overview.png
│   ├── scorecard-overview.png
│   ├── issues-overview.png
│   ├── todos-overview.png
│   ├── meetings-overview.png
│   ├── headlines-overview.png
│   ├── team-overview.png
│   └── explored-*.png
├── json-data/
│   ├── dashboard-data.json
│   ├── rocks-data.json
│   ├── scorecard-data.json
│   ├── issues-data.json
│   ├── todos-data.json
│   ├── meetings-data.json
│   ├── headlines-data.json
│   ├── team-data.json
│   ├── navigation-data.json
│   ├── features-inventory.json
│   ├── comprehensive-report.json
│   └── api-*.json (API responses)
├── features/
│   └── [will be populated with feature analysis]
├── navigation/
│   └── [will be populated with navigation analysis]
├── ninety-io-scraping-script.js
└── SCRAPING_INSTRUCTIONS.md
```

## Scraping Process Details

### 1. Authentication Phase
- Navigate to https://app.ninety.io/login
- Locate and click Google OAuth button
- Handle Google account selection for anand@gangerdermatology.com
- Wait for successful authentication and redirect

### 2. Dashboard Scraping
- Capture home/dashboard page
- Extract all widgets and metrics
- Save HTML, screenshot, and structured data

### 3. Core EOS Sections
For each major section (Rocks, Scorecard, Issues, Todos, Meetings, Headlines, Team):
- Navigate to section URL
- Capture full page content
- Extract structured data using multiple selector strategies
- Save HTML, screenshots, and JSON data

### 4. Navigation Discovery
- Map all navigation elements
- Discover additional sections not initially known
- Explore unique URLs (limited to first 10 for time efficiency)

### 5. Feature Inventory
- Identify all interactive elements
- Catalog forms and their purposes
- Extract action buttons and their functions
- Document UI patterns and workflows

### 6. API Data Capture
- Monitor network traffic for API calls
- Capture API responses for data structure analysis
- Save API data separately for schema understanding

## Data Extraction Strategies

### Multi-Selector Approach
The scraper uses multiple CSS selectors for each data type to ensure comprehensive coverage:

- **Generic selectors**: `.widget`, `.card`, `.list-item`
- **Semantic selectors**: `.rock`, `.metric`, `.issue`, `.todo`
- **Test ID selectors**: `[data-testid*="rock"]`
- **Class-based selectors**: `[class*="rock"]`

### Data Structure Capture
For each identified element, the scraper captures:
- Text content
- HTML structure
- CSS classes and attributes
- Hierarchical relationships
- Associated metadata (dates, owners, statuses)

## Expected Challenges and Solutions

### Challenge 1: Dynamic Content Loading
**Solution**: The scraper waits for `networkidle2` events and includes timeout handling.

### Challenge 2: Authentication Flow
**Solution**: Manual intervention support is built-in for complex OAuth flows.

### Challenge 3: Unknown URL Structure
**Solution**: Multiple URL patterns are attempted for each section.

### Challenge 4: Variable UI Elements
**Solution**: Multiple selector strategies ensure comprehensive data capture.

## Post-Scraping Analysis

After successful scraping, perform these analysis steps:

### 1. Data Validation
```bash
# Check for successful data extraction
ls -la "/mnt/q/Projects/ganger-platform/PRDs/PRD Support files/l10/json-data/"

# Verify screenshot capture
ls -la "/mnt/q/Projects/ganger-platform/PRDs/PRD Support files/l10/screenshots/"

# Review comprehensive report
cat "/mnt/q/Projects/ganger-platform/PRDs/PRD Support files/l10/json-data/comprehensive-report.json"
```

### 2. Feature Gap Analysis
Compare scraped features with current L10 app capabilities:
- Review `features-inventory.json` for complete feature list
- Compare with existing L10 app features
- Identify missing functionality
- Plan development priorities

### 3. Data Structure Analysis
Examine JSON data files to understand:
- Data relationships and hierarchies
- Required database schema changes
- API endpoint requirements
- Integration complexity

### 4. UI/UX Pattern Analysis
Review screenshots and HTML for:
- User workflow patterns
- Navigation structures
- Form designs and interactions
- Responsive design patterns

## Troubleshooting

### Common Issues

#### Issue: Authentication Failure
**Solution**: 
1. Verify Google account access
2. Check ninety.io account permissions
3. Manual authentication intervention may be required

#### Issue: Incomplete Data Extraction
**Solution**:
1. Check browser console for JavaScript errors
2. Verify selector patterns match actual DOM structure
3. Increase timeout values for slow-loading content

#### Issue: Rate Limiting
**Solution**:
1. Add delays between requests
2. Implement retry logic with exponential backoff
3. Reduce concurrent operations

### Debug Mode
To run in debug mode with full browser visibility:
```javascript
// Modify the puppeteer.launch options in the script:
this.browser = await puppeteer.launch({
    headless: false,  // Keep browser visible
    devtools: true,   // Open DevTools
    slowMo: 250       // Add delay between actions
});
```

## Data Privacy and Security

### Important Considerations
- All scraped data contains sensitive business information
- Store data securely and limit access appropriately
- Do not commit scraped data to public repositories
- Follow company data handling policies

### Data Cleanup
After analysis is complete:
```bash
# Archive scraped data
tar -czf ninety-io-scraped-data-$(date +%Y%m%d).tar.gz "/mnt/q/Projects/ganger-platform/PRDs/PRD Support files/l10/"

# Move to secure storage location
mv ninety-io-scraped-data-*.tar.gz /secure/archive/location/
```

## Expected Timeline

- **Setup and Authentication**: 5-10 minutes
- **Core Section Scraping**: 15-20 minutes
- **Navigation Discovery**: 10-15 minutes
- **Feature Inventory**: 5-10 minutes
- **Total Expected Time**: 35-55 minutes

## Success Criteria

The scraping is considered successful when:
- ✅ All major EOS sections are captured
- ✅ Structured data is extracted for each section
- ✅ Screenshots document UI patterns
- ✅ Navigation map is complete
- ✅ Feature inventory is comprehensive
- ✅ API data structures are captured
- ✅ Comprehensive report is generated

## Next Steps

After successful scraping:
1. Review comprehensive report for completeness
2. Analyze feature gaps compared to current L10 app
3. Plan data migration strategy
4. Update L10 app PRD with discovered requirements
5. Prioritize development tasks based on findings

---

*Created: January 18, 2025*  
*For: Ganger Platform L10 App Development*  
*Account: anand@gangerdermatology.com ninety.io access*