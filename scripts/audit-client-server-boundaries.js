#!/usr/bin/env node

/**
 * Client-Server Boundary Audit Script
 * 
 * Detects violations of client-server boundaries in Next.js applications
 * to prevent build failures and ensure proper separation of concerns.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const CLIENT_SERVER_VIOLATIONS = [
  // Server imports in client components
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    forbidden: [
      // Check for 'use client' followed by server imports
      /('use client'[\s\S]*?import.*from ['"]@ganger\/integrations\/server)/,
      /('use client'[\s\S]*?import.*from ['"]@ganger\/db)/,
      /('use client'[\s\S]*?import.*from ['"]googleapis)/,
      /('use client'[\s\S]*?import.*from ['"]puppeteer)/,
      /('use client'[\s\S]*?import.*from ['"]ioredis)/,
      /('use client'[\s\S]*?import.*from ['"]stripe['"]\s*(?!.*\/client))/
    ],
    message: 'Client components cannot import server-only packages'
  },
  
  // Node.js modules in client code
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    forbidden: [
      /import.*from ['"]fs['"]/,
      /import.*from ['"]crypto['"]/,
      /import.*from ['"]net['"]/,
      /import.*from ['"]dns['"]/,
      /import.*from ['"]child_process['"]/,
      /import.*from ['"]stream['"]/,
      /import.*from ['"]http['"]/,
      /import.*from ['"]https['"]/,
      /import.*from ['"]url['"]/,
      /import.*from ['"]os['"]/,
      /import.*from ['"]path['"]/,
      /import.*from ['"]tls['"]/,
      /import.*from ['"]zlib['"]/
    ],
    message: 'Node.js modules cannot be imported in client-side code'
  },
  
  // Mixed client-server in same file
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    forbidden: [
      /('use client'[\s\S]*?export\s+(async\s+)?function\s+\w+\s*\([^)]*\)\s*:\s*Promise)/
    ],
    message: 'Cannot mix client components and server functions in same file'
  }
];

function auditClientServerBoundaries() {
  console.log('🔄 Auditing client-server boundaries...');
  
  let violations = 0;
  const violationDetails = [];
  
  CLIENT_SERVER_VIOLATIONS.forEach(({ pattern, forbidden, message }) => {
    const files = glob.sync(pattern, { cwd: process.cwd() });
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      forbidden.forEach(forbiddenPattern => {
        const matches = content.match(forbiddenPattern);
        if (matches) {
          violations++;
          violationDetails.push({
            file,
            violation: matches[0].substring(0, 100) + '...',
            message,
            line: content.substring(0, matches.index).split('\n').length
          });
        }
      });
    });
  });
  
  if (violations > 0) {
    console.error(`\n❌ Found ${violations} client-server boundary violations:\n`);
    
    violationDetails.forEach(({ file, violation, message, line }) => {
      console.error(`📁 ${file}:${line}`);
      console.error(`   ${message}`);
      console.error(`   Code: ${violation}`);
      console.error('');
    });
    
    console.error('💡 Fix these violations:');
    console.error('   • Move server-only code to API routes');
    console.error('   • Use client-safe imports from @ganger/integrations/client');
    console.error('   • Add "use client" directive for interactive components');
    console.error('   • Separate client and server logic into different files\n');
    
    process.exit(1);
  }
  
  console.log('✅ No client-server boundary violations found');
}

if (require.main === module) {
  auditClientServerBoundaries();
}

module.exports = { auditClientServerBoundaries };