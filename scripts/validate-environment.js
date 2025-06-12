#!/usr/bin/env node
/**
 * Environment Configuration Validation Script
 * Validates that all applications have proper environment configuration
 * and no hardcoded localhost references remain in production code
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Configuration
const APP_DIRECTORIES = [
  'apps/staff',
  'apps/clinical-staffing',
  'apps/medication-auth',
  'apps/call-center-ops',
  'apps/integration-status',
  'apps/platform-dashboard',
  'apps/socials-reviews',
  'apps/handouts',
  'apps/inventory',
  'apps/checkin-kiosk',
  'apps/eos-l10',
  'apps/pharma-scheduling',
  'apps/compliance-training',
  'apps/batch-closeout',
  'apps/config-dashboard'
];

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'GOOGLE_CLIENT_ID'
];

const PROHIBITED_PATTERNS = [
  /localhost/gi,
  /127\.0\.0\.1/gi,
  /http:\/\/[^:]*:3\d{3}/gi
];

let validationResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

/**
 * Print colored output to console
 */
function colorLog(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print section header
 */
function printHeader(title) {
  colorLog(`\n${'='.repeat(60)}`, 'cyan');
  colorLog(`${title}`, 'cyan');
  colorLog(`${'='.repeat(60)}`, 'cyan');
}

/**
 * Print subsection header
 */
function printSubHeader(title) {
  colorLog(`\n${colors.bold}${title}${colors.reset}`, 'blue');
  colorLog(`${'-'.repeat(40)}`, 'blue');
}

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (e) {
    return false;
  }
}

/**
 * Check if a directory exists
 */
function dirExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (e) {
    return false;
  }
}

/**
 * Read file content safely
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null;
  }
}

/**
 * Search for patterns in file content
 */
function searchPatterns(content, patterns) {
  const findings = [];
  
  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      findings.push({
        pattern: pattern.toString(),
        matches: matches,
        count: matches.length
      });
    }
  });
  
  return findings;
}

/**
 * Validate individual application configuration
 */
