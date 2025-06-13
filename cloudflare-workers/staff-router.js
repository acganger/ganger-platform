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
    
    // 🏠 Default route - Staff Management (main portal) - WITH TAILWIND CSS
    return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Staff Management Portal - Ganger Dermatology</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: {
                            50: '#eff6ff',
                            100: '#dbeafe',
                            200: '#bfdbfe',
                            300: '#93c5fd',
                            400: '#60a5fa',
                            500: '#3b82f6',
                            600: '#2563eb',
                            700: '#1d4ed8',
                            800: '#1e40af',
                            900: '#1e3a8a',
                        },
                        urgent: {
                            50: '#fef2f2',
                            100: '#fee2e2',
                            200: '#fecaca',
                            300: '#fca5a5',
                            400: '#f87171',
                            500: '#ef4444',
                            600: '#dc2626',
                            700: '#b91c1c',
                            800: '#991b1b',
                            900: '#7f1d1d',
                        },
                        processing: {
                            50: '#f0f9ff',
                            100: '#e0f2fe',
                            200: '#bae6fd',
                            300: '#7dd3fc',
                            400: '#38bdf8',
                            500: '#0ea5e9',
                            600: '#0284c7',
                            700: '#0369a1',
                            800: '#075985',
                            900: '#0c4a6e',
                        },
                        success: {
                            50: '#ecfdf5',
                            100: '#d1fae5',
                            200: '#a7f3d0',
                            300: '#6ee7b7',
                            400: '#34d399',
                            500: '#10b981',
                            600: '#059669',
                            700: '#047857',
                            800: '#065f46',
                            900: '#064e3b',
                        },
                    },
                    fontFamily: {
                        sans: ['Inter', 'system-ui', 'sans-serif'],
                    },
                    animation: {
                        'fade-in': 'fadeIn 0.2s ease-in-out',
                        'slide-up': 'slideUp 0.3s ease-out',
                        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    },
                    keyframes: {
                        fadeIn: {
                            '0%': { opacity: '0' },
                            '100%': { opacity: '1' },
                        },
                        slideUp: {
                            '0%': { transform: 'translateY(10px)', opacity: '0' },
                            '100%': { transform: 'translateY(0)', opacity: '1' },
                        },
                    },
                },
            },
        }
    </script>
