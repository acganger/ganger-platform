#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

// Configuration
const APPS = [
  'ai-receptionist',
  'batch-closeout', 
  'call-center-ops',
  'checkin-kiosk',
  'clinical-staffing',
  'compliance-training',
  'component-showcase',
  'config-dashboard',
  'eos-l10',
  'handouts',
  'integration-status',
  'inventory',
  'medication-auth',
  'pharma-scheduling',
  'platform-dashboard',
  'socials-reviews',
  'staff'
];

const BASE_PORT = 3001;
const PROJECT_ROOT = process.cwd();
const APPS_DIR = path.join(PROJECT_ROOT, 'apps');
const TEST_RESULTS_DIR = path.join(PROJECT_ROOT, 'apptest');

// Utility functions
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeReport(appName, results) {
  const appTestDir = path.join(TEST_RESULTS_DIR, appName);
  ensureDir(appTestDir);
  
  const reportPath = path.join(appTestDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  // Also create a simple markdown report
  const mdReport = generateMarkdownReport(appName, results);
  const mdPath = path.join(appTestDir, 'README.md');
  fs.writeFileSync(mdPath, mdReport);
  
  return reportPath;
}

function generateMarkdownReport(appName, results) {
  const status = results.success ? '✅ PASS' : '❌ FAIL';
  const buildStatus = results.buildSuccess ? '✅ Build Success' : '❌ Build Failed';
  const startStatus = results.startSuccess ? '✅ Start Success' : '❌ Start Failed';
  
  return `# ${appName} Test Report

## Overall Status: ${status}

### Test Results
- **Build Status**: ${buildStatus}
- **Start Status**: ${startStatus}
- **Port**: ${results.port}
- **Test Duration**: ${results.duration}ms

### Build Output
\`\`\`
${results.buildOutput}
\`\`\`

### Start Output
\`\`\`
${results.startOutput}
\`\`\`

### Errors
${results.errors.length > 0 ? results.errors.map(e => `- ${e}`).join('\n') : 'None'}

### Next Steps
${results.success ? 
  'Application is working correctly. Ready for deployment.' : 
  'Application needs fixes. See errors above for remediation steps.'
}

---
*Generated on ${new Date().toISOString()}*
`;
}

async function runCommand(command, cwd = PROJECT_ROOT, timeout = 60000) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    
    const child = spawn('sh', ['-c', command], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({
        success: false,
        stdout,
        stderr,
        error: 'Command timed out'
      });
    }, timeout);
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        success: code === 0,
        stdout,
        stderr,
        exitCode: code
      });
    });
    
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({
        success: false,
        stdout,
        stderr,
        error: error.message
      });
    });
  });
}

async function checkAppStructure(appName) {
  const appDir = path.join(APPS_DIR, appName);
  const packageJsonPath = path.join(appDir, 'package.json');
  const nextConfigPath = path.join(appDir, 'next.config.js');
  
  if (!fs.existsSync(appDir)) {
    return { exists: false, error: 'App directory does not exist' };
  }
  
  if (!fs.existsSync(packageJsonPath)) {
    return { exists: false, error: 'package.json not found' };
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return {
      exists: true,
      packageJson,
      hasNextConfig: fs.existsSync(nextConfigPath),
      scripts: packageJson.scripts || {}
    };
  } catch (error) {
    return { exists: false, error: `Invalid package.json: ${error.message}` };
  }
}

async function testAppBuild(appName) {
  const appDir = path.join(APPS_DIR, appName);
  
  console.log(`Building ${appName}...`);
  
  // Try to build the application
  const buildResult = await runCommand('npm run build', appDir, 120000); // 2 minutes timeout
  
  return {
    success: buildResult.success,
    output: buildResult.stdout + buildResult.stderr,
    error: buildResult.error
  };
}

async function testAppStart(appName, port) {
  const appDir = path.join(APPS_DIR, appName);
  
  console.log(`Starting ${appName} on port ${port}...`);
  
  return new Promise((resolve) => {
    const startCommand = `PORT=${port} npm run dev`;
    const child = spawn('sh', ['-c', startCommand], {
      cwd: appDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    let startSuccess = false;
    
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({
        success: startSuccess,
        output: stdout + stderr,
        error: startSuccess ? null : 'Failed to start within timeout'
      });
    }, 30000); // 30 seconds to start
    
    child.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      
      // Check for successful start indicators
      if (output.includes('ready') || 
          output.includes('started') || 
          output.includes(`localhost:${port}`) ||
          output.includes('compiled successfully')) {
        startSuccess = true;
      }
    });
    
    child.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      
      // Also check stderr for success indicators (Next.js logs to stderr)
      if (output.includes('ready') || 
          output.includes('started') || 
          output.includes(`localhost:${port}`) ||
          output.includes('compiled successfully')) {
        startSuccess = true;
      }
    });
    
    child.on('close', (code) => {
      clearTimeout(timeout);
      resolve({
        success: startSuccess,
        output: stdout + stderr,
        error: code !== 0 ? `Process exited with code ${code}` : null
      });
    });
    
    child.on('error', (error) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        output: stdout + stderr,
        error: error.message
      });
    });
  });
}

