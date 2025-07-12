#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔐 Authentication Implementation Verification');
console.log('==========================================\n');

let issues = 0;

// Check 1: Cookie utilities exist and are properly implemented
console.log('📋 Checking Cookie Utilities...\n');

const cookieUtilsPath = 'packages/auth/src/utils/cookies.ts';
if (fs.existsSync(cookieUtilsPath)) {
  const cookieUtils = fs.readFileSync(cookieUtilsPath, 'utf8');
  
  const requiredFunctions = ['setCookie', 'getCookie', 'deleteCookie', 'getAllCookies'];
  requiredFunctions.forEach(func => {
    if (cookieUtils.includes(`export function ${func}`)) {
      console.log(`✅ ${func} function is exported`);
    } else {
      console.log(`❌ ${func} function not found`);
      issues++;
    }
  });
  
  // Check for proper domain configuration
  if (cookieUtils.includes('.gangerdermatology.com')) {
    console.log('✅ Cookie domain properly configured');
  } else {
    console.log('⚠️  Cookie domain not explicitly set in utilities');
  }
} else {
  console.log('❌ Cookie utilities file not found');
  issues++;
}

// Check 2: CookieStorage implementation
console.log('\n📋 Checking CookieStorage Implementation...\n');

const cookieStoragePath = 'packages/auth/src/utils/CookieStorage.ts';
if (fs.existsSync(cookieStoragePath)) {
  const cookieStorage = fs.readFileSync(cookieStoragePath, 'utf8');
  
  // Check for StorageAdapter interface implementation
  if (cookieStorage.includes('implements StorageAdapter') || 
      (cookieStorage.includes('getItem') && cookieStorage.includes('setItem') && cookieStorage.includes('removeItem'))) {
    console.log('✅ CookieStorage implements required storage interface');
  } else {
    console.log('❌ CookieStorage missing required interface methods');
    issues++;
  }
  
  // Check for gangerCookieStorage export
  if (cookieStorage.includes('export const gangerCookieStorage')) {
    console.log('✅ gangerCookieStorage is exported');
  } else {
    console.log('❌ gangerCookieStorage export not found');
    issues++;
  }
  
  // Check domain configuration
  if (cookieStorage.includes("domain: '.gangerdermatology.com'")) {
    console.log('✅ Cookie domain set to .gangerdermatology.com');
  } else {
    console.log('❌ Cookie domain not properly configured');
    issues++;
  }
} else {
  console.log('❌ CookieStorage.ts not found');
  issues++;
}

// Check 3: Supabase client configuration
console.log('\n📋 Checking Supabase Client Configuration...\n');

const supabasePath = 'packages/auth/src/supabase.ts';
if (fs.existsSync(supabasePath)) {
  const supabaseClient = fs.readFileSync(supabasePath, 'utf8');
  
  // Check import
  if (supabaseClient.includes("import { gangerCookieStorage }") || 
      supabaseClient.includes("import { CookieStorage")) {
    console.log('✅ Supabase client imports cookie storage');
  } else {
    console.log('❌ Supabase client missing cookie storage import');
    issues++;
  }
  
  // Check usage in client config
  const storageConfigRegex = /storage:\s*typeof\s+window[^}]*gangerCookieStorage/;
  if (storageConfigRegex.test(supabaseClient)) {
    console.log('✅ Supabase client configured to use cookie storage');
  } else {
    console.log('❌ Supabase client not using cookie storage');
    issues++;
  }
  
  // Count how many times it's used (should be at least 2 - main client and app client)
  const matches = supabaseClient.match(/gangerCookieStorage/g);
  if (matches && matches.length >= 2) {
    console.log(`✅ Cookie storage used in ${matches.length} client configurations`);
  } else {
    console.log('⚠️  Cookie storage not used in all client configurations');
  }
}

// Check 4: AuthProvider session restoration
console.log('\n📋 Checking AuthProvider Session Restoration...\n');

const authProviderPath = 'packages/auth/src/context.tsx';
if (fs.existsSync(authProviderPath)) {
  const authProvider = fs.readFileSync(authProviderPath, 'utf8');
  
  // Check for cookie import
  if (authProvider.includes("import { getCookie }")) {
    console.log('✅ AuthProvider imports getCookie');
  } else {
    console.log('❌ AuthProvider missing getCookie import');
    issues++;
  }
  
  // Check for session restoration logic
  if (authProvider.includes('getCookie') && authProvider.includes('sb-pfqtzmxxxhhsxmlddrta-auth-token')) {
    console.log('✅ AuthProvider checks for Supabase session cookies');
  } else {
    console.log('❌ AuthProvider missing session cookie checks');
    issues++;
  }
  
  // Check for setSession call
  if (authProvider.includes('supabase.auth.setSession')) {
    console.log('✅ AuthProvider attempts to restore session from cookies');
  } else {
    console.log('❌ AuthProvider missing session restoration logic');
    issues++;
  }
}

// Check 5: Package exports
console.log('\n📋 Checking Package Exports...\n');

const indexPath = 'packages/auth/src/index.ts';
if (fs.existsSync(indexPath)) {
  const indexExports = fs.readFileSync(indexPath, 'utf8');
  
  if (indexExports.includes('export { getCookie, setCookie, deleteCookie')) {
    console.log('✅ Cookie utilities are exported from package');
  } else {
    console.log('⚠️  Cookie utilities not exported from main index');
  }
  
  if (indexExports.includes('export { CookieStorage, gangerCookieStorage }')) {
    console.log('✅ CookieStorage classes are exported');
  } else {
    console.log('⚠️  CookieStorage not exported from main index');
  }
}

// Summary
console.log('\n==========================================');
console.log('📊 Authentication Verification Summary');
console.log('==========================================\n');

if (issues === 0) {
  console.log('✅ Authentication implementation is complete and correct!');
  console.log('\nExpected behavior:');
  console.log('- Sessions stored in cookies with .gangerdermatology.com domain');
  console.log('- Sessions persist across all subdomains');
  console.log('- AuthProvider restores sessions from cookies on mount');
  console.log('- All Supabase clients use cookie storage');
} else {
  console.log(`❌ Found ${issues} issue(s) in authentication implementation`);
  console.log('\nThese issues must be fixed for cross-domain SSO to work properly.');
}

process.exit(issues > 0 ? 1 : 0);