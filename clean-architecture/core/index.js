/**
 * Core Worker - Handles main platform dashboard and administrative functions
 * Apps: Dashboard, Config, Status, Admin, AI Receptionist, Call Center, Reps, Showcase, Batch
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    try {
      // Main dashboard
      if (path === '/' || path === '/dashboard' || path === '/dashboard/') {
        return await handleDashboard(request, env);
      }
      
      // Route to appropriate handler
      if (path.startsWith('/config')) return await handleConfig(path, request, env);
      if (path.startsWith('/status')) return await handleStatus(path, request, env);
      if (path.startsWith('/admin')) return await handleAdmin(path, request, env);
      if (path.startsWith('/ai-receptionist')) return await handleAIReceptionist(path, request, env);
      if (path.startsWith('/call-center')) return await handleCallCenter(path, request, env);
      if (path.startsWith('/reps')) return await handleReps(path, request, env);
      if (path.startsWith('/showcase')) return await handleShowcase(path, request, env);
      if (path.startsWith('/batch')) return await handleBatch(path, request, env);
      
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Core Worker Error:', error);
      return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
    }
  }
};

async function handleDashboard(request, env) {
  const timestamp = new Date().toISOString();
  const userCount = Math.floor(Math.random() * 50) + 150;
  const activeUsers = Math.floor(Math.random() * 20) + 30;
  
  return generateHTML(`
    <h1>🏠 Ganger Platform Dashboard</h1>
    <div class="content">
      <div class="welcome">
        <h2>Welcome to Ganger Platform</h2>
        <p>Clean Architecture v2.0 - ${timestamp}</p>
      </div>
      
      <div class="stats">
        <div class="stat-card">
          <h3>Total Users</h3>
          <p class="stat-value">${userCount}</p>
        </div>
        <div class="stat-card">
          <h3>Active Now</h3>
          <p class="stat-value">${activeUsers}</p>
        </div>
        <div class="stat-card">
          <h3>Apps Running</h3>
          <p class="stat-value">12</p>
        </div>
        <div class="stat-card">
          <h3>System Health</h3>
          <p class="stat-value">✅ 100%</p>
        </div>
      </div>
      
      <h2>Medical Applications</h2>
      <div class="app-grid">
        <a href="/inventory" class="app-card medical">
          <span class="app-icon">🏥</span>
          <h3>Inventory</h3>
          <p>Medical supply tracking</p>
        </a>
        <a href="/handouts" class="app-card medical">
          <span class="app-icon">📄</span>
          <h3>Handouts</h3>
          <p>Patient education materials</p>
        </a>
        <a href="/meds" class="app-card medical">
          <span class="app-icon">💊</span>
          <h3>Medications</h3>
          <p>Authorization management</p>
        </a>
        <a href="/kiosk" class="app-card medical">
          <span class="app-icon">🖥️</span>
          <h3>Kiosk Admin</h3>
          <p>Check-in management</p>
        </a>
      </div>
      
      <h2>Business Applications</h2>
      <div class="app-grid">
        <a href="/l10" class="app-card business">
          <span class="app-icon">🎯</span>
          <h3>EOS L10</h3>
          <p>Meeting management</p>
        </a>
        <a href="/compliance" class="app-card business">
          <span class="app-icon">📋</span>
          <h3>Compliance</h3>
          <p>Training & certifications</p>
        </a>
        <a href="/staffing" class="app-card business">
          <span class="app-icon">👥</span>
          <h3>Staffing</h3>
          <p>Schedule management</p>
        </a>
        <a href="/socials" class="app-card business">
          <span class="app-icon">📱</span>
          <h3>Socials</h3>
          <p>Review management</p>
        </a>
      </div>
      
      <h2>Administrative Tools</h2>
      <div class="app-grid">
        <a href="/config" class="app-card admin">
          <span class="app-icon">⚙️</span>
          <h3>Configuration</h3>
          <p>Platform settings</p>
        </a>
        <a href="/status" class="app-card admin">
          <span class="app-icon">📊</span>
          <h3>Status Monitor</h3>
          <p>System health</p>
        </a>
        <a href="/admin" class="app-card admin">
          <span class="app-icon">🔐</span>
          <h3>Admin Panel</h3>
          <p>User management</p>
        </a>
        <a href="/showcase" class="app-card admin">
          <span class="app-icon">🌟</span>
          <h3>App Showcase</h3>
          <p>Feature demos</p>
        </a>
      </div>
      
      <h2>Specialized Tools</h2>
      <div class="app-grid">
        <a href="/ai-receptionist" class="app-card special">
          <span class="app-icon">🤖</span>
          <h3>AI Receptionist</h3>
          <p>Automated assistance</p>
        </a>
        <a href="/call-center" class="app-card special">
          <span class="app-icon">📞</span>
          <h3>Call Center</h3>
          <p>Phone operations</p>
        </a>
        <a href="/reps" class="app-card special">
          <span class="app-icon">💼</span>
          <h3>Rep Portal</h3>
          <p>Pharma scheduling</p>
        </a>
        <a href="/batch" class="app-card special">
          <span class="app-icon">📦</span>
          <h3>Batch Closeout</h3>
          <p>Daily processing</p>
        </a>
      </div>
    </div>
  `, 'Ganger Platform Dashboard');
}

async function handleConfig(path, request, env) {
  const timestamp = new Date().toISOString();
  const subpath = path.replace('/config', '') || '/';
  
  if (subpath === '/settings' || subpath === '/settings/') {
    return generateHTML(`
      <h1>⚙️ Platform Settings</h1>
      <div class="content">
        <div class="settings-section">
          <h2>General Settings</h2>
          <form class="settings-form">
            <label>
              Practice Name:
              <input type="text" value="Ganger Dermatology" />
            </label>
            <label>
              Time Zone:
              <select>
                <option selected>Eastern Time (EST/EDT)</option>
                <option>Central Time</option>
                <option>Mountain Time</option>
                <option>Pacific Time</option>
              </select>
            </label>
            <label>
              <input type="checkbox" checked> Enable maintenance mode notifications
            </label>
            <label>
              <input type="checkbox" checked> Auto-backup patient data
            </label>
          </form>
        </div>
        <p>Last updated: ${timestamp}</p>
      </div>
    `, 'Platform Settings');
  }
  
  if (subpath === '/integrations' || subpath === '/integrations/') {
    return generateHTML(`
      <h1>🔌 Integrations</h1>
      <div class="content">
        <h2>Connected Services</h2>
        <div class="integration-list">
          <div class="integration-card connected">
            <h3>Google Workspace</h3>
            <p>Status: Connected</p>
            <p>Last sync: 5 minutes ago</p>
            <button>Sync Now</button>
          </div>
          <div class="integration-card connected">
            <h3>Stripe Payments</h3>
            <p>Status: Connected</p>
            <p>Mode: Production</p>
            <button>View Dashboard</button>
          </div>
          <div class="integration-card connected">
            <h3>Twilio SMS</h3>
            <p>Status: Connected</p>
            <p>Credits: $${(Math.random() * 100 + 50).toFixed(2)}</p>
            <button>Send Test</button>
          </div>
          <div class="integration-card disconnected">
            <h3>QuickBooks</h3>
            <p>Status: Not Connected</p>
            <button>Connect</button>
          </div>
        </div>
        <p>Updated: ${timestamp}</p>
      </div>
    `, 'Integrations');
  }
  
  return generateHTML(`
    <h1>⚙️ Configuration Center</h1>
    <div class="nav">
      <a href="/config/settings" class="nav-link">⚙️ Settings</a>
      <a href="/config/integrations" class="nav-link">🔌 Integrations</a>
    </div>
    <div class="content">
      <p>Manage platform configuration and integrations</p>
      <p>System time: ${timestamp}</p>
      <div class="quick-actions">
        <h3>Quick Actions</h3>
        <button class="action-btn">Export Configuration</button>
        <button class="action-btn">View Audit Log</button>
        <button class="action-btn">Clear Cache</button>
      </div>
    </div>
  `, 'Configuration Center');
}

async function handleStatus(path, request, env) {
  const timestamp = new Date().toISOString();
  const uptime = Math.floor(Math.random() * 30) + 60;
  
  return generateHTML(`
    <h1>📊 System Status</h1>
    <div class="content">
      <h2>Service Health</h2>
      <div class="status-grid">
        <div class="status-card operational">
          <h3>Database</h3>
          <p>✅ Operational</p>
          <p>Response time: ${Math.floor(Math.random() * 50) + 10}ms</p>
        </div>
        <div class="status-card operational">
          <h3>Authentication</h3>
          <p>✅ Operational</p>
          <p>Active sessions: ${Math.floor(Math.random() * 100) + 50}</p>
        </div>
        <div class="status-card operational">
          <h3>File Storage</h3>
          <p>✅ Operational</p>
          <p>Usage: ${Math.floor(Math.random() * 30) + 40}%</p>
        </div>
        <div class="status-card operational">
          <h3>Email Service</h3>
          <p>✅ Operational</p>
          <p>Queue: ${Math.floor(Math.random() * 10)} messages</p>
        </div>
        <div class="status-card operational">
          <h3>API Gateway</h3>
          <p>✅ Operational</p>
          <p>Requests/min: ${Math.floor(Math.random() * 500) + 200}</p>
        </div>
        <div class="status-card warning">
          <h3>Backup Service</h3>
          <p>⚠️ Scheduled Maintenance</p>
          <p>Next backup: 2:00 AM EST</p>
        </div>
      </div>
      
      <h2>System Metrics</h2>
      <div class="metrics">
        <p>Uptime: ${uptime} days</p>
        <p>Last incident: None in the past 30 days</p>
        <p>System load: ${(Math.random() * 2 + 1).toFixed(2)}</p>
      </div>
      
      <p>Last checked: ${timestamp}</p>
    </div>
  `, 'System Status');
}

async function handleAdmin(path, request, env) {
  const timestamp = new Date().toISOString();
  const subpath = path.replace('/admin', '') || '/';
  
  if (subpath === '/users' || subpath === '/users/') {
    const userCount = Math.floor(Math.random() * 50) + 150;
    return generateHTML(`
      <h1>👥 User Management</h1>
      <div class="content">
        <h2>Active Users (${userCount})</h2>
        <div class="user-list">
          <div class="user-item">
            <h4>Dr. Anand Ganger</h4>
            <p>Role: Administrator</p>
            <p>Last login: 10 minutes ago</p>
            <button>Edit</button>
          </div>
          <div class="user-item">
            <h4>Sarah Johnson</h4>
            <p>Role: Nurse</p>
            <p>Last login: 2 hours ago</p>
            <button>Edit</button>
          </div>
          <div class="user-item">
            <h4>Mike Chen</h4>
            <p>Role: Medical Assistant</p>
            <p>Last login: Yesterday</p>
            <button>Edit</button>
          </div>
        </div>
        <p>Updated: ${timestamp}</p>
      </div>
    `, 'User Management');
  }
  
  if (subpath === '/security' || subpath === '/security/') {
    return generateHTML(`
      <h1>🔒 Security Settings</h1>
      <div class="content">
        <h2>Security Configuration</h2>
        <div class="security-settings">
          <label>
            <input type="checkbox" checked> Require 2FA for admin accounts
          </label>
          <label>
            <input type="checkbox" checked> Auto-logout after 30 minutes
          </label>
          <label>
            <input type="checkbox"> Require password change every 90 days
          </label>
          <label>
            Minimum password length:
            <input type="number" value="8" min="6" max="20">
          </label>
        </div>
        <h3>Recent Security Events</h3>
        <div class="event-log">
          <p>✅ Successful login - Dr. Ganger - ${new Date(Date.now() - 600000).toLocaleString()}</p>
          <p>⚠️ Failed login attempt - Unknown user - ${new Date(Date.now() - 3600000).toLocaleString()}</p>
        </div>
        <p>Last reviewed: ${timestamp}</p>
      </div>
    `, 'Security Settings');
  }
  
  return generateHTML(`
    <h1>🔐 Admin Panel</h1>
    <div class="nav">
      <a href="/admin/users" class="nav-link">👥 Users</a>
      <a href="/admin/security" class="nav-link">🔒 Security</a>
    </div>
    <div class="content">
      <p>Platform administration and user management</p>
      <p>System time: ${timestamp}</p>
      <div class="admin-stats">
        <h3>Quick Stats</h3>
        <p>Total users: ${Math.floor(Math.random() * 50) + 150}</p>
        <p>Active sessions: ${Math.floor(Math.random() * 30) + 20}</p>
        <p>Failed logins today: ${Math.floor(Math.random() * 5)}</p>
      </div>
    </div>
  `, 'Admin Panel');
}

async function handleAIReceptionist(path, request, env) {
  const timestamp = new Date().toISOString();
  const callsHandled = Math.floor(Math.random() * 50) + 100;
  
  return generateHTML(`
    <h1>🤖 AI Receptionist</h1>
    <div class="content">
      <h2>Virtual Assistant Status</h2>
      <div class="ai-status">
        <div class="status-indicator online">
          <span>🟢</span> AI Assistant Online
        </div>
        <p>Voice Model: Natural v2.3</p>
        <p>Language: English (US)</p>
      </div>
      
      <div class="stats">
        <div class="stat-card">
          <h3>Calls Today</h3>
          <p class="stat-value">${callsHandled}</p>
        </div>
        <div class="stat-card">
          <h3>Avg Handle Time</h3>
          <p class="stat-value">2.3 min</p>
        </div>
        <div class="stat-card">
          <h3>Success Rate</h3>
          <p class="stat-value">94%</p>
        </div>
        <div class="stat-card">
          <h3>Appointments Booked</h3>
          <p class="stat-value">${Math.floor(Math.random() * 20) + 30}</p>
        </div>
      </div>
      
      <h3>Recent Interactions</h3>
      <div class="interaction-log">
        <div class="log-item">
          <p><strong>10:30 AM</strong> - New patient inquiry - Appointment booked</p>
        </div>
        <div class="log-item">
          <p><strong>10:15 AM</strong> - Prescription refill request - Transferred to pharmacy</p>
        </div>
        <div class="log-item">
          <p><strong>9:45 AM</strong> - General inquiry - Provided office hours</p>
        </div>
      </div>
      
      <p>Last updated: ${timestamp}</p>
    </div>
  `, 'AI Receptionist');
}

async function handleCallCenter(path, request, env) {
  const timestamp = new Date().toISOString();
  const activeAgents = Math.floor(Math.random() * 5) + 3;
  
  return generateHTML(`
    <h1>📞 Call Center Operations</h1>
    <div class="content">
      <h2>Call Center Dashboard</h2>
      <div class="stats">
        <div class="stat-card">
          <h3>Active Agents</h3>
          <p class="stat-value">${activeAgents}</p>
        </div>
        <div class="stat-card">
          <h3>Calls in Queue</h3>
          <p class="stat-value">${Math.floor(Math.random() * 5)}</p>
        </div>
        <div class="stat-card">
          <h3>Avg Wait Time</h3>
          <p class="stat-value">45 sec</p>
        </div>
        <div class="stat-card">
          <h3>Today's Volume</h3>
          <p class="stat-value">${Math.floor(Math.random() * 100) + 200}</p>
        </div>
      </div>
      
      <h3>Agent Status</h3>
      <div class="agent-grid">
        <div class="agent-card available">
          <h4>Sarah M.</h4>
          <p>Status: Available</p>
          <p>Calls today: 42</p>
        </div>
        <div class="agent-card busy">
          <h4>John D.</h4>
          <p>Status: On Call</p>
          <p>Duration: 3:24</p>
        </div>
        <div class="agent-card break">
          <h4>Lisa K.</h4>
          <p>Status: Break</p>
          <p>Back in: 5 min</p>
        </div>
      </div>
      
      <p>Updated: ${timestamp}</p>
    </div>
  `, 'Call Center Operations');
}

async function handleReps(path, request, env) {
  const timestamp = new Date().toISOString();
  const subpath = path.replace('/reps', '') || '/';
  
  if (subpath === '/schedule' || subpath === '/schedule/') {
    return generateHTML(`
      <h1>📅 Rep Visit Schedule</h1>
      <div class="content">
        <h2>This Week's Schedule</h2>
        <div class="schedule-list">
          <div class="visit-item">
            <h4>Monday - Pfizer Rep</h4>
            <p>Time: 11:00 AM - 11:30 AM</p>
            <p>Product: New dermatology treatment</p>
            <p>Meeting with: Dr. Ganger</p>
          </div>
          <div class="visit-item">
            <h4>Wednesday - Johnson & Johnson</h4>
            <p>Time: 2:00 PM - 2:30 PM</p>
            <p>Product: Skin care line update</p>
            <p>Meeting with: Medical team</p>
          </div>
          <div class="visit-item">
            <h4>Friday - Galderma</h4>
            <p>Time: 10:00 AM - 10:30 AM</p>
            <p>Product: Injectable training</p>
            <p>Meeting with: Dr. Smith</p>
          </div>
        </div>
        <p>Last updated: ${timestamp}</p>
      </div>
    `, 'Rep Visit Schedule');
  }
  
  return generateHTML(`
    <h1>💼 Pharma Rep Portal</h1>
    <div class="nav">
      <a href="/reps/schedule" class="nav-link">📅 Schedule</a>
    </div>
    <div class="content">
      <p>Pharmaceutical representative visit management</p>
      <p>System time: ${timestamp}</p>
      <div class="rep-stats">
        <h3>Visit Statistics</h3>
        <p>This month: ${Math.floor(Math.random() * 10) + 15} visits</p>
        <p>Average duration: 25 minutes</p>
        <p>Most frequent: Pfizer (${Math.floor(Math.random() * 5) + 3} visits)</p>
      </div>
      <div class="rep-rules">
        <h3>Visit Guidelines</h3>
        <ul>
          <li>Maximum 30 minutes per visit</li>
          <li>Appointments required (no walk-ins)</li>
          <li>Sample documentation required</li>
          <li>Lunch presentations: Tuesdays only</li>
        </ul>
      </div>
    </div>
  `, 'Pharma Rep Portal');
}

async function handleShowcase(path, request, env) {
  const timestamp = new Date().toISOString();
  
  return generateHTML(`
    <h1>🌟 App Showcase</h1>
    <div class="content">
      <h2>Platform Features Demo</h2>
      <div class="showcase-grid">
        <div class="feature-card">
          <h3>🏥 Medical Integration</h3>
          <p>Seamless EMR connectivity with real-time updates</p>
          <button>View Demo</button>
        </div>
        <div class="feature-card">
          <h3>📱 Mobile First</h3>
          <p>Responsive design works on all devices</p>
          <button>View Demo</button>
        </div>
        <div class="feature-card">
          <h3>🔒 HIPAA Compliant</h3>
          <p>End-to-end encryption and audit trails</p>
          <button>View Demo</button>
        </div>
        <div class="feature-card">
          <h3>⚡ Real-time Updates</h3>
          <p>Live data synchronization across all apps</p>
          <button>View Demo</button>
        </div>
        <div class="feature-card">
          <h3>🤖 AI Powered</h3>
          <p>Smart automation and predictive analytics</p>
          <button>View Demo</button>
        </div>
        <div class="feature-card">
          <h3>📊 Advanced Analytics</h3>
          <p>Comprehensive reporting and insights</p>
          <button>View Demo</button>
        </div>
      </div>
      
      <h3>What's New</h3>
      <div class="changelog">
        <div class="update-item">
          <h4>v2.0.0 - Clean Architecture</h4>
          <p>Complete platform rebuild with 5 optimized workers</p>
        </div>
        <div class="update-item">
          <h4>v1.9.5 - AI Receptionist</h4>
          <p>Natural language phone automation</p>
        </div>
        <div class="update-item">
          <h4>v1.9.0 - Mobile App</h4>
          <p>iOS and Android apps now available</p>
        </div>
      </div>
      
      <p>Last updated: ${timestamp}</p>
    </div>
  `, 'App Showcase');
}

async function handleBatch(path, request, env) {
  const timestamp = new Date().toISOString();
  const transactionCount = Math.floor(Math.random() * 200) + 500;
  const totalAmount = (Math.random() * 10000 + 15000).toFixed(2);
  
  return generateHTML(`
    <h1>📦 Batch Closeout</h1>
    <div class="content">
      <h2>Daily Batch Processing</h2>
      <div class="batch-status">
        <h3>Today's Batch - ${new Date().toLocaleDateString()}</h3>
        <div class="stats">
          <div class="stat-card">
            <h3>Transactions</h3>
            <p class="stat-value">${transactionCount}</p>
          </div>
          <div class="stat-card">
            <h3>Total Amount</h3>
            <p class="stat-value">$${totalAmount}</p>
          </div>
          <div class="stat-card">
            <h3>Success Rate</h3>
            <p class="stat-value">99.8%</p>
          </div>
          <div class="stat-card">
            <h3>Processing Time</h3>
            <p class="stat-value">12.4 min</p>
          </div>
        </div>
      </div>
      
      <h3>Batch Details</h3>
      <div class="batch-details">
        <table class="batch-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Count</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Credit Card</td>
              <td>${Math.floor(transactionCount * 0.7)}</td>
              <td>$${(totalAmount * 0.7).toFixed(2)}</td>
              <td class="status-success">✅ Complete</td>
            </tr>
            <tr>
              <td>Debit Card</td>
              <td>${Math.floor(transactionCount * 0.2)}</td>
              <td>$${(totalAmount * 0.2).toFixed(2)}</td>
              <td class="status-success">✅ Complete</td>
            </tr>
            <tr>
              <td>ACH Transfer</td>
              <td>${Math.floor(transactionCount * 0.1)}</td>
              <td>$${(totalAmount * 0.1).toFixed(2)}</td>
              <td class="status-pending">⏳ Processing</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="batch-actions">
        <button class="action-btn primary">Run Closeout</button>
        <button class="action-btn">Export Report</button>
        <button class="action-btn">View History</button>
      </div>
      
      <p>Last run: ${timestamp}</p>
    </div>
  `, 'Batch Closeout');
}

function generateHTML(content, title) {
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Ganger Core</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f5f5f5;
          color: #333;
          line-height: 1.6;
        }
        h1 { 
          background: #5e35b1;
          color: white;
          padding: 1.5rem;
          font-size: 1.75rem;
        }
        h2 {
          color: #4527a0;
          margin-bottom: 1rem;
        }
        h3 {
          color: #311b92;
          margin: 1.5rem 0 0.5rem;
        }
        .nav {
          background: #fff;
          padding: 1rem;
          display: flex;
          gap: 1rem;
          border-bottom: 2px solid #e0e0e0;
        }
        .nav-link {
          padding: 0.5rem 1rem;
          background: #f0f0f0;
          text-decoration: none;
          color: #333;
          border-radius: 4px;
          transition: all 0.3s;
        }
        .nav-link:hover {
          background: #5e35b1;
          color: white;
        }
        .content {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .welcome {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
          text-align: center;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }
        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }
        .stat-card h3 {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }
        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #5e35b1;
        }
        .app-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1.5rem;
          margin: 1.5rem 0 2.5rem;
        }
        .app-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-decoration: none;
          color: #333;
          transition: all 0.3s;
          text-align: center;
          border-top: 4px solid #ddd;
        }
        .app-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .app-card.medical { border-top-color: #1e88e5; }
        .app-card.business { border-top-color: #2e7d32; }
        .app-card.admin { border-top-color: #5e35b1; }
        .app-card.special { border-top-color: #d32f2f; }
        .app-icon {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 0.5rem;
        }
        .app-card h3 {
          color: #333;
          margin: 0.5rem 0;
        }
        .app-card p {
          font-size: 0.875rem;
          color: #666;
        }
        .settings-section {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .settings-form label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .settings-form input[type="text"],
        .settings-form select {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .integration-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        .integration-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-left: 4px solid #ddd;
        }
        .integration-card.connected {
          border-left-color: #4caf50;
        }
        .integration-card.disconnected {
          border-left-color: #f44336;
        }
        .integration-card button {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #5e35b1;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .quick-actions {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          margin-top: 1rem;
        }
        .action-btn {
          padding: 0.75rem 1.5rem;
          margin: 0.5rem;
          background: white;
          border: 2px solid #5e35b1;
          color: #5e35b1;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s;
        }
        .action-btn:hover {
          background: #5e35b1;
          color: white;
        }
        .action-btn.primary {
          background: #5e35b1;
          color: white;
        }
        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }
        .status-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-left: 4px solid #ddd;
        }
        .status-card.operational {
          border-left-color: #4caf50;
        }
        .status-card.warning {
          border-left-color: #ff9800;
        }
        .status-card.error {
          border-left-color: #f44336;
        }
        .metrics {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          margin-top: 1.5rem;
        }
        .user-list, .event-log {
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }
        .user-item {
          padding: 1.5rem;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .user-item button {
          padding: 0.5rem 1rem;
          background: #5e35b1;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .security-settings {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .event-log {
          padding: 1rem;
          margin-top: 1rem;
        }
        .event-log p {
          padding: 0.5rem 0;
          border-bottom: 1px solid #eee;
        }
        .ai-status {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
          text-align: center;
        }
        .status-indicator {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }
        .status-indicator.online {
          color: #4caf50;
        }
        .interaction-log, .changelog {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
        }
        .log-item, .update-item {
          padding: 0.75rem;
          border-bottom: 1px solid #eee;
        }
        .agent-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        .agent-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-left: 4px solid #ddd;
        }
        .agent-card.available { border-left-color: #4caf50; }
        .agent-card.busy { border-left-color: #ff9800; }
        .agent-card.break { border-left-color: #2196f3; }
        .visit-item, .schedule-list {
          background: white;
          border-radius: 8px;
          padding: 1rem;
        }
        .visit-item {
          margin-bottom: 1rem;
          padding: 1rem;
          border-bottom: 1px solid #eee;
        }
        .rep-stats, .rep-rules {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          margin-top: 1rem;
        }
        .rep-rules ul {
          list-style-position: inside;
          color: #666;
        }
        .showcase-grid, .feature-card {
          display: grid;
          gap: 1.5rem;
        }
        .showcase-grid {
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        }
        .feature-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }
        .feature-card button {
          margin-top: 1rem;
          padding: 0.5rem 1.5rem;
          background: #5e35b1;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .batch-status, .batch-details {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 1.5rem;
        }
        .batch-table {
          width: 100%;
          border-collapse: collapse;
        }
        .batch-table th {
          background: #f5f5f5;
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
        }
        .batch-table td {
          padding: 0.75rem;
          border-bottom: 1px solid #eee;
        }
        .status-success { color: #4caf50; }
        .status-pending { color: #ff9800; }
        .batch-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}