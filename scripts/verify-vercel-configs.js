#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Apps directory
const appsDir = path.join(__dirname, '../apps');

// Get all app directories
const appDirs = fs.readdirSync(appsDir).filter(dir => {
  const fullPath = path.join(appsDir, dir);
  return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'vercel.json'));
});

console.log(`Verifying ${appDirs.length} vercel.json files...\n`);

let hasNpmCommands = 0;
let hasPnpmWithDeps = 0;
let hasPnpmNoDeps = 0;
let hasErrors = 0;

appDirs.forEach(appName => {
  const vercelJsonPath = path.join(appsDir, appName, 'vercel.json');
  
  try {
    const config = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    const installCmd = config.installCommand || '';
    const buildCmd = config.buildCommand || '';
    
    // Check for npm commands (not pnpm)
    if ((installCmd.includes('npm ') && !installCmd.includes('pnpm')) || 
        (buildCmd.includes('npm ') && !buildCmd.includes('pnpm'))) {
      console.log(`❌ ${appName}: Still uses npm commands`);
      hasNpmCommands++;
    }
    // Check for pnpm with dependency builds
    else if (installCmd.includes('pnpm install') && installCmd.includes('build')) {
      console.log(`✅ ${appName}: Uses pnpm with dependency builds`);
      hasPnpmWithDeps++;
    }
    // Check for pnpm without dependency builds
    else if (installCmd.includes('pnpm install')) {
      console.log(`⚠️  ${appName}: Uses pnpm but no dependency builds`);
      hasPnpmNoDeps++;
    }
    else {
      console.log(`❓ ${appName}: Unknown format`);
      hasErrors++;
    }
    
  } catch (error) {
    console.error(`❌ ${appName}: Error reading vercel.json - ${error.message}`);
    hasErrors++;
  }
});

console.log('\n=== Summary ===');
console.log(`✅ Apps with pnpm + deps: ${hasPnpmWithDeps}`);
console.log(`⚠️  Apps with pnpm only: ${hasPnpmNoDeps}`);
console.log(`❌ Apps with npm: ${hasNpmCommands}`);
console.log(`❓ Errors: ${hasErrors}`);
console.log(`Total: ${appDirs.length}`);

if (hasNpmCommands === 0 && hasErrors === 0) {
  console.log('\n🎉 All apps have been successfully migrated to pnpm!');
  if (hasPnpmNoDeps > 0) {
    console.log('Note: Some apps don\'t have dependency builds. Run update-vercel-json-with-deps.js to add them.');
  }
} else {
  console.log('\n⚠️  Some apps still need attention.');
}