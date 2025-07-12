#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find all vercel.json files in apps directory
const appsDir = path.join(__dirname, '..', 'apps');

function updateVercelJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const config = JSON.parse(content);
    
    // Track if changes were made
    let changed = false;
    
    // Update installCommand to remove --no-frozen-lockfile and NODE_ENV=development
    if (config.installCommand) {
      const originalInstall = config.installCommand;
      
      // Remove NODE_ENV=development
      config.installCommand = config.installCommand.replace(/NODE_ENV=development\s+/g, '');
      
      // Remove --no-frozen-lockfile
      config.installCommand = config.installCommand.replace(/--no-frozen-lockfile/g, '');
      
      // Clean up any double spaces
      config.installCommand = config.installCommand.replace(/\s+/g, ' ').trim();
      
      if (originalInstall !== config.installCommand) {
        changed = true;
        console.log(`Updated installCommand in ${filePath}`);
      }
    }
    
    // Add or update env section
    if (!config.env) {
      config.env = {};
      changed = true;
    }
    
    // Set NODE_ENV to production
    if (config.env.NODE_ENV !== 'production') {
      config.env.NODE_ENV = 'production';
      changed = true;
      console.log(`Set NODE_ENV=production in ${filePath}`);
    }
    
    // Add ENABLE_EXPERIMENTAL_COREPACK for pnpm support
    if (!config.env.ENABLE_EXPERIMENTAL_COREPACK) {
      config.env.ENABLE_EXPERIMENTAL_COREPACK = '1';
      changed = true;
      console.log(`Added ENABLE_EXPERIMENTAL_COREPACK in ${filePath}`);
    }
    
    // Write back if changes were made
    if (changed) {
      const updatedContent = JSON.stringify(config, null, 2) + '\n';
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ Updated ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed for ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Process all apps
fs.readdirSync(appsDir).forEach(app => {
  const appPath = path.join(appsDir, app);
  const vercelJsonPath = path.join(appPath, 'vercel.json');
  
  if (fs.existsSync(vercelJsonPath)) {
    console.log(`\nProcessing ${app}...`);
    updateVercelJson(vercelJsonPath);
  }
});

console.log('\n✨ Vercel configuration update complete!');