// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pfqtzmxxxhhsxmlddrta.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('💡 Create a .env file or set the environment variable');
  process.exit(1);
}

async function checkDatabaseStatus() {
  console.log('🔍 Checking current database schema...\n');
  
  try {
    // Check if we can access any tables
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.text();
      console.log('📊 Database API Response:');
      console.log('Status:', response.status);
      console.log('Headers:', Object.fromEntries(response.headers));
      console.log('Data preview:', data.substring(0, 500) + '...');
    }
    
    // Try to access specific tables that might already exist
    const tablesToCheck = ['users', 'locations', 'inventory_items', 'handout_templates'];
    
    for (const table of tablesToCheck) {
      try {
        const tableResponse = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Accept': 'application/json'
          }
        });
        
        console.log(`\n📋 Table "${table}": Status ${tableResponse.status}`);
        
        if (tableResponse.ok) {
          const tableData = await tableResponse.json();
          console.log(`   ✅ Table exists and accessible (${tableData.length} rows shown)`);
        } else if (tableResponse.status === 404) {
          console.log(`   ⚠️  Table does not exist`);
        } else {
          const errorData = await tableResponse.text();
          console.log(`   ❌ Error:`, errorData);
        }
      } catch (error) {
        console.log(`   ❌ Error checking table "${table}":`, error.message);
      }
    }
    
    // Check available endpoints
    console.log('\n🔗 Checking available API endpoints...');
    const schemaResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Accept': 'application/openapi+json'
      }
    });
    
    if (schemaResponse.ok) {
      const schema = await schemaResponse.json();
      if (schema.paths) {
        const availableTables = Object.keys(schema.paths)
          .filter(path => path.startsWith('/') && !path.includes('{'))
          .map(path => path.substring(1))
          .filter(table => table && !table.includes('/'))
          .slice(0, 10); // Show first 10
        
        console.log('📚 Available tables/endpoints:');
        availableTables.forEach(table => console.log(`   - ${table}`));
        
        if (availableTables.length === 0) {
          console.log('   ⚠️  No tables found - database appears empty');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

checkDatabaseStatus();