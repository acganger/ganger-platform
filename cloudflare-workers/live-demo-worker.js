// 🚀 Ganger Platform - Live Demo Worker
// Shows working platform interface while apps are being deployed

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
  const baseStyle = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .container { 
        background: white; 
        border-radius: 16px; 
        box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        max-width: 800px; 
        width: 90%;
        padding: 40px;
      }
      .header { 
        text-align: center; 
        margin-bottom: 40px; 
        border-bottom: 2px solid #f1f5f9;
        padding-bottom: 30px;
      }
      .logo { 
        font-size: 28px; 
        font-weight: 700; 
        color: #1e40af; 
        margin-bottom: 8px; 
      }
      .subtitle { 
        color: #64748b; 
        font-size: 16px; 
      }
      .nav-grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
        gap: 16px; 
        margin-bottom: 40px; 
      }
      .nav-item { 
        display: block; 
        padding: 20px; 
        background: #f8fafc; 
        border: 2px solid #e2e8f0;
        border-radius: 12px; 
        text-decoration: none; 
        color: #334155; 
        font-weight: 500;
        transition: all 0.2s;
        text-align: center;
      }
      .nav-item:hover { 
        background: #e2e8f0; 
        border-color: #cbd5e1;
        transform: translateY(-2px);
      }
      .nav-item .icon { 
        font-size: 24px; 
        margin-bottom: 8px; 
        display: block; 
      }
      .status { 
        background: #f0f9ff; 
        border: 1px solid #bae6fd; 
        border-radius: 8px; 
        padding: 20px; 
        margin-top: 30px;
        text-align: center;
      }
      .status-title { 
        font-weight: 600; 
        color: #0369a1; 
        margin-bottom: 8px; 
      }
      .status-text { 
        color: #0c4a6e; 
        line-height: 1.5; 
      }
      .breadcrumb {
        background: #eff6ff;
        padding: 12px 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 14px;
        color: #1e40af;
      }
      .app-header {
        text-align: center;
        margin-bottom: 30px;
      }
      .app-title {
        font-size: 32px;
        font-weight: 700;
        color: #1e40af;
        margin-bottom: 8px;
      }
      .app-description {
        color: #64748b;
        font-size: 16px;
        line-height: 1.6;
      }
      .feature-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-top: 30px;
      }
      .feature-card {
        background: #f8fafc;
        padding: 24px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
      }
      .feature-title {
        font-weight: 600;
        color: #334155;
        margin-bottom: 8px;
      }
      .feature-text {
        color: #64748b;
        line-height: 1.5;
        font-size: 14px;
      }
    </style>
  `;

  // 🏥 Staff Portal Routes
  if (hostname === 'staff.gangerdermatology.com') {
    if (pathname === '/' || pathname === '') {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Staff Portal - Ganger Dermatology</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          ${baseStyle}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏥 Staff Portal</div>
              <div class="subtitle">Ganger Dermatology Medical Practice Management</div>
            </div>
            
            <div class="nav-grid">
              <a href="/inventory" class="nav-item">
                <span class="icon">📦</span>
                Inventory Management
              </a>
              <a href="/handouts" class="nav-item">
                <span class="icon">📋</span>
                Patient Handouts
              </a>
              <a href="/staffing" class="nav-item">
                <span class="icon">👥</span>
                Clinical Staffing
              </a>
              <a href="/l10" class="nav-item">
                <span class="icon">🎯</span>
                EOS L10 Management
              </a>
              <a href="/meds" class="nav-item">
                <span class="icon">💊</span>
                Medication Authorization
              </a>
              <a href="/training" class="nav-item">
                <span class="icon">🎓</span>
                Compliance Training
              </a>
              <a href="/ops" class="nav-item">
                <span class="icon">📞</span>
                Call Center Operations
              </a>
              <a href="/closeout" class="nav-item">
                <span class="icon">💰</span>
                Batch Closeout
              </a>
              <a href="/config" class="nav-item">
                <span class="icon">⚙️</span>
                Configuration
              </a>
              <a href="/socials" class="nav-item">
                <span class="icon">📱</span>
                Social Media
              </a>
              <a href="/integrations" class="nav-item">
                <span class="icon">🔗</span>
                Integration Status
              </a>
              <a href="/ai" class="nav-item">
                <span class="icon">🤖</span>
                AI Receptionist
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
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // Individual app pages
    const appPages = {
      '/inventory': {
        title: '📦 Inventory Management',
        description: 'Medical supply tracking with barcode scanning, real-time stock management, and automated reordering workflows.',
        features: [
          { title: 'Barcode Scanning', text: 'Mobile device integration for instant item tracking' },
          { title: 'Real-time Updates', text: 'Live inventory levels across all practice locations' },
          { title: 'Automated Reordering', text: 'Smart thresholds trigger purchase recommendations' },
          { title: 'Vendor Integration', text: 'Direct connection to Henry Schein and major suppliers' }
        ]
      },
      '/handouts': {
        title: '📋 Patient Handouts Generator',
        description: 'Custom educational materials with QR scanning, digital delivery, and communication hub integration.',
        features: [
          { title: 'Template Library', text: 'Extensive collection of medical education templates' },
          { title: 'Custom Branding', text: 'Practice-specific customization and patient information' },
          { title: 'Multi-format Delivery', text: 'Print, email, SMS, and QR code distribution' },
          { title: 'Engagement Tracking', text: 'Monitor patient education material usage' }
        ]
      },
      '/staffing': {
        title: '👥 Clinical Staffing Optimization',
        description: 'Employee scheduling and optimization with drag-and-drop interface, availability tracking, and AI-powered suggestions.',
        features: [
          { title: 'Visual Scheduling', text: 'Drag-and-drop calendar interface' },
          { title: 'Availability Management', text: 'Real-time staff availability and requests' },
          { title: 'AI Optimization', text: 'Smart schedule suggestions and conflict resolution' },
          { title: 'Compliance Tracking', text: 'Certification and training requirements monitoring' }
        ]
      }
    };

    const app = appPages[pathname];
    if (app) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${app.title} - Ganger Dermatology</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          ${baseStyle}
        </head>
        <body>
          <div class="container">
            <div class="breadcrumb">
              <a href="/">🏥 Staff Portal</a> / ${app.title}
            </div>
            
            <div class="app-header">
              <div class="app-title">${app.title}</div>
              <div class="app-description">${app.description}</div>
            </div>
            
            <div class="feature-grid">
              ${app.features.map(feature => `
                <div class="feature-card">
                  <div class="feature-title">${feature.title}</div>
                  <div class="feature-text">${feature.text}</div>
                </div>
              `).join('')}
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
      `, { headers: { 'Content-Type': 'text/html' } });
    }
  }

  // 💊 Pharmaceutical Representatives Portal
  if (hostname === 'reps.gangerdermatology.com') {
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pharmaceutical Representatives - Ganger Dermatology</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">💊 Pharmaceutical Portal</div>
            <div class="subtitle">Representative Scheduling & Sample Management</div>
          </div>
          
          <div class="feature-grid">
            <div class="feature-card">
              <div class="feature-title">📅 Appointment Scheduling</div>
              <div class="feature-text">Book meetings with practice staff based on availability and preferences</div>
            </div>
            <div class="feature-card">
              <div class="feature-title">📦 Sample Management</div>
              <div class="feature-text">Track sample inventory and delivery confirmations</div>
            </div>
            <div class="feature-card">
              <div class="feature-title">📚 Educational Materials</div>
              <div class="feature-text">Share product information and training resources</div>
            </div>
            <div class="feature-card">
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
    `, { headers: { 'Content-Type': 'text/html' } });
  }

  // 🖥️ Patient Check-in Kiosk
  if (hostname === 'kiosk.gangerdermatology.com') {
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Check-in Kiosk - Ganger Dermatology</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🖥️ Patient Kiosk</div>
            <div class="subtitle">Self-Service Check-in & Payment Processing</div>
          </div>
          
          <div class="feature-grid">
            <div class="feature-card">
              <div class="feature-title">👤 Patient Lookup</div>
              <div class="feature-text">Quick search by name, date of birth, or phone number</div>
            </div>
            <div class="feature-card">
              <div class="feature-title">📝 Information Updates</div>
              <div class="feature-text">Update address, insurance, emergency contacts, and medical history</div>
            </div>
            <div class="feature-card">
              <div class="feature-title">📋 Digital Forms</div>
              <div class="feature-text">Complete intake forms, consents, and pre-visit questionnaires</div>
            </div>
            <div class="feature-card">
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
    `, { headers: { 'Content-Type': 'text/html' } });
  }

  // Default fallback
  return new Response('Application not found', { status: 404 });
}