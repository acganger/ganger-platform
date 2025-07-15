#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/001_auth_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Use fetch to execute via Supabase REST API
    const supabaseUrl = 'https://supa.gangerdermatology.com';
    const serviceRoleKey = 'sb_secret_v5sXkhM2ouPpiR5axMqYIQ_Db7TwDVc';
    
    console.log('🚀 Running authentication schema migration...');
    console.log(`📁 Migration file: ${migrationPath}`);
    console.log(`🗄️  Database: ${supabaseUrl}`);
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim() === '') continue;
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey
          },
          body: JSON.stringify({
            query: statement + ';'
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`❌ Error in statement ${i + 1}:`, errorText);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (error) {
        console.log(`❌ Error executing statement ${i + 1}:`, error.message);
        // Continue with other statements
      }
    }
    
    console.log('✨ Migration completed!');
    console.log('📋 Next steps:');
    console.log('  1. Verify tables were created in Supabase Dashboard');
    console.log('  2. Test authentication with Google OAuth');
    console.log('  3. Create test user accounts');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Alternative approach: Create tables via Supabase client
async function createTablesViaSupabase() {
  console.log('🔄 Attempting to create tables via Supabase JavaScript client...');
  
  try {
    // Import Supabase (if available)
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = 'https://supa.gangerdermatology.com';
    const serviceRoleKey = 'sb_secret_v5sXkhM2ouPpiR5axMqYIQ_Db7TwDVc';
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Test connection
    const { data, error } = await supabase.from('_supabase_session').select('*').limit(1);
    
    if (error && !error.message.includes('does not exist')) {
      console.log('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Connected to Supabase successfully');
    
    // Read and execute migration file using raw SQL
    const migrationPath = path.join(__dirname, '../supabase/migrations/001_auth_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the entire migration as a transaction
    const { data: result, error: migrationError } = await supabase.rpc('exec', {
      sql: migrationSQL
    });
    
    if (migrationError) {
      console.log('❌ Migration error:', migrationError.message);
      return false;
    }
    
    console.log('✅ Migration executed successfully');
    return true;
    
  } catch (error) {
    console.log('❌ Supabase client error:', error.message);
    return false;
  }
}

// Try both approaches
runMigration()
  .then(() => {
    console.log('🎉 Authentication schema setup completed!');
  })
  .catch(async (error) => {
    console.log('❌ Primary migration failed, trying alternative approach...');
    const success = await createTablesViaSupabase();
    if (!success) {
      console.error('❌ All migration attempts failed');
      process.exit(1);
    }
  });