function validateApp(appDir) {
  const appName = path.basename(appDir);
  const results = {
    name: appName,
    passed: true,
    issues: [],
    warnings: []
  };

  printSubHeader(`Validating ${appName}`);

  // Check if app directory exists
  if (!dirExists(appDir)) {
    results.passed = false;
    results.issues.push(`Directory ${appDir} does not exist`);
    colorLog(`❌ Directory not found: ${appDir}`, 'red');
    return results;
  }

  // Check for required configuration files
  const configFiles = [
    'package.json',
    'next.config.js',
    'src/lib/supabase.ts'
  ];

  configFiles.forEach(file => {
    const filePath = path.join(appDir, file);
    if (!fileExists(filePath)) {
      results.issues.push(`Missing required file: ${file}`);
      colorLog(`❌ Missing: ${file}`, 'red');
    } else {
      colorLog(`✅ Found: ${file}`, 'green');
    }
  });

  // Check Next.js configuration
  const nextConfigPath = path.join(appDir, 'next.config.js');
  if (fileExists(nextConfigPath)) {
    const nextConfigContent = readFile(nextConfigPath);
    if (nextConfigContent) {
      if (nextConfigContent.includes('@ganger/config/next-config-template')) {
        colorLog(`✅ Using standardized Next.js config`, 'green');
      } else {
        results.warnings.push('Not using standardized Next.js configuration');
        colorLog(`⚠️  Not using standardized Next.js config`, 'yellow');
      }

      // Check for localhost in Next.js config
      const localhostFindings = searchPatterns(nextConfigContent, [/localhost/gi]);
      if (localhostFindings.length > 0) {
        results.issues.push(`Localhost references found in next.config.js`);
        colorLog(`❌ Localhost references in next.config.js`, 'red');
      }
    }
  }

  // Check Supabase configuration
  const supabaseConfigPath = path.join(appDir, 'src/lib/supabase.ts');
  if (fileExists(supabaseConfigPath)) {
    const supabaseContent = readFile(supabaseConfigPath);
    if (supabaseContent) {
      if (supabaseContent.includes('@ganger/config')) {
        colorLog(`✅ Using standardized Supabase config`, 'green');
      } else {
        results.warnings.push('Not using standardized Supabase configuration');
        colorLog(`⚠️  Not using standardized Supabase config`, 'yellow');
      }

      // Check for hardcoded values
      if (supabaseContent.includes('https://pfqtzmxxxhhsxmlddrta.supabase.co')) {
        results.warnings.push('Hardcoded Supabase URL found');
        colorLog(`⚠️  Hardcoded Supabase URL (consider using env vars only)`, 'yellow');
      }
    }
  }

  // Check for localhost references in source files
  const srcDir = path.join(appDir, 'src');
  if (dirExists(srcDir)) {
    const localhostCount = searchForLocalhostReferences(srcDir);
    if (localhostCount > 0) {
      results.issues.push(`${localhostCount} localhost references found in source files`);
      colorLog(`❌ ${localhostCount} localhost references in source files`, 'red');
    } else {
      colorLog(`✅ No localhost references in source files`, 'green');
    }
  }

  // Check for environment variable usage
  const envUsageCount = checkEnvironmentVariableUsage(path.join(appDir, 'src'));
  if (envUsageCount > 0) {
    colorLog(`✅ ${envUsageCount} environment variables used`, 'green');
  } else {
    results.warnings.push('No environment variables detected');
    colorLog(`⚠️  No environment variable usage detected`, 'yellow');
  }

  // Check TypeScript compilation
  try {
    colorLog(`🔍 Checking TypeScript compilation...`, 'blue');
    const tscOutput = execSync(`cd ${appDir} && npx tsc --noEmit`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    colorLog(`✅ TypeScript compilation passed`, 'green');
  } catch (error) {
    results.warnings.push('TypeScript compilation has issues');
    colorLog(`⚠️  TypeScript compilation issues detected`, 'yellow');
  }

  // Summary for this app
  if (results.issues.length === 0) {
    colorLog(`\n✅ ${appName} validation PASSED`, 'green');
    validationResults.passed++;
  } else {
    colorLog(`\n❌ ${appName} validation FAILED`, 'red');
    validationResults.failed++;
  }

  if (results.warnings.length > 0) {
    validationResults.warnings += results.warnings.length;
  }

  return results;
}

/**
 * Search for localhost references in a directory
 */
function searchForLocalhostReferences(dir) {
  let count = 0;
  
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
        count += searchForLocalhostReferences(fullPath);
      } else if (file.isFile() && /\.(ts|tsx|js|jsx)$/.test(file.name)) {
        const content = readFile(fullPath);
        if (content) {
          const findings = searchPatterns(content, PROHIBITED_PATTERNS);
          findings.forEach(finding => {
            count += finding.count;
            colorLog(`  📍 ${file.name}: ${finding.count} match(es) for ${finding.pattern}`, 'yellow');
          });
        }
      }
    });
  } catch (e) {
    // Ignore permission errors
  }
  
  return count;
}

/**
 * Check environment variable usage in source files
 */
function checkEnvironmentVariableUsage(dir) {
  let count = 0;
  
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
        count += checkEnvironmentVariableUsage(fullPath);
      } else if (file.isFile() && /\.(ts|tsx|js|jsx)$/.test(file.name)) {
        const content = readFile(fullPath);
        if (content) {
          const envMatches = content.match(/process\.env\./g);
          if (envMatches) {
            count += envMatches.length;
          }
        }
      }
    });
  } catch (e) {
    // Ignore permission errors
  }
  
  return count;
}

/**
 * Validate global environment configuration
 */
