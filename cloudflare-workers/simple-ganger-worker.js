// 🚀 Ganger Platform - Simplified Worker (No R2 Required)
// Routes to individual app deployments until R2 is enabled

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const pathname = url.pathname;

    // 📊 Analytics tracking (if available)
    if (env.GANGER_ANALYTICS) {
      ctx.waitUntil(
        env.GANGER_ANALYTICS.writeDataPoint({
          blobs: [hostname, pathname, request.method],
          doubles: [Date.now()],
          indexes: [hostname]
        }).catch(() => {})
      );
    }

    // 🌐 Route based on hostname and path
    const appConfig = getAppConfig(hostname, pathname);
    
    if (!appConfig) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ganger Platform</title>
          <style>
            body { font-family: -apple-system, sans-serif; margin: 40px; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
            h1 { color: #1e40af; margin-bottom: 20px; }
            .links { display: grid; gap: 12px; margin-top: 30px; }
            .link { display: block; padding: 16px; background: #f1f5f9; border-radius: 8px; text-decoration: none; color: #334155; font-weight: 500; }
            .link:hover { background: #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🏥 Ganger Dermatology Platform</h1>
            <p>Welcome to the Ganger Platform medical practice management suite.</p>
            <div class="links">
              <a href="https://staff.gangerdermatology.com" class="link">🏥 Staff Portal (Main Hub)</a>
              <a href="https://reps.gangerdermatology.com" class="link">💊 Pharmaceutical Representatives</a>
              <a href="https://kiosk.gangerdermatology.com" class="link">🖥️ Patient Check-in Kiosk</a>
            </div>
          </div>
        </body>
        </html>
      `, { 
        status: 200, 
        headers: { 'Content-Type': 'text/html' } 
      });
    }

    try {
      // 🎯 Route to appropriate app deployment
      let targetUrl;
      
      if (hostname === 'staff.gangerdermatology.com') {
        // Staff portal with path-based routing
        if (pathname.startsWith('/inventory')) {
          targetUrl = 'https://ganger-inventory.vercel.app' + pathname.replace('/inventory', '');
        } else if (pathname.startsWith('/handouts')) {
          targetUrl = 'https://ganger-handouts.vercel.app' + pathname.replace('/handouts', '');
        } else if (pathname.startsWith('/staffing')) {
          targetUrl = 'https://ganger-staffing.vercel.app' + pathname.replace('/staffing', '');
        } else if (pathname.startsWith('/l10')) {
          targetUrl = 'https://ganger-l10.vercel.app' + pathname.replace('/l10', '');
        } else if (pathname.startsWith('/meds')) {
          targetUrl = 'https://ganger-meds.vercel.app' + pathname.replace('/meds', '');
        } else {
          // Default to platform dashboard
          targetUrl = 'https://ganger-staff.vercel.app' + pathname;
        }
      } else if (hostname === 'reps.gangerdermatology.com') {
        targetUrl = 'https://ganger-pharma.vercel.app' + pathname;
      } else if (hostname === 'kiosk.gangerdermatology.com') {
        targetUrl = 'https://ganger-kiosk.vercel.app' + pathname;
      } else {
        targetUrl = 'https://ganger-staff.vercel.app' + pathname;
      }

      const response = await fetch(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
      });

      // 📝 Add security headers
      const headers = new Headers(response.headers);
      headers.set('X-Frame-Options', 'DENY');
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      headers.set('X-Powered-By', 'Ganger Platform v1.0');

      // 🔒 HIPAA compliance headers for medical apps
      if (appConfig.medical) {
        headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        headers.set('Content-Security-Policy', "default-src 'self' *.supabase.co *.gangerdermatology.com *.vercel.app");
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Service Unavailable</title></head>
        <body>
          <h1>🚧 Service Temporarily Unavailable</h1>
          <p>The Ganger Platform is currently being deployed. Please try again in a few minutes.</p>
          <p><a href="/">← Return to Platform Home</a></p>
        </body>
        </html>
      `, { 
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      });
    }
  }
};

// 🎯 Application routing configuration
function getAppConfig(hostname, pathname) {
  const routes = {
    'staff.gangerdermatology.com': { medical: true },
    'reps.gangerdermatology.com': { medical: false },
    'kiosk.gangerdermatology.com': { medical: true }
  };

  return routes[hostname] || null;
}