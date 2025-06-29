#!/usr/bin/env node

/**
 * Deployment Status Dashboard
 * Checks the deployment status of all apps in the monorepo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// List of all apps
const apps = [
  'ai-receptionist',
  'batch-closeout',
  'call-center-ops',
  'checkin-kiosk',
  'clinical-staffing',
  'compliance-training',
  'component-showcase',
  'config-dashboard',
  'deployment-helper',
  'eos-l10',
  'handouts',
  'integration-status',
  'inventory',
  'llm-demo',
  'medication-auth',
  'pharma-scheduling',
  'platform-dashboard',
  'socials-reviews',
  'staff'
];

// Function to get Vercel deployment status
async function getDeploymentStatus(appName) {
  try {
    // Check if vercel.json exists
    const vercelJsonPath = path.join('apps', appName, 'vercel.json');
    const hasVercelJson = fs.existsSync(vercelJsonPath);
    
    // Check if app has turbo-ignore configured
    let hasTurboIgnore = false;
    if (hasVercelJson) {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
      hasTurboIgnore = vercelConfig.ignoreCommand?.includes('turbo-ignore');
    }
    
    // Get last commit that modified this app
    const lastCommit = execSync(
      `git log -1 --pretty=format:"%h %s" -- apps/${appName}`,
      { encoding: 'utf8' }
    ).trim();
    
    return {
      name: appName,
      hasVercelJson,
      hasTurboIgnore,
      lastCommit: lastCommit || 'No commits found',
      status: hasVercelJson ? 'configured' : 'not configured'
    };
  } catch (error) {
    return {
      name: appName,
      hasVercelJson: false,
      hasTurboIgnore: false,
      lastCommit: 'Error checking',
      status: 'error'
    };
  }
}

// Main function
async function main() {
  console.log(`${colors.bright}${colors.blue}🚀 Ganger Platform - Deployment Status Dashboard${colors.reset}\n`);
  console.log(`${colors.dim}Checking ${apps.length} applications...${colors.reset}\n`);
  
  const statuses = await Promise.all(apps.map(getDeploymentStatus));
  
  // Summary statistics
  const configured = statuses.filter(s => s.hasVercelJson).length;
  const withTurboIgnore = statuses.filter(s => s.hasTurboIgnore).length;
  
  console.log(`${colors.bright}📊 Summary:${colors.reset}`);
  console.log(`  • Total apps: ${apps.length}`);
  console.log(`  • Configured for Vercel: ${colors.green}${configured}${colors.reset}`);
  console.log(`  • With turbo-ignore: ${colors.cyan}${withTurboIgnore}${colors.reset}`);
  console.log(`  • Missing configuration: ${colors.yellow}${apps.length - configured}${colors.reset}\n`);
  
  // Detailed status table
  console.log(`${colors.bright}📋 Detailed Status:${colors.reset}`);
  console.log('─'.repeat(100));
  console.log(
    `${'App Name'.padEnd(25)} | ` +
    `${'Vercel'.padEnd(8)} | ` +
    `${'Turbo'.padEnd(7)} | ` +
    `${'Last Commit'.padEnd(50)}`
  );
  console.log('─'.repeat(100));
  
  statuses.forEach(status => {
    const vercelIcon = status.hasVercelJson ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    const turboIcon = status.hasTurboIgnore ? `${colors.cyan}✓${colors.reset}` : `${colors.yellow}-${colors.reset}`;
    const appName = status.name.padEnd(25);
    const lastCommit = status.lastCommit.substring(0, 50).padEnd(50);
    
    console.log(
      `${appName} | ` +
      `${vercelIcon.padEnd(17)} | ` +
      `${turboIcon.padEnd(16)} | ` +
      `${colors.dim}${lastCommit}${colors.reset}`
    );
  });
  
  console.log('─'.repeat(100));
  
  // Recommendations
  if (configured < apps.length) {
    console.log(`\n${colors.yellow}⚠️  Recommendations:${colors.reset}`);
    const unconfigured = statuses.filter(s => !s.hasVercelJson);
    console.log(`  • ${unconfigured.length} apps need Vercel configuration:`);
    unconfigured.forEach(app => {
      console.log(`    - ${app.name}`);
    });
  }
  
  if (withTurboIgnore < configured) {
    console.log(`\n${colors.cyan}💡 Optimization:${colors.reset}`);
    const needsTurboIgnore = statuses.filter(s => s.hasVercelJson && !s.hasTurboIgnore);
    console.log(`  • ${needsTurboIgnore.length} apps could benefit from turbo-ignore:`);
    needsTurboIgnore.forEach(app => {
      console.log(`    - ${app.name}`);
    });
  }
  
  console.log(`\n${colors.dim}Run 'vercel list' to see actual deployment status${colors.reset}`);
}

// Run the script
main().catch(console.error);