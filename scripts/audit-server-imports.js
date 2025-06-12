#!/usr/bin/env node

/**
 * Server Import Prevention Audit Script
 * 
 * Prevents server-only packages from being imported in client-side code
 * to avoid build failures and bundle bloat.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const SERVER_ONLY_IMPORTS = [
  // Database packages
  {
    pattern: /import.*from ['"]@ganger\/db['"]/,
    message: 'Database access is server-only. Use API routes to access data from client components.'
  },
  {
    pattern: /import.*from ['"]@supabase\/supabase-js['"]/,
    message: 'Direct Supabase client access is server-only. Use @ganger/db or API routes.'
  },
  
  // Integration server packages
  {
    pattern: /import.*from ['"]@ganger\/integrations\/server['"]/,
    message: 'Server integration services are server-only. Use @ganger/integrations/client instead.'
  },
  
  // External service packages
  {
    pattern: /import.*from ['"]googleapis['"]/,
    message: 'Google APIs are server-only. Create API routes for Google service access.'
  },
  {
    pattern: /import.*from ['"]puppeteer['"]/,
    message: 'Puppeteer is server-only. Create API routes for PDF generation.'
  },
  {
    pattern: /import.*from ['"]puppeteer-core['"]/,
    message: 'Puppeteer Core is server-only. Create API routes for PDF generation.'
  },
  {
    pattern: /import.*from ['"]ioredis['"]/,
    message: 'Redis client is server-only. Use client-side caching or API routes.'
  },
  {
    pattern: /import.*from ['"]redis['"]/,
    message: 'Redis client is server-only. Use client-side caching or API routes.'
  },
  {
    pattern: /import.*from ['"]stripe['"]\s*(?!.*\/client)/,
    message: 'Stripe server SDK is server-only. Use Stripe client SDK or API routes.'
  },
  {
    pattern: /import.*from ['"]twilio['"]/,
    message: 'Twilio is server-only. Create API routes for SMS/voice functionality.'
  },
  
  // Node.js built-in modules
  {
    pattern: /import.*from ['"]fs['"]/,
    message: 'File system access is server-only. Use API routes for file operations.'
  },
  {
    pattern: /import.*from ['"]crypto['"]/,
    message: 'Node.js crypto module is server-only. Use Web Crypto API in client.'
  },
  {
    pattern: /import.*from ['"]net['"]/,
    message: 'Network module is server-only. Use fetch API in client components.'
  },
  {
    pattern: /import.*from ['"]dns['"]/,
    message: 'DNS module is server-only. Not available in browser environment.'
  },
  {
    pattern: /import.*from ['"]child_process['"]/,
    message: 'Child process module is server-only. Not available in browser environment.'
  },
  {
    pattern: /import.*from ['"]stream['"]/,
    message: 'Node.js streams are server-only. Use browser-compatible alternatives.'
  },
  {
    pattern: /import.*from ['"]http['"]/,
    message: 'HTTP module is server-only. Use fetch API in client components.'
  },
  {
    pattern: /import.*from ['"]https['"]/,
    message: 'HTTPS module is server-only. Use fetch API in client components.'
  },
  {
    pattern: /import.*from ['"]url['"]/,
    message: 'Node.js URL module is server-only. Use browser URL API instead.'
  },
  {
    pattern: /import.*from ['"]os['"]/,
    message: 'OS module is server-only. Not available in browser environment.'
  },
  {
    pattern: /import.*from ['"]path['"]/,
    message: 'Path module is server-only. Use browser-compatible path operations.'
  },
  {
    pattern: /import.*from ['"]tls['"]/,
    message: 'TLS module is server-only. Not available in browser environment.'
  },
  {
    pattern: /import.*from ['"]zlib['"]/,
    message: 'Zlib module is server-only. Use browser-compatible compression.'
  }
];

function auditServerImports() {
  console.log('🚫 Auditing server imports in client code...');
  
  let violations = 0;
  const violationDetails = [];
  
  // Check all TypeScript/JavaScript files in apps
  const files = glob.sync('apps/*/src/**/*.{ts,tsx,js,jsx}', { cwd: process.cwd() });
  
  files.forEach(file => {
    // Skip API routes (server-only files)
    if (file.includes('/pages/api/') || file.includes('/app/api/')) {
      return;
    }
    
    const content = fs.readFileSync(file, 'utf8');
    
    SERVER_ONLY_IMPORTS.forEach(({ pattern, message }) => {
      const matches = content.match(pattern);
      if (matches) {
        violations++;
        violationDetails.push({
          file,
          violation: matches[0],
          message,
          line: content.substring(0, matches.index).split('\n').length
        });
      }
    });
  });
  
  if (violations > 0) {
    console.error(`\n❌ Found ${violations} server import violations in client code:\n`);
    
    violationDetails.forEach(({ file, violation, message, line }) => {
      console.error(`📁 ${file}:${line}`);
      console.error(`   Import: ${violation}`);
      console.error(`   Issue: ${message}`);
      console.error('');
    });
    
    console.error('💡 Fix these violations:');
    console.error('   • Replace server imports with client-safe alternatives');
    console.error('   • Use @ganger/integrations/client instead of /server');
    console.error('   • Create API routes for server-side operations');
    console.error('   • Use browser-compatible APIs instead of Node.js modules\n');
    
    console.error('📖 Client-safe alternatives:');
    console.error('   • Database: API routes → fetch("/api/data")');
    console.error('   • PDF generation: API routes → fetch("/api/pdf/generate")');
    console.error('   • External APIs: API routes → fetch("/api/service/action")');
    console.error('   • File operations: API routes → fetch("/api/files/upload")\n');
    
    process.exit(1);
  }
  
  console.log('✅ No server imports found in client code');
}

if (require.main === module) {
  auditServerImports();
}

module.exports = { auditServerImports };