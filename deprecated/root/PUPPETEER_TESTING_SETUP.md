# Ganger Platform - Puppeteer Testing Environment Setup

## 🚀 Overview

A comprehensive Puppeteer testing environment has been set up to systematically test all React/Next.js applications in the Ganger Platform. This testing suite provides automated browser testing, screenshot capture, error detection, and detailed reporting.

## 📁 Files Created

### Main Testing Script
- **Location**: `/mnt/q/Projects/ganger-platform/scripts/test-apps-puppeteer.js`
- **Purpose**: Core Puppeteer testing logic that handles application startup, browser testing, and report generation

### Helper Script
- **Location**: `/mnt/q/Projects/ganger-platform/scripts/run-app-tests.sh`
- **Purpose**: User-friendly command-line interface for running tests with various options

### Test Results Directory
- **Location**: `/mnt/q/Projects/ganger-platform/apptest/`
- **Purpose**: Contains all test results, screenshots, and reports

## 🧪 Testing Capabilities

### Automated Testing Features

1. **Application Startup Testing**
   - Checks if each application can build successfully
   - Starts applications on unique ports (3001-3017)
   - Waits for applications to be fully ready
   - Captures startup logs and errors

2. **Browser-Based Testing**
   - Takes full-page screenshots of main pages
   - Tests common routes (/, /about, /dashboard, /settings, /api/health)
   - Captures console logs and JavaScript errors
   - Measures performance metrics (load times, DOM ready times)
   - Tests navigation elements and links

3. **Error Detection**
   - Build failures and dependency issues
   - Runtime JavaScript errors
   - 404 and 5xx HTTP errors
   - Console warnings and errors
   - Performance issues

4. **Comprehensive Reporting**
   - JSON reports with detailed test data
   - HTML reports with interactive interface
   - Individual application reports
   - Screenshot galleries
   - Performance metrics and timing data

## 📋 Applications Configured for Testing

All 17 applications are configured with unique ports:

1. **ai-receptionist** (Port 3001)
2. **batch-closeout** (Port 3002)
3. **call-center-ops** (Port 3003)
4. **checkin-kiosk** (Port 3004)
5. **clinical-staffing** (Port 3005)
6. **compliance-training** (Port 3006)
7. **component-showcase** (Port 3007)
8. **config-dashboard** (Port 3008)
9. **eos-l10** (Port 3009)
10. **handouts** (Port 3010)
11. **integration-status** (Port 3011)
12. **inventory** (Port 3012)
13. **medication-auth** (Port 3013)
14. **pharma-scheduling** (Port 3014)
15. **platform-dashboard** (Port 3015)
16. **socials-reviews** (Port 3016)
17. **staff** (Port 3017)

## 🚀 Usage Instructions

### Prerequisites Check
```bash
# Check if system is ready for testing
/mnt/q/Projects/ganger-platform/scripts/run-app-tests.sh check
```

### Install System Dependencies (If Needed)
If you get browser launch errors, install Puppeteer dependencies:
```bash
# Automated installation for most Linux distributions
/mnt/q/Projects/ganger-platform/scripts/run-app-tests.sh install-deps

# Or run the dependency installer directly
/mnt/q/Projects/ganger-platform/scripts/install-puppeteer-deps.sh
```

### Run All Tests
```bash
# Test all applications (recommended)
/mnt/q/Projects/ganger-platform/scripts/run-app-tests.sh all

# Or simply:
/mnt/q/Projects/ganger-platform/scripts/run-app-tests.sh
```

### Test Single Application
```bash
# Test only the inventory application
/mnt/q/Projects/ganger-platform/scripts/run-app-tests.sh single inventory

# Test only the eos-l10 application
/mnt/q/Projects/ganger-platform/scripts/run-app-tests.sh single eos-l10
```

### Other Commands
```bash
# List all available applications
/mnt/q/Projects/ganger-platform/scripts/run-app-tests.sh list

# Clean up previous test results
/mnt/q/Projects/ganger-platform/scripts/run-app-tests.sh clean

# Show help
/mnt/q/Projects/ganger-platform/scripts/run-app-tests.sh help
```

## 📊 Test Reports

After running tests, reports are generated in `/mnt/q/Projects/ganger-platform/apptest/`:

### HTML Report
- **File**: `test-report.html`
- **Features**: Interactive web interface with:
  - Overall statistics and success rates
  - Expandable application details
  - Screenshot galleries
  - Error and warning lists
  - Performance metrics

### JSON Report
- **File**: `test-report.json`
- **Features**: Complete test data in JSON format for:
  - Automated processing
  - Integration with CI/CD pipelines
  - Custom analysis scripts

