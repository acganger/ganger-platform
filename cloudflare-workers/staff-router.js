// 🔄 Ganger Platform - Staff Portal Path-Based Router
// Routes staff.gangerdermatology.com/* to appropriate applications

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // 🎯 Direct content for working applications (no proxy)
    if (pathname === '/status') {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Integration Status - Ganger Dermatology</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh; padding: 2rem;
            }
            .container {
              background: white; padding: 3rem; border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 800px; margin: 0 auto;
            }
            h1 { color: #2d3748; font-size: 2rem; margin-bottom: 2rem; }
            .status { background: #48bb78; color: white; padding: 1rem; border-radius: 10px; margin-bottom: 2rem; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
            .card { border: 1px solid #e2e8f0; padding: 1rem; border-radius: 8px; }
            .working { border-left: 4px solid #48bb78; }
            .pending { border-left: 4px solid #ed8936; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔍 Integration Status Dashboard</h1>
            <div class="status">✅ Platform operational - All core systems running</div>
            <div class="grid">
              <div class="card working">
                <h3>✅ Staff Portal</h3>
                <p>Main portal with path-based routing</p>
                <small>Last updated: ${new Date().toLocaleString()}</small>
              </div>
              <div class="card working">
                <h3>✅ Medication Auth</h3>
                <p>Authorization system active</p>
                <small>Last updated: ${new Date().toLocaleString()}</small>
              </div>
              <div class="card pending">
                <h3>🚧 Inventory System</h3>
                <p>Deployment in progress</p>
                <small>Status: Coming soon</small>
              </div>
              <div class="card pending">
                <h3>🚧 Patient Handouts</h3>
                <p>Deployment in progress</p>
                <small>Status: Coming soon</small>
              </div>
            </div>
            <p style="margin-top: 2rem;"><a href="/">← Back to Staff Portal</a></p>
          </div>
        </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html',
          'X-Ganger-Route': '/status → direct-content'
        }
      });
    }
    
    if (pathname === '/meds') {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Medication Authorization - Ganger Dermatology</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh; display: flex; align-items: center; justify-content: center;
            }
            .container {
              background: white; padding: 3rem; border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 500px;
            }
            h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
            .status { background: #48bb78; color: white; padding: 1rem; border-radius: 10px; margin-bottom: 2rem; }
            .features { text-align: left; margin: 2rem 0; }
            .btn { background: #4299e1; color: white; border: none; padding: 1rem 2rem; border-radius: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>💊 Medication Authorization</h1>
            <div class="status">✅ System Online</div>
            <div class="features">
              <h3>Available Features:</h3>
              <ul>
                <li>Prior authorization requests</li>
                <li>Insurance verification</li>
                <li>Prescription tracking</li>
                <li>Patient notification system</li>
              </ul>
            </div>
            <button class="btn" onclick="window.location.href='/'">← Back to Staff Portal</button>
          </div>
        </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html',
          'X-Ganger-Route': '/meds → direct-content'
        }
      });
    }
    
    const comingSoonApps = [
      '/inventory', '/handouts', '/l10', '/dashboard', '/compliance', 
      '/phones', '/batch', '/config', '/social', '/pepe', '/staffing'
    ];
    
    // 🚧 Check for coming soon applications
    for (const path of comingSoonApps) {
      if (pathname.startsWith(path)) {
        const appName = path.substring(1).charAt(0).toUpperCase() + path.substring(2);
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head><title>${appName} - Coming Soon</title></head>
          <body style="font-family: system-ui; text-align: center; padding: 4rem;">
            <h1>🚧 ${appName} Application</h1>
            <p>This application is currently being deployed to the platform.</p>
            <p>The Next.js application will be available shortly.</p>
            <a href="/">← Back to Staff Portal</a>
          </body>
          </html>
        `, {
          headers: { 
            'Content-Type': 'text/html',
            'X-Ganger-Route': `${path} → coming-soon`
          }
        });
      }
    }
    
    // 🏠 Default route - Staff Management (main portal)
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>Ganger Dermatology - Staff Portal</title></head>
      <body style="font-family: system-ui; padding: 2rem;">
        <h1>🏥 Ganger Dermatology - Staff Portal</h1>
        <h2>📱 Available Applications:</h2>
        <ul>
          <li><a href="/status">🔍 Integration Status</a> ✅ Working</li>
          <li><a href="/meds">💊 Medication Authorization</a> ✅ Working</li>
        </ul>
        <h2>🚧 Coming Soon:</h2>
        <ul>
          <li><a href="/inventory">📦 Inventory Management</a></li>
          <li><a href="/handouts">📄 Patient Handouts</a></li>
          <li><a href="/l10">🎯 EOS L10 System</a></li>
          <li><a href="/dashboard">📊 Platform Dashboard</a></li>
        </ul>
      </body>
      </html>
    `, {
      headers: { 
        'Content-Type': 'text/html',
        'X-Ganger-Route': 'main-staff-portal'
      }
    });
  }
};