const { google } = require('googleapis');
const path = require('path');

// Your Google Sheets ID
const SPREADSHEET_ID = '1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k';

// Service account setup
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../mcp-servers/google-sheets-mcp/service-account.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function setupProjectSheets() {
  console.log('🚀 Setting up Ganger Platform Google Sheets structure...');
  
  try {
    // Clear existing sheets and create new structure
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    console.log(`📊 Connected to spreadsheet: ${spreadsheet.data.properties.title}`);
    
    // Create the 4 required sheets
    const sheetRequests = [
      {
        addSheet: {
          properties: {
            title: 'Master Project Tracker',
            gridProperties: {
              rowCount: 1000,
              columnCount: 15
            }
          }
        }
      },
      {
        addSheet: {
          properties: {
            title: 'Daily Progress',
            gridProperties: {
              rowCount: 1000,
              columnCount: 10
            }
          }
        }
      },
      {
        addSheet: {
          properties: {
            title: 'Compilation Status',
            gridProperties: {
              rowCount: 100,
              columnCount: 8
            }
          }
        }
      },
      {
        addSheet: {
          properties: {
            title: 'Feature Verification',
            gridProperties: {
              rowCount: 500,
              columnCount: 12
            }
          }
        }
      }
    ];
    
    // Batch create sheets
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: sheetRequests
      }
    });
    
    console.log('✅ Created 4 project sheets');
    
    // Set up Master Project Tracker headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Master Project Tracker!A1:O1',
      valueInputOption: 'RAW',
      resource: {
        values: [[
          'Feature ID',
          'Feature Name', 
          'Application',
          'Priority',
          'Current Status',
          'Terminal Assignment',
          'Verification Status',
          'Completion %',
          'Last Updated',
          'Assigned Terminal',
          'Dependencies',
          'Blockers',
          'Notes',
          'PRD Reference',
          'Verification Gates'
        ]]
      }
    });
    
    // Set up Daily Progress headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Daily Progress!A1:J1',
      valueInputOption: 'RAW',
      resource: {
        values: [[
          'Date',
          'Terminal ID',
          'Features Worked',
          'Compilation Status',
          'Blockers Encountered',
          'Blockers Resolved',
          'Next Day Plan',
          'Hours Worked',
          'Progress Notes',
          'Context Saved'
        ]]
      }
    });
    
    // Set up Compilation Status headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Compilation Status!A1:H1',
      valueInputOption: 'RAW',
      resource: {
        values: [[
          'App/Package',
          'TypeScript Status',
          'Build Status',
          'Lint Status',
          'Test Status',
          'Error Count',
          'Last Checked',
          'Priority Fix'
        ]]
      }
    });
    
    // Set up Feature Verification headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Feature Verification!A1:L1',
      valueInputOption: 'RAW',
      resource: {
        values: [[
          'Feature ID',
          'Feature Name',
          'Documented Status',
          'Actual Status',
          'Verification Result',
          'Test Date',
          'Test Method',
          'Pass/Fail',
          'Error Details',
          'Fixed Date',
          'Verified By',
          'Notes'
        ]]
      }
    });
    
    console.log('✅ Set up all sheet headers');
    
    // Populate current reality data
    await populateCurrentReality();
    
    console.log('🎯 Google Sheets setup complete!');
    console.log(`📊 View at: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`);
    
  } catch (error) {
    console.error('❌ Error setting up sheets:', error.message);
  }
}

