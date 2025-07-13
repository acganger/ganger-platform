#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Analyzing TypeScript errors across all apps...\n');
console.log('This will help identify what needs to be fixed before removing ignoreBuildErrors.\n');

const apps = fs.readdirSync(path.join(__dirname, '../apps'))
  .filter(dir => fs.existsSync(path.join(__dirname, '../apps', dir, 'package.json')));

const results = [];
let totalErrors = 0;

apps.forEach(app => {
  console.log(`Checking ${app}...`);
  
  try {
    // Run type check for each app
    execSync(`pnpm -F @ganger/${app} type-check`, {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    
    results.push({
      app,
      errors: 0,
      status: '✅ No errors'
    });
  } catch (error) {
    // Parse error output
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const errorMatches = output.match(/Found (\d+) error/);
    const errorCount = errorMatches ? parseInt(errorMatches[1]) : 'Unknown';
    
    totalErrors += typeof errorCount === 'number' ? errorCount : 1;
    
    results.push({
      app,
      errors: errorCount,
      status: '❌ Has errors',
      sample: output.split('\\n').slice(0, 5).join('\\n')
    });
  }
});

// Generate report
console.log('\\n' + '='.repeat(80));
console.log('TypeScript Error Analysis Report');
console.log('='.repeat(80) + '\\n');

console.log('Summary:');
console.log(`- Total apps analyzed: ${apps.length}`);
console.log(`- Apps with errors: ${results.filter(r => r.errors > 0).length}`);
console.log(`- Total errors found: ${totalErrors}\\n`);

console.log('App Status:');
results.forEach(result => {
  console.log(`  ${result.app}: ${result.status} ${result.errors > 0 ? `(${result.errors} errors)` : ''}`);
});

// Write detailed report
const reportPath = path.join(__dirname, '../true-docs/deployment/typescript-errors-report.md');
const reportContent = `# TypeScript Errors Report

Generated: ${new Date().toISOString()}

## Summary

- Total apps analyzed: ${apps.length}
- Apps with errors: ${results.filter(r => r.errors > 0).length}
- Total errors found: ${totalErrors}

## Recommendation

Before removing \`ignoreBuildErrors: true\` from next.config.js files:

1. Fix all TypeScript errors in each app
2. Run \`pnpm run type-check:changed\` to verify fixes
3. Only then remove \`ignoreBuildErrors\` to prevent future regressions

## Apps with TypeScript Errors

${results
  .filter(r => r.errors > 0)
  .map(r => `### ${r.app}
- Errors: ${r.errors}
- Status: ${r.status}
- Sample output:
\`\`\`
${r.sample || 'Error details not captured'}
\`\`\`
`)
  .join('\\n')}

## Apps without TypeScript Errors

${results
  .filter(r => r.errors === 0)
  .map(r => `- ${r.app}`)
  .join('\\n')}

## Next Steps

1. Start with apps that have fewer errors
2. Common issues to fix:
   - Missing type definitions
   - Incorrect import paths
   - Undefined variables
   - Type mismatches
3. Add proper types instead of using \`any\`
4. Ensure all @ganger/* package imports are properly typed
`;

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, reportContent);

console.log(`\\n✅ Detailed report saved to: ${reportPath}`);
console.log('\\n⚠️  IMPORTANT: Do NOT remove ignoreBuildErrors until all TypeScript errors are fixed!');
console.log('This would break deployments. Fix errors first, then remove the flag.');