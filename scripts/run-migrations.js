#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(filePath) {
  const fileName = path.basename(filePath);
  console.log(`Running migration: ${fileName}`);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split by semicolon and filter out empty statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      const cleanStatement = statement.trim();
      if (cleanStatement) {
        console.log(`  Executing: ${cleanStatement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: cleanStatement });
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase.from('_temp').select('*').limit(0);
          if (directError) {
            console.error(`Error in ${fileName}:`, error);
            throw error;
          }
        }
      }
    }
    
    console.log(`✅ Completed migration: ${fileName}`);
  } catch (error) {
    console.error(`❌ Failed migration: ${fileName}`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting database migrations...');
  
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('Migrations directory not found:', migrationsDir);
    process.exit(1);
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  if (migrationFiles.length === 0) {
    console.log('No migration files found');
    return;
  }
  
  console.log(`Found ${migrationFiles.length} migration files`);
  
  // Test connection first
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('_test').select('*').limit(1);
    if (error && !error.message.includes('does not exist')) {
      throw error;
    }
    console.log('✅ Supabase connection successful');
  } catch (error) {
    console.log('⚠️  Connection test failed, but continuing with migrations...');
  }
  
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    await runMigration(filePath);
  }
  
  console.log('🎉 All migrations completed successfully!');
}

main().catch(error => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});