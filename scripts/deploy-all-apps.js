#!/usr/bin/env node

// 🚀 Deploy All Ganger Platform Applications
// Builds and deploys each Next.js application to individual subdomains

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APPS = [
  { name: 'staff', subdomain: 'staff-app', description: 'Legacy Staff App Migration (Next.js)' },
  { name: 'inventory', subdomain: 'inventory', description: 'Medical Supply Management' },
  { name: 'handouts', subdomain: 'handouts', description: 'Patient Education Generator' },
  { name: 'checkin-kiosk', subdomain: 'kiosk-app', description: 'Patient Self-Service Kiosk' },
  { name: 'eos-l10', subdomain: 'l10', description: 'EOS L10 Team Management' },
  { name: 'medication-auth', subdomain: 'meds', description: 'Medication Authorization' },
  { name: 'compliance-training', subdomain: 'training', description: 'Staff Training Platform' },
  { name: 'pharma-scheduling', subdomain: 'pharma', description: 'Pharmaceutical Scheduling' },
  { name: 'call-center-ops', subdomain: 'ops', description: 'Call Center Operations' },
  { name: 'batch-closeout', subdomain: 'closeout', description: 'Financial Batch Processing' },
  { name: 'config-dashboard', subdomain: 'config', description: 'Configuration Management' },
  { name: 'platform-dashboard', subdomain: 'dashboard', description: 'Executive Dashboard' },
  { name: 'socials-reviews', subdomain: 'socials', description: 'Social Media Management' },
  { name: 'integration-status', subdomain: 'integrations', description: 'Integration Monitoring' },
  { name: 'ai-receptionist', subdomain: 'ai', description: 'AI Receptionist Demo' }
];

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || 's688NbswpthbmdiAmQO57QbOrZQKKW5b5mSGQIi3';
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '68d0160c9915efebbbecfddfd48cddab';

async function checkAppReadiness(appName) {
  const appPath = path.join(__dirname, '..', 'apps', appName);
  
  if (!fs.existsSync(appPath)) {
    return { ready: false, reason: 'Directory does not exist' };
  }
  
  if (!fs.existsSync(path.join(appPath, 'package.json'))) {
    return { ready: false, reason: 'No package.json found' };
  }
  
  if (!fs.existsSync(path.join(appPath, 'next.config.js'))) {
    return { ready: false, reason: 'No Next.js config found' };
  }
  
  try {
    // Check if TypeScript compiles
    execSync(`cd ${appPath} && pnpm run type-check`, { stdio: 'pipe' });
    return { ready: true, reason: 'TypeScript compilation successful' };
  } catch (error) {
    return { ready: false, reason: 'TypeScript compilation failed' };
  }
}

async function buildApp(appName) {
  const appPath = path.join(__dirname, '..', 'apps', appName);
  console.log(`🏗️  Building ${appName}...`);
  
  try {
    // Install dependencies
    execSync(`cd ${appPath} && pnpm install`, { stdio: 'inherit' });
    
    // Build for production
    execSync(`cd ${appPath} && pnpm run build`, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        SUPABASE_URL: 'https://pfqtzmxxxhhsxmlddrta.supabase.co',
        NEXT_PUBLIC_SUPABASE_URL: 'https://pfqtzmxxxhhsxmlddrta.supabase.co',
        NEXT_PUBLIC_STAFF_URL: 'https://staff.gangerdermatology.com',
        NEXT_PUBLIC_PLATFORM_VERSION: '1.0'
      }
    });
    
    console.log(`✅ ${appName} built successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to build ${appName}:`, error.message);
    return false;
  }
}

