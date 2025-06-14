const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfqtzmxxxhhsxmlddrta.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0Mjk3MDksImV4cCI6MjA1MDAwNTcwOX0.Kz1zLwgw9gPyORKZJ6VNOhqjSvxgvmjNFIDO6qRgpw8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('auth.users')
      .select('email')
      .limit(5);
    
    if (error) {
      console.error('Error connecting to database:', error.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('📧 Found users:', data?.map(u => u.email) || []);
    
    // Test if eos_teams table exists
    const { data: teams, error: teamsError } = await supabase
      .from('eos_teams')
      .select('*')
      .limit(1);
      
    if (teamsError) {
      console.log('📋 EOS teams table does not exist yet - will create');
    } else {
      console.log('✅ EOS teams table exists');
    }
    
  } catch (err) {
    console.error('Connection test failed:', err.message);
  }
}

testConnection();