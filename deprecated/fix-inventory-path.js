#!/usr/bin/env node

/**
 * Fix the inventory path handling in the getInventoryApp function
 */

const fs = require('fs');

const staffRouterPath = '/mnt/q/Projects/ganger-platform/cloudflare-workers/staff-router.js';

// Read the current file
let content = fs.readFileSync(staffRouterPath, 'utf8');

// Find and replace the problematic path handling
const oldPathLogic = `  // Remove /inventory prefix for R2 key lookup
  let r2Key = pathname.replace('/inventory', '');
  
  // Handle root inventory path
  if (r2Key === '' || r2Key === '/') {
    r2Key = 'index.html';
  }`;

const newPathLogic = `  // Remove /inventory prefix for R2 key lookup
  let r2Key = pathname.replace('/inventory', '');
  
  // Handle root inventory path
  if (r2Key === '' || r2Key === '/') {
    r2Key = 'index.html';
  }
  
  // Debug logging
  console.log('Inventory path debug:', { pathname, r2Key });`;

// Replace the path logic
content = content.replace(oldPathLogic, newPathLogic);

// Write the updated file
fs.writeFileSync(staffRouterPath, content);

console.log('✅ Added debug logging to inventory path handling');
console.log('📁 File updated:', staffRouterPath);