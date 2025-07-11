#!/usr/bin/env node

/**
 * Setup Edge Config for Ganger Platform
 * This script automatically configures Edge Config with all app routes
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'RdwA23mHSvPcm9ptReM6zxjF';
const TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_wpY7PcIsYQNnslNN39o7fWvS';

// App routing configuration
const APP_ROUTES = {
  // Core apps
  '': 'https://ganger-actions.vercel.app', // Root route to employee portal
  'actions': 'https://ganger-actions.vercel.app',
  
  // Medical apps
  'inventory': 'https://ganger-inventory.vercel.app',
  'handouts': 'https://ganger-handouts.vercel.app',
  'medication-auth': 'https://ganger-medication-auth.vercel.app',
  'meds': 'https://ganger-medication-auth.vercel.app', // Alias
  'kiosk': 'https://ganger-checkin-kiosk.vercel.app',
  'checkin-kiosk': 'https://ganger-checkin-kiosk.vercel.app', // Alias
  
  // Business apps
  'l10': 'https://ganger-eos-l10.vercel.app',
  'eos-l10': 'https://ganger-eos-l10.vercel.app', // Alias
  'batch': 'https://ganger-batch-closeout.vercel.app',
  'batch-closeout': 'https://ganger-batch-closeout.vercel.app', // Alias
  'compliance': 'https://ganger-compliance-training.vercel.app',
  'compliance-training': 'https://ganger-compliance-training.vercel.app', // Alias
  'clinical-staffing': 'https://ganger-clinical-staffing.vercel.app',
  'staffing': 'https://ganger-clinical-staffing.vercel.app', // Alias
  'socials': 'https://ganger-socials-reviews.vercel.app',
  'socials-reviews': 'https://ganger-socials-reviews.vercel.app', // Alias
  
  // Management apps
  'config': 'https://ganger-config-dashboard.vercel.app',
  'config-dashboard': 'https://ganger-config-dashboard.vercel.app', // Alias
  'status': 'https://ganger-integration-status.vercel.app',
  'integration-status': 'https://ganger-integration-status.vercel.app', // Alias
  
  // Admin apps
  'ai-receptionist': 'https://ganger-ai-receptionist.vercel.app',
  'call-center': 'https://ganger-call-center-ops.vercel.app',
  'call-center-ops': 'https://ganger-call-center-ops.vercel.app', // Alias
  'pharma': 'https://ganger-pharma-scheduling.vercel.app',
  'pharma-scheduling': 'https://ganger-pharma-scheduling.vercel.app', // Alias
  'lunch': 'https://ganger-pharma-scheduling.vercel.app', // Alternative route
  'reps': 'https://ganger-pharma-scheduling.vercel.app', // Alternative route
  
  // Developer apps
  'components': 'https://ganger-component-showcase.vercel.app',
  'component-showcase': 'https://ganger-component-showcase.vercel.app', // Alias
  'showcase': 'https://ganger-component-showcase.vercel.app', // Alias
  'platform': 'https://ganger-platform-dashboard.vercel.app',
  'platform-dashboard': 'https://ganger-platform-dashboard.vercel.app', // Alias
};

async function createOrUpdateEdgeConfig() {
  console.log('🚀 Setting up Edge Config for Ganger Platform...\n');
  
  try {
    // First, check if Edge Config already exists
    const edgeConfigId = await getExistingEdgeConfig();
    
    if (edgeConfigId) {
      console.log(`✅ Found existing Edge Config: ${edgeConfigId}`);
      await updateEdgeConfig(edgeConfigId);
    } else {
      console.log('📝 Creating new Edge Config...');
      await createNewEdgeConfig();
    }
    
    console.log('\n✅ Edge Config setup complete!');
    console.log('\n📌 Next steps:');
    console.log('1. The Edge Config has been created/updated');
    console.log('2. Make sure EDGE_CONFIG_202507_1 environment variable is set in Vercel');
    console.log('3. Redeploy ganger-staff for changes to take effect');
    
  } catch (error) {
    console.error('\n❌ Error setting up Edge Config:', error.message);
    process.exit(1);
  }
}

async function getExistingEdgeConfig() {
  // Check environment variables in ganger-staff project
  const response = await fetch(
    `https://api.vercel.com/v1/projects/ganger-staff/env?teamId=${TEAM_ID}`,
    {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch environment variables');
  }
  
  const envVars = await response.json();
  const edgeConfigVar = envVars.find(v => v.key === 'EDGE_CONFIG_202507_1');
  
  if (edgeConfigVar && edgeConfigVar.value) {
    // Extract Edge Config ID from connection string
    const match = edgeConfigVar.value.match(/edge-config\.vercel\.com\/(ecfg_[a-z0-9]+)/);
    return match ? match[1] : null;
  }
  
  return null;
}

async function createNewEdgeConfig() {
  const response = await fetch(
    `https://api.vercel.com/v1/edge-config?teamId=${TEAM_ID}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'ganger-platform-router',
        slug: 'ganger-platform-router',
        items: {
          appUrls: APP_ROUTES,
        },
      }),
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Edge Config: ${error}`);
  }
  
  const edgeConfig = await response.json();
  console.log(`✅ Created Edge Config: ${edgeConfig.id}`);
  
  // Create connection string
  const connectionString = `https://edge-config.vercel.com/${edgeConfig.id}?token=YOUR_TOKEN_HERE`;
  
  console.log('\n⚠️  IMPORTANT: You need to:');
  console.log('1. Get the actual token from Vercel Edge Config dashboard');
  console.log('2. Update EDGE_CONFIG_202507_1 environment variable in ganger-staff project');
  console.log(`3. Use this format: ${connectionString}`);
}

async function updateEdgeConfig(edgeConfigId) {
  // For updating existing Edge Config, we need to use the Edge Config API
  // This is more complex as it requires the actual Edge Config token
  console.log('\n⚠️  To update the existing Edge Config:');
  console.log('1. Go to Vercel Dashboard → Edge Config');
  console.log('2. Find the ganger-platform-router config');
  console.log('3. Update the "appUrls" key with the following JSON:');
  console.log('\n' + JSON.stringify(APP_ROUTES, null, 2));
}

// Run the script
createOrUpdateEdgeConfig();