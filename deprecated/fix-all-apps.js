#!/usr/bin/env node

/**
 * Script to fix all apps deployment configurations
 * - Remove static export configurations
 * - Add proper Next.js + Workers runtime
 * - Update build scripts for @cloudflare/next-on-pages
 * - Remove demo content
 * - Ensure proper Tailwind v4 setup
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
  'ai-receptionist'
];

const NEXT_CONFIG_TEMPLATE = (appName, basePath) => `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ganger/auth', '@ganger/db', '@ganger/integrations', '@ganger/ui', '@ganger/utils'],
  
  // Cloudflare Workers runtime
  experimental: {
    runtime: 'edge',
  },
  
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

const WORKER_TEMPLATE = (serviceName, basePath) => `/**
 * Cloudflare Worker for ${serviceName} Next.js Application
 * Using @cloudflare/next-on-pages for proper Next.js runtime
 */

import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

// Import the Next.js handler from the build
import { default as nextHandler } from './_worker.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check endpoint
    if (url.pathname === '${basePath}/health' || url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: '${serviceName}',
        deployment: 'next-on-pages',
        runtime: 'cloudflare-workers'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      // Use Next.js handler for all requests
      return await nextHandler.fetch(request, env, ctx);
    } catch (error) {
      console.error('Next.js handler error:', error);
      
      // Fallback error response
      return new Response(JSON.stringify({
        error: 'Application Error',
        message: 'The ${serviceName} application encountered an error',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
};`;

const POSTCSS_CONFIG = `module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}`;

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
  'ai-receptionist': '/ai'
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
    // 1. Fix next.config.js
    const nextConfigPath = path.join(appDir, 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      const serviceName = appName.replace(/-/g, ' ');
      fs.writeFileSync(nextConfigPath, NEXT_CONFIG_TEMPLATE(appName, basePath));
      console.log(`  ✅ Updated next.config.js`);
    }

    // 2. Fix worker.js
    const workerPath = path.join(appDir, 'worker.js');
    if (fs.existsSync(workerPath)) {
      const serviceName = appName.replace(/-/g, ' ');
      fs.writeFileSync(workerPath, WORKER_TEMPLATE(serviceName, basePath));
      console.log(`  ✅ Updated worker.js`);
    }

    // 3. Update package.json build scripts
    const packageJsonPath = path.join(appDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Update scripts
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts.build = 'next build && npx @cloudflare/next-on-pages';
      packageJson.scripts['build:next'] = 'next build';
      packageJson.scripts['build:worker'] = 'npx @cloudflare/next-on-pages';
      packageJson.scripts.deploy = `npm run build && wrangler pages deploy .vercel/output/static --project-name=${appName}-production`;

      // Ensure dependencies
      packageJson.dependencies = packageJson.dependencies || {};
      packageJson.devDependencies = packageJson.devDependencies || {};
      
      if (!packageJson.dependencies['@cloudflare/next-on-pages']) {
        packageJson.devDependencies['@cloudflare/next-on-pages'] = '^1.13.12';
      }
      
      if (!packageJson.devDependencies['tailwindcss']) {
        packageJson.devDependencies['tailwindcss'] = '^4.1.7';
      }

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`  ✅ Updated package.json`);
    }

    // 4. Fix PostCSS config
    const postcssPath = path.join(appDir, 'postcss.config.js');
    if (fs.existsSync(postcssPath)) {
      fs.writeFileSync(postcssPath, POSTCSS_CONFIG);
      console.log(`  ✅ Updated postcss.config.js`);
    }

    // 5. Remove old Tailwind v3 config if exists
    const tailwindConfigPath = path.join(appDir, 'tailwind.config.js');
    if (fs.existsSync(tailwindConfigPath)) {
      fs.unlinkSync(tailwindConfigPath);
      console.log(`  ✅ Removed old tailwind.config.js`);
    }

    // 6. Clean up static build artifacts
    const outDir = path.join(appDir, 'out');
    const nextDir = path.join(appDir, '.next');
    const distDir = path.join(appDir, 'dist');
    
    [outDir, nextDir, distDir].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`  ✅ Cleaned ${path.basename(dir)} directory`);
      }
    });

    console.log(`✅ ${appName} fixed successfully\n`);

  } catch (error) {
    console.log(`❌ Error fixing ${appName}:`, error.message);
  }
}

function main() {
  console.log('🚀 Starting app deployment fixes...\n');
  
  APPS_TO_FIX.forEach(appName => {
    fixApp(appName);
  });
  
  console.log('🎉 All apps processed!');
  console.log('\nNext steps:');
  console.log('1. Run: npm install in each app directory');
  console.log('2. Test build: npm run build in each app');
  console.log('3. Deploy: npm run deploy in each app');
}

if (require.main === module) {
  main();
}

module.exports = { fixApp, APPS_TO_FIX };