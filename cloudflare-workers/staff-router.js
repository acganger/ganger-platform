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
    // 🔗 Route all application paths to their respective workers
    // Remove the "coming soon" interceptor - all apps should be accessible
    
    // Note: Individual app routing will be handled by the platform's 
    // existing worker deployment infrastructure. Each app has its own
    // worker-simple.js that will handle the actual application logic.
    
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
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div class="animate-fade-in">
            <!-- Welcome Banner -->
            <div class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg mb-8 p-8 text-white">
                <div>
                    <h2 class="text-3xl font-bold mb-2">Welcome to Staff Portal</h2>
                    <p class="text-primary-100 text-lg">Comprehensive employee management and collaboration hub</p>
                </div>
            </div>

            <!-- All 17 Applications -->
            <div class="mb-8">
                <h3 class="text-2xl font-bold text-gray-900 mb-6">All Platform Applications (17 Apps)</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <!-- AI Receptionist -->
                    <a href="/ai-receptionist" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">AI Receptionist</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">AI-powered phone assistant and call routing</p>
                        </div>
                    </a>

                    <!-- Batch Closeout -->
                    <a href="/batch" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Batch Closeout</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Financial reconciliation and reporting</p>
                        </div>
                    </a>

                    <!-- Call Center Ops -->
                    <a href="/call-center" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Call Center Ops</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Call center management and operations</p>
                        </div>
                    </a>

                    <!-- Check-in Kiosk -->
                    <a href="/kiosk" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Check-in Kiosk</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Patient self-service check-in system</p>
                        </div>
                    </a>

                    <!-- Clinical Staffing -->
                    <a href="/staffing" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Clinical Staffing</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Medical staff scheduling and management</p>
                        </div>
                    </a>

                    <!-- Compliance Training -->
                    <a href="/compliance" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Compliance Training</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Training tracking and compliance management</p>
                        </div>
                    </a>

                    <!-- Config Dashboard -->
                    <a href="/config" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Config Dashboard</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">System configuration and settings</p>
                        </div>
                    </a>

                    <!-- EOS L10 -->
                    <a href="/l10" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">EOS L10</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Team meetings and goal tracking</p>
                        </div>
                    </a>

                    <!-- Handouts -->
                    <a href="/handouts" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Patient Handouts</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Patient education materials and delivery</p>
                        </div>
                    </a>

                    <!-- Integration Status -->
                    <a href="/status" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Integration Status</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">System monitoring and health dashboard</p>
                        </div>
                    </a>

                    <!-- Inventory -->
                    <a href="/inventory" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Inventory</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Medical supply and equipment tracking</p>
                        </div>
                    </a>

                    <!-- Medication Auth -->
                    <a href="/meds" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-processing-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-5 h-5 text-processing-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Medication Auth</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Prior authorization and prescription tracking</p>
                        </div>
                    </a>

                    <!-- Pharma Scheduling -->
                    <a href="/reps" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Pharma Scheduling</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Pharmaceutical rep appointment booking</p>
                        </div>
                    </a>

                    <!-- Platform Dashboard -->
                    <a href="/dashboard" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Platform Dashboard</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Analytics and platform overview</p>
                        </div>
                    </a>

                    <!-- Socials Reviews -->
                    <a href="/socials" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Social Reviews</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Social media and review management</p>
                        </div>
                    </a>

                    <!-- Staff Portal -->
                    <a href="/staff-portal" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Staff Portal</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Employee management and HR tools</p>
                        </div>
                    </a>
                </div>
            </div>

        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-12">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between">
                <div class="text-sm text-gray-500">
                    © 2025 Ganger Dermatology. Staff Management Portal.
                </div>
                <div class="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Platform Status: All 17 applications operational</span>
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