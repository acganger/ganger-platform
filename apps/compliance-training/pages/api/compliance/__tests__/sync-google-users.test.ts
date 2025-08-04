/**
 * Example usage and test cases for Google Workspace sync endpoint
 */

// Example: Dry run to preview changes
async function previewSync() {
  const response = await fetch('/api/compliance/sync-google-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_AUTH_TOKEN'
    },
    body: JSON.stringify({
      dryRun: true,
      departments: ['Clinical', 'Front Desk']
    })
  });

  const result = await response.json();
  console.log('Preview Results:', result.data.results);
}

// Example: Sync specific location
async function syncLocation() {
  const response = await fetch('/api/compliance/sync-google-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_AUTH_TOKEN'
    },
    body: JSON.stringify({
      dryRun: false,
      locations: ['Ann Arbor']
    })
  });

  const result = await response.json();
  console.log('Sync completed:', result.data);
}

// Example: Force update all accounts
async function forceUpdateAll() {
  const response = await fetch('/api/compliance/sync-google-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_AUTH_TOKEN'
    },
    body: JSON.stringify({
      dryRun: false,
      forceUpdate: true
    })
  });

  const result = await response.json();
  console.log('Force update completed:', result.data);
}

// Example: Handle errors
async function syncWithErrorHandling() {
  try {
    const response = await fetch('/api/compliance/sync-google-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_AUTH_TOKEN'
      },
      body: JSON.stringify({
        dryRun: false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Sync failed:', error.error);
      return;
    }

    const result = await response.json();
    
    // Check for partial failures
    if (result.data.results.errors.length > 0) {
      console.warn('Some accounts failed to sync:', result.data.results.errors);
    }
    
    console.log('Sync completed successfully:', {
      created: result.data.results.accountsCreated,
      updated: result.data.results.accountsUpdated,
      errors: result.data.results.errors.length
    });
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Example: Check sync status from logs
async function checkSyncHistory() {
  // This would query the sync_logs table
  const { data: logs } = await supabase
    .from('sync_logs')
    .select('*')
    .eq('type', 'google_workspace_active')
    .order('started_at', { ascending: false })
    .limit(10);

  logs?.forEach(log => {
    console.log(`Sync ${log.id}: ${log.status} - ${log.results.employeesProcessed} processed`);
  });
}

// Test data for development
export const testEmployees = [
  {
    id: 'test-1',
    email: 'john.doe@gangerdermatology.com',
    first_name: 'John',
    last_name: 'Doe',
    department: 'Clinical',
    job_title: 'Nurse',
    location: 'Ann Arbor',
    start_date: '2024-01-15',
    status: 'active'
  },
  {
    id: 'test-2',
    email: 'jane.smith@gangerdermatology.com',
    first_name: 'Jane',
    last_name: 'Smith',
    department: 'Front Desk',
    job_title: 'Receptionist',
    location: 'Plymouth',
    start_date: '2024-03-01',
    status: 'active'
  }
];

// Integration test example
describe('Google Workspace Sync API', () => {
  it('should preview sync in dry run mode', async () => {
    const response = await fetch('/api/compliance/sync-google-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TEST_AUTH_TOKEN}`
      },
      body: JSON.stringify({
        dryRun: true
      })
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.dryRun).toBe(true);
    expect(result.data.results.activeEmployees).toBeDefined();
  });

  it('should require authentication', async () => {
    const response = await fetch('/api/compliance/sync-google-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dryRun: true
      })
    });

    expect(response.status).toBe(401);
  });

  it('should respect rate limiting', async () => {
    // Make 11 requests (limit is 10 per minute)
    const requests = Array(11).fill(null).map(() => 
      fetch('/api/compliance/sync-google-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TEST_AUTH_TOKEN}`
        },
        body: JSON.stringify({ dryRun: true })
      })
    );

    const responses = await Promise.all(requests);
    const lastResponse = responses[responses.length - 1];
    
    expect(lastResponse.status).toBe(429); // Too Many Requests
  });
});