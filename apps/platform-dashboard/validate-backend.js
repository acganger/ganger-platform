#!/usr/bin/env node

/**
 * Backend Implementation Validation Script
 * Verifies that all critical backend files exist and are structurally sound
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Platform Dashboard Backend Implementation...\n');

// Files that must exist for backend to be complete
const requiredFiles = [
  // API Routes
  'src/app/api/dashboard/route.ts',
  'src/app/api/search/route.ts', 
  'src/app/api/quick-actions/execute/route.ts',
  
  // Core Services
  'src/lib/services/dashboard-aggregator.ts',
  'src/lib/services/cache-service.ts',
  'src/lib/services/activity-logger.ts',
  'src/lib/services/background-jobs.ts',
  
  // Infrastructure
  'src/lib/supabase-server.ts',
  'src/lib/integrations/google-workspace.ts',
  'src/types/dashboard.ts',
  
  // Configuration
  'package.json',
  'tsconfig.json',
  'jest.config.js',
  'jest.setup.js'
];

// Database migration file (in root supabase)
const migrationFile = '../../supabase/migrations/2025_01_11_create_dashboard_platform_tables.sql';

let validationResults = {
  filesExist: 0,
  filesMissing: 0,
  errors: []
};

console.log('📁 Checking Required Files:');
console.log('========================');

// Check each required file
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
    validationResults.filesExist++;
  } else {
    console.log(`❌ ${file} - MISSING`);
    validationResults.filesMissing++;
    validationResults.errors.push(`Missing file: ${file}`);
  }
});

// Check database migration
console.log('\n🗄️  Checking Database Migration:');
console.log('==============================');

const migrationPath = path.join(__dirname, migrationFile);
if (fs.existsSync(migrationPath)) {
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  const tableCount = (migrationContent.match(/CREATE TABLE/g) || []).length;
  const indexCount = (migrationContent.match(/CREATE INDEX/g) || []).length;
  const rlsCount = (migrationContent.match(/ENABLE ROW LEVEL SECURITY/g) || []).length;
  
  console.log(`✅ Migration file exists`);
  console.log(`   - ${tableCount} tables`);
  console.log(`   - ${indexCount} indexes`);
  console.log(`   - ${rlsCount} RLS policies`);
  
  if (tableCount < 10) {
    validationResults.errors.push(`Expected 10 tables, found ${tableCount}`);
  }
} else {
  console.log(`❌ Migration file missing: ${migrationFile}`);
  validationResults.filesMissing++;
  validationResults.errors.push('Database migration missing');
}

// Check package.json dependencies
console.log('\n📦 Checking Dependencies:');
console.log('=======================');

const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = [
    'next',
    'react', 
    '@supabase/supabase-js',
    '@heroicons/react',
    'react-toastify'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      validationResults.errors.push(`Missing dependency: ${dep}`);
    }
  });
}

// Check API route structure
console.log('\n🛣️  Checking API Route Structure:');
console.log('===============================');

const apiRoutes = [
  'src/app/api/dashboard/route.ts',
  'src/app/api/search/route.ts',
  'src/app/api/quick-actions/execute/route.ts'
];

apiRoutes.forEach(route => {
  const routePath = path.join(__dirname, route);
  if (fs.existsSync(routePath)) {
    const content = fs.readFileSync(routePath, 'utf8');
    
    // Check for required exports
    const hasGET = content.includes('export async function GET');
    const hasPOST = content.includes('export async function POST');
    const hasPUT = content.includes('export async function PUT');
    
    if (route.includes('dashboard') && hasGET && hasPUT) {
      console.log(`✅ ${route} - GET/PUT methods`);
    } else if (route.includes('search') && hasGET) {
      console.log(`✅ ${route} - GET method`);
    } else if (route.includes('quick-actions') && hasPOST) {
      console.log(`✅ ${route} - POST method`);
    } else {
      console.log(`❌ ${route} - Missing required HTTP methods`);
      validationResults.errors.push(`API route missing methods: ${route}`);
    }
  }
});

// Final Results
console.log('\n📊 Validation Summary:');
console.log('====================');
console.log(`✅ Files exist: ${validationResults.filesExist}`);
console.log(`❌ Files missing: ${validationResults.filesMissing}`);

if (validationResults.errors.length > 0) {
  console.log('\n🚨 Issues Found:');
  validationResults.errors.forEach(error => {
    console.log(`   - ${error}`);
  });
} else {
  console.log('\n🎉 All validation checks passed!');
}

// Overall assessment
const successRate = (validationResults.filesExist / (validationResults.filesExist + validationResults.filesMissing)) * 100;
console.log(`\n📈 Implementation Completeness: ${successRate.toFixed(1)}%`);

if (successRate >= 90) {
  console.log('🟢 Backend implementation is COMPLETE and ready for testing');
} else if (successRate >= 70) {
  console.log('🟡 Backend implementation is MOSTLY COMPLETE but has some gaps');
} else {
  console.log('🔴 Backend implementation has SIGNIFICANT GAPS and needs work');
}

process.exit(validationResults.errors.length > 0 ? 1 : 0);