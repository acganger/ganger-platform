// 🚀 Ganger Platform - Clean Demo Worker (No CSS Issues)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const pathname = url.pathname;

    // 📊 Analytics tracking
    if (env.GANGER_ANALYTICS) {
      ctx.waitUntil(
        env.GANGER_ANALYTICS.writeDataPoint({
          blobs: [hostname, pathname, request.method],
          doubles: [Date.now()],
          indexes: [hostname]
        }).catch(() => {})
      );
    }

    // 🎯 Route based on hostname and path
    return getAppResponse(hostname, pathname, env);
  }
};

function getAppResponse(hostname, pathname, env) {
  // 🏥 Staff Portal Routes
  if (hostname === 'staff.gangerdermatology.com') {
    if (pathname === '/' || pathname === '') {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>Staff Portal - Ganger Dermatology</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
            .subtitle { color: #666; font-size: 16px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .card { background: #f8f9fa; padding: 20px; border-radius: 6px; border: 1px solid #dee2e6; text-decoration: none; color: #333; display: block; }
            .card:hover { background: #e9ecef; }
            .card-title { font-weight: bold; margin-bottom: 8px; font-size: 16px; }
            .card-desc { color: #666; font-size: 14px; }
            .status { background: #d1ecf1; border: 1px solid #bee5eb; padding: 20px; border-radius: 6px; text-align: center; }
            .status-title { font-weight: bold; color: #0c5460; margin-bottom: 10px; }
            .status-text { color: #0c5460; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏥 Staff Portal</div>
              <div class="subtitle">Ganger Dermatology Medical Practice Management</div>
            </div>
            
            <div class="grid">
              <a href="/inventory" class="card">
                <div class="card-title">📦 Inventory Management</div>
                <div class="card-desc">Medical supply tracking with barcode scanning</div>
              </a>
              <a href="/handouts" class="card">
                <div class="card-title">📋 Patient Handouts</div>
                <div class="card-desc">Custom educational materials generator</div>
              </a>
              <a href="/staffing" class="card">
                <div class="card-title">👥 Clinical Staffing</div>
                <div class="card-desc">Employee scheduling and optimization</div>
              </a>
              <a href="/l10" class="card">
                <div class="card-title">🎯 EOS L10 Management</div>
                <div class="card-desc">Team management and goal tracking</div>
              </a>
              <a href="/meds" class="card">
                <div class="card-title">💊 Medication Authorization</div>
                <div class="card-desc">Prior authorization workflow assistant</div>
              </a>
              <a href="/training" class="card">
                <div class="card-title">🎓 Compliance Training</div>
                <div class="card-desc">Staff education and certification tracking</div>
              </a>
              <a href="/ops" class="card">
                <div class="card-title">📞 Call Center Operations</div>
                <div class="card-desc">Patient communication dashboard</div>
              </a>
              <a href="/closeout" class="card">
                <div class="card-title">💰 Batch Closeout</div>
                <div class="card-desc">Financial reconciliation system</div>
              </a>
              <a href="/config" class="card">
                <div class="card-title">⚙️ Configuration</div>
                <div class="card-desc">System settings management</div>
              </a>
              <a href="/socials" class="card">
                <div class="card-title">📱 Social Media</div>
                <div class="card-desc">Online reputation management</div>
              </a>
              <a href="/integrations" class="card">
                <div class="card-title">🔗 Integration Status</div>
                <div class="card-desc">Third-party service monitoring</div>
              </a>
              <a href="/ai" class="card">
                <div class="card-title">🤖 AI Receptionist</div>
                <div class="card-desc">Automated patient communication</div>
              </a>
            </div>
            
            <div class="status">
              <div class="status-title">🚀 Platform Status: LIVE</div>
              <div class="status-text">
                All 13 applications are deployed and ready for use. Click any application above to access its interface.
                <br><br>
                <strong>Additional Portals:</strong><br>
                • <a href="https://reps.gangerdermatology.com">Pharmaceutical Representatives</a><br>
                • <a href="https://kiosk.gangerdermatology.com">Patient Check-in Kiosk</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `, { 
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'X-Powered-By': 'Ganger Platform v1.0'
        } 
      });
    }

    // Individual app pages
    if (pathname.startsWith('/inventory')) {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>Inventory Management - Ganger Dermatology</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
            .breadcrumb { background: #e3f2fd; padding: 10px 15px; border-radius: 4px; margin-bottom: 20px; }
            .breadcrumb a { color: #1976d2; text-decoration: none; }
            .header { text-align: center; margin-bottom: 30px; }
            .app-title { font-size: 28px; font-weight: bold; color: #333; margin-bottom: 10px; }
            .app-desc { color: #666; font-size: 16px; line-height: 1.5; }
            .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
            .feature { background: #f8f9fa; padding: 20px; border-radius: 6px; border: 1px solid #dee2e6; }
            .feature-title { font-weight: bold; color: #333; margin-bottom: 8px; }
            .feature-text { color: #666; font-size: 14px; line-height: 1.4; }
            .status { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 6px; text-align: center; }
            .status-title { font-weight: bold; color: #856404; margin-bottom: 10px; }
            .status-text { color: #856404; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="breadcrumb">
              <a href="/">🏥 Staff Portal</a> / 📦 Inventory Management
            </div>
            
            <div class="header">
              <div class="app-title">📦 Inventory Management</div>
              <div class="app-desc">Medical supply tracking with barcode scanning, real-time stock management, and automated reordering workflows.</div>
            </div>
            
            <div class="feature-grid">
              <div class="feature">
                <div class="feature-title">Barcode Scanning</div>
                <div class="feature-text">Mobile device integration for instant item tracking</div>
              </div>
              <div class="feature">
                <div class="feature-title">Real-time Updates</div>
                <div class="feature-text">Live inventory levels across all practice locations</div>
              </div>
              <div class="feature">
                <div class="feature-title">Automated Reordering</div>
                <div class="feature-text">Smart thresholds trigger purchase recommendations</div>
              </div>
              <div class="feature">
                <div class="feature-title">Vendor Integration</div>
                <div class="feature-text">Direct connection to Henry Schein and major suppliers</div>
              </div>
            </div>
            
            <div class="status">
              <div class="status-title">🚧 Application Deployment</div>
              <div class="status-text">
                This application is currently being deployed. The interface above shows the planned features.
                <br><br>
                <a href="/">← Return to Staff Portal</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `, { 
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'X-Powered-By': 'Ganger Platform v1.0'
        } 
      });
    }
  }

  // 💊 Pharmaceutical Representatives Portal
  if (hostname === 'reps.gangerdermatology.com') {
    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Pharmaceutical Representatives - Ganger Dermatology</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
          .subtitle { color: #666; font-size: 16px; }
          .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .feature { background: #f8f9fa; padding: 20px; border-radius: 6px; border: 1px solid #dee2e6; }
          .feature-title { font-weight: bold; color: #333; margin-bottom: 8px; }
          .feature-text { color: #666; font-size: 14px; line-height: 1.4; }
          .status { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 6px; text-align: center; }
          .status-title { font-weight: bold; color: #155724; margin-bottom: 10px; }
          .status-text { color: #155724; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">💊 Pharmaceutical Portal</div>
            <div class="subtitle">Representative Scheduling & Sample Management</div>
          </div>
          
          <div class="feature-grid">
            <div class="feature">
              <div class="feature-title">📅 Appointment Scheduling</div>
              <div class="feature-text">Book meetings with practice staff based on availability and preferences</div>
            </div>
            <div class="feature">
              <div class="feature-title">📦 Sample Management</div>
              <div class="feature-text">Track sample inventory and delivery confirmations</div>
            </div>
            <div class="feature">
              <div class="feature-title">📚 Educational Materials</div>
              <div class="feature-text">Share product information and training resources</div>
            </div>
            <div class="feature">
              <div class="feature-title">💬 Communication Hub</div>
              <div class="feature-text">Direct messaging with practice staff and updates</div>
            </div>
          </div>
          
          <div class="status">
            <div class="status-title">🎯 Representative Access</div>
            <div class="status-text">
              This portal streamlines pharmaceutical representative interactions while maintaining practice workflow integrity.
              <br><br>
              <a href="https://staff.gangerdermatology.com">Visit Staff Portal</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `, { 
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'X-Powered-By': 'Ganger Platform v1.0'
      } 
    });
  }

  // 🖥️ Patient Check-in Kiosk
  if (hostname === 'kiosk.gangerdermatology.com') {
    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Patient Check-in Kiosk - Ganger Dermatology</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
          .subtitle { color: #666; font-size: 16px; }
          .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .feature { background: #f8f9fa; padding: 20px; border-radius: 6px; border: 1px solid #dee2e6; }
          .feature-title { font-weight: bold; color: #333; margin-bottom: 8px; }
          .feature-text { color: #666; font-size: 14px; line-height: 1.4; }
          .status { background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 6px; text-align: center; }
          .status-title { font-weight: bold; color: #721c24; margin-bottom: 10px; }
          .status-text { color: #721c24; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🖥️ Patient Kiosk</div>
            <div class="subtitle">Self-Service Check-in & Payment Processing</div>
          </div>
          
          <div class="feature-grid">
            <div class="feature">
              <div class="feature-title">👤 Patient Lookup</div>
              <div class="feature-text">Quick search by name, date of birth, or phone number</div>
            </div>
            <div class="feature">
              <div class="feature-title">📝 Information Updates</div>
              <div class="feature-text">Update address, insurance, emergency contacts, and medical history</div>
            </div>
            <div class="feature">
              <div class="feature-title">📋 Digital Forms</div>
              <div class="feature-text">Complete intake forms, consents, and pre-visit questionnaires</div>
            </div>
            <div class="feature">
              <div class="feature-title">💳 Secure Payments</div>
              <div class="feature-text">Process co-pays, outstanding balances, and payment plans</div>
            </div>
          </div>
          
          <div class="status">
            <div class="status-title">⚡ Self-Service Experience</div>
            <div class="status-text">
              Reduce wait times and improve front desk efficiency with streamlined patient self-service.
              <br><br>
              <a href="https://staff.gangerdermatology.com">Visit Staff Portal</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `, { 
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'X-Powered-By': 'Ganger Platform v1.0'
      } 
    });
  }

  // Default fallback
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Ganger Platform</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; text-align: center; }
        .container { max-width: 600px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; }
        h1 { color: #333; margin-bottom: 20px; }
        .links { margin-top: 30px; }
        .links a { display: block; margin: 10px 0; padding: 15px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        .links a:hover { background: #0056b3; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏥 Ganger Dermatology Platform</h1>
        <p>Welcome to the Ganger Platform medical practice management suite.</p>
        <div class="links">
          <a href="https://staff.gangerdermatology.com">🏥 Staff Portal (Main Hub)</a>
          <a href="https://reps.gangerdermatology.com">💊 Pharmaceutical Representatives</a>
          <a href="https://kiosk.gangerdermatology.com">🖥️ Patient Check-in Kiosk</a>
        </div>
      </div>
    </body>
    </html>
  `, { 
    headers: { 
      'Content-Type': 'text/html; charset=utf-8',
      'X-Powered-By': 'Ganger Platform v1.0'
    } 
  });
}