#!/usr/bin/env node

/**
 * 'use client' Directive Audit Script
 * 
 * Ensures all interactive React components include the 'use client' directive
 * to prevent hydration errors and client-server boundary violations.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const INTERACTIVE_PATTERNS = [
  // React hooks that require 'use client'
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    required: /import.*\{[^}]*useState[^}]*\}.*from ['"]react['"]/,
    directive: /'use client'/,
    message: 'Components using useState must include "use client" directive'
  },
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    required: /import.*\{[^}]*useEffect[^}]*\}.*from ['"]react['"]/,
    directive: /'use client'/,
    message: 'Components using useEffect must include "use client" directive'
  },
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    required: /import.*\{[^}]*useCallback[^}]*\}.*from ['"]react['"]/,
    directive: /'use client'/,
    message: 'Components using useCallback must include "use client" directive'
  },
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    required: /import.*\{[^}]*useMemo[^}]*\}.*from ['"]react['"]/,
    directive: /'use client'/,
    message: 'Components using useMemo must include "use client" directive'
  },
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    required: /import.*\{[^}]*useReducer[^}]*\}.*from ['"]react['"]/,
    directive: /'use client'/,
    message: 'Components using useReducer must include "use client" directive'
  },
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    required: /import.*\{[^}]*useContext[^}]*\}.*from ['"]react['"]/,
    directive: /'use client'/,
    message: 'Components using useContext must include "use client" directive'
  },
  
  // Event handlers that require 'use client'
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    required: /onClick\s*=\s*\{/,
    directive: /'use client'/,
    message: 'Components with onClick handlers must include "use client" directive'
  },
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    required: /onChange\s*=\s*\{/,
    directive: /'use client'/,
    message: 'Components with onChange handlers must include "use client" directive'
  },
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    required: /onSubmit\s*=\s*\{/,
    directive: /'use client'/,
    message: 'Components with onSubmit handlers must include "use client" directive'
  },
  
  // Browser APIs that require 'use client'
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    required: /window\./,
    directive: /'use client'/,
    message: 'Components using window object must include "use client" directive'
  },
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    required: /document\./,
    directive: /'use client'/,
    message: 'Components using document object must include "use client" directive'
  },
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    required: /localStorage\./,
    directive: /'use client'/,
    message: 'Components using localStorage must include "use client" directive'
  }
];

function auditUseClientDirective() {
  console.log('⚛️ Auditing "use client" directive usage...');
  
  let violations = 0;
  const violationDetails = [];
  
  INTERACTIVE_PATTERNS.forEach(({ pattern, required, directive, message }) => {
    const files = glob.sync(pattern, { cwd: process.cwd() });
    
    files.forEach(file => {
      // Skip API routes (server-only)
      if (file.includes('/pages/api/') || file.includes('/app/api/')) {
        return;
      }
      
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file contains interactive patterns
      const hasInteractivePattern = required.test(content);
      
      if (hasInteractivePattern) {
        // Check if file has 'use client' directive
        const hasUseClient = directive.test(content);
        
        if (!hasUseClient) {
          violations++;
          const match = content.match(required);
          violationDetails.push({
            file,
            violation: match ? match[0] : 'Interactive pattern detected',
            message,
            line: match ? content.substring(0, match.index).split('\n').length : 1
          });
        }
      }
    });
  });
  
  if (violations > 0) {
    console.error(`\n❌ Found ${violations} missing "use client" directive violations:\n`);
    
    violationDetails.forEach(({ file, violation, message, line }) => {
      console.error(`📁 ${file}:${line}`);
      console.error(`   ${message}`);
      console.error(`   Interactive code: ${violation}`);
      console.error('');
    });
    
    console.error('💡 Fix these violations:');
    console.error('   • Add "use client" directive at the top of interactive components');
    console.error('   • Format: \'use client\' (with quotes)');
    console.error('   • Place directive before all imports');
    console.error('   • Only client-side interactive components need this directive\n');
    
    process.exit(1);
  }
  
  console.log('✅ All interactive components properly use "use client" directive');
}

if (require.main === module) {
  auditUseClientDirective();
}

module.exports = { auditUseClientDirective };