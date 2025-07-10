#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common dependencies that most apps need
const COMMON_DEPS = ['auth', 'ui', 'utils', 'config'];

// Apps directory
const appsDir = path.join(__dirname, '../apps');

// Get all app directories
const appDirs = fs.readdirSync(appsDir).filter(dir => {
  const fullPath = path.join(appsDir, dir);
  return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'vercel.json'));
});

console.log(`Found ${appDirs.length} apps with vercel.json files\n`);

appDirs.forEach(appName => {
  const vercelJsonPath = path.join(appsDir, appName, 'vercel.json');
  
  try {
    // Read current vercel.json
    const currentConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    
    // Extract package name from buildCommand if it exists
    let packageName = appName;
    if (currentConfig.buildCommand) {
      const match = currentConfig.buildCommand.match(/@ganger\/([^\s]+)/);
      if (match) {
        packageName = match[1];
      }
    }
    
    // Build the dependency build commands
    const depBuildCommands = COMMON_DEPS.map(dep => `pnpm -F @ganger/${dep} build`).join(' && ');
    
    // Create updated config with extended installCommand
    const updatedConfig = {
      installCommand: `cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile && ${depBuildCommands}`,
      buildCommand: `cd ../.. && pnpm -F @ganger/${packageName} build`,
      outputDirectory: ".next",
      framework: "nextjs"
    };
    
    // Check if config has changed
    const currentInstall = currentConfig.installCommand || '';
    const hasDepBuilds = currentInstall.includes('build');
    
    if (!hasDepBuilds) {
      // Write updated config
      fs.writeFileSync(vercelJsonPath, JSON.stringify(updatedConfig, null, 2) + '\n');
      console.log(`✅ Updated ${appName}/vercel.json with dependency builds`);
    } else {
      console.log(`⏭️  Skipped ${appName}/vercel.json (already has dependency builds)`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${appName}/vercel.json:`, error.message);
  }
});

console.log('\nDone! All vercel.json files have been updated with dependency builds.');
console.log('\nNote: This adds builds for common dependencies (auth, ui, utils, config).');
console.log('If specific apps need different dependencies, you may need to customize them.');