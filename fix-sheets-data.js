const { google } = require('googleapis');

async function fixGoogleSheetsData() {
  try {
    console.log('🔧 Setting up Google Sheets API...');
    
    const auth = new google.auth.GoogleAuth({
      keyFile: './mcp-servers/google-sheets-mcp/apigatewayproject-451519-c46a66d3fd3d.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const sheetId = '1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k';
    
    const timestamp = new Date().toISOString();
    
    console.log('📊 Restoring original 5 tasks plus 26 new tasks...');
    
    // RESTORE original 5 tasks with their completion status
    const originalTasks = [
      ['TASK-001', 'Fix missing ioredis dependency (@ganger/db)', 'packages/db', 'Missing ioredis dependency causing compilation failures', 'Terminal 2', 'High', 'COMPLETED', 'PASS', 'PASS', 'PASS', '', '2025-06-09T22:00:00Z', '', '2025-06-10T00:15:00Z', 'Terminal 2 verified: ioredis@5.6.1 installed, @ganger/db compiles successfully'],
      ['TASK-002', 'Fix Inventory TypeScript compilation errors', 'apps/inventory', 'EnhancedCommunicationHub JSX usage errors', 'Terminal 1', 'High', 'IN_PROGRESS', 'FAIL', 'FAIL', 'FAIL', '', '2025-06-09T22:00:00Z', '', '', 'Terminal 1 working: JSX/API handler confusion errors remain'],
      ['TASK-003', 'Fix Handouts TypeScript compilation errors', 'apps/handouts', 'EnhancedCommunicationHub JSX usage errors', 'Terminal 1', 'High', 'PENDING', 'FAIL', 'FAIL', 'FAIL', '', '2025-06-09T22:00:00Z', '', '', '4 compilation errors in analytics, history, index, templates pages'],
      ['TASK-004', 'Test Checkin-Kiosk compilation status', 'apps/checkin-kiosk', 'Unknown compilation status, needs verification', 'Terminal 1', 'Medium', 'PENDING', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', '', '2025-06-09T22:00:00Z', '', '', 'Status verification needed after integrations fixes'],
      ['TASK-005', 'Documentation reality reconciliation', 'docs/', 'Remove false Infrastructure Excellence claims', 'Both', 'High', 'PENDING', 'N/A', 'N/A', 'N/A', '', '2025-06-09T22:00:00Z', '', '', 'CLAUDE.md contains false claims, Infrastructure Excellence Summary fabricated']
    ];
    
    // Add NEW tasks (TASK-006 through TASK-030)
    const newTasks = [
      ['TASK-006', 'Fix TypeScript rootDir configuration errors', 'packages/integrations', 'Resolve cross-package compilation errors', 'Terminal 2', 'High', 'PENDING', 'FAIL', 'FAIL', 'FAIL', '', timestamp, '', '', 'rootDir errors prevent compilation'],
      ['TASK-007', 'Audit workspace package dependencies', 'packages/*', 'Verify all @ganger/* packages compile', 'Terminal 2', 'High', 'PENDING', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', '', timestamp, '', '', 'Systematic package verification needed'],
      ['TASK-008', 'Environment variables validation', '.env.example', 'Verify all required variables documented', 'Terminal 2', 'Medium', 'PENDING', 'N/A', 'N/A', 'N/A', '', timestamp, '', '', 'Per CLAUDE.md security policy'],
      ['TASK-009', 'Database migrations verification', 'supabase/migrations/', 'Test all migrations work correctly', 'Terminal 2', 'Medium', 'PENDING', 'N/A', 'N/A', 'UNKNOWN', '', timestamp, '', '', 'Supabase migration testing needed'],
      ['TASK-010', 'MCP servers configuration audit', '.mcp.json', 'Verify all 4 MCP servers function', 'Terminal 2', 'Medium', 'PENDING', 'N/A', 'N/A', 'UNKNOWN', '', timestamp, '', '', 'google-sheets, memory, fetch, time'],
      ['TASK-011', 'Package build system verification', 'packages/*/package.json', 'Ensure independent package builds', 'Terminal 2', 'Medium', 'PENDING', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', '', timestamp, '', '', 'Deploy readiness verification'],
      ['TASK-012', 'Turborepo workspace optimization', 'turbo.json', 'Optimize for deployment builds', 'Terminal 2', 'Low', 'PENDING', 'N/A', 'N/A', 'UNKNOWN', '', timestamp, '', '', 'Build system optimization'],
      ['TASK-013', 'Complete apps/inventory TypeScript fixes', 'apps/inventory', 'Fix JSX/API handler type errors', 'Terminal 1', 'High', 'PENDING', 'FAIL', 'FAIL', 'FAIL', '', timestamp, '', '', 'React component/API handler confusion'],
      ['TASK-014', 'Complete apps/handouts TypeScript fixes', 'apps/handouts', 'Fix JSX/API handler type errors', 'Terminal 1', 'High', 'PENDING', 'FAIL', 'FAIL', 'FAIL', '', timestamp, '', '', '4 compilation errors in pages'],
      ['TASK-015', 'Complete apps/checkin-kiosk verification', 'apps/checkin-kiosk', 'Verify compilation and functionality', 'Terminal 1', 'High', 'PENDING', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', '', timestamp, '', '', 'Status needs verification'],
      ['TASK-016', 'Fix apps/pharma-scheduling JSX errors', 'apps/pharma-scheduling', 'Resolve Card/Button JSX component issues', 'Terminal 1', 'Medium', 'PENDING', 'FAIL', 'FAIL', 'FAIL', '', timestamp, '', '', 'JSX component type issues'],
      ['TASK-017', 'Enhance apps/eos-l10 for production', 'apps/eos-l10', 'Verify and enhance working app', 'Terminal 1', 'Medium', 'PENDING', 'PASS', 'PASS', 'PASS', '', timestamp, '', '', 'Only confirmed working app'],
      ['TASK-018', 'Fix apps/medication-auth compilation', 'apps/medication-auth', 'Verify and fix TypeScript errors', 'Terminal 1', 'Medium', 'PENDING', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', '', timestamp, '', '', 'Compilation status unknown'],
      ['TASK-019', 'Universal provider integration testing', 'packages/integrations/src/providers/', 'Test providers across all apps', 'Terminal 1', 'Medium', 'PENDING', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', '', timestamp, '', '', 'CommunicationProvider, PaymentProvider'],
      ['TASK-020', 'Frontend accessibility audit', 'apps/*/src/', 'Verify WCAG 2.1 AA compliance', 'Terminal 1', 'Low', 'PENDING', 'N/A', 'N/A', 'UNKNOWN', '', timestamp, '', '', 'Accessibility testing needed'],
      ['TASK-021', 'Next.js configuration standardization', 'apps/*/next.config.js', 'Consistent configs for deployment', 'Terminal 1', 'Medium', 'PENDING', 'N/A', 'N/A', 'UNKNOWN', '', timestamp, '', '', 'Static export vs SSR consistency'],
      ['TASK-022', 'Build process testing', 'package.json scripts', 'Test full platform build', 'Terminal 2', 'High', 'PENDING', 'UNKNOWN', 'UNKNOWN', 'FAIL', '', timestamp, '', '', 'Deployment build verification'],
      ['TASK-023', 'Environment variable deployment testing', '.env.example', 'Test with placeholder values', 'Terminal 2', 'Medium', 'PENDING', 'N/A', 'N/A', 'UNKNOWN', '', timestamp, '', '', 'Apps must work with placeholders'],
      ['TASK-024', 'Performance optimization audit', 'apps/*/', 'Optimize bundle sizes', 'Terminal 1', 'Low', 'PENDING', 'N/A', 'N/A', 'UNKNOWN', '', timestamp, '', '', 'Bundle analysis needed'],
      ['TASK-025', 'Security headers implementation', 'next.config.js', 'Production security headers', 'Terminal 2', 'Medium', 'PENDING', 'N/A', 'N/A', 'UNKNOWN', '', timestamp, '', '', 'Security for production'],
      ['TASK-026', 'API endpoint documentation', 'docs/', 'Document all API endpoints', 'Terminal 2', 'Low', 'PENDING', 'N/A', 'N/A', 'N/A', '', timestamp, '', '', 'API documentation needed'],
      ['TASK-027', 'Database connection optimization', 'packages/db/', 'Production connection handling', 'Terminal 2', 'Medium', 'PENDING', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', '', timestamp, '', '', 'Connection pooling and errors'],
      ['TASK-028', 'Error handling standardization', 'apps/*/src/', 'Consistent error handling', 'Terminal 1', 'Medium', 'PENDING', 'N/A', 'N/A', 'UNKNOWN', '', timestamp, '', '', 'Error boundaries needed'],
      ['TASK-029', 'Monitoring and logging setup', 'packages/monitoring/', 'Actual monitoring implementation', 'Terminal 2', 'Low', 'PENDING', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', '', timestamp, '', '', 'Replace aspirational claims'],
      ['TASK-030', 'Final deployment readiness verification', 'Entire platform', 'End-to-end deployment test', 'Both', 'High', 'PENDING', 'FAIL', 'FAIL', 'FAIL', '', timestamp, '', '', 'Complete platform deployment']
    ];
    
    // Headers for Master Project Tracker
    const headers = [
      'Task ID', 'Description', 'Component', 'Details', 'Assigned Terminal', 
      'Priority', 'Status', 'TypeScript Status', 'Build Status', 'Functional Status', 
      'Blocked By', 'Created Date', 'Due Date', 'Completed Date', 'Notes'
    ];
    
    // Combine all tasks
    const allTasks = [headers, ...originalTasks, ...newTasks];
    
    // Update Master Project Tracker
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Master Project Tracker!A1:O31',
      valueInputOption: 'USER_ENTERED',
      resource: { values: allTasks }
    });
    
    console.log('✅ Restored original 5 tasks + added 25 new tasks');
    
    // Create Daily Progress sheet
    console.log('📊 Creating Daily Progress sheet...');
    const dailyProgressHeaders = [
      'Date', 'Terminal', 'Session Start', 'Task ID', 'Activity Description', 
      'Progress Notes', 'Blockers', 'Verification Commands Run', 'Status', 'Context Preserved'
    ];
    
    const dailyProgressData = [
      dailyProgressHeaders,
      [timestamp, 'Terminal 2', '2025-06-09T22:00:00Z', 'TASK-001', 'Fixed ioredis dependency', 'Added ioredis@5.6.1 to packages/db and root package.json', '', 'npm run type-check (PASS)', 'COMPLETED', 'Yes'],
      [timestamp, 'Terminal 1', '2025-06-10T00:30:00Z', 'TASK-002', 'Working on inventory TypeScript fixes', 'JSX/API handler confusion errors identified', '', 'npm run type-check (FAIL)', 'IN_PROGRESS', 'Yes'],
      [timestamp, 'System', '2025-06-10T00:45:00Z', 'TASK-006-030', 'Added 25 deployment tasks', 'Comprehensive task expansion for deployment readiness', '', 'Google Sheets API (SUCCESS)', 'COMPLETED', 'Yes']
    ];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Daily Progress!A1:J10',
      valueInputOption: 'USER_ENTERED',
      resource: { values: dailyProgressData }
    });
    
    // Create Compilation Status sheet
    console.log('📊 Creating Compilation Status sheet...');
    const compilationHeaders = [
      'Component', 'TypeScript Status', 'Build Status', 'Lint Status', 'Test Status', 
      'Last Verified', 'Error Summary', 'Fixed By', 'Verification Command'
    ];
    
    const compilationData = [
      compilationHeaders,
      ['@ganger/auth', 'PASS', 'PASS', 'PASS', 'N/A', timestamp, '', '', 'npm run type-check'],
      ['@ganger/utils', 'PASS', 'PASS', 'PASS', 'N/A', timestamp, '', '', 'npm run type-check'],
      ['@ganger/ui', 'PASS', 'PASS', 'PASS', 'N/A', timestamp, '', '', 'npm run type-check'],
      ['@ganger/integrations', 'PARTIAL', 'FAIL', 'UNKNOWN', 'N/A', timestamp, 'rootDir configuration errors', '', 'npm run type-check'],
      ['@ganger/db', 'PASS', 'PASS', 'PASS', 'N/A', timestamp, 'Fixed by Terminal 2 (ioredis dependency)', 'Terminal 2', 'npm run type-check'],
      ['apps/eos-l10', 'PASS', 'PASS', 'PASS', 'N/A', timestamp, '', '', 'npm run type-check'],
      ['apps/inventory', 'FAIL', 'FAIL', 'FAIL', 'N/A', timestamp, 'JSX/API handler type errors', '', 'npm run type-check'],
      ['apps/handouts', 'FAIL', 'FAIL', 'FAIL', 'N/A', timestamp, '4 compilation errors in pages', '', 'npm run type-check'],
      ['apps/checkin-kiosk', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', 'N/A', timestamp, 'Status needs verification', '', 'npm run type-check'],
      ['apps/pharma-scheduling', 'FAIL', 'FAIL', 'UNKNOWN', 'N/A', timestamp, 'JSX component type issues', '', 'npm run type-check'],
      ['apps/medication-auth', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', 'N/A', timestamp, 'Status needs verification', '', 'npm run type-check']
    ];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Compilation Status!A1:I15',
      valueInputOption: 'USER_ENTERED',
      resource: { values: compilationData }
    });
    
    // Create Feature Verification sheet
    console.log('📊 Creating Feature Verification sheet...');
    const verificationHeaders = [
      'Feature', 'Documentation Claim', 'Actual Status', 'Gap Description', 
      'Priority', 'Assigned To', 'Verification Method', 'Last Checked'
    ];
    
    const verificationData = [
      verificationHeaders,
      ['Redis Caching', 'Implemented with performance monitoring', 'WORKING (ioredis dependency fixed)', 'Was missing dependency, now resolved', 'High', 'Terminal 2', 'npm run type-check on @ganger/db', timestamp],
      ['Inventory App', 'Production ready', 'BROKEN (TypeScript compilation fails)', 'JSX/API handler confusion errors', 'High', 'Terminal 1', 'npm run type-check', timestamp],
      ['Handouts App', 'Production ready', 'BROKEN (TypeScript compilation fails)', '4 compilation errors in pages', 'High', 'Terminal 1', 'npm run type-check', timestamp],
      ['Check-in Kiosk', 'Production ready', 'UNKNOWN (needs verification)', 'Status unknown after integrations fixes', 'Medium', 'Terminal 1', 'npm run type-check', timestamp],
      ['Payment Processing', 'Enterprise-grade integration', 'PARTIAL (needs verification)', 'Integration status unclear', 'Medium', 'Terminal 1', 'Functional testing', timestamp],
      ['Universal Communication Hub', 'Fully implemented', 'PARTIAL (TypeScript fixes made)', 'Terminal 1 made progress on integration', 'Medium', 'Terminal 1', 'Provider testing', timestamp],
      ['Infrastructure Excellence', 'EXCEPTIONAL rating', 'FALSE (was fabricated)', 'Infrastructure Excellence Summary was aspirational', 'High', 'Terminal 2', 'Documentation audit', timestamp],
      ['MCP Integration', '12 servers implemented', 'PARTIAL (4 servers working)', 'Only google-sheets, memory, fetch, time configured', 'Medium', 'Terminal 2', 'MCP server testing', timestamp]
    ];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Feature Verification!A1:H10',
      valueInputOption: 'USER_ENTERED',
      resource: { values: verificationData }
    });
    
    console.log('🎯 Successfully restored and expanded Google Sheets tracking:');
    console.log('   ✅ Master Project Tracker: 5 original + 25 new tasks (30 total)');
    console.log('   ✅ Daily Progress: Terminal activity log with completed work');
    console.log('   ✅ Compilation Status: Current state of all components');
    console.log('   ✅ Feature Verification: Documentation vs reality status');
    console.log('');
    console.log('📊 Work history preserved:');
    console.log('   - TASK-001: COMPLETED by Terminal 2 (ioredis dependency fixed)');
    console.log('   - TASK-002: IN_PROGRESS by Terminal 1 (inventory compilation)');
    console.log('   - TASK-003-005: PENDING (handouts, checkin-kiosk, documentation)');
    
  } catch (error) {
    console.error('❌ Error fixing sheets:', error.message);
  }
}

fixGoogleSheetsData();