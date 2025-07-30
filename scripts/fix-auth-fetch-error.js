#!/usr/bin/env node

/**
 * Script to diagnose and provide fixes for the "Failed to fetch" authentication error
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Authentication "Failed to fetch" Error\n');

// Check current environment configuration
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

console.log('📋 Current Configuration:');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1];
console.log(`  Supabase URL: ${supabaseUrl}`);
console.log(`  Anon Key: ${supabaseKey?.substring(0, 20)}...`);

console.log('\n🔍 Diagnosis:');
console.log('The "Failed to fetch" error is likely caused by one of these issues:\n');

console.log('1. Browser blocking the request due to:');
console.log('   - Ad blockers or privacy extensions');
console.log('   - Strict browser security settings');
console.log('   - Corporate firewall/proxy');

console.log('\n2. Supabase configuration issues:');
console.log('   - Custom domain SSL/TLS problems');
console.log('   - CORS configuration on custom domain');
console.log('   - OAuth redirect URL mismatch');

console.log('\n3. Google OAuth configuration:');
console.log('   - Incorrect redirect URLs in Google Console');
console.log('   - Domain not authorized in OAuth consent screen');

console.log('\n💡 Immediate Solutions:\n');

console.log('Option 1: Use Standard Supabase URL (Recommended for testing)');
console.log('=========================================================');
console.log('Update these environment variables in both .env and Vercel:');
console.log('');
console.log('NEXT_PUBLIC_SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co');
console.log('');
console.log('This bypasses any custom domain issues.');

console.log('\nOption 2: Add Error Logging to Auth Context');
console.log('==========================================');
console.log('Add detailed error logging to help diagnose the exact failure point.');

const authContextPath = path.join(process.cwd(), 'packages/auth/src/context.tsx');
const improvedSignIn = `
  async function signIn(redirectTo?: string) {
    try {
      const redirectUrl = redirectTo || 
        (typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : undefined);
      
      console.log('[Auth] Starting sign in with redirect to:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.error('[Auth] OAuth error:', error);
        // Check if it's a network error
        if (error.message?.includes('fetch')) {
          console.error('[Auth] Network error detected. Possible causes:');
          console.error('- Browser extensions blocking the request');
          console.error('- CORS issues with custom domain');
          console.error('- Network connectivity problems');
        }
        throw error;
      }
      
      console.log('[Auth] OAuth initiated successfully');
      return data;
    } catch (error) {
      console.error('[Auth] Sign in failed:', error);
      throw error;
    }
  }`;

console.log('\nOption 3: Add Fallback for Failed Fetch');
console.log('======================================');
console.log('Update the error page to provide more helpful information:');

const errorPageUpdate = `
  // In apps/ganger-staff/src/pages/auth/callback.tsx
  
  if (error) {
    // Check if it's a network error
    const isNetworkError = error.toLowerCase().includes('fetch') || 
                          error.toLowerCase().includes('network');
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-8 text-center">
          <div className="text-red-600 text-xl font-semibold mb-4">
            {isNetworkError ? 'Connection Error' : 'Authentication Failed'}
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          
          {isNetworkError && (
            <div className="text-left bg-yellow-50 p-4 rounded mb-6">
              <p className="font-semibold mb-2">Troubleshooting:</p>
              <ul className="list-disc ml-5 space-y-1 text-sm">
                <li>Disable ad blockers or privacy extensions</li>
                <li>Check your internet connection</li>
                <li>Try a different browser</li>
                <li>Clear browser cache and cookies</li>
              </ul>
            </div>
          )}
          
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Return to sign in
          </button>
        </div>
      </div>
    );
  }`;

console.log('\n📝 Next Steps:');
console.log('1. Try the authentication in an incognito/private window');
console.log('2. Check browser console for specific error messages');
console.log('3. Verify Google OAuth authorized redirect URIs include:');
console.log('   - https://staff.gangerdermatology.com/auth/callback');
console.log('   - http://localhost:3001/auth/callback (for local dev)');
console.log('');
console.log('4. If using custom domain, verify in Supabase dashboard:');
console.log('   - Custom domain is properly configured');
console.log('   - SSL certificate is valid');
console.log('   - CORS settings allow your domains');

console.log('\n🚀 Quick Test:');
console.log('Run this in browser console to test Supabase connectivity:');
console.log(`
fetch('${supabaseUrl}/auth/v1/health', {
  headers: {
    'apikey': '${supabaseKey}',
    'Authorization': 'Bearer ${supabaseKey}'
  }
})
.then(r => r.json())
.then(d => console.log('✅ Supabase accessible:', d))
.catch(e => console.error('❌ Fetch failed:', e));
`);

// Write a temporary HTML file for testing
const testHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Supabase Auth Test</title>
</head>
<body>
  <h1>Supabase Authentication Test</h1>
  <button id="testBtn">Test Supabase Connection</button>
  <div id="result"></div>
  
  <script>
    document.getElementById('testBtn').addEventListener('click', async () => {
      const result = document.getElementById('result');
      result.innerHTML = 'Testing...';
      
      try {
        const response = await fetch('${supabaseUrl}/auth/v1/health', {
          headers: {
            'apikey': '${supabaseKey}',
            'Authorization': 'Bearer ${supabaseKey}'
          }
        });
        
        if (response.ok) {
          result.innerHTML = '<p style="color: green;">✅ Supabase connection successful!</p>';
        } else {
          result.innerHTML = '<p style="color: red;">❌ Supabase returned error: ' + response.status + '</p>';
        }
      } catch (error) {
        result.innerHTML = '<p style="color: red;">❌ Failed to fetch: ' + error.message + '</p>';
        console.error('Full error:', error);
      }
    });
  </script>
</body>
</html>`;

fs.writeFileSync('test-supabase-auth.html', testHtml);
console.log('\n📄 Created test-supabase-auth.html - Open this file in your browser to test connectivity');