function validateGlobalConfig() {
  printSubHeader('Global Configuration');

  // Check for environment example files
  const envFiles = [
    '.env.production.example',
    '.env.development.example'
  ];

  envFiles.forEach(file => {
    if (fileExists(file)) {
      colorLog(`✅ Found: ${file}`, 'green');
    } else {
      validationResults.errors.push(`Missing ${file}`);
      colorLog(`❌ Missing: ${file}`, 'red');
    }
  });

  // Check @ganger/config package
  const configPackagePath = 'packages/config/package.json';
  if (fileExists(configPackagePath)) {
    colorLog(`✅ @ganger/config package exists`, 'green');
    
    // Check for key configuration files
    const configFiles = [
      'packages/config/environment.ts',
      'packages/config/next-config-template.js',
      'packages/config/supabase-template.ts'
    ];

    configFiles.forEach(file => {
      if (fileExists(file)) {
        colorLog(`✅ Found: ${path.basename(file)}`, 'green');
      } else {
        validationResults.errors.push(`Missing config file: ${file}`);
        colorLog(`❌ Missing: ${file}`, 'red');
      }
    });
  } else {
    validationResults.errors.push('Missing @ganger/config package');
    colorLog(`❌ Missing @ganger/config package`, 'red');
  }

  // Check package.json for workspace configuration
  if (fileExists('package.json')) {
    const packageContent = readFile('package.json');
    try {
      const packageJson = JSON.parse(packageContent);
      if (packageJson.workspaces) {
        colorLog(`✅ Workspace configuration found`, 'green');
      } else {
        validationResults.warnings++;
        colorLog(`⚠️  No workspace configuration`, 'yellow');
      }
    } catch (e) {
      validationResults.errors.push('Invalid package.json');
      colorLog(`❌ Invalid package.json`, 'red');
    }
  }
}

/**
 * Generate validation report
 */
function generateReport(appResults) {
  printHeader('VALIDATION REPORT');

  colorLog(`📊 Summary:`, 'bold');
  colorLog(`  ✅ Passed: ${validationResults.passed} applications`);
  colorLog(`  ❌ Failed: ${validationResults.failed} applications`);
  colorLog(`  ⚠️  Warnings: ${validationResults.warnings} total`);
  colorLog(`  🚨 Critical Errors: ${validationResults.errors.length}`);

  if (validationResults.errors.length > 0) {
    colorLog(`\n🚨 Critical Errors:`, 'red');
    validationResults.errors.forEach(error => {
      colorLog(`  • ${error}`, 'red');
    });
  }

  // Detailed app results
  colorLog(`\n📋 Application Details:`, 'bold');
  appResults.forEach(result => {
    if (result.passed) {
      colorLog(`  ✅ ${result.name}`, 'green');
    } else {
      colorLog(`  ❌ ${result.name}`, 'red');
      result.issues.forEach(issue => {
        colorLog(`    • ${issue}`, 'red');
      });
    }
    
    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        colorLog(`    ⚠️  ${warning}`, 'yellow');
      });
    }
  });

  // Recommendations
  printSubHeader('Recommendations');
  
  if (validationResults.failed > 0) {
    colorLog(`🔧 Fix failed applications before deployment`, 'yellow');
  }
  
  if (validationResults.warnings > 5) {
    colorLog(`🔧 Consider addressing warnings for better consistency`, 'yellow');
  }
  
  if (validationResults.passed === APP_DIRECTORIES.length && validationResults.errors.length === 0) {
    colorLog(`🎉 All applications are ready for deployment!`, 'green');
  }

  return validationResults.failed === 0 && validationResults.errors.length === 0;
}

/**
 * Main validation function
 */
function main() {
  printHeader('GANGER PLATFORM - ENVIRONMENT CONFIGURATION VALIDATION');
  
  colorLog(`🔍 Validating ${APP_DIRECTORIES.length} applications...`, 'blue');
  colorLog(`📁 Checking for localhost references and configuration issues`, 'blue');

  // Validate global configuration
  validateGlobalConfig();

  // Validate each application
  const appResults = [];
  
  APP_DIRECTORIES.forEach(appDir => {
    const result = validateApp(appDir);
    appResults.push(result);
  });

  // Generate and display report
  const success = generateReport(appResults);

  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Run validation if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validateApp,
  validateGlobalConfig,
  searchForLocalhostReferences,
  checkEnvironmentVariableUsage
};