### Individual App Reports
- **Location**: `apptest/[app-name]/report.json`
- **Features**: Detailed test results for each application including:
  - Build status and logs
  - Startup success/failure
  - Browser test results
  - Screenshot paths
  - Console logs and errors

### Screenshot Organization
- **Location**: `apptest/[app-name]/screenshots/`
- **Files**: 
  - `01-main-page.png` - Full-page screenshot of main page
  - Additional screenshots for different routes (if accessible)

## 🔧 Configuration Options

The testing script can be customized by modifying `/mnt/q/Projects/ganger-platform/scripts/test-apps-puppeteer.js`:

### Test Configuration
```javascript
const TEST_CONFIG = {
  timeout: 30000,           // 30 seconds per app
  headless: true,           // Run browser in headless mode
  viewport: { width: 1920, height: 1080 },
  screenshotQuality: 90     // Screenshot quality (1-100)
};
```

### Port Configuration
Applications are assigned unique ports to avoid conflicts. Ports can be modified in the `APPLICATIONS` array.

### Browser Options
Puppeteer browser options can be modified in the `initialize()` method.

## 🛠️ Troubleshooting

### Common Issues

1. **Port Already in Use**
   - The helper script checks for port conflicts
   - Kill processes using required ports: `sudo lsof -ti:3001 | xargs kill -9`

2. **Build Failures**
   - Check application dependencies: `npm install` in app directory
   - Review build logs in test reports
   - Ensure all environment variables are set

3. **Application Won't Start**
   - Check for missing dependencies
   - Verify package.json scripts
   - Review startup logs in test reports

4. **Browser Issues**
   - Ensure system has required dependencies for Puppeteer
   - Try running with `headless: false` for debugging
   - Check for missing browser dependencies

### Manual Testing
For manual testing and debugging, you can:

1. Start an application manually: `cd apps/inventory && npm run dev`
2. Open browser to `http://localhost:3000`
3. Check console for errors
4. Test navigation and functionality

## 📈 Expected Output

### Successful Test Run
```
🚀 Initializing Puppeteer Testing Environment...
✅ Created directory structure for all applications
✅ Browser launched successfully

📱 Testing Application: inventory
🌐 Port: 3012
   📦 Checking build status...
   ✅ Build check passed
   🚀 Starting application...
   ✅ Application started successfully
   ⏳ Waiting for application to be ready...
   ✅ Application is ready
   🧪 Running browser tests...
   📸 Testing main page...
   ✅ Main page loaded: "Inventory Management"
   🧭 Testing navigation...
   ✅ Found 5 navigation links
   ⚡ Measuring performance...
   ✅ Performance measured - Load time: 1234ms
   🛑 Stopping inventory...

   ✅ PASSED inventory (Port 3012)

📊 Generating comprehensive test report...
✅ Reports generated:
   📋 Summary: /mnt/q/Projects/ganger-platform/apptest/test-report.json
   🌐 HTML Report: /mnt/q/Projects/ganger-platform/apptest/test-report.html
   📁 Individual reports in each app directory

🎉 Testing Complete!
📊 Results: 17/17 applications passed
📁 Reports saved to: /mnt/q/Projects/ganger-platform/apptest

✅ Exiting with code 0
```

## 🔄 Integration with CI/CD

The testing script is designed to integrate with automated workflows:

- **Exit Codes**: Returns 0 for success, 1 for failures
- **JSON Output**: Machine-readable test results
- **Screenshots**: Visual verification of application states
- **Detailed Logs**: Complete error information for debugging

### GitHub Actions Integration
```yaml
- name: Run Application Tests
  run: |
    chmod +x scripts/run-app-tests.sh
    ./scripts/run-app-tests.sh all
    
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: apptest/
```

## 📝 Next Steps

1. **Run Initial Test**: Execute the testing suite to get baseline results
2. **Review Results**: Check the HTML report for any failing applications
3. **Fix Issues**: Address any build failures or runtime errors
4. **Integrate with CI**: Add to your deployment pipeline
5. **Customize Tests**: Add application-specific test cases as needed

## 🎯 Benefits

- **Early Detection**: Catch build and runtime issues before deployment
- **Visual Verification**: Screenshots show actual application appearance
- **Performance Monitoring**: Track load times and performance metrics
- **Comprehensive Coverage**: Tests all applications systematically
- **Automated Reporting**: Detailed reports with actionable insights
- **CI/CD Ready**: Designed for integration with automated workflows

---

*Testing Environment Ready! 🚀*