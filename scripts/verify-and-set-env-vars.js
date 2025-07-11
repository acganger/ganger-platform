#!/usr/bin/env node

/**
 * Script to verify and set environment variables for ganger-staff via Vercel API
 * Usage: node scripts/verify-and-set-env-vars.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_wpY7PcIsYQNnslNN39o7fWvS';
const PROJECT_NAME = 'ganger-staff';

if (!VERCEL_TOKEN) {
  console.error('Error: VERCEL_TOKEN environment variable is required');
  process.exit(1);
}

// Required environment variables for ganger-staff
const requiredEnvVars = {
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: 'https://pfqtzmxxxhhsxmlddrta.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTg1MjQsImV4cCI6MjA2NDY3NDUyNH0.v14_9iozO98QoNQq8JcaI9qMM6KKTlcWMYTkXyCDc5s',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '', // Should be set separately
  
  // Google OAuth
  GOOGLE_CLIENT_ID: '310418971046-skkrjvju66fid4r75lfdile2i8o8nrsd.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: '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',
  
  // Edge Config
  EDGE_CONFIG_202507_1: process.env.EDGE_CONFIG_202507_1 || '', // Should be set from Vercel dashboard
  
  // Application Settings
  NEXT_PUBLIC_APP_URL: 'https://staff.gangerdermatology.com',
  NODE_ENV: 'production'
};

// Function to make HTTPS request
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
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
    if (data) req.write(data);
    req.end();
  });
}

// Get current environment variables
async function getProjectEnvVars() {
  const options = {
    hostname: 'api.vercel.com',
    path: `/v9/projects/${PROJECT_NAME}/env?teamId=${TEAM_ID}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`
    }
  };

  try {
    const response = await makeRequest(options);
    return response.envs || [];
  } catch (error) {
    console.error('Failed to get environment variables:', error.message);
    return [];
  }
}

// Create or update environment variable
async function setEnvVar(key, value, target = ['production', 'preview', 'development']) {
  const data = JSON.stringify({
    key,
    value,
    target,
    type: value.length > 500 ? 'encrypted' : 'plain'
  });

  const options = {
    hostname: 'api.vercel.com',
    path: `/v10/projects/${PROJECT_NAME}/env?teamId=${TEAM_ID}`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  try {
    await makeRequest(options, data);
    console.log(`✅ Set ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to set ${key}: ${error.message}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log('Verifying and Setting Environment Variables for ganger-staff');
  console.log('===========================================================\n');

  // Get current env vars
  console.log('Fetching current environment variables...');
  const currentEnvVars = await getProjectEnvVars();
  const currentKeys = currentEnvVars.map(env => env.key);

  console.log(`Found ${currentEnvVars.length} existing environment variables\n`);

  // Check and set required variables
  const missingVars = [];
  const existingVars = [];

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (currentKeys.includes(key)) {
      existingVars.push(key);
    } else if (value) {
      missingVars.push({ key, value });
    }
  }

  // Report status
  console.log('Status Report:');
  console.log('--------------');
  console.log(`✅ Already set: ${existingVars.length} variables`);
  existingVars.forEach(key => console.log(`   - ${key}`));
  
  console.log(`\n⚠️  Missing: ${missingVars.length} variables`);
  missingVars.forEach(({ key }) => console.log(`   - ${key}`));

  // Check for critical missing vars
  const criticalMissing = [];
  if (!currentKeys.includes('SUPABASE_SERVICE_ROLE_KEY') && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    criticalMissing.push('SUPABASE_SERVICE_ROLE_KEY');
  }
  if (!currentKeys.includes('EDGE_CONFIG_202507_1') && !process.env.EDGE_CONFIG_202507_1) {
    criticalMissing.push('EDGE_CONFIG_202507_1');
  }

  if (criticalMissing.length > 0) {
    console.log('\n🚨 CRITICAL: The following variables must be set manually in Vercel dashboard:');
    criticalMissing.forEach(key => console.log(`   - ${key}`));
    console.log('\nThese contain sensitive data that should not be in code.');
  }

  // Set missing variables
  if (missingVars.length > 0) {
    console.log('\nSetting missing environment variables...');
    
    for (const { key, value } of missingVars) {
      await setEnvVar(key, value);
    }
  }

  // Trigger redeployment
  console.log('\n📝 Next Steps:');
  console.log('1. Set any critical missing variables in Vercel dashboard');
  console.log('2. Trigger a new deployment: vercel --prod');
  console.log('3. Check https://staff.gangerdermatology.com after deployment');
  
  // Create debug endpoint info
  console.log('\n🔍 Debug Information:');
  console.log('The /debug page shows "page not found" because it needs to be built with the environment variables.');
  console.log('After setting env vars and redeploying, the authentication should work properly.');
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});