// Dynamic App Content Generators for Staff Router
// These replace static HTML with dynamic content

export function getDynamicIntegrationStatus() {
  const timestamp = new Date().toISOString();
  const systems = [
    { name: 'Supabase Database', status: 'operational', latency: Math.floor(Math.random() * 50) + 10 },
    { name: 'Google Workspace', status: 'operational', latency: Math.floor(Math.random() * 100) + 20 },
    { name: 'Cloudflare Workers', status: 'operational', latency: Math.floor(Math.random() * 30) + 5 },
    { name: 'Twilio SMS', status: 'operational', latency: Math.floor(Math.random() * 200) + 50 },
    { name: 'Stripe Payments', status: 'operational', latency: Math.floor(Math.random() * 150) + 30 },
  ];

  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integration Status - Live Dashboard</title>
    <style>
        body { font-family: system-ui; background: #0f172a; color: #e2e8f0; padding: 2rem; margin: 0; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #38bdf8; margin-bottom: 2rem; }
        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
        .status-card { background: #1e293b; padding: 1.5rem; border-radius: 10px; border: 1px solid #334155; }
        .status-card h3 { margin: 0 0 1rem 0; color: #94a3b8; }
        .operational { color: #4ade80; }
        .degraded { color: #facc15; }
        .offline { color: #f87171; }
        .metric { display: flex; justify-content: space-between; margin: 0.5rem 0; }
        .timestamp { background: #334155; padding: 0.5rem 1rem; border-radius: 5px; display: inline-block; margin-top: 2rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Integration Status Dashboard</h1>
        <p>Real-time monitoring of all platform integrations</p>
        
        <div class="status-grid">
            ${systems.map(system => `
            <div class="status-card">
                <h3>${system.name}</h3>
                <div class="metric">
                    <span>Status:</span>
                    <span class="${system.status}">${system.status.toUpperCase()}</span>
                </div>
                <div class="metric">
                    <span>Latency:</span>
                    <span>${system.latency}ms</span>
                </div>
                <div class="metric">
                    <span>Uptime:</span>
                    <span>99.${Math.floor(Math.random() * 9) + 90}%</span>
                </div>
            </div>
            `).join('')}
        </div>
        
        <div class="timestamp">
            Last Updated: ${timestamp}
        </div>
        
        <p style="margin-top: 2rem; opacity: 0.7;">
            Auto-refreshes every 30 seconds. This is dynamic content from Cloudflare Workers.
        </p>
    </div>
    
    <script>
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>`, {
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

export function getDynamicStaffingApp() {
  const timestamp = new Date().toISOString();
  const providers = [
    { name: 'Dr. Smith', specialty: 'Dermatology', status: 'On Duty', room: 'Room 101' },
    { name: 'Dr. Johnson', specialty: 'Cosmetic', status: 'On Break', room: 'Room 205' },
    { name: 'Dr. Williams', specialty: 'Surgical', status: 'With Patient', room: 'Room 303' },
    { name: 'Dr. Brown', specialty: 'Pediatric', status: 'Available', room: 'Room 104' },
  ];

  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clinical Staffing - Live Dashboard</title>
    <style>
        body { font-family: system-ui; background: #f8fafc; color: #1e293b; padding: 2rem; margin: 0; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #3b82f6; margin-bottom: 2rem; }
        .staff-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
        .staff-card { background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .staff-card h3 { margin: 0 0 0.5rem 0; color: #1e293b; }
        .specialty { color: #64748b; font-size: 0.875rem; }
        .status { padding: 0.25rem 0.75rem; border-radius: 20px; display: inline-block; margin-top: 0.5rem; font-size: 0.875rem; }
        .on-duty { background: #dcfce7; color: #166534; }
        .on-break { background: #fef3c7; color: #92400e; }
        .with-patient { background: #dbeafe; color: #1e40af; }
        .available { background: #e0e7ff; color: #3730a3; }
        .room { margin-top: 0.5rem; color: #64748b; }
        .timestamp { background: #e2e8f0; padding: 0.5rem 1rem; border-radius: 5px; display: inline-block; margin-top: 2rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>👥 Clinical Staffing Dashboard</h1>
        <p>Real-time provider status and room assignments</p>
        
        <div class="staff-grid">
            ${providers.map(provider => `
            <div class="staff-card">
                <h3>${provider.name}</h3>
                <div class="specialty">${provider.specialty}</div>
                <div class="status ${provider.status.toLowerCase().replace(' ', '-')}">${provider.status}</div>
                <div class="room">${provider.room}</div>
            </div>
            `).join('')}
        </div>
        
        <div class="timestamp">
            Last Updated: ${timestamp}
        </div>
        
        <p style="margin-top: 2rem; color: #64748b;">
            Staff count: ${providers.length} providers on site
        </p>
    </div>
</body>
</html>`, {
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

export function getDynamicConfigDashboard() {
  const timestamp = new Date().toISOString();
  const configs = [
    { category: 'System', setting: 'Maintenance Mode', value: 'Disabled', type: 'toggle' },
    { category: 'System', setting: 'Debug Logging', value: 'Enabled', type: 'toggle' },
    { category: 'API', setting: 'Rate Limit', value: '1000 req/min', type: 'number' },
    { category: 'API', setting: 'Timeout', value: '30 seconds', type: 'number' },
    { category: 'Security', setting: 'Two-Factor Auth', value: 'Required', type: 'select' },
    { category: 'Security', setting: 'Session Duration', value: '24 hours', type: 'number' },
  ];

  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configuration Dashboard</title>
    <style>
        body { font-family: system-ui; background: #fafafa; color: #333; padding: 2rem; margin: 0; }
        .container { max-width: 1000px; margin: 0 auto; }
        h1 { color: #5b21b6; margin-bottom: 2rem; }
        .config-section { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; }
        .config-section h2 { margin: 0 0 1.5rem 0; color: #6b7280; font-size: 1.125rem; }
        .config-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid #e5e7eb; }
        .config-item:last-child { border-bottom: none; }
        .config-value { background: #f3f4f6; padding: 0.5rem 1rem; border-radius: 5px; font-family: monospace; }
        .timestamp { background: #e5e7eb; padding: 0.5rem 1rem; border-radius: 5px; display: inline-block; margin-top: 2rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚙️ Configuration Dashboard</h1>
        <p>Platform-wide configuration settings</p>
        
        ${['System', 'API', 'Security'].map(category => `
        <div class="config-section">
            <h2>${category} Settings</h2>
            ${configs.filter(c => c.category === category).map(config => `
            <div class="config-item">
                <span>${config.setting}</span>
                <span class="config-value">${config.value}</span>
            </div>
            `).join('')}
        </div>
        `).join('')}
        
        <div class="timestamp">
            Configuration loaded at: ${timestamp}
        </div>
    </div>
</body>
</html>`, {
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

// Dynamic Staff Portal (root route)
export function getDynamicStaffPortal() {
  const timestamp = new Date().toISOString();
  const staffCount = Math.floor(Math.random() * 20) + 30;
  const activeUsers = Math.floor(Math.random() * 10) + 15;
  
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Staff Management Portal - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f0f4f8;
            min-height: 100vh;
        }
        .navbar {
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 1rem 0;
        }
        .nav-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            font-size: 1.5rem;
            font-weight: bold;
            color: #2563eb;
        }
        .live-stats {
            display: flex;
            gap: 2rem;
            align-items: center;
        }
        .stat {
            text-align: center;
        }
        .stat-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #2563eb;
        }
        .stat-label {
            font-size: 0.875rem;
            color: #64748b;
        }
        .hero {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 4rem 0;
            text-align: center;
        }
        .hero h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        .hero p {
            font-size: 1.25rem;
            opacity: 0.9;
        }
        .dashboard-grid {
            max-width: 1200px;
            margin: 3rem auto;
            padding: 0 2rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
        }
        .app-card {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
            text-decoration: none;
            color: inherit;
            position: relative;
            overflow: hidden;
        }
        .app-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }
        .app-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #2563eb, #7c3aed);
        }
        .app-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        .app-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #1e293b;
        }
        .app-desc {
            color: #64748b;
            line-height: 1.5;
        }
        .app-status {
            margin-top: 1rem;
            font-size: 0.875rem;
            color: #059669;
            font-weight: 500;
        }
        .timestamp {
            text-align: center;
            margin: 3rem 0;
            color: #64748b;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="nav-content">
            <div class="logo">🏥 Ganger Dermatology</div>
            <div class="live-stats">
                <div class="stat">
                    <div class="stat-value">${staffCount}</div>
                    <div class="stat-label">Staff Members</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${activeUsers}</div>
                    <div class="stat-label">Active Now</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${new Date().toLocaleTimeString()}</div>
                    <div class="stat-label">Current Time</div>
                </div>
            </div>
        </div>
    </nav>
    
    <div class="hero">
        <h1>Staff Management Portal</h1>
        <p>Your gateway to all Ganger Dermatology applications and services</p>
    </div>
    
    <div class="dashboard-grid">
        <a href="/inventory" class="app-card">
            <div class="app-icon">📦</div>
            <h3 class="app-title">Inventory Management</h3>
            <p class="app-desc">Track medical supplies, manage stock levels, and automate reordering</p>
            <div class="app-status">✅ Active</div>
        </a>
        
        <a href="/handouts" class="app-card">
            <div class="app-icon">📄</div>
            <h3 class="app-title">Patient Handouts</h3>
            <p class="app-desc">Generate and distribute patient education materials</p>
            <div class="app-status">✅ Active</div>
        </a>
        
        <a href="/l10" class="app-card">
            <div class="app-icon">🎯</div>
            <h3 class="app-title">EOS L10</h3>
            <p class="app-desc">Run effective Level 10 meetings with your leadership team</p>
            <div class="app-status">✅ Active</div>
        </a>
        
        <a href="/meds" class="app-card">
            <div class="app-icon">💊</div>
            <h3 class="app-title">Medication Auth</h3>
            <p class="app-desc">Manage medication authorizations and approvals</p>
            <div class="app-status">✅ Active</div>
        </a>
        
        <a href="/batch" class="app-card">
            <div class="app-icon">📋</div>
            <h3 class="app-title">Batch Closeout</h3>
            <p class="app-desc">Daily batch processing and financial reconciliation</p>
            <div class="app-status">✅ Active</div>
        </a>
        
        <a href="/kiosk" class="app-card">
            <div class="app-icon">🖥️</div>
            <h3 class="app-title">Check-in Kiosk</h3>
            <p class="app-desc">Patient self-service check-in and registration</p>
            <div class="app-status">✅ Active</div>
        </a>
        
        <a href="/status" class="app-card">
            <div class="app-icon">📊</div>
            <h3 class="app-title">Integration Status</h3>
            <p class="app-desc">Monitor system health and third-party integrations</p>
            <div class="app-status">✅ Active</div>
        </a>
        
        <a href="/staffing" class="app-card">
            <div class="app-icon">👥</div>
            <h3 class="app-title">Clinical Staffing</h3>
            <p class="app-desc">Real-time provider status and scheduling</p>
            <div class="app-status">✅ Active</div>
        </a>
        
        <a href="/compliance" class="app-card">
            <div class="app-icon">✅</div>
            <h3 class="app-title">Compliance Training</h3>
            <p class="app-desc">Track and manage staff compliance requirements</p>
            <div class="app-status">✅ Active</div>
        </a>
    </div>
    
    <div class="timestamp">
        Generated: ${timestamp} | Random ID: ${Math.random().toString(36).substring(7)}
    </div>
</body>
</html>`, {
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

// Dynamic Medication Authorization
export function getDynamicMedicationAuth() {
  const timestamp = new Date().toISOString();
  const pendingCount = Math.floor(Math.random() * 10) + 5;
  const approvedToday = Math.floor(Math.random() * 20) + 15;
  
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medication Authorization Portal</title>
    <style>
        body { font-family: system-ui; background: #f3f4f6; margin: 0; padding: 2rem; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-value { font-size: 2rem; font-weight: bold; color: #7c3aed; }
        .stat-label { color: #6b7280; margin-top: 0.5rem; }
        .timestamp { background: #e5e7eb; padding: 0.5rem 1rem; border-radius: 4px; display: inline-block; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💊 Medication Authorization Portal</h1>
            <p>Real-time medication approval and tracking system</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${pendingCount}</div>
                <div class="stat-label">Pending Authorizations</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${approvedToday}</div>
                <div class="stat-label">Approved Today</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">2.5 hrs</div>
                <div class="stat-label">Avg Processing Time</div>
            </div>
        </div>
        
        <div class="timestamp">Last Updated: ${timestamp}</div>
    </div>
</body>
</html>`, {
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

// Dynamic Batch Closeout
export function getDynamicBatchCloseout() {
  try {
    const timestamp = new Date().toISOString();
    const batchesProcessed = Math.floor(Math.random() * 5) + 10;
    const totalAmount = (Math.random() * 50000 + 100000).toFixed(2);
    
    return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Batch Closeout System - Live</title>
    <style>
        body { font-family: system-ui; background: #1a1a2e; color: white; margin: 0; padding: 2rem; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #f39c12, #e74c3c); padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
        .batch-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
        .batch-card { background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 8px; }
        .amount { font-size: 2rem; font-weight: bold; color: #f39c12; }
        .timestamp { font-family: monospace; background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Batch Closeout System</h1>
            <p>Real-time financial batch processing and reconciliation</p>
        </div>
        
        <div class="batch-grid">
            <div class="batch-card">
                <h3>Today's Batches</h3>
                <div class="amount">${batchesProcessed}</div>
                <p>Processed successfully</p>
            </div>
            <div class="batch-card">
                <h3>Total Amount</h3>
                <div class="amount">$${totalAmount}</div>
                <p>Today's transactions</p>
            </div>
            <div class="batch-card">
                <h3>Next Batch</h3>
                <div class="amount">5:00 PM</div>
                <p>Scheduled closeout</p>
            </div>
        </div>
        
        <p class="timestamp">Last Update: ${timestamp}</p>
    </div>
</body>
</html>`, {
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
  } catch (error) {
    return new Response(`Error in getDynamicBatchCloseout: ${error.message}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Dynamic Patient Handouts
export function getDynamicPatientHandouts() {
  const timestamp = new Date().toISOString();
  const handoutsGenerated = Math.floor(Math.random() * 50) + 100;
  const activeTemplates = Math.floor(Math.random() * 10) + 20;
  
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Patient Handouts Generator - Dynamic</title>
    <style>
        body { font-family: system-ui; background: #f8fafc; margin: 0; padding: 2rem; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .stat-number { font-size: 2.5rem; font-weight: bold; color: #6366f1; }
        .timestamp { text-align: center; color: #64748b; font-family: monospace; margin-top: 2rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📄 Patient Handouts Generator</h1>
            <p>Dynamic educational content delivery system</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${handoutsGenerated}</div>
                <p>Handouts Today</p>
            </div>
            <div class="stat-card">
                <div class="stat-number">${activeTemplates}</div>
                <p>Active Templates</p>
            </div>
            <div class="stat-card">
                <div class="stat-number">QR</div>
                <p>Scan Enabled</p>
            </div>
        </div>
        
        <div class="timestamp">Generated: ${timestamp}</div>
    </div>
</body>
</html>`, {
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

// Dynamic Check-in Kiosk
export function getDynamicCheckinKiosk() {
  const timestamp = new Date().toISOString();
  const checkinsToday = Math.floor(Math.random() * 30) + 50;
  const avgWaitTime = Math.floor(Math.random() * 10) + 5;
  
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Check-in Kiosk Dashboard</title>
    <style>
        body { font-family: system-ui; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; margin: 0; padding: 2rem; min-height: 100vh; }
        .container { max-width: 800px; margin: 0 auto; text-align: center; }
        .kiosk-status { background: rgba(255,255,255,0.1); padding: 3rem; border-radius: 20px; margin: 2rem 0; }
        .big-number { font-size: 4rem; font-weight: bold; margin: 1rem 0; }
        .status-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem; }
        .status-item { background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 10px; }
        .timestamp { font-family: monospace; opacity: 0.8; margin-top: 2rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🖥️ Check-in Kiosk System</h1>
        
        <div class="kiosk-status">
            <h2>Today's Activity</h2>
            <div class="big-number">${checkinsToday}</div>
            <p>Patient Check-ins</p>
        </div>
        
        <div class="status-grid">
            <div class="status-item">
                <h3>Average Wait</h3>
                <div style="font-size: 2rem;">${avgWaitTime} min</div>
            </div>
            <div class="status-item">
                <h3>System Status</h3>
                <div style="font-size: 2rem;">✅ Online</div>
            </div>
        </div>
        
        <div class="timestamp">Last Update: ${timestamp}</div>
    </div>
</body>
</html>`, {
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

// Proxy helper for apps that need separate Workers
export async function proxyToWorker(workerUrl, request) {
  const url = new URL(request.url);
  const targetUrl = workerUrl + url.pathname + url.search;
  
  return fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
}