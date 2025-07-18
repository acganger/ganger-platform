#!/usr/bin/env node

/**
 * Check current deployment status of Ganger Platform apps
 */

const https = require('https');

const VERCEL_TOKEN = 'RdwA23mHSvPcm9ptReM6zxjF';
const TEAM_ID = 'team_wpY7PcIsYQNnslNN39o7fWvS';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: path.includes('?') ? `${path}&teamId=${TEAM_ID}` : `${path}?teamId=${TEAM_ID}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`API Error (${res.statusCode}): ${parsed.error?.message || data}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function checkDeployments() {
  console.log('🔍 Checking Ganger Platform Deployment Status');
  console.log('=============================================\n');

  try {
    // Get all projects
    console.log('Fetching Vercel projects...');
    const response = await makeRequest('/v9/projects?limit=100');
    const projects = response.projects || [];
    
    console.log(`Found ${projects.length} projects\n`);

    // Filter Ganger projects
    const gangerProjects = projects.filter(p => 
      p.name.includes('ganger') || 
      p.name === 'staff' ||
      p.name === 'inventory' ||
      p.name === 'handouts'
    );

    console.log(`Found ${gangerProjects.length} Ganger projects:\n`);

    // Check each project's latest deployment
    for (const project of gangerProjects) {
      console.log(`\n📦 ${project.name}`);
      console.log('─'.repeat(50));
      
      try {
        // Get latest deployment
        const deployments = await makeRequest(`/v6/deployments?projectId=${project.id}&limit=1`);
        
        if (deployments.deployments && deployments.deployments.length > 0) {
          const latest = deployments.deployments[0];
          const createdDate = new Date(latest.created);
          const ageMinutes = Math.floor((Date.now() - createdDate) / 1000 / 60);
          const ageHours = Math.floor(ageMinutes / 60);
          const ageDays = Math.floor(ageHours / 24);
          
          let ageString = '';
          if (ageDays > 0) {
            ageString = `${ageDays}d ${ageHours % 24}h ago`;
          } else if (ageHours > 0) {
            ageString = `${ageHours}h ${ageMinutes % 60}m ago`;
          } else {
            ageString = `${ageMinutes}m ago`;
          }
          
          console.log(`  Status: ${latest.state === 'READY' ? '✅ Ready' : latest.state === 'ERROR' ? '❌ Error' : '⏳ ' + latest.state}`);
          console.log(`  URL: https://${latest.url}`);
          console.log(`  Created: ${createdDate.toLocaleString()} (${ageString})`);
          console.log(`  Branch: ${latest.meta?.githubCommitRef || 'unknown'}`);
          console.log(`  Commit: ${latest.meta?.githubCommitSha ? latest.meta.githubCommitSha.substring(0, 7) : 'unknown'}`);
          console.log(`  Message: ${latest.meta?.githubCommitMessage || 'No message'}`);
          
          // Check custom domains
          if (project.alias && project.alias.length > 0) {
            console.log(`  Domains: ${project.alias.map(a => a.domain).join(', ')}`);
          }
          
          if (latest.state === 'ERROR' && latest.errorMessage) {
            console.log(`  Error: ${latest.errorMessage}`);
          }
        } else {
          console.log('  Status: ❓ No deployments found');
        }
      } catch (err) {
        console.log(`  Status: ⚠️  Error checking: ${err.message}`);
      }
    }

    // Summary
    console.log('\n\n📊 Summary');
    console.log('==========');
    console.log(`Total Ganger projects: ${gangerProjects.length}`);
    
    // Check staff.gangerdermatology.com specifically
    const staffProject = gangerProjects.find(p => p.name === 'ganger-staff' || p.name === 'staff');
    if (staffProject) {
      console.log(`\n🌐 staff.gangerdermatology.com:`);
      if (staffProject.alias && staffProject.alias.find(a => a.domain === 'staff.gangerdermatology.com')) {
        console.log('  ✅ Domain configured');
      } else {
        console.log('  ❌ Domain not configured');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDeployments().catch(console.error);