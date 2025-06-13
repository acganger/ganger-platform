#!/usr/bin/env node
/**
 * 🎨 Ganger Platform - Theme Update Script
 * Easily change themes for individual apps or the entire platform
 */

const fs = require('fs');
const path = require('path');

// Predefined theme options
const themes = {
  'medical-blue': {
    primary: '#1e40af',
    secondary: '#3b82f6', 
    accent: '#60a5fa',
    name: 'Medical Blue'
  },
  'medical-green': {
    primary: '#059669',
    secondary: '#047857',
    accent: '#065f46', 
    name: 'Medical Green'
  },
  'medical-purple': {
    primary: '#7c3aed',
    secondary: '#6d28d9',
    accent: '#5b21b6',
    name: 'Medical Purple'
  },
  'medical-teal': {
    primary: '#0d9488',
    secondary: '#0f766e',
    accent: '#134e4a',
    name: 'Medical Teal'
  },
  'professional-gray': {
    primary: '#374151',
    secondary: '#4b5563',
    accent: '#6b7280',
    name: 'Professional Gray'
  }
};

function showUsage() {
  console.log('🎨 Ganger Platform Theme Updater');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/update-theme.js --app=inventory --theme=medical-blue');
  console.log('  node scripts/update-theme.js --all --theme=medical-green');
  console.log('  node scripts/update-theme.js --list-themes');
  console.log('');
  console.log('Available themes:');
  Object.keys(themes).forEach(key => {
    console.log(`  • ${key} - ${themes[key].name}`);
  });
  console.log('');
  console.log('Available apps:');
  console.log('  inventory, handouts, l10, compliance, phones, config,');
  console.log('  social, pepe, staffing, dashboard, batch, reps, status, meds');
}

// Parse command line arguments
const args = process.argv.slice(2);
const appArg = args.find(arg => arg.startsWith('--app='))?.split('=')[1];
const themeArg = args.find(arg => arg.startsWith('--theme='))?.split('=')[1];
const allApps = args.includes('--all');
const listThemes = args.includes('--list-themes');

if (listThemes) {
  showUsage();
  process.exit(0);
}

if (!themeArg || (!appArg && !allApps)) {
  showUsage();
  process.exit(1);
}

if (!themes[themeArg]) {
  console.error(`❌ Theme "${themeArg}" not found. Use --list-themes to see available themes.`);
  process.exit(1);
}

const selectedTheme = themes[themeArg];
const gradient = `linear-gradient(135deg, ${selectedTheme.primary} 0%, ${selectedTheme.secondary} 50%, ${selectedTheme.accent} 100%)`;

console.log(`🎨 Updating theme to: ${selectedTheme.name}`);
console.log(`   Gradient: ${gradient}`);

// Read the staff router file
const routerPath = path.join(__dirname, '../cloudflare-workers/staff-router.js');
let routerContent = fs.readFileSync(routerPath, 'utf8');

// Define app path mappings
const appPaths = {
  'inventory': '/inventory',
  'handouts': '/handouts', 
  'l10': '/l10',
  'compliance': '/compliance',
  'phones': '/phones',
  'config': '/config',
  'social': '/social',
  'pepe': '/pepe',
  'staffing': '/staffing',
  'dashboard': '/dashboard',
  'batch': '/batch',
  'reps': '/reps',
  'status': '/status',
  'meds': '/meds'
};

function updateAppTheme(content, appPath) {
  // Find the app's section and update its background gradient
  const appSectionRegex = new RegExp(
    `(if \\(pathname === '${appPath}'\\)[\\s\\S]*?background: )linear-gradient\\([^;]+\\);`,
    'g'
  );
  
  return content.replace(appSectionRegex, `$1${gradient};`);
}

// Update themes
if (allApps) {
  console.log('🔄 Updating all applications...');
  Object.values(appPaths).forEach(appPath => {
    routerContent = updateAppTheme(routerContent, appPath);
    console.log(`   ✅ Updated ${appPath}`);
  });
} else {
  if (!appPaths[appArg]) {
    console.error(`❌ App "${appArg}" not found. Use --list-themes to see available apps.`);
    process.exit(1);
  }
  
  console.log(`🔄 Updating ${appArg} application...`);
  routerContent = updateAppTheme(routerContent, appPaths[appArg]);
  console.log(`   ✅ Updated ${appPaths[appArg]}`);
}

// Write the updated content
fs.writeFileSync(routerPath, routerContent);

console.log('');
console.log('✅ Theme update complete!');
console.log('');
console.log('🚀 Next steps:');
console.log('   1. Deploy: cd cloudflare-workers && npx wrangler deploy --env production');
console.log('   2. Or commit and push for auto-deployment:');
console.log('      git add . && git commit -m "Update theme" && git push origin main');
console.log('');
console.log(`🌐 Changes will be live at: https://staff.gangerdermatology.com/`);