#!/usr/bin/env node

/**
 * Fix apps deployment configurations - CORRECTED VERSION
 * - Remove invalid runtime: 'edge' configuration
 * - Fix build scripts to avoid recursive calls
 * - Ensure proper @cloudflare/next-on-pages integration
 */

const fs = require('fs');
const path = require('path');

const APPS_DIR = path.join(__dirname, 'apps');

const APPS_TO_FIX = [
  'handouts',
  'checkin-kiosk', 
  'medication-auth',
  'eos-l10',
  'pharma-scheduling',
  'call-center-ops',
  'batch-closeout',
  'clinical-staffing',
  'compliance-training',
  'platform-dashboard',
  'config-dashboard',
  'component-showcase',
  'integration-status',
  'ai-receptionist',
  'socials-reviews',
  'inventory'
];

const NEXT_CONFIG_TEMPLATE = (appName, basePath) => `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ganger/auth', '@ganger/db', '@ganger/integrations', '@ganger/ui', '@ganger/utils'],
  
  // Staff portal integration
  basePath: '${basePath}',
  assetPrefix: '${basePath}',
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  images: {
    domains: ['pfqtzmxxxhhsxmlddrta.supabase.co'],
    unoptimized: true,
  },
};

module.exports = nextConfig;`;

const BASE_PATH_MAP = {
  'handouts': '/handouts',
  'checkin-kiosk': '/checkin', 
  'medication-auth': '/meds',
  'eos-l10': '/l10',
  'pharma-scheduling': '/reps',
  'call-center-ops': '/phones',
  'batch-closeout': '/batch',
  'clinical-staffing': '/staffing',
  'compliance-training': '/compliance',
  'platform-dashboard': '/dashboard',
  'config-dashboard': '/config',
  'component-showcase': '/showcase',
  'integration-status': '/status',
  'ai-receptionist': '/ai',
  'socials-reviews': '/socials',
  'inventory': '/inventory'
};

function fixApp(appName) {
  const appDir = path.join(APPS_DIR, appName);
  
  if (!fs.existsSync(appDir)) {
    console.log(`❌ App ${appName} directory not found`);
    return;
  }

  console.log(`🔧 Fixing ${appName}...`);

  const basePath = BASE_PATH_MAP[appName] || `/${appName}`;

  try {
    // 1. Fix next.config.js - Remove invalid runtime config
    const nextConfigPath = path.join(appDir, 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      fs.writeFileSync(nextConfigPath, NEXT_CONFIG_TEMPLATE(appName, basePath));
      console.log(`  ✅ Updated next.config.js (removed invalid runtime config)`);
    }

    // 2. Update package.json build scripts - Fix recursive build issue
    const packageJsonPath = path.join(appDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Update scripts to fix recursive build issue
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts.build = 'next build';
      packageJson.scripts['build:worker'] = 'npx @cloudflare/next-on-pages';
      packageJson.scripts['build:cloudflare'] = 'next build && npx @cloudflare/next-on-pages';
      packageJson.scripts.deploy = `pnpm run build:cloudflare && wrangler pages deploy .vercel/output/static --project-name=${appName}-production`;

      // Ensure dependencies
      packageJson.devDependencies = packageJson.devDependencies || {};
      if (!packageJson.devDependencies['@cloudflare/next-on-pages']) {
        packageJson.devDependencies['@cloudflare/next-on-pages'] = '^1.13.12';
      }

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`  ✅ Updated package.json (fixed recursive build)`);
    }

    console.log(`✅ ${appName} fixed successfully\n`);

  } catch (error) {
    console.log(`❌ Error fixing ${appName}:`, error.message);
  }
}

function main() {
  console.log('🚀 Fixing app deployment configurations...\n');
  
  APPS_TO_FIX.forEach(appName => {
    fixApp(appName);
  });
  
  console.log('🎉 All apps processed!');
  console.log('\nKey fixes applied:');
  console.log('✅ Removed invalid runtime: "edge" from experimental config');
  console.log('✅ Fixed recursive build script issue');
  console.log('✅ Separated Next.js build from Cloudflare Workers build');
  console.log('\nNext steps:');
  console.log('1. Commit changes: git add . && git commit -m "Fix app deployment configs"');
  console.log('2. Push to trigger deployment: git push origin main');
}

if (require.main === module) {
  main();
}

module.exports = { fixApp, APPS_TO_FIX };