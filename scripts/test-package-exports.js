#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Testing package exports after fixes...\n');

// Test packages
const packages = [
  '@ganger/db',
  '@ganger/cache', 
  '@ganger/monitoring'
];

// Create a test app to verify imports
const testDir = path.join(__dirname, '../test-exports');
const testFile = path.join(testDir, 'test.ts');

// Create test directory
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Create package.json for test
fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify({
  name: 'test-exports',
  version: '1.0.0',
  private: true,
  dependencies: {
    '@ganger/db': 'workspace:*',
    '@ganger/cache': 'workspace:*',
    '@ganger/monitoring': 'workspace:*',
    'typescript': '^5.0.0'
  }
}, null, 2));

// Create TypeScript config
fs.writeFileSync(path.join(testDir, 'tsconfig.json'), JSON.stringify({
  extends: '../packages/config/typescript/base.json',
  compilerOptions: {
    outDir: 'dist',
    moduleResolution: 'node',
    module: 'commonjs',
    target: 'es2020',
    lib: ['es2020'],
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    strict: false,
    skipLibCheck: true
  },
  include: ['*.ts']
}, null, 2));

// Create test file
const testContent = `
// Test imports from @ganger/db
import { connectionMonitor, db, supabase, supabaseAdmin } from '@ganger/db';

// Test imports from @ganger/cache  
import { cacheManager } from '@ganger/cache';

// Test imports from @ganger/monitoring
import { performanceMonitor } from '@ganger/monitoring';

console.log('✓ All imports resolved successfully');
console.log('✓ connectionMonitor:', typeof connectionMonitor);
console.log('✓ db:', typeof db);
console.log('✓ cacheManager:', typeof cacheManager);
console.log('✓ performanceMonitor:', typeof performanceMonitor);
`;

fs.writeFileSync(testFile, testContent);

console.log('Created test file. Running TypeScript compilation...\n');

try {
  // Install dependencies
  execSync('pnpm install', { cwd: testDir, stdio: 'inherit' });
  
  // Run TypeScript compilation
  execSync('pnpm exec tsc --noEmit', { cwd: testDir, stdio: 'inherit' });
  
  console.log('\n✅ All package exports are working correctly!');
  console.log('The exports field additions have fixed the import issues.\n');
} catch (error) {
  console.error('\n❌ Export test failed:', error.message);
  process.exit(1);
} finally {
  // Cleanup
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}