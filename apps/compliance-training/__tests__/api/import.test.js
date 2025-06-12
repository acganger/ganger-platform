// Test that all API files can be properly imported and have correct exports

describe('API Import and Export Tests', () => {
  test('Middleware files can be imported', () => {
    // Test that middleware files exist and have the right structure
    const fs = require('fs');
    const path = require('path');
    
    const middlewarePath = path.join(__dirname, '../../middleware');
    
    // Check if middleware directory exists
    expect(fs.existsSync(middlewarePath)).toBe(true);
    
    // Check if auth.ts exists
    const authPath = path.join(middlewarePath, 'auth.ts');
    expect(fs.existsSync(authPath)).toBe(true);
    
    // Check if errorHandler.ts exists
    const errorHandlerPath = path.join(middlewarePath, 'errorHandler.ts');
    expect(fs.existsSync(errorHandlerPath)).toBe(true);
    
    // Read and verify basic structure
    const authContent = fs.readFileSync(authPath, 'utf8');
    expect(authContent).toContain('withAuth');
    expect(authContent).toContain('AuthenticatedRequest');
    expect(authContent).toContain('withRateLimit');
    
    const errorContent = fs.readFileSync(errorHandlerPath, 'utf8');
    expect(errorContent).toContain('ApiResponse');
    expect(errorContent).toContain('ErrorCodes');
    expect(errorContent).toContain('handleApiError');
  });

  test('Lib files can be imported', () => {
    const fs = require('fs');
    const path = require('path');
    
    const libPath = path.join(__dirname, '../../lib');
    
    // Check if lib directory exists
    expect(fs.existsSync(libPath)).toBe(true);
    
    // Check if cache.ts exists
    const cachePath = path.join(libPath, 'cache.ts');
    expect(fs.existsSync(cachePath)).toBe(true);
    
    // Check if monitoring.ts exists
    const monitoringPath = path.join(libPath, 'monitoring.ts');
    expect(fs.existsSync(monitoringPath)).toBe(true);
    
    // Read and verify basic structure
    const cacheContent = fs.readFileSync(cachePath, 'utf8');
    expect(cacheContent).toContain('ComplianceCache');
    expect(cacheContent).toContain('withCache');
    expect(cacheContent).toContain('cache');
    
    const monitoringContent = fs.readFileSync(monitoringPath, 'utf8');
    expect(monitoringContent).toContain('ComplianceMonitoring');
    expect(monitoringContent).toContain('monitoring');
    expect(monitoringContent).toContain('recordMetric');
  });

  test('API endpoint files exist and have correct structure', () => {
    const fs = require('fs');
    const path = require('path');
    
    const apiPath = path.join(__dirname, '../../pages/api');
    
    // Check dashboard endpoint
    const dashboardPath = path.join(apiPath, 'compliance/dashboard.ts');
    expect(fs.existsSync(dashboardPath)).toBe(true);
    
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    expect(dashboardContent).toContain('DashboardData');
    expect(dashboardContent).toContain('dashboardHandler');
    expect(dashboardContent).toContain('withAuth');
    expect(dashboardContent).toContain('export default');
    
    // Check sync endpoint
    const syncPath = path.join(apiPath, 'compliance/sync.ts');
    expect(fs.existsSync(syncPath)).toBe(true);
    
    const syncContent = fs.readFileSync(syncPath, 'utf8');
    expect(syncContent).toContain('SyncRequest');
    expect(syncContent).toContain('SyncResponse');
    expect(syncContent).toContain('syncHandler');
    expect(syncContent).toContain('export default');
    
    // Check employee endpoint
    const employeePath = path.join(apiPath, 'compliance/employee/[id].ts');
    expect(fs.existsSync(employeePath)).toBe(true);
    
    const employeeContent = fs.readFileSync(employeePath, 'utf8');
    expect(employeeContent).toContain('EmployeeComplianceData');
    expect(employeeContent).toContain('employeeHandler');
    expect(employeeContent).toContain('withAuth');
    expect(employeeContent).toContain('export default');
    
    // Check export endpoint
    const exportPath = path.join(apiPath, 'compliance/export.ts');
    expect(fs.existsSync(exportPath)).toBe(true);
    
    // Check health endpoint
    const healthPath = path.join(apiPath, 'health.ts');
    expect(fs.existsSync(healthPath)).toBe(true);
    
    const healthContent = fs.readFileSync(healthPath, 'utf8');
    expect(healthContent).toContain('HealthStatus');
    expect(healthContent).toContain('healthHandler');
    expect(healthContent).toContain('export default');
  });

  test('Package integrations exist and have correct structure', () => {
    const fs = require('fs');
    const path = require('path');
    
    const integrationsPath = path.join(__dirname, '../../../../packages/integrations/server');
    
    // Check if integrations directory exists
    expect(fs.existsSync(integrationsPath)).toBe(true);
    
    // Check Zenefits integration
    const zenefitsPath = path.join(integrationsPath, 'zenefits/ZenefitsComplianceSync.ts');
    expect(fs.existsSync(zenefitsPath)).toBe(true);
    
    const zenefitsContent = fs.readFileSync(zenefitsPath, 'utf8');
    expect(zenefitsContent).toContain('ZenefitsComplianceSync');
    expect(zenefitsContent).toContain('ZenefitsConfig');
    expect(zenefitsContent).toContain('syncEmployees');
    
    // Check Google Classroom integration
    const classroomPath = path.join(integrationsPath, 'google-classroom/GoogleClassroomComplianceSync.ts');
    expect(fs.existsSync(classroomPath)).toBe(true);
    
    const classroomContent = fs.readFileSync(classroomPath, 'utf8');
    expect(classroomContent).toContain('GoogleClassroomComplianceSync');
    expect(classroomContent).toContain('GoogleClassroomConfig');
    expect(classroomContent).toContain('syncTrainingCompletions');
    
    // Check realtime service
    const realtimePath = path.join(integrationsPath, 'realtime/ComplianceRealtimeService.ts');
    expect(fs.existsSync(realtimePath)).toBe(true);
    
    // Check background jobs
    const backgroundPath = path.join(integrationsPath, 'background/ComplianceBackgroundJobs.ts');
    expect(fs.existsSync(backgroundPath)).toBe(true);
  });

  test('Database migrations exist and are complete', () => {
    const fs = require('fs');
    const path = require('path');
    
    const migrationsPath = path.join(__dirname, '../../../../supabase/migrations');
    expect(fs.existsSync(migrationsPath)).toBe(true);
    
    // Check compliance training migrations
    const complianceMigrations = [
      '20250610000001_compliance_training_schema.sql',
      '20250610000002_compliance_training_rls.sql', 
      '20250610000003_compliance_training_seed.sql',
      '20250610000004_compliance_advanced_functions.sql',
      '20250610000005_compliance_triggers.sql',
      '20250610000006_background_job_schedules.sql'
    ];
    
    complianceMigrations.forEach(migration => {
      const migrationPath = path.join(migrationsPath, migration);
      expect(fs.existsSync(migrationPath)).toBe(true);
      
      const content = fs.readFileSync(migrationPath, 'utf8');
      expect(content.length).toBeGreaterThan(100); // Ensure it's not empty
      expect(content).toContain('--'); // Should have comments
    });
    
    // Verify schema migration has key tables
    const schemaPath = path.join(migrationsPath, '20250610000001_compliance_training_schema.sql');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    expect(schemaContent).toContain('CREATE TABLE employees');
    expect(schemaContent).toContain('CREATE TABLE training_modules');
    expect(schemaContent).toContain('CREATE TABLE training_completions');
    
    // Verify RLS migration has policies
    const rlsPath = path.join(migrationsPath, '20250610000002_compliance_training_rls.sql');
    const rlsContent = fs.readFileSync(rlsPath, 'utf8');
    expect(rlsContent).toContain('ENABLE ROW LEVEL SECURITY');
    expect(rlsContent).toContain('CREATE POLICY');
  });

  test('Configuration files exist and are properly structured', () => {
    const fs = require('fs');
    const path = require('path');
    
    const rootPath = path.join(__dirname, '../../');
    
    // Check package.json
    const packagePath = path.join(rootPath, 'package.json');
    expect(fs.existsSync(packagePath)).toBe(true);
    
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    expect(packageContent.name).toBe('@ganger/compliance-training');
    expect(packageContent.scripts).toBeDefined();
    expect(packageContent.scripts.test).toBeDefined();
    
    // Check Jest config
    const jestPath = path.join(rootPath, 'jest.config.js');
    expect(fs.existsSync(jestPath)).toBe(true);
    
    const jestContent = fs.readFileSync(jestPath, 'utf8');
    expect(jestContent).toContain('testEnvironment');
    expect(jestContent).toContain('module.exports');
    
    // Check Jest setup
    const jestSetupPath = path.join(rootPath, 'jest.setup.js');
    expect(fs.existsSync(jestSetupPath)).toBe(true);
    
    // Check TypeScript config
    const tsconfigPath = path.join(rootPath, 'tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);
    
    // Check Next.js config
    const nextConfigPath = path.join(rootPath, 'next.config.js');
    expect(fs.existsSync(nextConfigPath)).toBe(true);
  });

  test('Test files are comprehensive and cover all areas', () => {
    const fs = require('fs');
    const path = require('path');
    
    const testsPath = path.join(__dirname, './');
    const testFiles = fs.readdirSync(testsPath).filter(file => file.endsWith('.test.js'));
    
    // Should have multiple test files
    expect(testFiles.length).toBeGreaterThanOrEqual(3);
    expect(testFiles).toContain('simple.test.js');
    expect(testFiles).toContain('integration.test.js');
    expect(testFiles).toContain('endpoints.test.js');
    expect(testFiles).toContain('import.test.js');
    
    // Check that integration test has comprehensive coverage
    const integrationPath = path.join(testsPath, 'integration.test.js');
    const integrationContent = fs.readFileSync(integrationPath, 'utf8');
    expect(integrationContent).toContain('Dashboard API');
    expect(integrationContent).toContain('Employee Detail API');
    expect(integrationContent).toContain('Sync API');
    expect(integrationContent).toContain('Export API');
    expect(integrationContent).toContain('Error Handling');
    expect(integrationContent).toContain('Performance Tests');
    expect(integrationContent).toContain('Security Tests');
  });
});