async function deployToVercel(appName, subdomain) {
  const appPath = path.join(__dirname, '..', 'apps', appName);
  console.log(`🚀 Deploying ${appName} to ${subdomain}.gangerdermatology.com...`);
  
  try {
    // Deploy to Vercel with custom domain
    const deployCommand = `cd ${appPath} && vercel --prod --yes --token="$VERCEL_TOKEN" --name="${subdomain}-ganger" --domains="${subdomain}.gangerdermatology.com"`;
    execSync(deployCommand, { stdio: 'inherit' });
    
    console.log(`✅ ${appName} deployed to https://${subdomain}.gangerdermatology.com`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to deploy ${appName}:`, error.message);
    return false;
  }
}

async function createDNSRecord(subdomain, target) {
  console.log(`📝 Creating DNS record: ${subdomain}.gangerdermatology.com → ${target}`);
  
  const dnsData = {
    type: 'CNAME',
    name: subdomain,
    content: target,
    ttl: 1,
    proxied: true
  };
  
  try {
    const result = execSync(`curl -X POST "https://api.cloudflare.com/client/v4/zones/ba76d3d3f41251c49f0365421bd644a5/dns_records" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data '${JSON.stringify(dnsData)}'`, { encoding: 'utf8' });
    
    const response = JSON.parse(result);
    if (response.success) {
      console.log(`✅ DNS record created for ${subdomain}.gangerdermatology.com`);
      return true;
    } else {
      console.log(`ℹ️  DNS record may already exist for ${subdomain}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Failed to create DNS record for ${subdomain}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Ganger Platform Application Deployment');
  console.log('==================================================');
  
  const deploymentResults = [];
  
  // Phase 1: Check readiness of all applications
  console.log('\n📋 Phase 1: Checking Application Readiness');
  for (const app of APPS) {
    const readiness = await checkAppReadiness(app.name);
    console.log(`${readiness.ready ? '✅' : '❌'} ${app.name}: ${readiness.reason}`);
    deploymentResults.push({ ...app, ready: readiness.ready, reason: readiness.reason });
  }
  
  const readyApps = deploymentResults.filter(app => app.ready);
  console.log(`\n📊 Summary: ${readyApps.length}/${APPS.length} applications ready for deployment`);
  
  if (readyApps.length === 0) {
    console.log('❌ No applications are ready for deployment. Exiting.');
    process.exit(1);
  }
  
  // Phase 2: Build ready applications
  console.log('\n🏗️  Phase 2: Building Applications');
  const builtApps = [];
  
  for (const app of readyApps) {
    const buildSuccess = await buildApp(app.name);
    if (buildSuccess) {
      builtApps.push(app);
    }
  }
  
  console.log(`\n📊 Build Summary: ${builtApps.length}/${readyApps.length} applications built successfully`);
  
  if (builtApps.length === 0) {
    console.log('❌ No applications built successfully. Exiting.');
    process.exit(1);
  }
  
  // Phase 3: Deploy to Vercel (if VERCEL_TOKEN is available)
  if (process.env.VERCEL_TOKEN) {
    console.log('\n🚀 Phase 3: Deploying to Vercel');
    const deployedApps = [];
    
    for (const app of builtApps) {
      const deploySuccess = await deployToVercel(app.name, app.subdomain);
      if (deploySuccess) {
        deployedApps.push(app);
        // Create DNS records
        await createDNSRecord(app.subdomain, `${app.subdomain}-ganger.vercel.app`);
      }
    }
    
    console.log(`\n📊 Deployment Summary: ${deployedApps.length}/${builtApps.length} applications deployed successfully`);
  } else {
    console.log('\n⚠️  Phase 3: Skipping Vercel deployment (VERCEL_TOKEN not provided)');
    console.log('Built applications are ready for manual deployment');
  }
  
  // Final summary
  console.log('\n🎉 Deployment Complete!');
  console.log('======================');
  
  console.log('\n📱 Ready Applications:');
  builtApps.forEach(app => {
    const url = process.env.VERCEL_TOKEN 
      ? `https://${app.subdomain}.gangerdermatology.com`
      : `Built and ready in apps/${app.name}/`;
    console.log(`   • ${app.description}: ${url}`);
  });
  
  console.log('\n🔗 Platform Access:');
  console.log('   • Main Portal: https://staff.gangerdermatology.com');
  console.log('   • Legacy Staff App: https://staff.gangerdermatology.com/legacy');
  console.log('   • Pharma Reps: https://reps.gangerdermatology.com');
  console.log('   • Patient Kiosk: https://kiosk.gangerdermatology.com');
  
  if (builtApps.length < APPS.length) {
    console.log('\n⚠️  Remaining Applications:');
    const remainingApps = APPS.filter(app => !builtApps.some(built => built.name === app.name));
    remainingApps.forEach(app => {
      const result = deploymentResults.find(r => r.name === app.name);
      console.log(`   • ${app.name}: ${result ? result.reason : 'Not checked'}`);
    });
  }
}

// Run deployment
main().catch(error => {
  console.error('💥 Deployment failed:', error.message);
  process.exit(1);
});