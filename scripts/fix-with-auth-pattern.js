#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const files = [
  '/q/Projects/ganger-platform/apps/clinical-staffing/app/api/staffing/auto-assign/route.ts',
  '/q/Projects/ganger-platform/apps/clinical-staffing/app/api/staff-schedules/route.ts',
  '/q/Projects/ganger-platform/apps/clinical-staffing/app/api/staff-members/route.ts',
  '/q/Projects/ganger-platform/apps/clinical-staffing/app/api/staff-members/[id]/availability/route.ts',
  '/q/Projects/ganger-platform/apps/clinical-staffing/app/api/providers/route.ts',
  '/q/Projects/ganger-platform/apps/clinical-staffing/app/api/optimization/suggestions/route.ts',
  '/q/Projects/ganger-platform/apps/clinical-staffing/app/api/analytics/staffing/route.ts'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix the withAuth pattern
    content = content.replace(
      /return withAuth\(async \(user\) => \{\s*return withStandardErrorHandling\(async \(\) => \{/g,
      'return withAuth(async (request, { user }) => {'
    );
    
    // Remove the extra closing })(request); pattern
    content = content.replace(
      /\}\);\s*\}\)\(request\);/g,
      '});'
    );
    
    fs.writeFileSync(file, content);
    console.log(`Fixed: ${file}`);
  }
}

// Now check other apps that might have the same issue
console.log('\nChecking other apps for similar patterns...');

const appsToCheck = [
  'ganger-eos-l10',
  'ganger-integration-status'
];

for (const app of appsToCheck) {
  const appDir = `/q/Projects/ganger-platform/apps/${app}`;
  if (fs.existsSync(appDir)) {
    const apiDir = path.join(appDir, 'app/api');
    if (fs.existsSync(apiDir)) {
      const findFiles = (dir) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            findFiles(filePath);
          } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('return withAuth(async (user)')) {
              console.log(`Found pattern in: ${filePath}`);
            }
          }
        }
      };
      findFiles(apiDir);
    }
  }
}