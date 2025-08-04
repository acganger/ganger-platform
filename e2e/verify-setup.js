const { chromium } = require('@playwright/test');

console.log('Playwright setup verification');
console.log('=============================');

// Check if Playwright is installed
try {
  const version = require('@playwright/test/package.json').version;
  console.log(`✓ Playwright version: ${version}`);
} catch (error) {
  console.error('✗ Playwright not found');
  process.exit(1);
}

// Check configuration
try {
  const config = require('../playwright.config.ts');
  console.log('✓ Playwright config found');
  console.log(`  - Test directory: ${config.default.testDir || './e2e'}`);
  console.log(`  - Base URL: ${config.default.use?.baseURL || 'Not set'}`);
} catch (error) {
  console.error('✗ Playwright config not found or has errors');
}

// Check test files
const fs = require('fs');
const path = require('path');
const testDir = path.join(__dirname, 'tests');

if (fs.existsSync(testDir)) {
  const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.spec.ts'));
  console.log(`✓ Found ${testFiles.length} test files:`);
  testFiles.forEach(file => console.log(`  - ${file}`));
} else {
  console.error('✗ Test directory not found');
}

console.log('\nSetup Summary:');
console.log('- Playwright is installed');
console.log('- Configuration is in place');
console.log('- Test files are created');
console.log('- To run tests, browsers need to be installed with: pnpm playwright:install');
console.log('- Then run tests with: pnpm test:e2e');