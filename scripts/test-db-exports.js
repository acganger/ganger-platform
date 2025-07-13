#!/usr/bin/env node

// Test script to verify @ganger/db exports
console.log('Testing @ganger/db exports...\n');

try {
  // Try to require the module
  const dbExports = require('../packages/db/src/index.ts');
  
  console.log('✓ Module loaded successfully');
  
  // Check for connectionMonitor
  if (dbExports.connectionMonitor) {
    console.log('✓ connectionMonitor is exported');
    console.log('  Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(dbExports.connectionMonitor)).filter(m => m !== 'constructor').join(', '));
  } else {
    console.log('✗ connectionMonitor is NOT exported');
  }
  
  // List all exports
  console.log('\nAll exports from @ganger/db:');
  Object.keys(dbExports).forEach(key => {
    console.log(`  - ${key}: ${typeof dbExports[key]}`);
  });
  
} catch (error) {
  console.error('✗ Failed to load module:', error.message);
  
  // Try TypeScript approach
  console.log('\nTrying with ts-node...');
  try {
    require('ts-node/register');
    const dbExports = require('../packages/db/src/index.ts');
    console.log('✓ Module loaded with ts-node');
    console.log('connectionMonitor exported:', !!dbExports.connectionMonitor);
  } catch (tsError) {
    console.error('✗ ts-node also failed:', tsError.message);
  }
}