async function testSingleApp(appName, appIndex) {
  const startTime = Date.now();
  const port = BASE_PORT + appIndex;
  const errors = [];
  
  console.log(`\n🧪 Testing ${appName} (${appIndex + 1}/${APPS.length})`);
  console.log(`📁 App directory: apps/${appName}`);
  console.log(`🌐 Port: ${port}`);
  
  // Check app structure
  const structure = await checkAppStructure(appName);
  if (!structure.exists) {
    errors.push(structure.error);
    const results = {
      appName,
      port,
      success: false,
      buildSuccess: false,
      startSuccess: false,
      buildOutput: '',
      startOutput: '',
      errors,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
    const reportPath = writeReport(appName, results);
    console.log(`❌ ${appName}: Structure check failed - ${structure.error}`);
    console.log(`📄 Report: ${reportPath}`);
    return results;
  }
  
  console.log(`✅ App structure valid`);
  
  // Test build
  const buildResult = await testAppBuild(appName);
  if (!buildResult.success) {
    errors.push(`Build failed: ${buildResult.error || 'Unknown build error'}`);
  }
  
  console.log(`${buildResult.success ? '✅' : '❌'} Build: ${buildResult.success ? 'Success' : 'Failed'}`);
  
  // Test start (only if build succeeded)
  let startResult = { success: false, output: '', error: 'Skipped due to build failure' };
  if (buildResult.success) {
    startResult = await testAppStart(appName, port);
    if (!startResult.success) {
      errors.push(`Start failed: ${startResult.error || 'Unknown start error'}`);
    }
    console.log(`${startResult.success ? '✅' : '❌'} Start: ${startResult.success ? 'Success' : 'Failed'}`);
  } else {
    console.log(`⏭️  Start: Skipped (build failed)`);
  }
  
  const results = {
    appName,
    port,
    success: buildResult.success && startResult.success,
    buildSuccess: buildResult.success,
    startSuccess: startResult.success,
    buildOutput: buildResult.output,
    startOutput: startResult.output,
    errors,
    duration: Date.now() - startTime,
    timestamp: new Date().toISOString()
  };
  
  const reportPath = writeReport(appName, results);
  console.log(`📄 Report: ${reportPath}`);
  
  return results;
}

async function generateSummaryReport(allResults) {
  const summary = {
    total: allResults.length,
    passed: allResults.filter(r => r.success).length,
    failed: allResults.filter(r => !r.success).length,
    buildIssues: allResults.filter(r => !r.buildSuccess).length,
    startIssues: allResults.filter(r => r.buildSuccess && !r.startSuccess).length,
    results: allResults,
    timestamp: new Date().toISOString()
  };
  
  const summaryPath = path.join(TEST_RESULTS_DIR, 'summary-report.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  // Generate summary markdown
  const mdContent = `# Ganger Platform Application Test Summary

## Overview
- **Total Applications**: ${summary.total}
- **Passed**: ${summary.passed} ✅
- **Failed**: ${summary.failed} ❌
- **Build Issues**: ${summary.buildIssues}
- **Start Issues**: ${summary.startIssues}

## Test Results

${allResults.map(r => {
  const status = r.success ? '✅' : '❌';
  const buildStatus = r.buildSuccess ? '✅' : '❌';
  const startStatus = r.startSuccess ? '✅' : '❌';
  
  return `### ${r.appName} ${status}
- **Build**: ${buildStatus}
- **Start**: ${startStatus} 
- **Port**: ${r.port}
- **Duration**: ${r.duration}ms
- **Report**: [View Details](${r.appName}/README.md)
${r.errors.length > 0 ? `- **Errors**: ${r.errors.length}` : ''}
`;
}).join('\n')}

## Remediation Plans

${allResults.filter(r => !r.success).map(r => {
  return `### ${r.appName} Remediation Plan
**Issues:**
${r.errors.map(e => `- ${e}`).join('\n')}

**Recommended Actions:**
${!r.buildSuccess ? '- Fix build errors (see build output in detailed report)' : ''}
${r.buildSuccess && !r.startSuccess ? '- Fix runtime/start issues (see start output in detailed report)' : ''}
- Review dependencies and configurations
- Check for missing environment variables
- Verify Next.js configuration

`;
}).join('\n')}

---
*Generated on ${new Date().toISOString()}*
`;

  const mdPath = path.join(TEST_RESULTS_DIR, 'README.md');
  fs.writeFileSync(mdPath, mdContent);
  
  return { summaryPath, mdPath };
}

async function main() {
  console.log('🚀 Starting Ganger Platform Application Testing');
  console.log(`📁 Project root: ${PROJECT_ROOT}`);
  console.log(`📁 Test results: ${TEST_RESULTS_DIR}`);
  console.log(`📊 Testing ${APPS.length} applications`);
  
  ensureDir(TEST_RESULTS_DIR);
  
  const allResults = [];
  
  for (let i = 0; i < APPS.length; i++) {
    const appName = APPS[i];
    const results = await testSingleApp(appName, i);
    allResults.push(results);
    
    // Brief pause between apps
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Generating summary report...');
  const { summaryPath, mdPath } = await generateSummaryReport(allResults);
  
  console.log('\n🎉 Testing Complete!');
  console.log(`📄 Summary Report: ${summaryPath}`);
  console.log(`📚 Readable Summary: ${mdPath}`);
  console.log(`📁 Individual Reports: ${TEST_RESULTS_DIR}/[app-name]/README.md`);
  
  const summary = allResults.reduce((acc, r) => {
    if (r.success) acc.passed++;
    else acc.failed++;
    return acc;
  }, { passed: 0, failed: 0 });
  
  console.log(`\n✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  
  // Exit with appropriate code
  process.exit(summary.failed > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testSingleApp, main };