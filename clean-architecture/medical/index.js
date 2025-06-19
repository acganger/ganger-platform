/**
 * Medical Apps Worker - Handles all medical-related applications
 * Apps: Inventory, Handouts, Medications, Kiosk Admin
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    try {
      // Route to appropriate handler
      if (path.startsWith('/inventory')) return await handleInventory(path, request, env);
      if (path.startsWith('/handouts')) return await handleHandouts(path, request, env);
      if (path.startsWith('/meds')) return await handleMeds(path, request, env);
      if (path.startsWith('/kiosk')) return await handleKiosk(path, request, env);
      
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Medical Worker Error:', error);
      return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
    }
  }
};

async function handleInventory(path, request, env) {
  const timestamp = new Date().toISOString();
  const subpath = path.replace('/inventory', '') || '/';
  
  // Handle subroutes
  if (subpath === '/barcode-scan' || subpath === '/barcode-scan/') {
    return generateHTML(`
      <h1>🏥 Barcode Scanner</h1>
      <div class="content">
        <p>Scan medical supplies and equipment</p>
        <p>Last scan: ${timestamp}</p>
        <button class="scan-btn">📷 Start Scanning</button>
      </div>
    `, 'Barcode Scanner');
  }
  
  if (subpath === '/stock-levels' || subpath === '/stock-levels/') {
    const randomStock = Math.floor(Math.random() * 500) + 100;
    return generateHTML(`
      <h1>📊 Stock Levels</h1>
      <div class="content">
        <p>Current inventory status</p>
        <p>Total items in stock: ${randomStock}</p>
        <p>Updated: ${timestamp}</p>
        <div class="stock-chart">
          <div class="stock-item">Syringes: ${Math.floor(Math.random() * 1000)}</div>
          <div class="stock-item">Bandages: ${Math.floor(Math.random() * 2000)}</div>
          <div class="stock-item">Gloves: ${Math.floor(Math.random() * 5000)}</div>
        </div>
      </div>
    `, 'Stock Levels');
  }
  
  if (subpath === '/reports' || subpath === '/reports/') {
    return generateHTML(`
      <h1>📈 Inventory Reports</h1>
      <div class="content">
        <p>Generate and view inventory reports</p>
        <p>Generated: ${timestamp}</p>
        <ul>
          <li><a href="/inventory/reports/usage">Usage Report</a></li>
          <li><a href="/inventory/reports/expiring">Expiring Items</a></li>
          <li><a href="/inventory/reports/reorder">Reorder Report</a></li>
        </ul>
      </div>
    `, 'Reports');
  }
  
  // Main inventory page
  return generateHTML(`
    <h1>🏥 Inventory Management</h1>
    <div class="nav">
      <a href="/inventory/barcode-scan" class="nav-link">📷 Barcode Scan</a>
      <a href="/inventory/stock-levels" class="nav-link">📊 Stock Levels</a>
      <a href="/inventory/reports" class="nav-link">📈 Reports</a>
    </div>
    <div class="content">
      <p>Medical supply tracking and management</p>
      <p>System time: ${timestamp}</p>
      <div class="stats">
        <div class="stat-card">
          <h3>Low Stock Alerts</h3>
          <p class="stat-value">${Math.floor(Math.random() * 10) + 5}</p>
        </div>
        <div class="stat-card">
          <h3>Pending Orders</h3>
          <p class="stat-value">${Math.floor(Math.random() * 20) + 10}</p>
        </div>
      </div>
    </div>
  `, 'Inventory Management');
}

async function handleHandouts(path, request, env) {
  const timestamp = new Date().toISOString();
  const subpath = path.replace('/handouts', '') || '/';
  
  if (subpath === '/generate' || subpath === '/generate/') {
    return generateHTML(`
      <h1>📄 Generate Handout</h1>
      <div class="content">
        <form class="handout-form">
          <label>Condition/Topic:</label>
          <select>
            <option>Acne Treatment</option>
            <option>Eczema Care</option>
            <option>Sun Protection</option>
            <option>Skin Cancer Prevention</option>
          </select>
          <label>Language:</label>
          <select>
            <option>English</option>
            <option>Spanish</option>
            <option>Arabic</option>
          </select>
          <button type="submit">Generate PDF</button>
        </form>
        <p>Generated at: ${timestamp}</p>
      </div>
    `, 'Generate Handout');
  }
  
  if (subpath === '/qr-scan' || subpath === '/qr-scan/') {
    return generateHTML(`
      <h1>📱 QR Code Scanner</h1>
      <div class="content">
        <p>Scan patient QR codes for handout delivery</p>
        <div class="qr-scanner">
          <div class="scanner-frame">📷</div>
          <p>Point camera at QR code</p>
        </div>
        <p>Last scan: ${timestamp}</p>
      </div>
    `, 'QR Scanner');
  }
  
  if (subpath === '/library' || subpath === '/library/') {
    const handoutCount = Math.floor(Math.random() * 50) + 150;
    return generateHTML(`
      <h1>📚 Handout Library</h1>
      <div class="content">
        <p>Browse and manage patient education materials</p>
        <p>Total handouts: ${handoutCount}</p>
        <p>Updated: ${timestamp}</p>
        <div class="library-grid">
          <div class="handout-card">Acne Care Guide</div>
          <div class="handout-card">Post-Procedure Instructions</div>
          <div class="handout-card">Skin Cancer Facts</div>
          <div class="handout-card">Moisturizer Guide</div>
        </div>
      </div>
    `, 'Handout Library');
  }
  
  return generateHTML(`
    <h1>📄 Patient Handouts</h1>
    <div class="nav">
      <a href="/handouts/generate" class="nav-link">📝 Generate</a>
      <a href="/handouts/qr-scan" class="nav-link">📱 QR Scan</a>
      <a href="/handouts/library" class="nav-link">📚 Library</a>
    </div>
    <div class="content">
      <p>Create and distribute patient education materials</p>
      <p>System time: ${timestamp}</p>
      <div class="stats">
        <div class="stat-card">
          <h3>Handouts Today</h3>
          <p class="stat-value">${Math.floor(Math.random() * 30) + 20}</p>
        </div>
        <div class="stat-card">
          <h3>QR Scans</h3>
          <p class="stat-value">${Math.floor(Math.random() * 50) + 30}</p>
        </div>
      </div>
    </div>
  `, 'Patient Handouts');
}

async function handleMeds(path, request, env) {
  const timestamp = new Date().toISOString();
  const subpath = path.replace('/meds', '') || '/';
  
  if (subpath === '/authorize' || subpath === '/authorize/') {
    return generateHTML(`
      <h1>💊 Medication Authorization</h1>
      <div class="content">
        <h2>Pending Authorizations</h2>
        <div class="auth-list">
          <div class="auth-item">
            <span>Patient: John Doe</span>
            <span>Medication: Tretinoin 0.025%</span>
            <button>Approve</button>
          </div>
          <div class="auth-item">
            <span>Patient: Jane Smith</span>
            <span>Medication: Doxycycline 100mg</span>
            <button>Approve</button>
          </div>
        </div>
        <p>Updated: ${timestamp}</p>
      </div>
    `, 'Medication Authorization');
  }
  
  if (subpath === '/history' || subpath === '/history/') {
    const authCount = Math.floor(Math.random() * 100) + 200;
    return generateHTML(`
      <h1>📋 Authorization History</h1>
      <div class="content">
        <p>Total authorizations this month: ${authCount}</p>
        <p>Last updated: ${timestamp}</p>
        <table class="history-table">
          <tr>
            <th>Date</th>
            <th>Patient</th>
            <th>Medication</th>
            <th>Status</th>
          </tr>
          <tr>
            <td>${new Date(Date.now() - 3600000).toLocaleString()}</td>
            <td>Patient A</td>
            <td>Hydroquinone 4%</td>
            <td>Approved</td>
          </tr>
        </table>
      </div>
    `, 'Authorization History');
  }
  
  return generateHTML(`
    <h1>💊 Medication Management</h1>
    <div class="nav">
      <a href="/meds/authorize" class="nav-link">✅ Authorize</a>
      <a href="/meds/history" class="nav-link">📋 History</a>
    </div>
    <div class="content">
      <p>Medication authorization and tracking</p>
      <p>System time: ${timestamp}</p>
      <div class="stats">
        <div class="stat-card">
          <h3>Pending Auth</h3>
          <p class="stat-value">${Math.floor(Math.random() * 10) + 5}</p>
        </div>
        <div class="stat-card">
          <h3>Today's Approvals</h3>
          <p class="stat-value">${Math.floor(Math.random() * 20) + 15}</p>
        </div>
      </div>
    </div>
  `, 'Medication Management');
}

async function handleKiosk(path, request, env) {
  const timestamp = new Date().toISOString();
  const subpath = path.replace('/kiosk', '') || '/';
  
  if (subpath === '/settings' || subpath === '/settings/') {
    return generateHTML(`
      <h1>⚙️ Kiosk Settings</h1>
      <div class="content">
        <h2>Configuration</h2>
        <div class="settings-form">
          <label>
            <input type="checkbox" checked> Enable payment processing
          </label>
          <label>
            <input type="checkbox" checked> Show insurance verification
          </label>
          <label>
            <input type="checkbox"> Require photo ID scan
          </label>
          <label>
            Timeout (seconds): <input type="number" value="300">
          </label>
        </div>
        <p>Last updated: ${timestamp}</p>
      </div>
    `, 'Kiosk Settings');
  }
  
  if (subpath === '/analytics' || subpath === '/analytics/') {
    const checkIns = Math.floor(Math.random() * 50) + 100;
    const avgTime = (Math.random() * 2 + 1).toFixed(1);
    return generateHTML(`
      <h1>📊 Kiosk Analytics</h1>
      <div class="content">
        <h2>Today's Statistics</h2>
        <div class="stats">
          <div class="stat-card">
            <h3>Total Check-ins</h3>
            <p class="stat-value">${checkIns}</p>
          </div>
          <div class="stat-card">
            <h3>Avg Check-in Time</h3>
            <p class="stat-value">${avgTime} min</p>
          </div>
          <div class="stat-card">
            <h3>Payment Success Rate</h3>
            <p class="stat-value">98.5%</p>
          </div>
        </div>
        <p>Generated: ${timestamp}</p>
      </div>
    `, 'Kiosk Analytics');
  }
  
  return generateHTML(`
    <h1>🖥️ Check-in Kiosk Admin</h1>
    <div class="nav">
      <a href="/kiosk/settings" class="nav-link">⚙️ Settings</a>
      <a href="/kiosk/analytics" class="nav-link">📊 Analytics</a>
    </div>
    <div class="content">
      <p>Manage patient self-service kiosks</p>
      <p>System time: ${timestamp}</p>
      <div class="kiosk-status">
        <h2>Kiosk Status</h2>
        <div class="status-grid">
          <div class="kiosk-card online">
            <h3>Kiosk 1 - Lobby</h3>
            <p>Status: Online</p>
            <p>Last activity: 2 min ago</p>
          </div>
          <div class="kiosk-card online">
            <h3>Kiosk 2 - Reception</h3>
            <p>Status: Online</p>
            <p>Last activity: 5 min ago</p>
          </div>
        </div>
      </div>
    </div>
  `, 'Kiosk Admin');
}

function generateHTML(content, title) {
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Ganger Medical</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f5f5f5;
          color: #333;
          line-height: 1.6;
        }
        h1 { 
          background: #1e88e5;
          color: white;
          padding: 1.5rem;
          font-size: 1.75rem;
        }
        h2 {
          color: #1565c0;
          margin-bottom: 1rem;
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
          background: #1e88e5;
          color: white;
        }
        .content {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
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
          color: #1e88e5;
        }
        .handout-form, .settings-form {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-width: 500px;
        }
        .handout-form label, .settings-form label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-weight: 500;
        }
        .handout-form select, .handout-form button,
        .settings-form input {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .handout-form button {
          background: #1e88e5;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.75rem;
        }
        .qr-scanner {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          text-align: center;
          max-width: 400px;
          margin: 0 auto;
        }
        .scanner-frame {
          font-size: 5rem;
          margin: 1rem 0;
        }
        .library-grid, .stock-chart {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        .handout-card, .stock-item {
          background: white;
          padding: 1rem;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .auth-list {
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }
        .auth-item {
          padding: 1rem;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .auth-item button {
          background: #4caf50;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }
        .history-table {
          width: 100%;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .history-table th, .history-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .history-table th {
          background: #f5f5f5;
          font-weight: 600;
        }
        .kiosk-status {
          margin-top: 2rem;
        }
        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-top: 1rem;
        }
        .kiosk-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-left: 4px solid #ddd;
        }
        .kiosk-card.online {
          border-left-color: #4caf50;
        }
        .kiosk-card h3 {
          color: #333;
          margin-bottom: 0.5rem;
        }
        .kiosk-card p {
          color: #666;
          font-size: 0.9rem;
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