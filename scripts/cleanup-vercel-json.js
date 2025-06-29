#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all vercel.json files
const files = glob.sync('apps/*/vercel.json');

console.log(`Found ${files.length} vercel.json files to clean up...`);

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const json = JSON.parse(content);
    
    if (json.ignoreCommand) {
      delete json.ignoreCommand;
      
      // Write back with proper formatting
      fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
      console.log(`✅ Removed ignoreCommand from ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log('\nCleanup complete!');