#!/usr/bin/env node

// 🚀 Fully Automated Cloudflare Pages Setup
// This script creates all necessary Cloudflare Pages projects programmatically

const { execSync } = require('child_process');
const fs = require('fs');

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || 'TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf';
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '68d0160c9915efebbbecfddfd48cddab';
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || 'ba76d3d3f41251c49f0365421bd644a5';

// 🎯 Project Configuration
const PROJECTS = [
  {
    name: 'staff-production',
    domain: 'staff.gangerdermatology.com',
    app: 'staff',
    description: 'Main staff portal with path-based routing to all applications'
  },
  {
    name: 'reps-production', 
    domain: 'reps.gangerdermatology.com',
    app: 'pharma-scheduling',
    description: 'Pharmaceutical representatives scheduling portal'
  },
  {
    name: 'kiosk-production',
    domain: 'kiosk.gangerdermatology.com', 
    app: 'checkin-kiosk',
    description: 'Patient check-in kiosk system'
  }
];

async function makeCloudflareRequest(endpoint, method = 'GET', data = null) {
  const url = `https://api.cloudflare.com/client/v4${endpoint}`;
  
  const options = [
    'curl', '-X', method,
    '-H', `Authorization: Bearer ${CLOUDFLARE_API_TOKEN}`,
    '-H', 'Content-Type: application/json'
  ];
  
  if (data) {
    options.push('--data', JSON.stringify(data));
  }
  
  options.push(url);
  
  try {
    const result = execSync(options.join(' '), { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (error) {
    console.error(`❌ Cloudflare API Error:`, error.message);
    return { success: false, errors: [{ message: error.message }] };
  }
}

async function createPagesProject(project) {
  console.log(`🚀 Creating Cloudflare Pages project: ${project.name}`);
  
  // First, try to create via the direct API
  const createData = {
    name: project.name,
    production_branch: 'main',
    source: {
      type: 'github',
      config: {
        owner: 'acganger',
        repo_name: 'ganger-platform',
        production_branch: 'main',
        pr_comments_enabled: true,
        deployments_enabled: true,
        preview_deployment_setting: 'custom',
        preview_branch_includes: ['staging', 'develop'],
        preview_branch_excludes: ['main']
      }
    },
    build_config: {
      build_command: `cd apps/${project.app} && pnpm install && pnpm run build`,
      destination_dir: `apps/${project.app}/out`,
      root_dir: '/',
      web_analytics_tag: null,
      web_analytics_token: null
    },
    deployment_configs: {
      production: {
        env_vars: {
          NODE_ENV: 'production',
          SUPABASE_URL: 'https://pfqtzmxxxhhsxmlddrta.supabase.co',
          NEXT_PUBLIC_STAFF_URL: 'https://staff.gangerdermatology.com',
          NEXT_PUBLIC_REPS_URL: 'https://reps.gangerdermatology.com',
          NEXT_PUBLIC_KIOSK_URL: 'https://kiosk.gangerdermatology.com'
        },
        compatibility_date: '2024-01-01'
      }
    }
  };
  
  const result = await makeCloudflareRequest(`/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects`, 'POST', createData);
  
  if (result.success) {
    console.log(`✅ Successfully created ${project.name}`);
    return result.result;
  } else {
    console.log(`ℹ️  Project ${project.name} may already exist or API limitations. Continuing...`);
    
    // Try to get existing project
    const existingResult = await makeCloudflareRequest(`/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${project.name}`);
    if (existingResult.success) {
      console.log(`✅ Found existing project ${project.name}`);
      return existingResult.result;
    }
    
    return null;
  }
}

async function setupCustomDomain(projectName, domain) {
  console.log(`🌐 Setting up custom domain: ${domain} for ${projectName}`);
  
  const domainData = {
    name: domain
  };
  
  const result = await makeCloudflareRequest(
    `/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectName}/domains`,
    'POST',
    domainData
  );
  
  if (result.success) {
    console.log(`✅ Domain ${domain} configured for ${projectName}`);
    return result.result;
  } else {
    console.log(`ℹ️  Domain ${domain} may already be configured or API limitations`);
    return null;
  }
}

async function createDNSRecord(domain, target) {
  console.log(`📝 Creating DNS CNAME record: ${domain} → ${target}`);
  
  // Extract subdomain from full domain
  const subdomain = domain.replace('.gangerdermatology.com', '');
  
  const dnsData = {
    type: 'CNAME',
    name: subdomain,
    content: target,
    ttl: 1, // Auto
    proxied: true
  };
  
  const result = await makeCloudflareRequest(`/zones/${CLOUDFLARE_ZONE_ID}/dns_records`, 'POST', dnsData);
  
  if (result.success) {
    console.log(`✅ DNS record created: ${domain} → ${target}`);
    return result.result;
  } else {
    console.log(`ℹ️  DNS record may already exist: ${domain}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Automated Cloudflare Pages Setup for Ganger Platform');
  console.log('===============================================================');
  
  const createdProjects = [];
  
  // Create all projects
  for (const project of PROJECTS) {
    try {
      const result = await createPagesProject(project);
      if (result) {
        createdProjects.push({ ...project, result });
        
        // Set up custom domain
        await setupCustomDomain(project.name, project.domain);
        
        // Create DNS record pointing to Pages URL
        const pagesUrl = `${project.name}.pages.dev`;
        await createDNSRecord(project.domain, pagesUrl);
        
        console.log(`✅ ${project.name} setup complete`);
      }
    } catch (error) {
      console.error(`❌ Error setting up ${project.name}:`, error.message);
    }
    
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\\n🎉 Cloudflare Pages Setup Complete!');
  console.log('=====================================');
  
  if (createdProjects.length > 0) {
    console.log('\\n🌐 Your applications will be available at:');
    createdProjects.forEach(project => {
      console.log(`   • ${project.domain}`);
      console.log(`     └─ Project: ${project.name}.pages.dev`);
    });
    
    console.log('\\n📋 Next Steps:');
    console.log('1. ✅ GitHub Actions will auto-deploy on next push');
    console.log('2. ✅ SSL certificates will auto-provision');
    console.log('3. ✅ DNS propagation (may take 5-10 minutes)');
    console.log('4. 🔄 Path-based routing worker deployment needed');
    
    console.log('\\n🎪 Ready for team demo! 🎉');
  } else {
    console.log('\\n⚠️  No new projects were created. They may already exist.');
    console.log('Check your Cloudflare Pages dashboard: https://dash.cloudflare.com/pages');
  }
}

// Run the setup
main().catch(error => {
  console.error('💥 Setup failed:', error.message);
  process.exit(1);
});