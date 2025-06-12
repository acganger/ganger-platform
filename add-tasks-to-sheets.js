const { google } = require('googleapis');
const path = require('path');

async function addTasksToGoogleSheets() {
  try {
    console.log('🔧 Setting up Google Sheets API...');
    
    // Load service account
    const auth = new google.auth.GoogleAuth({
      keyFile: './mcp-servers/google-sheets-mcp/apigatewayproject-451519-c46a66d3fd3d.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const sheetId = '1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k';
    
    console.log('📊 Adding 25+ deployment tasks...');
    
    // Current timestamp
    const timestamp = new Date().toISOString();
    
    // Define all 26 tasks
    const tasks = [
      // Backend Infrastructure (Terminal 2)
      ['TASK-005', 'Fix TypeScript rootDir configuration', 'packages/integrations', 'Resolve cross-package compilation errors', 'Terminal 2', 'High', 'PENDING', 'FAIL', 'FAIL', 'FAIL', '', timestamp, '', '', 'rootDir errors prevent compilation'],
      ['TASK-006', 'Audit workspace package dependencies', 'packages/*', 'Verify all @ganger/* packages compile', 'Terminal 2', 'High', 'PENDING', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', '', timestamp, '', '', 'Systematic package verification needed'],
      ['TASK-007', 'Documentation reality reconciliation', 'docs/', 'Remove false Infrastructure Excellence claims', 'Terminal 2', 'High', 'PENDING', 'N/A', 'N/A', 'N/A', '', timestamp, '', '', 'CLAUDE.md contains false claims'],
      ['TASK-008', 'Environment variables validation', '.env.example', 'Verify all required variables documented', 'Terminal 2', 'Medium', 'PENDING', 'N/A', 'N/A', 'N/A', '', timestamp, '', '', 'Per CLAUDE.md security policy'],
      ['TASK-009', 'Database migrations verification', 'supabase/migrations/', 'Test all migrations work correctly', 'Terminal 2', 'Medium', 'PENDING', 'N/A', 'N/A', 'UNKNOWN', '', timestamp, '', '', 'Supabase migration testing needed'],
      ['TASK-010', 'MCP servers configuration audit', '.mcp.json', 'Verify all 4 MCP servers function', 'Terminal 2', 'Medium', 'PENDING', 'N/A', 'N/A', 'UNKNOWN', '', timestamp, '', '', 'google-sheets, memory, fetch, time'],
      ['TASK-011', 'Package build system verification', 'packages/*/package.json', 'Ensure independent package builds', 'Terminal 2', 'Medium', 'PENDING', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', '', timestamp, '', '', 'Deploy readiness verification'],
      ['TASK-012', 'Turborepo workspace optimization', 'turbo.json', 'Optimize for deployment builds', 'Terminal 2', 'Low', 'PENDING', 'N/A', 'N/A', 'UNKNOWN', '', timestamp, '', '', 'Build system optimization'],
      
      // Frontend Applications (Terminal 1)
      ['TASK-013', 'Complete apps/inventory TypeScript fixes', 'apps/inventory', 'Fix JSX/API handler type errors', 'Terminal 1', 'High', 'PENDING', 'FAIL', 'FAIL', 'FAIL', '', timestamp, '', '', 'React component/API handler confusion'],
      ['TASK-014', 'Complete apps/handouts TypeScript fixes', 'apps/handouts', 'Fix JSX/API handler type errors', 'Terminal 1', 'High', 'PENDING', 'FAIL', 'FAIL', 'FAIL', '', timestamp, '', '', '4 compilation errors in pages'],
      ['TASK-015', 'Complete apps/checkin-kiosk verification', 'apps/checkin-kiosk', 'Verify compilation and functionality', 'Terminal 1', 'High', 'PENDING', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', '', timestamp, '', '', 'Status needs verification'],
      ['TASK-016', 'Fix apps/pharma-scheduling JSX errors', 'apps/pharma-scheduling', 'Resolve Card/Button JSX component issues', 'Terminal 1', 'Medium', 'PENDING', 'FAIL', 'FAIL', 'FAIL', '', timestamp, '', '', 'JSX component type issues'],
      ['TASK-017', 'Enhance apps/eos-l10 for production', 'apps/eos-l10', 'Verify and enhance working app', 'Terminal 1', 'Medium', 'PENDING', 'PASS', 'PASS', 'PASS', '', timestamp, '', '', 'Only confirmed working app'],
      ['TASK-018', 'Fix apps/medication-auth compilation', 'apps/medication-auth', 'Verify and fix TypeScript errors', 'Terminal 1', 'Medium', 'PENDING', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', '', timestamp, '', '', 'Compilation status unknown'],
      ['TASK-019', 'Universal provider integration testing', 'packages/integrations/src/providers/', 'Test providers across all apps', 'Terminal 1', 'Medium', 'PENDING', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', '', timestamp, '', '', 'CommunicationProvider, PaymentProvider'],
      ['TASK-020', 'Frontend accessibility audit', 'apps/*/src/', 'Verify WCAG 2.1 AA compliance', 'Terminal 1', 'Low', 'PENDING', 'N/A', 'N/A', 'UNKNOWN', '', timestamp, '', '', 'Accessibility testing needed'],
      
      // Deployment Preparation (Mixed)
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
    
    // Add header row for Master Project Tracker
    const headers = [
      'Task ID', 'Description', 'Component', 'Details', 'Assigned Terminal', 
      'Priority', 'Status', 'TypeScript Status', 'Build Status', 'Functional Status', 
      'Blocked By', 'Created Date', 'Due Date', 'Completed Date', 'Notes'
    ];
    
    // Prepare data for insertion
    const values = [headers, ...tasks];
    
    // Add to Master Project Tracker sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Master Project Tracker!A1:O27',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: values
      }
    });
    
    console.log('✅ Successfully added 26 deployment tasks to Google Sheets');
    console.log('📊 Tasks include:');
    console.log('   - 8 Backend Infrastructure tasks (Terminal 2)');
    console.log('   - 8 Frontend Application tasks (Terminal 1)');
    console.log('   - 10 Deployment Preparation tasks (Mixed)');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('   1. Use automation prompts for both terminals');
    console.log('   2. Terminals will automatically load tasks from sheets');
    console.log('   3. Progress tracked in real-time');
    console.log('   4. Verification gates prevent false claims');
    
  } catch (error) {
    console.error('❌ Error adding tasks:', error.message);
    if (error.code === 403) {
      console.error('🔒 Permission denied. Service account may not have access.');
    }
  }
}

addTasksToGoogleSheets();