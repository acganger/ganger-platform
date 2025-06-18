#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const APPS = [
  'ai-receptionist',
  'batch-closeout', 
  'call-center-ops',
  'checkin-kiosk',
  'clinical-staffing',
  'compliance-training',
  'component-showcase',
  'config-dashboard',
  'eos-l10',
  'handouts',
  'integration-status',
  'inventory',
  'medication-auth',
  'pharma-scheduling',
  'platform-dashboard',
  'socials-reviews',
  'staff'
];

const PROJECT_ROOT = process.cwd();
const APPS_DIR = path.join(PROJECT_ROOT, 'apps');

function findFiles(dir, extensions = ['.tsx', '.ts']) {
  const files = [];
  
  if (!fs.existsSync(dir)) return files;
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== 'node_modules' && item !== '.next' && item !== 'dist' && item !== 'out') {
      files.push(...findFiles(fullPath, extensions));
    } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixAuthUsage(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let newContent = content;
  
  // Fix 1: Replace user.role with profile.role
  if (content.includes('user?.role')) {
    console.log(`Fixing user.role usage in ${filePath}`);
    newContent = newContent.replace(/user\?\.role/g, 'profile?.role');
    modified = true;
  }
  
  if (content.includes('user.role')) {
    console.log(`Fixing user.role usage in ${filePath}`);
    newContent = newContent.replace(/user\.role/g, 'profile?.role');
    modified = true;
  }
  
  // Fix 2: Ensure profile is imported from useAuth
  if (content.includes('profile?.role') && content.includes('useAuth') && !content.includes('profile }')) {
    console.log(`Adding profile to useAuth destructuring in ${filePath}`);
    
    // Pattern to match const { user } = useAuth(); and similar
    const useAuthPattern = /const\s+{\s*([^}]+)\s*}\s*=\s*useAuth\(\)/;
    const match = newContent.match(useAuthPattern);
    
    if (match) {
      const existingImports = match[1];
      if (!existingImports.includes('profile')) {
        const newImports = existingImports.includes('user') 
          ? existingImports.replace('user', 'user, profile')
          : `${existingImports}, profile`;
        newContent = newContent.replace(useAuthPattern, `const { ${newImports} } = useAuth()`);
        modified = true;
      }
    }
  }
  
  // Fix 3: Replace common user.email with user?.email for safety
  if (content.includes('user.email') && !content.includes('user?.email')) {
    console.log(`Making user.email access safe in ${filePath}`);
    newContent = newContent.replace(/user\.email/g, 'user?.email');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, newContent);
    return true;
  }
  
  return false;
}

function fixApp(appName) {
  console.log(`\n🔧 Fixing auth usage in ${appName}...`);
  
  const appDir = path.join(APPS_DIR, appName);
  if (!fs.existsSync(appDir)) {
    console.log(`❌ App directory not found: ${appDir}`);
    return { fixed: 0, errors: [`App directory not found: ${appDir}`] };
  }
  
  const files = findFiles(appDir, ['.tsx', '.ts']);
  let fixed = 0;
  const errors = [];
  
  for (const file of files) {
    try {
      if (fixAuthUsage(file)) {
        fixed++;
      }
    } catch (error) {
      errors.push(`Error fixing ${file}: ${error.message}`);
    }
  }
  
  console.log(`✅ Fixed ${fixed} files in ${appName}`);
  if (errors.length > 0) {
    console.log(`⚠️  Errors: ${errors.length}`);
    errors.forEach(error => console.log(`   ${error}`));
  }
  
  return { fixed, errors };
}

async function main() {
  console.log('🚀 Starting Auth Usage Fixes');
  console.log(`📁 Project root: ${PROJECT_ROOT}`);
  console.log(`🔧 Fixing auth usage patterns in ${APPS.length} applications`);
  
  let totalFixed = 0;
  const allErrors = [];
  
  for (const appName of APPS) {
    const result = fixApp(appName);
    totalFixed += result.fixed;
    allErrors.push(...result.errors);
  }
  
  console.log('\n📊 Summary:');
  console.log(`✅ Total files fixed: ${totalFixed}`);
  console.log(`❌ Total errors: ${allErrors.length}`);
  
  if (allErrors.length > 0) {
    console.log('\n🔴 Errors encountered:');
    allErrors.forEach(error => console.log(`  ${error}`));
  }
  
  console.log('\n🎉 Auth usage fixes complete!');
  console.log('Next steps:');
  console.log('1. Test builds: npm run build');
  console.log('2. Test individual apps: cd apps/[app-name] && npm run build');
  
  process.exit(allErrors.length > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { fixApp, fixAuthUsage, main };