async function populateCurrentReality() {
  console.log('📝 Populating current reality data...');
  
  // Current compilation status (from audit findings)
  const compilationData = [
    ['EOS-L10', 'PASS', 'PASS', 'PASS', 'PASS', '0', new Date().toISOString(), 'None - Working'],
    ['Inventory', 'FAIL', 'FAIL', 'FAIL', 'UNKNOWN', '20+', new Date().toISOString(), 'HIGH - TypeScript errors'],
    ['Handouts', 'FAIL', 'FAIL', 'FAIL', 'UNKNOWN', '20+', new Date().toISOString(), 'HIGH - TypeScript errors'],
    ['Checkin-Kiosk', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', '?', new Date().toISOString(), 'MEDIUM - Needs testing'],
    ['@ganger/auth', 'PASS', 'PASS', 'PASS', 'UNKNOWN', '0', new Date().toISOString(), 'None - Working'],
    ['@ganger/ui', 'PASS', 'PASS', 'PASS', 'UNKNOWN', '0', new Date().toISOString(), 'None - Working'],
    ['@ganger/utils', 'PASS', 'PASS', 'PASS', 'UNKNOWN', '0', new Date().toISOString(), 'None - Working'],
    ['@ganger/db', 'FAIL', 'FAIL', 'FAIL', 'UNKNOWN', '5+', new Date().toISOString(), 'HIGH - Missing ioredis'],
    ['@ganger/integrations', 'PASS', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', '0', new Date().toISOString(), 'LOW - Compiles but type issues'],
  ];
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Compilation Status!A2:H10',
    valueInputOption: 'RAW',
    resource: {
      values: compilationData
    }
  });
  
  // Feature verification (documented vs actual)
  const verificationData = [
    ['INV-001', 'Inventory Management System', 'Production Ready', 'Compilation Fails', 'FAIL', new Date().toISOString(), 'TypeScript Check', 'FAIL', 'EnhancedCommunicationHub JSX errors', '', '', 'Documentation inaccurate'],
    ['HO-001', 'Patient Handouts Generator', 'Production Ready', 'Compilation Fails', 'FAIL', new Date().toISOString(), 'TypeScript Check', 'FAIL', 'Same JSX component errors', '', '', 'Documentation inaccurate'],
    ['EOS-001', 'EOS L10 Platform', 'Production Ready', 'Actually Works', 'PASS', new Date().toISOString(), 'Full Test', 'PASS', 'Compiles and functions', new Date().toISOString(), 'Audit', 'Documentation accurate'],
    ['INFRA-001', 'Redis Caching System', 'Enterprise-grade completion', 'Missing Dependencies', 'FAIL', new Date().toISOString(), 'Dependency Check', 'FAIL', 'ioredis not installed', '', '', 'False documentation'],
    ['INFRA-002', 'Integration Health Monitoring', 'Real-time monitoring', 'Packages exist but broken', 'FAIL', new Date().toISOString(), 'Compilation Check', 'FAIL', 'TypeScript errors', '', '', 'Partially true'],
  ];
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Feature Verification!A2:L6',
    valueInputOption: 'RAW',
    resource: {
      values: verificationData
    }
  });
  
  // Initial project tasks (high priority fixes)
  const projectTasks = [
    ['TASK-001', 'Fix missing ioredis dependency', '@ganger/db', 'P0', 'NOT_STARTED', 'BACKEND', 'PENDING', '0%', new Date().toISOString(), '', '', 'Missing npm package', 'Blocking Redis functionality', '', 'COMPILE_CHECK,BUILD_CHECK'],
    ['TASK-002', 'Fix Inventory TypeScript errors', 'inventory', 'P0', 'NOT_STARTED', 'FRONTEND', 'PENDING', '0%', new Date().toISOString(), '', 'TASK-001', 'EnhancedCommunicationHub JSX issues', 'App compilation fails', 'PRD Inventory', 'TYPE_CHECK,BUILD_CHECK,FUNC_TEST'],
    ['TASK-003', 'Fix Handouts TypeScript errors', 'handouts', 'P0', 'NOT_STARTED', 'FRONTEND', 'PENDING', '0%', new Date().toISOString(), '', 'TASK-001', 'Same JSX component issues', 'App compilation fails', 'PRD Handouts', 'TYPE_CHECK,BUILD_CHECK,FUNC_TEST'],
    ['TASK-004', 'Test Checkin-Kiosk compilation', 'checkin-kiosk', 'P1', 'NOT_STARTED', 'FRONTEND', 'PENDING', '0%', new Date().toISOString(), '', '', '', 'Verify compilation status', 'PRD Check-in Kiosk', 'TYPE_CHECK,BUILD_CHECK'],
    ['TASK-005', 'Documentation reality reconciliation', 'docs', 'P1', 'NOT_STARTED', 'SHARED', 'PENDING', '0%', new Date().toISOString(), '', 'TASK-002,TASK-003', '', 'Update docs to match reality', '', 'DOC_CHECK,ACCURACY_CHECK'],
  ];
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Master Project Tracker!A2:O6',
    valueInputOption: 'RAW',
    resource: {
      values: projectTasks
    }
  });
  
  console.log('✅ Populated current reality data');
}

// Run the setup
setupProjectSheets().catch(console.error);