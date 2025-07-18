// Simple database connection test

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://supa.gangerdermatology.com';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('💡 Create a .env file or set the environment variable');
  process.exit(1);
}

// Test using fetch API
async function testConnection() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    
    console.log('Database connection status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    if (response.ok) {
      console.log('✅ Database connection successful!');
      return true;
    } else {
      console.log('⚠️ Database connection issue:', response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

testConnection();