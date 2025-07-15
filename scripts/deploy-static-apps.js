#!/usr/bin/env node
/**
 * Deploy static versions of apps to simple hosting services
 * This script builds apps with static export and provides deployment instructions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const apps = [
  'medication-auth',
  'platform-dashboard', 
  'eos-l10',
  'checkin-kiosk',
  'handouts'
];

const environmentVars = [
  'NEXT_PUBLIC_SUPABASE_URL=https://supa.gangerdermatology.com',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_q-yj56RH8zrMVH-4cRazWA_PI2pBoeh',
  'SUPABASE_URL=https://supa.gangerdermatology.com',
  'SUPABASE_ANON_KEY=sb_publishable_q-yj56RH8zrMVH-4cRazWA_PI2pBoeh',
  'NEXTAUTH_SECRET=ganger-platform-production',
  'NODE_ENV=production'
].join(' ');

console.log('🚀 Building and preparing Ganger Platform apps for deployment...\n');

const deploymentReport = {
  successful: [],
  failed: [],
  instructions: []
};

for (const app of apps) {
  const appPath = path.join(__dirname, '..', 'apps', app);
  
  if (!fs.existsSync(appPath)) {
    console.log(`⚠️  App ${app} not found, skipping...`);
    deploymentReport.failed.push({ app, reason: 'Directory not found' });
    continue;
  }

  try {
    console.log(`📦 Building ${app}...`);
    
    // Create .env.local for the app
    const envPath = path.join(appPath, '.env.local');
    const envContent = environmentVars.split(' ').join('\n').replace(/(\w+)=/g, '$1=');
    fs.writeFileSync(envPath, envContent);
    
    // Try to build the app
    process.chdir(appPath);
    execSync('pnpm run build', { 
      stdio: 'pipe',
      env: { 
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: 'https://supa.gangerdermatology.com',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_q-yj56RH8zrMVH-4cRazWA_PI2pBoeh'
      }
    });
    
    // Check if static export exists
    const outputPath = path.join(appPath, 'out');
    const buildPath = path.join(appPath, '.next');
    
    if (fs.existsSync(outputPath)) {
      console.log(`✅ ${app} - Static export ready at: ${outputPath}`);
      deploymentReport.successful.push({
        app,
        outputPath: outputPath,
        deploymentType: 'static',
        size: getDirectorySize(outputPath)
      });
    } else if (fs.existsSync(buildPath)) {
      console.log(`✅ ${app} - Next.js build ready at: ${buildPath}`);
      deploymentReport.successful.push({
        app,
        outputPath: buildPath,
        deploymentType: 'nextjs',
        size: getDirectorySize(buildPath)
      });
    } else {
      throw new Error('No build output found');
    }
    
  } catch (error) {
    console.log(`❌ ${app} - Build failed: ${error.message}`);
    deploymentReport.failed.push({ 
      app, 
      reason: error.message.split('\n')[0] 
    });
  }
  
  console.log(''); // Add spacing
}

// Generate deployment instructions
console.log('\n📋 DEPLOYMENT STATUS REPORT\n');
console.log('='.repeat(50));

if (deploymentReport.successful.length > 0) {
  console.log('\n✅ SUCCESSFUL BUILDS:');
  deploymentReport.successful.forEach(result => {
    console.log(`   • ${result.app} (${result.deploymentType}) - ${result.size}`);
    console.log(`     📁 ${result.outputPath}`);
  });
}

if (deploymentReport.failed.length > 0) {
  console.log('\n❌ FAILED BUILDS:');
  deploymentReport.failed.forEach(result => {
    console.log(`   • ${result.app}: ${result.reason}`);
  });
}

// Generate deployment instructions
console.log('\n🚀 DEPLOYMENT INSTRUCTIONS:');
console.log('\nFor Netlify deployment:');
console.log('1. Drag and drop the app folder to Netlify');
console.log('2. Set domain: [app-name].gangerdermatology.com');
console.log('3. Add environment variables in Netlify dashboard');

console.log('\nFor Vercel deployment:');
console.log('1. vercel --prod --confirm');
console.log('2. Set custom domain in Vercel dashboard');

console.log('\nFor GitHub Pages:');
console.log('1. Create gh-pages branch');
console.log('2. Copy build files to gh-pages branch');
console.log('3. Enable GitHub Pages in repository settings');

// Save report to file
fs.writeFileSync(
  path.join(__dirname, '..', 'deployment-report.json'),
  JSON.stringify(deploymentReport, null, 2)
);

console.log('\n📝 Report saved to: deployment-report.json');
console.log('\n🎉 Deployment preparation complete!');

function getDirectorySize(dirPath) {
  try {
    const stats = execSync(`du -sh "${dirPath}"`, { encoding: 'utf8' });
    return stats.split('\t')[0];
  } catch {
    return 'unknown size';
  }
}