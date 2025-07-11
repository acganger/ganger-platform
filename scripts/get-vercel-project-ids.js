#!/usr/bin/env node

/**
 * Script to get all Vercel project IDs for GitHub Actions secrets
 * Usage: node scripts/get-vercel-project-ids.js
 */

const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'RdwA23mHSvPcm9ptReM6zxjF';
const TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_wpY7PcIsYQNnslNN39o7fWvS';

// Apps we need project IDs for
const apps = [
  'ganger-actions',
  'inventory',
  'handouts',
  'eos-l10',
  'batch-closeout',
  'compliance-training',
  'clinical-staffing',
  'config-dashboard',
  'integration-status',
  'ai-receptionist',
  'call-center-ops',
  'medication-auth',
  'pharma-scheduling',
  'checkin-kiosk',
  'socials-reviews',
  'component-showcase',
  'platform-dashboard',
  'staff'
];

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`API Error (${res.statusCode}): ${JSON.stringify(response)}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function getAllProjects() {
  const allProjects = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await makeRequest(`/v9/projects?teamId=${TEAM_ID}&limit=100&page=${page}`);
    allProjects.push(...(response.projects || []));
    hasMore = response.pagination && response.pagination.hasNext;
    page++;
  }

  return allProjects;
}

async function main() {
  console.log('Getting Vercel Project IDs for GitHub Actions Secrets');
  console.log('=====================================================\n');

  try {
    // Get all projects
    console.log('Fetching all Vercel projects...');
    const projects = await getAllProjects();
    console.log(`Found ${projects.length} total projects\n`);

    // Create a map of project names to IDs
    const projectMap = {};
    projects.forEach(project => {
      projectMap[project.name] = project.id;
    });

    // Generate GitHub secrets
    console.log('GitHub Actions Secrets Required:');
    console.log('================================\n');

    const secrets = [];
    const missing = [];

    apps.forEach(app => {
      const projectName = `ganger-${app}`;
      const projectId = projectMap[projectName] || projectMap[app];
      const secretName = `VERCEL_PROJECT_ID_${app.toUpperCase().replace(/-/g, '_')}`;

      if (projectId) {
        secrets.push({ name: secretName, value: projectId, app });
        console.log(`${secretName}=${projectId}`);
      } else {
        missing.push(app);
        console.log(`${secretName}=<NOT FOUND - project "${projectName}" does not exist>`);
      }
    });

    if (missing.length > 0) {
      console.log('\n⚠️  Missing Projects:');
      console.log('====================');
      missing.forEach(app => {
        console.log(`- ${app} (expected project name: ganger-${app})`);
      });
    }

    // Generate GitHub CLI commands
    console.log('\n\nGitHub CLI Commands to Set Secrets:');
    console.log('====================================\n');
    console.log('# First, make sure you are in the repository directory');
    console.log('# cd /path/to/ganger-platform\n');
    
    secrets.forEach(({ name, value }) => {
      console.log(`gh secret set ${name} -b "${value}"`);
    });

    // Also add the core secrets
    console.log('\n# Core secrets (if not already set):');
    console.log(`gh secret set VERCEL_TOKEN -b "${VERCEL_TOKEN}"`);
    console.log(`gh secret set VERCEL_TEAM_ID -b "${TEAM_ID}"`);
    console.log(`gh secret set VERCEL_ORG_ID -b "${TEAM_ID}"`);

    console.log('\n\n📝 Summary:');
    console.log('===========');
    console.log(`✅ Found project IDs for ${secrets.length} apps`);
    console.log(`❌ Missing projects for ${missing.length} apps`);
    console.log('\nRun the GitHub CLI commands above to set all secrets.');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();