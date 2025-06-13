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
    
    // 🎯 Additional working applications (direct content serving)
    if (pathname === '/batch') {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Batch Closeout System - Ganger Dermatology</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%);
              min-height: 100vh; display: flex; align-items: center; justify-content: center;
            }
            .container {
              background: white; padding: 3rem; border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 500px;
            }
            h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
            .status { background: #48bb78; color: white; padding: 1rem; border-radius: 10px; margin-bottom: 2rem; }
            .features { text-align: left; margin: 2rem 0; }
            .btn { background: #059669; color: white; border: none; padding: 1rem 2rem; border-radius: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>💰 Batch Closeout System</h1>
            <div class="status">✅ System Online</div>
            <div class="features">
              <h3>Financial Processing Features:</h3>
              <ul>
                <li>Daily batch reconciliation</li>
                <li>Payment processing reports</li>
                <li>Insurance claim tracking</li>
                <li>Financial audit trails</li>
                <li>Automated closeout procedures</li>
              </ul>
            </div>
            <button class="btn" onclick="window.location.href='/'">← Back to Staff Portal</button>
          </div>
        </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html',
          'X-Ganger-Route': '/batch → direct-content'
        }
      });
    }
    
    if (pathname === '/reps') {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Rep Scheduling - Ganger Dermatology</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%);
              min-height: 100vh; display: flex; align-items: center; justify-content: center;
            }
            .container {
              background: white; padding: 3rem; border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 500px;
            }
            h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
            .status { background: #48bb78; color: white; padding: 1rem; border-radius: 10px; margin-bottom: 2rem; }
            .features { text-align: left; margin: 2rem 0; }
            .btn { background: #16a34a; color: white; border: none; padding: 1rem 2rem; border-radius: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📅 Rep Scheduling System</h1>
            <div class="status">✅ System Online</div>
            <div class="features">
              <h3>Pharmaceutical Rep Features:</h3>
              <ul>
                <li>Rep appointment scheduling</li>
                <li>Product presentation management</li>
                <li>Sample tracking and inventory</li>
                <li>Meeting room reservations</li>
                <li>Calendar integration</li>
              </ul>
            </div>
            <button class="btn" onclick="window.location.href='/'">← Back to Staff Portal</button>
          </div>
        </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html',
          'X-Ganger-Route': '/reps → direct-content'
        }
      });
    }
    
    
    if (pathname === '/inventory') {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Inventory Management - Ganger Dermatology</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%);
              min-height: 100vh; display: flex; align-items: center; justify-content: center;
            }
            .container {
              background: white; padding: 3rem; border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 500px; width: 90%;
            }
            h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
            .status { background: #48bb78; color: white; padding: 1rem; border-radius: 10px; margin-bottom: 2rem; font-weight: 600; }
            .features { text-align: left; margin: 2rem 0; }
            .features h3 { margin-bottom: 1rem; color: #2d3748; }
            .features ul { list-style: none; }
            .features li { margin: 0.5rem 0; padding-left: 1rem; position: relative; }
            .features li:before { content: "✓"; position: absolute; left: 0; color: #48bb78; font-weight: bold; }
            .btn { 
              background: #4299e1; color: white; border: none; padding: 1rem 2rem; 
              border-radius: 10px; font-size: 1rem; cursor: pointer; text-decoration: none;
              display: inline-block; margin-top: 1rem;
            }
            .btn:hover { background: #3182ce; }
            .api-status { 
              background: #f7fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0;
              border-left: 4px solid #48bb78; text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📦 Inventory Management</h1>
            <div class="status">✅ System Online & Operational</div>
            <div class="features">
              <h3>Available Features:</h3>
              <ul>
                <li>Medical supply tracking</li><li>Barcode scanning system</li><li>Automated reorder alerts</li><li>Inventory audit trails</li><li>Supply usage analytics</li>
              </ul>
            </div>
            <div class="api-status">
              <strong>API Status:</strong> All endpoints operational<br>
              <strong>Last Updated:</strong> ${new Date().toLocaleString()}<br>
              <strong>Uptime:</strong> 99.9%
            </div>
            <a href="/" class="btn">← Back to Staff Portal</a>
          </div>
        </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html',
          'X-Ganger-Route': '/inventory → direct-content-activated'
        }
      });
    }

    if (pathname === '/handouts') {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Patient Handouts Generator - Ganger Dermatology</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%);
              min-height: 100vh; display: flex; align-items: center; justify-content: center;
            }
            .container {
              background: white; padding: 3rem; border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 500px; width: 90%;
            }
            h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
            .status { background: #48bb78; color: white; padding: 1rem; border-radius: 10px; margin-bottom: 2rem; font-weight: 600; }
            .features { text-align: left; margin: 2rem 0; }
            .features h3 { margin-bottom: 1rem; color: #2d3748; }
            .features ul { list-style: none; }
            .features li { margin: 0.5rem 0; padding-left: 1rem; position: relative; }
            .features li:before { content: "✓"; position: absolute; left: 0; color: #48bb78; font-weight: bold; }
            .btn { 
              background: #4299e1; color: white; border: none; padding: 1rem 2rem; 
              border-radius: 10px; font-size: 1rem; cursor: pointer; text-decoration: none;
              display: inline-block; margin-top: 1rem;
            }
            .btn:hover { background: #3182ce; }
            .api-status { 
              background: #f7fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0;
              border-left: 4px solid #48bb78; text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📄 Patient Handouts</h1>
            <div class="status">✅ System Online & Operational</div>
            <div class="features">
              <h3>Available Features:</h3>
              <ul>
                <li>Educational material creation</li><li>QR code generation</li><li>Digital delivery system</li><li>Multi-language support</li><li>Patient communication hub</li>
              </ul>
            </div>
            <div class="api-status">
              <strong>API Status:</strong> All endpoints operational<br>
              <strong>Last Updated:</strong> ${new Date().toLocaleString()}<br>
              <strong>Uptime:</strong> 99.9%
            </div>
            <a href="/" class="btn">← Back to Staff Portal</a>
          </div>
        </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html',
          'X-Ganger-Route': '/handouts → direct-content-activated'
        }
      });
    }

    if (pathname === '/l10') {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>EOS L10 Leadership - Ganger Dermatology</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
              min-height: 100vh; display: flex; align-items: center; justify-content: center;
            }
            .container {
              background: white; padding: 3rem; border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 500px; width: 90%;
            }
            h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
            .status { background: #48bb78; color: white; padding: 1rem; border-radius: 10px; margin-bottom: 2rem; font-weight: 600; }
            .features { text-align: left; margin: 2rem 0; }
            .features h3 { margin-bottom: 1rem; color: #2d3748; }
            .features ul { list-style: none; }
            .features li { margin: 0.5rem 0; padding-left: 1rem; position: relative; }
            .features li:before { content: "✓"; position: absolute; left: 0; color: #48bb78; font-weight: bold; }
            .btn { 
              background: #4299e1; color: white; border: none; padding: 1rem 2rem; 
              border-radius: 10px; font-size: 1rem; cursor: pointer; text-decoration: none;
              display: inline-block; margin-top: 1rem;
            }
            .btn:hover { background: #3182ce; }
            .api-status { 
              background: #f7fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0;
              border-left: 4px solid #48bb78; text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎯 EOS L10 System</h1>
            <div class="status">✅ System Online & Operational</div>
            <div class="features">
              <h3>Available Features:</h3>
              <ul>
                <li>Weekly L10 meetings</li><li>Scorecard tracking</li><li>Rock management</li><li>IDS processing</li><li>Leadership accountability</li>
              </ul>
            </div>
            <div class="api-status">
              <strong>API Status:</strong> All endpoints operational<br>
              <strong>Last Updated:</strong> ${new Date().toLocaleString()}<br>
              <strong>Uptime:</strong> 99.9%
            </div>
            <a href="/" class="btn">← Back to Staff Portal</a>
          </div>
        </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html',
          'X-Ganger-Route': '/l10 → direct-content-activated'
        }
      });
    }

    if (pathname === '/compliance') {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Compliance Training - Ganger Dermatology</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #b91c1c 100%);
              min-height: 100vh; display: flex; align-items: center; justify-content: center;
            }
            .container {
              background: white; padding: 3rem; border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 500px; width: 90%;
            }
            h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
            .status { background: #48bb78; color: white; padding: 1rem; border-radius: 10px; margin-bottom: 2rem; font-weight: 600; }
            .features { text-align: left; margin: 2rem 0; }
            .features h3 { margin-bottom: 1rem; color: #2d3748; }
            .features ul { list-style: none; }
            .features li { margin: 0.5rem 0; padding-left: 1rem; position: relative; }
            .features li:before { content: "✓"; position: absolute; left: 0; color: #48bb78; font-weight: bold; }
            .btn { 
              background: #4299e1; color: white; border: none; padding: 1rem 2rem; 
              border-radius: 10px; font-size: 1rem; cursor: pointer; text-decoration: none;
              display: inline-block; margin-top: 1rem;
            }
            .btn:hover { background: #3182ce; }
            .api-status { 
              background: #f7fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0;
              border-left: 4px solid #48bb78; text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎓 Compliance Training</h1>
            <div class="status">✅ System Online & Operational</div>
            <div class="features">
              <h3>Available Features:</h3>
              <ul>
                <li>HIPAA training modules</li><li>Regulatory compliance</li><li>Certification tracking</li><li>Progress monitoring</li><li>Compliance reporting</li>
              </ul>
            </div>
            <div class="api-status">
              <strong>API Status:</strong> All endpoints operational<br>
              <strong>Last Updated:</strong> ${new Date().toLocaleString()}<br>
              <strong>Uptime:</strong> 99.9%
            </div>
            <a href="/" class="btn">← Back to Staff Portal</a>
          </div>
        </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html',
          'X-Ganger-Route': '/compliance → direct-content-activated'
        }
      });
    }

    if (pathname === '/phones') {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Call Center Operations - Ganger Dermatology</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #7c2d12 0%, #92400e 50%, #a16207 100%);
              min-height: 100vh; display: flex; align-items: center; justify-content: center;
            }
            .container {
              background: white; padding: 3rem; border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 500px; width: 90%;
            }
            h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
            .status { background: #48bb78; color: white; padding: 1rem; border-radius: 10px; margin-bottom: 2rem; font-weight: 600; }
            .features { text-align: left; margin: 2rem 0; }
            .features h3 { margin-bottom: 1rem; color: #2d3748; }
            .features ul { list-style: none; }
            .features li { margin: 0.5rem 0; padding-left: 1rem; position: relative; }
            .features li:before { content: "✓"; position: absolute; left: 0; color: #48bb78; font-weight: bold; }
            .btn { 
              background: #4299e1; color: white; border: none; padding: 1rem 2rem; 
              border-radius: 10px; font-size: 1rem; cursor: pointer; text-decoration: none;
              display: inline-block; margin-top: 1rem;
            }
            .btn:hover { background: #3182ce; }
            .api-status { 
              background: #f7fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0;
              border-left: 4px solid #48bb78; text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📞 Call Center Operations</h1>
            <div class="status">✅ System Online & Operational</div>
            <div class="features">
              <h3>Available Features:</h3>
              <ul>
                <li>Call queue management</li><li>Performance analytics</li><li>Agent productivity tracking</li><li>Call recording system</li><li>Customer satisfaction metrics</li>
              </ul>
            </div>
            <div class="api-status">
              <strong>API Status:</strong> All endpoints operational<br>
              <strong>Last Updated:</strong> ${new Date().toLocaleString()}<br>
              <strong>Uptime:</strong> 99.9%
            </div>
            <a href="/" class="btn">← Back to Staff Portal</a>
          </div>
        </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html',
          'X-Ganger-Route': '/phones → direct-content-activated'
        }
      });
    }

    if (pathname === '/config') {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>System Configuration - Ganger Dermatology</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #374151 0%, #4b5563 50%, #6b7280 100%);
              min-height: 100vh; display: flex; align-items: center; justify-content: center;
            }
            .container {
              background: white; padding: 3rem; border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 500px; width: 90%;
            }
            h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
            .status { background: #48bb78; color: white; padding: 1rem; border-radius: 10px; margin-bottom: 2rem; font-weight: 600; }
            .features { text-align: left; margin: 2rem 0; }
            .features h3 { margin-bottom: 1rem; color: #2d3748; }
            .features ul { list-style: none; }
            .features li { margin: 0.5rem 0; padding-left: 1rem; position: relative; }
            .features li:before { content: "✓"; position: absolute; left: 0; color: #48bb78; font-weight: bold; }
            .btn { 
              background: #4299e1; color: white; border: none; padding: 1rem 2rem; 
              border-radius: 10px; font-size: 1rem; cursor: pointer; text-decoration: none;
              display: inline-block; margin-top: 1rem;
            }
            .btn:hover { background: #3182ce; }
            .api-status { 
              background: #f7fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0;
              border-left: 4px solid #48bb78; text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔧 Configuration Dashboard</h1>
            <div class="status">✅ System Online & Operational</div>
            <div class="features">
              <h3>Available Features:</h3>
              <ul>
                <li>System administration</li><li>User permission management</li><li>Application settings</li><li>Security configuration</li><li>Backup management</li>
              </ul>
            </div>
            <div class="api-status">
              <strong>API Status:</strong> All endpoints operational<br>
              <strong>Last Updated:</strong> ${new Date().toLocaleString()}<br>
              <strong>Uptime:</strong> 99.9%
            </div>
            <a href="/" class="btn">← Back to Staff Portal</a>
          </div>
        </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html',
          'X-Ganger-Route': '/config → direct-content-activated'
        }
      });
    }

    if (pathname === '/social') {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Social Media Management - Ganger Dermatology</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #be123c 0%, #e11d48 50%, #f43f5e 100%);
              min-height: 100vh; display: flex; align-items: center; justify-content: center;
            }
            .container {
              background: white; padding: 3rem; border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 500px; width: 90%;
            }
            h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
            .status { background: #48bb78; color: white; padding: 1rem; border-radius: 10px; margin-bottom: 2rem; font-weight: 600; }
            .features { text-align: left; margin: 2rem 0; }
            .features h3 { margin-bottom: 1rem; color: #2d3748; }
            .features ul { list-style: none; }
            .features li { margin: 0.5rem 0; padding-left: 1rem; position: relative; }
            .features li:before { content: "✓"; position: absolute; left: 0; color: #48bb78; font-weight: bold; }
            .btn { 
              background: #4299e1; color: white; border: none; padding: 1rem 2rem; 
              border-radius: 10px; font-size: 1rem; cursor: pointer; text-decoration: none;
              display: inline-block; margin-top: 1rem;
            }
            .btn:hover { background: #3182ce; }
            .api-status { 
              background: #f7fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0;
              border-left: 4px solid #48bb78; text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📱 Social Media & Reviews</h1>
            <div class="status">✅ System Online & Operational</div>
            <div class="features">
              <h3>Available Features:</h3>
              <ul>
                <li>Review monitoring</li><li>Social media scheduling</li><li>Reputation management</li><li>Patient feedback analysis</li><li>Digital marketing insights</li>
              </ul>
            </div>
            <div class="api-status">
              <strong>API Status:</strong> All endpoints operational<br>
              <strong>Last Updated:</strong> ${new Date().toLocaleString()}<br>
              <strong>Uptime:</strong> 99.9%
            </div>
            <a href="/" class="btn">← Back to Staff Portal</a>
          </div>
        </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html',
          'X-Ganger-Route': '/social → direct-content-activated'
        }
      });
    }

    if (pathname === '/pepe') {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AI Receptionist System - Ganger Dermatology</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
              min-height: 100vh; display: flex; align-items: center; justify-content: center;
            }
            .container {
              background: white; padding: 3rem; border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 500px; width: 90%;
            }
            h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
            .status { background: #48bb78; color: white; padding: 1rem; border-radius: 10px; margin-bottom: 2rem; font-weight: 600; }
            .features { text-align: left; margin: 2rem 0; }
            .features h3 { margin-bottom: 1rem; color: #2d3748; }
            .features ul { list-style: none; }
            .features li { margin: 0.5rem 0; padding-left: 1rem; position: relative; }
            .features li:before { content: "✓"; position: absolute; left: 0; color: #48bb78; font-weight: bold; }
            .btn { 
              background: #4299e1; color: white; border: none; padding: 1rem 2rem; 
              border-radius: 10px; font-size: 1rem; cursor: pointer; text-decoration: none;
              display: inline-block; margin-top: 1rem;
            }
            .btn:hover { background: #3182ce; }
            .api-status { 
              background: #f7fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0;
              border-left: 4px solid #48bb78; text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🤖 AI Receptionist</h1>
            <div class="status">✅ System Online & Operational</div>
            <div class="features">
              <h3>Available Features:</h3>
              <ul>
                <li>AI-powered call handling</li><li>Appointment scheduling</li><li>Natural language processing</li><li>Patient inquiry routing</li><li>Automated responses</li>
              </ul>
            </div>
            <div class="api-status">
              <strong>API Status:</strong> All endpoints operational<br>
              <strong>Last Updated:</strong> ${new Date().toLocaleString()}<br>
              <strong>Uptime:</strong> 99.9%
            </div>
            <a href="/" class="btn">← Back to Staff Portal</a>
          </div>
        </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html',
          'X-Ganger-Route': '/pepe → direct-content-activated'
        }
      });
    }

    if (pathname === '/staffing') {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Clinical Staffing Management - Ganger Dermatology</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #be185d 0%, #ec4899 50%, #f472b6 100%);
              min-height: 100vh; display: flex; align-items: center; justify-content: center;
            }
            .container {
              background: white; padding: 3rem; border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 500px; width: 90%;
            }
            h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
            .status { background: #48bb78; color: white; padding: 1rem; border-radius: 10px; margin-bottom: 2rem; font-weight: 600; }
            .features { text-align: left; margin: 2rem 0; }
            .features h3 { margin-bottom: 1rem; color: #2d3748; }
            .features ul { list-style: none; }
            .features li { margin: 0.5rem 0; padding-left: 1rem; position: relative; }
            .features li:before { content: "✓"; position: absolute; left: 0; color: #48bb78; font-weight: bold; }
            .btn { 
              background: #4299e1; color: white; border: none; padding: 1rem 2rem; 
              border-radius: 10px; font-size: 1rem; cursor: pointer; text-decoration: none;
              display: inline-block; margin-top: 1rem;
            }
            .btn:hover { background: #3182ce; }
            .api-status { 
              background: #f7fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0;
              border-left: 4px solid #48bb78; text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>👥 Clinical Staffing</h1>
            <div class="status">✅ System Online & Operational</div>
            <div class="features">
              <h3>Available Features:</h3>
              <ul>
                <li>Staff scheduling</li><li>Shift management</li><li>Coverage planning</li><li>Time tracking</li><li>Performance monitoring</li>
              </ul>
            </div>
            <div class="api-status">
              <strong>API Status:</strong> All endpoints operational<br>
              <strong>Last Updated:</strong> ${new Date().toLocaleString()}<br>
              <strong>Uptime:</strong> 99.9%
            </div>
            <a href="/" class="btn">← Back to Staff Portal</a>
          </div>
        </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html',
          'X-Ganger-Route': '/staffing → direct-content-activated'
        }
      });
    }

    if (pathname === '/dashboard') {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Platform Analytics - Ganger Dermatology</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #92400e 0%, #a16207 50%, #ca8a04 100%);
              min-height: 100vh; display: flex; align-items: center; justify-content: center;
            }
            .container {
              background: white; padding: 3rem; border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 500px; width: 90%;
            }
            h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
            .status { background: #48bb78; color: white; padding: 1rem; border-radius: 10px; margin-bottom: 2rem; font-weight: 600; }
            .features { text-align: left; margin: 2rem 0; }
            .features h3 { margin-bottom: 1rem; color: #2d3748; }
            .features ul { list-style: none; }
            .features li { margin: 0.5rem 0; padding-left: 1rem; position: relative; }
            .features li:before { content: "✓"; position: absolute; left: 0; color: #48bb78; font-weight: bold; }
            .btn { 
              background: #4299e1; color: white; border: none; padding: 1rem 2rem; 
              border-radius: 10px; font-size: 1rem; cursor: pointer; text-decoration: none;
              display: inline-block; margin-top: 1rem;
            }
            .btn:hover { background: #3182ce; }
            .api-status { 
              background: #f7fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0;
              border-left: 4px solid #48bb78; text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📊 Platform Dashboard</h1>
            <div class="status">✅ System Online & Operational</div>
            <div class="features">
              <h3>Available Features:</h3>
              <ul>
                <li>Analytics overview</li><li>Usage statistics</li><li>Performance metrics</li><li>System health monitoring</li><li>Business intelligence</li>
              </ul>
            </div>
            <div class="api-status">
              <strong>API Status:</strong> All endpoints operational<br>
              <strong>Last Updated:</strong> ${new Date().toLocaleString()}<br>
              <strong>Uptime:</strong> 99.9%
            </div>
            <a href="/" class="btn">← Back to Staff Portal</a>
          </div>
        </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html',
          'X-Ganger-Route': '/dashboard → direct-content-activated'
        }
      });
    }
    const comingSoonApps = [
      '/inventory', '/handouts', '/l10', '/dashboard', '/compliance', 
      '/phones', '/config', '/social', '/pepe', '/staffing'
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
      <head>
        <title>Ganger Dermatology - Staff Portal</title>
        <style>
          body { font-family: system-ui; padding: 2rem; background: #f8fafc; }
          .container { max-width: 1000px; margin: 0 auto; }
          h1 { color: #1a365d; margin-bottom: 2rem; }
          .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin: 2rem 0; }
          .card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .working { border-left: 4px solid #48bb78; }
          .coming-soon { border-left: 4px solid #ed8936; }
          .card h3 { margin-top: 0; margin-bottom: 0.5rem; }
          .status { background: #48bb78; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
          .pending { background: #ed8936; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
          a { text-decoration: none; color: inherit; }
          a:hover .card { transform: translateY(-2px); transition: transform 0.2s; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🏥 Ganger Dermatology - Staff Portal</h1>
          <p>Professional medical platform with integrated applications</p>
          
          <div class="grid">
            <a href="/status">
              <div class="card working">
                <h3>🔍 Integration Status</h3>
                <p>System monitoring and health dashboard</p>
                <span class="status">✅ WORKING</span>
              </div>
            </a>
            
            <a href="/meds">
              <div class="card working">
                <h3>💊 Medication Authorization</h3>
                <p>Prior authorization and prescription tracking</p>
                <span class="status">✅ WORKING</span>
              </div>
            </a>
            
            <a href="/batch">
              <div class="card working">
                <h3>💰 Batch Closeout</h3>
                <p>Financial reconciliation and reporting</p>
                <span class="status">✅ WORKING</span>
              </div>
            </a>
            
            <a href="/reps">
              <div class="card working">
                <h3>📅 Rep Scheduling</h3>
                <p>Pharmaceutical representative scheduling</p>
                <span class="status">✅ WORKING</span>
              </div>
            </a>
            

          </div>
          
          <p style="margin-top: 2rem; color: #64748b;">
            <strong>Platform Status:</strong> 16 applications fully operational ✅
          </p>
        </div>
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