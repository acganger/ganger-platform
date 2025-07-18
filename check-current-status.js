#!/usr/bin/env node

const VERCEL_TOKEN = 'RdwA23mHSvPcm9ptReM6zxjF';
const TEAM_ID = 'team_wpY7PcIsYQNnslNN39o7fWvS';

async function checkDeploymentStatus() {
  console.log('🔍 Checking Ganger Platform Deployment Status...\n');

  try {
    // Get recent deployments
    const deploymentsUrl = `https://api.vercel.com/v6/deployments?teamId=${TEAM_ID}&limit=20`;
    const deploymentsResponse = await fetch(deploymentsUrl, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`
      }
    });

    if (!deploymentsResponse.ok) {
      throw new Error(`Failed to fetch deployments: ${deploymentsResponse.status}`);
    }

    const { deployments } = await deploymentsResponse.json();
    
    // Group deployments by project
    const projectDeployments = {};
    
    for (const deployment of deployments) {
      const projectName = deployment.name;
      if (!projectDeployments[projectName]) {
        projectDeployments[projectName] = [];
      }
      projectDeployments[projectName].push({
        url: deployment.url,
        state: deployment.state,
        created: new Date(deployment.created).toLocaleString(),
        ready: deployment.ready,
        error: deployment.errorMessage
      });
    }

    console.log('📊 Recent Deployments by Project:\n');
    
    for (const [project, deps] of Object.entries(projectDeployments)) {
      console.log(`\n${project}:`);
      const latestDep = deps[0];
      console.log(`  Latest: ${latestDep.created}`);
      console.log(`  Status: ${latestDep.state} ${latestDep.ready ? '✅' : '⏳'}`);
      console.log(`  URL: https://${latestDep.url}`);
      if (latestDep.error) {
        console.log(`  ❌ Error: ${latestDep.error}`);
      }
    }

    // Check projects
    console.log('\n\n📦 Checking Vercel Projects...\n');
    
    const projectsUrl = `https://api.vercel.com/v9/projects?teamId=${TEAM_ID}`;
    const projectsResponse = await fetch(projectsUrl, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`
      }
    });

    if (!projectsResponse.ok) {
      throw new Error(`Failed to fetch projects: ${projectsResponse.status}`);
    }

    const { projects } = await projectsResponse.json();
    
    // Sort projects by name
    projects.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`Total Projects: ${projects.length}\n`);
    
    // Check ganger-staff specifically
    const gangerStaff = projects.find(p => p.name === 'ganger-staff');
    if (gangerStaff) {
      console.log('🏠 Main Portal (ganger-staff):');
      console.log(`  ID: ${gangerStaff.id}`);
      console.log(`  Framework: ${gangerStaff.framework || 'nextjs'}`);
      console.log(`  Node Version: ${gangerStaff.nodeVersion || 'default'}`);
      console.log(`  Environment Variables: ${Object.keys(gangerStaff.env || {}).length} configured`);
      
      // Check custom domains
      const domainsUrl = `https://api.vercel.com/v9/projects/${gangerStaff.id}/domains?teamId=${TEAM_ID}`;
      const domainsResponse = await fetch(domainsUrl, {
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`
        }
      });
      
      if (domainsResponse.ok) {
        const { domains } = await domainsResponse.json();
        console.log(`  Domains: ${domains.map(d => d.name).join(', ')}`);
      }
    } else {
      console.log('❌ ganger-staff project not found!');
    }
    
    // List all projects
    console.log('\n\nAll Projects:');
    projects.forEach(project => {
      console.log(`  - ${project.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDeploymentStatus();