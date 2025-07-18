/**
 * Initialize Feature Flags for Database Migration
 * Phase 4: Validation & Production Deployment
 */

import { migrationFlags } from './feature-flags/migration-flags';

async function initializeFeatureFlags() {
  console.log('Initializing migration feature flags...\n');
  
  try {
    // Create the feature flags table if it doesn't exist
    await createFeatureFlagsTable();
    
    // Initialize default feature flags
    await migrationFlags.initialize();
    
    // Display all flags
    const allFlags = await migrationFlags.getAllFlags();
    
    console.log('Feature flags initialized successfully:\n');
    console.log('Flag Name                           | Enabled | Rollout % | App Name           |');
    console.log('-----------------------------------|---------|-----------|-------------------|');
    
    for (const flag of allFlags) {
      console.log(
        `${flag.flag_name.padEnd(34)} | ${flag.enabled.toString().padEnd(7)} | ` +
        `${flag.rollout_percentage.toString().padEnd(9)} | ${(flag.app_name || 'N/A').padEnd(17)} |`
      );
    }
    
    console.log('\n✅ Feature flags initialization complete');
    
  } catch (error) {
    console.error('❌ Error initializing feature flags:', error);
    process.exit(1);
  }
}

async function createFeatureFlagsTable() {
  const { createClient } = require('@supabase/supabase-js');
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://supa.gangerdermatology.com';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Create tables if they don't exist
  const tableCreationSQL = `
    -- Create feature flags table
    CREATE TABLE IF NOT EXISTS migration_feature_flags (
      flag_name TEXT PRIMARY KEY,
      enabled BOOLEAN DEFAULT false,
      rollout_percentage INTEGER DEFAULT 0,
      app_name TEXT,
      user_emails TEXT[],
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create feature flag logs table
    CREATE TABLE IF NOT EXISTS migration_feature_flag_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      flag_name TEXT NOT NULL,
      user_email TEXT,
      result BOOLEAN NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create migration audit log table
    CREATE TABLE IF NOT EXISTS migration_audit_log (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      action TEXT NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      details JSONB,
      user_email TEXT
    );

    -- Create rollback reports table
    CREATE TABLE IF NOT EXISTS migration_rollback_reports (
      rollback_id TEXT PRIMARY KEY,
      completed_at TIMESTAMPTZ,
      executed_steps INTEGER[],
      status TEXT,
      initiated_by TEXT,
      verification_results JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  
  try {
    await supabase.rpc('exec_sql', { sql: tableCreationSQL });
    console.log('✅ Migration tables created successfully');
  } catch (error) {
    // Tables might already exist, which is fine
    console.log('ℹ️  Migration tables already exist or cannot be created via RPC');
  }
}

// Run if executed directly
if (require.main === module) {
  initializeFeatureFlags()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { initializeFeatureFlags };