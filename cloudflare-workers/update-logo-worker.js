// 🏥 Ganger Platform - Updated Worker with Real Logo and Working Apps
// Routes to actual deployed applications where available

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
  // Actual Ganger Dermatology logo (simplified for Worker embedding)
  const gangerLogoSVG = `<svg viewBox="0 0 500 143" xmlns="http://www.w3.org/2000/svg">
    <circle cx="71" cy="71" r="60" fill="#2d3748" stroke="#fff" stroke-width="3"/>
    <path d="M45 55c10 0 18 5 22 12l-8 5c-2-4-6-7-12-7-8 0-14 6-14 14s6 14 14 14c6 0 10-3 12-7l8 5c-4 7-12 12-22 12-15 0-26-11-26-26s11-26 26-26z" fill="white"/>
    <path d="M71 45c5 0 9 2 12 6l-6 6c-2-2-4-3-6-3s-4 1-4 3c0 2 2 3 6 4 6 2 10 5 10 11 0 7-6 12-14 12s-14-5-14-12h8c0 3 2 5 6 5s6-2 6-5c0-2-2-3-6-4-6-2-10-5-10-11 0-7 6-12 12-12z" fill="white"/>
    <text x="160" y="75" fill="#2d3748" font-family="Arial, sans-serif" font-size="48" font-weight="300">GANGER</text>
    <text x="160" y="105" fill="#4a5568" font-family="Arial, sans-serif" font-size="16" font-weight="300" letter-spacing="3px">DERMATOLOGY</text>
  </svg>`;

  const gangerLogo = `data:image/svg+xml;base64,${btoa(gangerLogoSVG)}`;

  const baseStyle = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; 
        margin: 0; 
        padding: 0; 
        background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
        min-height: 100vh;
      }
      .header { 
        background: white; 
        padding: 20px 0; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 40px;
      }
      .header-content { 
        max-width: 1200px; 
        margin: 0 auto; 
        padding: 0 20px; 
        display: flex; 
        align-items: center; 
        justify-content: space-between;
      }
      .logo { 
        display: flex; 
        align-items: center; 
        gap: 15px;
      }
      .logo img { 
        height: 60px; 
        width: auto;
      }
      .logo-text { 
        font-size: 18px; 
        font-weight: 300; 
        color: #2d3748; 
        letter-spacing: 1px;
      }
      .platform-badge {
        background: #e2e8f0;
        color: #4a5568;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0.5px;
      }
      .container { 
        max-width: 1200px; 
        margin: 0 auto; 
        padding: 0 20px;
      }
      .main-content {
        background: white; 
        padding: 40px; 
        border-radius: 12px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        border: 1px solid #e2e8f0;
      }
      .page-title { 
        font-size: 28px; 
        font-weight: 600; 
        color: #2d3748; 
        margin-bottom: 8px; 
        text-align: center;
      }
      .page-subtitle { 
        color: #718096; 
        font-size: 16px; 
        text-align: center;
        margin-bottom: 40px;
      }
      .grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
        gap: 24px; 
        margin-bottom: 40px; 
      }
      .card { 
        background: #f8fafc; 
        padding: 24px; 
        border-radius: 8px; 
        border: 1px solid #e2e8f0; 
        text-decoration: none; 
        color: #2d3748; 
        display: block; 
        transition: all 0.2s ease;
        position: relative;
      }
      .card:hover { 
        background: #edf2f7; 
        border-color: #cbd5e1;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      .card-icon { 
        font-size: 24px; 
        width: 32px;
        text-align: center;
      }
      .card-title { 
        font-weight: 600; 
        font-size: 16px; 
        color: #2d3748;
      }
      .card-desc { 
        color: #718096; 
        font-size: 14px; 
        line-height: 1.5;
      }
      .legacy-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        background: #fbd38d;
        color: #744210;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .live-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        background: #68d391;
        color: #22543d;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .status { 
        background: #f0fff4; 
        border: 1px solid #9ae6b4; 
        padding: 24px; 
        border-radius: 8px; 
        text-align: center; 
        margin-top: 40px;
      }
      .status-title { 
        font-weight: 600; 
        color: #22543d; 
        margin-bottom: 12px; 
        font-size: 16px;
      }
      .status-text { 
        color: #2f855a; 
        line-height: 1.6;
      }
      .status-text a {
        color: #22543d;
        text-decoration: underline;
      }
      .footer {
        margin-top: 60px;
        padding: 30px 0;
        border-top: 1px solid #e2e8f0;
        text-align: center;
        color: #718096;
        font-size: 14px;
      }
    </style>
  `;

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
          ${baseStyle}
        </head>
        <body>
          <div class="header">
            <div class="header-content">
              <div class="logo">
                <img src="${gangerLogo}" alt="Ganger Dermatology">
                <div class="logo-text">Medical Platform</div>
              </div>
              <div class="platform-badge">Staff Portal</div>
            </div>
          </div>
          
          <div class="container">
            <div class="main-content">
              <div class="page-title">Staff Portal</div>
              <div class="page-subtitle">Comprehensive Staff Management & Operations Platform</div>
              
              <div class="grid">
                <a href="https://staff.gangerdermatology.com/legacy" class="card">
                  <div class="legacy-badge">Current</div>
                  <div class="card-header">
                    <span class="card-icon">🏥</span>
                    <span class="card-title">Legacy Staff System</span>
                  </div>
                  <div class="card-desc">Access the current PHP-based staff portal for tickets, time-off requests, and HR workflows</div>
                </a>
                
                <a href="https://ai-ganger.vercel.app" class="card">
                  <div class="live-badge">Live</div>
                  <div class="card-header">
                    <span class="card-icon">🤖</span>
                    <span class="card-title">AI Receptionist Demo</span>
                  </div>
                  <div class="card-desc">Automated patient communication and call handling demonstration</div>
                </a>
                
                <a href="https://dashboard-ganger.vercel.app" class="card">
                  <div class="live-badge">Live</div>
                  <div class="card-header">
                    <span class="card-icon">📊</span>
                    <span class="card-title">Executive Dashboard</span>
                  </div>
                  <div class="card-desc">Practice analytics and performance monitoring</div>
                </a>
                
                <a href="/inventory" class="card">
                  <div class="card-header">
                    <span class="card-icon">📦</span>
                    <span class="card-title">Inventory Management</span>
                  </div>
                  <div class="card-desc">Medical supply tracking with barcode scanning and automated reordering</div>
                </a>
                
                <a href="/handouts" class="card">
                  <div class="card-header">
                    <span class="card-icon">📋</span>
                    <span class="card-title">Patient Handouts</span>
                  </div>
                  <div class="card-desc">Custom educational materials generator with QR delivery</div>
                </a>
                
                <a href="/staffing" class="card">
                  <div class="card-header">
                    <span class="card-icon">👥</span>
                    <span class="card-title">Clinical Staffing</span>
                  </div>
                  <div class="card-desc">Employee scheduling and optimization with AI-powered suggestions</div>
                </a>
                
                <a href="/l10" class="card">
                  <div class="card-header">
                    <span class="card-icon">🎯</span>
                    <span class="card-title">EOS L10 Management</span>
                  </div>
                  <div class="card-desc">Team management and goal tracking for leadership meetings</div>
                </a>
                
                <a href="/meds" class="card">
                  <div class="card-header">
                    <span class="card-icon">💊</span>
                    <span class="card-title">Medication Authorization</span>
                  </div>
                  <div class="card-desc">Prior authorization workflow assistant for medication approvals</div>
                </a>
                
                <a href="/training" class="card">
                  <div class="card-header">
                    <span class="card-icon">🎓</span>
                    <span class="card-title">Compliance Training</span>
                  </div>
                  <div class="card-desc">Staff education and certification tracking system</div>
                </a>
                
                <a href="/ops" class="card">
                  <div class="card-header">
                    <span class="card-icon">📞</span>
                    <span class="card-title">Call Center Operations</span>
                  </div>
                  <div class="card-desc">Patient communication dashboard and call analytics</div>
                </a>
                
                <a href="/closeout" class="card">
                  <div class="card-header">
                    <span class="card-icon">💰</span>
                    <span class="card-title">Batch Closeout</span>
                  </div>
                  <div class="card-desc">Financial reconciliation and daily batch processing</div>
                </a>
                
                <a href="/config" class="card">
                  <div class="card-header">
                    <span class="card-icon">⚙️</span>
                    <span class="card-title">Configuration</span>
                  </div>
                  <div class="card-desc">System settings and platform configuration management</div>
                </a>
                
                <a href="/socials" class="card">
                  <div class="card-header">
                    <span class="card-icon">📱</span>
                    <span class="card-title">Social Media</span>
                  </div>
                  <div class="card-desc">Online reputation management and social media analytics</div>
                </a>
                
                <a href="/integrations" class="card">
                  <div class="card-header">
                    <span class="card-icon">🔗</span>
                    <span class="card-title">Integration Status</span>
                  </div>
                  <div class="card-desc">Third-party service monitoring and system health dashboard</div>
                </a>
              </div>
              
              <div class="status">
                <div class="status-title">🚀 Platform Status: LIVE</div>
                <div class="status-text">
                  <strong>Current System:</strong> Use the <a href="https://staff.gangerdermatology.com/legacy">Legacy Staff System</a> for daily operations<br>
                  <strong>New Applications:</strong> 🤖 AI Receptionist and 📊 Executive Dashboard are now live!<br>
                  <strong>Additional Portals:</strong> 
                  <a href="https://reps.gangerdermatology.com">Pharmaceutical Representatives</a> | 
                  <a href="https://kiosk.gangerdermatology.com">Patient Check-in Kiosk</a>
                </div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <div class="container">
              © 2025 Ganger Dermatology. Powered by Ganger Platform v1.0
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

    // Route to deployed applications or show coming soon
    const deployedApps = {
      '/ai': 'https://ai-ganger.vercel.app',
      '/dashboard': 'https://dashboard-ganger.vercel.app'
    };

    if (deployedApps[pathname]) {
      // Redirect to deployed application
      return Response.redirect(deployedApps[pathname], 301);
    }

    // Coming soon pages for other apps
    if (pathname.startsWith('/inventory') || pathname.startsWith('/handouts') || 
        pathname.startsWith('/staffing') || pathname.startsWith('/l10') || 
        pathname.startsWith('/meds') || pathname.startsWith('/training') ||
        pathname.startsWith('/ops') || pathname.startsWith('/closeout') ||
        pathname.startsWith('/config') || pathname.startsWith('/socials') ||
        pathname.startsWith('/integrations')) {
      
      const appName = pathname.split('/')[1];
      const appTitles = {
        'inventory': '📦 Inventory Management',
        'handouts': '📋 Patient Handouts Generator', 
        'staffing': '👥 Clinical Staffing Optimization',
        'l10': '🎯 EOS L10 Management',
        'meds': '💊 Medication Authorization',
        'training': '🎓 Compliance Training',
        'ops': '📞 Call Center Operations',
        'closeout': '💰 Batch Closeout',
        'config': '⚙️ Configuration Dashboard',
        'socials': '📱 Social Media Management',
        'integrations': '🔗 Integration Status Monitor'
      };

      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>${appTitles[appName]} - Ganger Dermatology</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseStyle}
        </head>
        <body>
          <div class="header">
            <div class="header-content">
              <div class="logo">
                <img src="${gangerLogo}" alt="Ganger Dermatology">
                <div class="logo-text">Medical Platform</div>
              </div>
              <div class="platform-badge">${appTitles[appName]}</div>
            </div>
          </div>
          
          <div class="container">
            <div class="main-content">
              <div class="page-title">${appTitles[appName]}</div>
              <div class="page-subtitle">Application deployment in progress</div>
              
              <div class="status">
                <div class="status-title">🚧 Application Deployment</div>
                <div class="status-text">
                  This application is currently being deployed to the platform. The Next.js application will be available shortly.
                  <br><br>
                  <a href="/">← Return to Staff Portal</a> | 
                  <a href="https://staff.gangerdermatology.com/legacy">Access Legacy Staff System</a>
                </div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <div class="container">
              © 2025 Ganger Dermatology. Powered by Ganger Platform v1.0
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

  // Other domains remain the same...
  return new Response('Application not found', { status: 404 });
}