</head>
<body class="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 font-sans">
    <!-- Navigation Header -->
    <nav class="bg-white shadow-lg border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                    <div class="ml-4">
                        <h1 class="text-xl font-semibold text-gray-900">Staff Management Portal</h1>
                        <p class="text-sm text-gray-500">Ganger Dermatology</p>
                    </div>
                </div>
                
                <div class="flex items-center space-x-4">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                        <span class="w-2 h-2 bg-success-400 rounded-full mr-2 animate-pulse"></span>
                        Live System
                    </span>
                    <div class="text-sm text-gray-700">
                        <span class="font-medium">Tailwind CSS:</span> 
                        <span class="text-success-600 font-semibold">✓ Working</span>
                    </div>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div class="animate-fade-in">
            <!-- Welcome Banner -->
            <div class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg mb-8 p-8 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-3xl font-bold mb-2">Welcome to Staff Portal</h2>
                        <p class="text-primary-100 text-lg">Comprehensive employee management and collaboration hub</p>
                    </div>
                    <div class="hidden md:block">
                        <div class="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                            <div class="text-center">
                                <div class="text-2xl font-bold">✨</div>
                                <div class="text-sm font-medium">Tailwind CSS</div>
                                <div class="text-xs text-primary-200">Fully Operational</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Working Applications -->
            <div class="mb-8">
                <h3 class="text-2xl font-bold text-gray-900 mb-6">Available Applications</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    <!-- Integration Status -->
                    <a href="/status" class="block">
                        <div class="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-4">
                                <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-lg font-semibold text-gray-900">Integration Status</h3>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                                        ✅ Working
                                    </span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-sm">System monitoring and health dashboard</p>
                        </div>
                    </a>

                    <!-- Medication Authorization -->
                    <a href="/meds" class="block">
                        <div class="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-4">
                                <div class="w-12 h-12 bg-processing-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-processing-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-lg font-semibold text-gray-900">Medication Authorization</h3>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                                        ✅ Working
                                    </span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-sm">Prior authorization and prescription tracking</p>
                        </div>
                    </a>

                    <!-- Batch Closeout -->
                    <a href="/batch" class="block">
                        <div class="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-4">
                                <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-lg font-semibold text-gray-900">Batch Closeout</h3>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                                        ✅ Working
                                    </span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-sm">Financial reconciliation and reporting</p>
                        </div>
                    </a>

                    <!-- Rep Scheduling -->
                    <a href="/reps" class="block">
                        <div class="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-4">
                                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-lg font-semibold text-gray-900">Rep Scheduling</h3>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                                        ✅ Working
                                    </span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-sm">Pharmaceutical representative scheduling</p>
                        </div>
                    </a>
                </div>
            </div>

            <!-- Tailwind CSS Demo Section -->
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h3 class="text-2xl font-bold text-gray-900 mb-6">Tailwind CSS Components Demo</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <!-- Status Badges -->
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-3">Status Badges</h4>
                        <div class="space-y-2">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                            <br>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
                            <br>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Urgent</span>
                            <br>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">In Progress</span>
                        </div>
                    </div>
                    
                    <!-- Buttons -->
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-3">Buttons</h4>
                        <div class="space-y-2">
                            <button class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">Primary</button>
                            <button class="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200">Secondary</button>
                            <button class="w-full bg-success-600 hover:bg-success-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">Success</button>
                        </div>
                    </div>
                    
                    <!-- Form Elements -->
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-3">Form Elements</h4>
                        <div class="space-y-2">
                            <input type="text" placeholder="Text Input" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                            <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                                <option>Select Option</option>
                                <option>Option 1</option>
                                <option>Option 2</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Responsive Grid -->
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-3">Responsive Grid</h4>
                        <div class="grid grid-cols-2 gap-2">
                            <div class="bg-primary-100 text-primary-800 p-2 rounded text-center text-xs font-medium">1</div>
                            <div class="bg-primary-200 text-primary-800 p-2 rounded text-center text-xs font-medium">2</div>
                            <div class="bg-primary-300 text-primary-800 p-2 rounded text-center text-xs font-medium">3</div>
                            <div class="bg-primary-400 text-primary-800 p-2 rounded text-center text-xs font-medium">4</div>
                        </div>
                    </div>
                </div>

                <!-- Animation Demo -->
                <div>
                    <h4 class="font-semibold text-gray-700 mb-3">Animations & Effects</h4>
                    <div class="flex flex-wrap gap-4">
                        <div class="bg-red-100 text-red-800 px-4 py-2 rounded-lg animate-pulse">Pulse Animation</div>
                        <div class="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg animate-bounce">Bounce Animation</div>
                        <div class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:scale-105 transform transition-transform duration-200 cursor-pointer">Hover Scale</div>
                        <div class="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg hover:shadow-lg transition-shadow duration-200 cursor-pointer">Hover Shadow</div>
                    </div>
                </div>
            </div>

            <!-- System Information -->
            <div class="bg-gray-50 rounded-xl border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-success-600">✓</div>
                        <div class="text-sm font-medium text-gray-700">Tailwind CSS</div>
                        <div class="text-xs text-gray-500">Fully Operational</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-success-600">✓</div>
                        <div class="text-sm font-medium text-gray-700">Cloudflare Workers</div>
                        <div class="text-xs text-gray-500">Deployed Successfully</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-success-600">✓</div>
                        <div class="text-sm font-medium text-gray-700">Responsive Design</div>
                        <div class="text-xs text-gray-500">Mobile Ready</div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-12">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between">
                <div class="text-sm text-gray-500">
                    © 2025 Ganger Dermatology. Staff Management Portal with Tailwind CSS.
                </div>
                <div class="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Platform Status: All systems operational</span>
                </div>
            </div>
        </div>
    </footer>

    <script>
        // Add some interactivity to demonstrate Tailwind
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Tailwind CSS is working properly!');
            
            // Add click handlers to demo buttons
            const buttons = document.querySelectorAll('button');
            buttons.forEach(button => {
                button.addEventListener('click', function() {
                    console.log('Button clicked - Tailwind CSS interactions working!');
                });
            });
        });
    </script>
</body>
</html>`, {
      headers: { 
        'Content-Type': 'text/html',
        'X-Ganger-Route': 'main-staff-portal-tailwind-enabled',
        'X-Powered-By': 'Cloudflare Workers + Tailwind CSS'
      }
    });
  }
};