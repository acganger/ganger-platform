#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const SUPABASE_URL = 'https://supa.gangerdermatology.com';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_v5sXkhM2ouPpiR5axMqYIQ_Db7TwDVc';

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLFile() {
  try {
    console.log('🚀 Starting essential tables creation...\n');
    
    // Read the SQL file
    const sqlFilePath = join(__dirname, 'create-essential-tables.sql');
    const sqlContent = readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 Read SQL file successfully');
    console.log('🔄 Executing SQL statements...\n');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });
    
    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log('⚠️  exec_sql RPC not available, trying direct execution...\n');
      
      // Split SQL into individual statements
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('DO $$'));
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const statement of statements) {
        try {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          
          // Use the Supabase admin API to execute raw SQL
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              query: statement + ';'
            })
          });
          
          if (!response.ok) {
            // Try using the SQL endpoint directly
            const sqlResponse = await fetch(`${SUPABASE_URL}/pg/query`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              },
              body: JSON.stringify({
                query: statement + ';'
              })
            });
            
            if (!sqlResponse.ok) {
              throw new Error(`HTTP ${sqlResponse.status}: ${await sqlResponse.text()}`);
            }
          }
          
          successCount++;
          console.log('✅ Success\n');
        } catch (err) {
          errorCount++;
          console.error(`❌ Error: ${err.message}\n`);
        }
      }
      
      console.log('\n📊 Summary:');
      console.log(`✅ Successful statements: ${successCount}`);
      console.log(`❌ Failed statements: ${errorCount}`);
      
      if (errorCount === 0) {
        console.log('\n🎉 All essential tables created successfully!');
      } else {
        console.log('\n⚠️  Some statements failed. Please check the errors above.');
      }
    } else {
      console.log('✅ SQL executed successfully!');
      console.log('\n🎉 All essential tables created successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error executing SQL:', error.message);
    process.exit(1);
  }
}

// Execute the function
executeSQLFile();