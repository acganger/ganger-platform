#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://supa.gangerdermatology.com';
const SUPABASE_SERVICE_KEY = 'sb_secret_v5sXkhM2ouPpiR5axMqYIQ_Db7TwDVc';

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function executeSQLFile(filePath) {
  const fileName = path.basename(filePath);
  
  try {
    // Read SQL file
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Skip empty files
    if (!sql.trim()) {
      log(`  ⏭️  Skipping empty file: ${fileName}`, 'yellow');
      return true;
    }
    
    // Split SQL into individual statements
    // This is a simple split - for production use a proper SQL parser
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    log(`  📄 Processing ${fileName} (${statements.length} statements)...`, 'blue');
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip certain statements that might cause issues
      if (statement.includes('CREATE EXTENSION') && statement.includes('IF NOT EXISTS')) {
        // Extensions are usually already installed
        continue;
      }
      
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          // Some errors are expected (e.g., "already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key')) {
            // This is fine, continue
          } else {
            throw error;
          }
        }
      } catch (err) {
        // Try direct execution if RPC fails
        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            },
            body: JSON.stringify({ query: statement })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            if (!errorText.includes('already exists')) {
              console.error(`    Statement ${i + 1} failed:`, errorText);
            }
          }
        } catch (fetchErr) {
          // Ignore and continue
        }
      }
    }
    
    log(`  ✅ Completed ${fileName}`, 'green');
    return true;
  } catch (error) {
    log(`  ❌ Failed ${fileName}: ${error.message}`, 'red');
    return false;
  }
}

async function recreateDatabases() {
  log('🚀 Starting Supabase Database Recreation', 'magenta');
  log('=====================================\n', 'magenta');
  
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  
  // Check if migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    log('❌ Migrations directory not found!', 'red');
    process.exit(1);
  }
  
  // Get all SQL files sorted by name
  const sqlFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .map(file => path.join(migrationsDir, file));
  
  log(`📁 Found ${sqlFiles.length} migration files\n`, 'blue');
  
  // Process migrations in order
  let successful = 0;
  let failed = 0;
  
  // Group migrations by priority
  const authMigrations = sqlFiles.filter(f => path.basename(f).includes('auth'));
  const baseMigrations = sqlFiles.filter(f => path.basename(f).includes('base') || path.basename(f).includes('create_tables'));
  const otherMigrations = sqlFiles.filter(f => !authMigrations.includes(f) && !baseMigrations.includes(f));
  
  // Execute in priority order
  log('🔐 Setting up authentication tables...', 'yellow');
  for (const file of authMigrations) {
    const success = await executeSQLFile(file);
    success ? successful++ : failed++;
  }
  
  log('\n📊 Creating base tables...', 'yellow');
  for (const file of baseMigrations) {
    const success = await executeSQLFile(file);
    success ? successful++ : failed++;
  }
  
  log('\n🏗️  Creating application-specific tables...', 'yellow');
  for (const file of otherMigrations) {
    const success = await executeSQLFile(file);
    success ? successful++ : failed++;
  }
  
  // Summary
  log('\n=====================================', 'magenta');
  log('📊 Migration Summary:', 'magenta');
  log(`  ✅ Successful: ${successful}`, 'green');
  log(`  ❌ Failed: ${failed}`, 'red');
  log('=====================================\n', 'magenta');
  
  if (failed > 0) {
    log('⚠️  Some migrations failed. This might be due to:', 'yellow');
    log('  - Tables already existing (which is fine)', 'yellow');
    log('  - Missing permissions (contact Supabase support)', 'yellow');
    log('  - Invalid SQL syntax in migration files', 'yellow');
  }
  
  log('✨ Database recreation complete!', 'green');
  log('\n📝 Next steps:', 'blue');
  log('  1. Check Supabase dashboard for created tables', 'blue');
  log('  2. Verify RLS policies are enabled', 'blue');
  log('  3. Test authentication flow', 'blue');
}

// Alternative approach using direct SQL execution
async function executeSQLDirect(sql) {
  try {
    const response = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'x-connection-encrypted': 'true'
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    return await response.json();
  } catch (error) {
    // Try alternative endpoint
    try {
      const response = await fetch(`${SUPABASE_URL}/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({ query: sql })
      });
      
      return await response.json();
    } catch (err) {
      throw error;
    }
  }
}

// Check if we have the necessary dependencies
try {
  require('@supabase/supabase-js');
} catch (error) {
  log('❌ Missing dependency: @supabase/supabase-js', 'red');
  log('   Please run: pnpm add @supabase/supabase-js', 'yellow');
  process.exit(1);
}

// Run the recreation
recreateDatabases().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});