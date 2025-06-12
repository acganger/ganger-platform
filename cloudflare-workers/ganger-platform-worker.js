// 🚀 Ganger Platform - Unified Cloudflare Worker
// Serves all applications with intelligent routing and static asset delivery

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
        })
      );
    }

    // 🌐 Route based on hostname and path
    const appConfig = getAppConfig(hostname, pathname);
    
    if (!appConfig) {
      return new Response('Application not found', { status: 404 });
    }

    try {
      // 🎯 Fetch from the appropriate app build
      const targetUrl = `https://ganger-platform-assets.pages.dev/${appConfig.path}${pathname === '/' ? '' : pathname}`;
      
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });

      // 📝 Add security headers
      const headers = new Headers(response.headers);
      headers.set('X-Frame-Options', 'DENY');
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      headers.set('X-Powered-By', 'Ganger Platform v1.0');

      // 🔒 HIPAA compliance headers
      if (appConfig.medical) {
        headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        headers.set('Content-Security-Policy', "default-src 'self' *.supabase.co *.gangerdermatology.com");
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(`Service temporarily unavailable: ${error.message}`, { 
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};

// 🎯 Application routing configuration
function getAppConfig(hostname, pathname) {
  const routes = {
    // 🏥 Main staff portal with path-based routing
    'staff.gangerdermatology.com': {
      '/': { path: 'staff', medical: true, app: 'platform-dashboard' },
      '/inventory': { path: 'inventory', medical: true, app: 'inventory' },
      '/handouts': { path: 'handouts', medical: true, app: 'handouts' },
      '/staffing': { path: 'clinical-staffing', medical: true, app: 'clinical-staffing' },
      '/l10': { path: 'eos-l10', medical: false, app: 'eos-l10' },
      '/meds': { path: 'medication-auth', medical: true, app: 'medication-auth' },
      '/training': { path: 'compliance-training', medical: true, app: 'compliance-training' },
      '/ops': { path: 'call-center-ops', medical: true, app: 'call-center-ops' },
      '/closeout': { path: 'batch-closeout', medical: true, app: 'batch-closeout' },
      '/config': { path: 'config-dashboard', medical: false, app: 'config-dashboard' },
      '/socials': { path: 'socials-reviews', medical: false, app: 'socials-reviews' },
      '/integrations': { path: 'integration-status', medical: false, app: 'integration-status' },
      '/ai': { path: 'ai-receptionist', medical: true, app: 'ai-receptionist' }
    },
    
    // 💊 Pharmaceutical representatives portal
    'reps.gangerdermatology.com': {
      '/': { path: 'pharma-scheduling', medical: false, app: 'pharma-scheduling' }
    },
    
    // 🖥️ Patient check-in kiosk
    'kiosk.gangerdermatology.com': {
      '/': { path: 'checkin-kiosk', medical: true, app: 'checkin-kiosk' }
    }
  };

  // Find matching route
  const hostRoutes = routes[hostname];
  if (!hostRoutes) return null;

  // Check for exact path match first
  if (hostRoutes[pathname]) {
    return hostRoutes[pathname];
  }

  // Check for path prefix matches (for SPA routing)
  for (const [routePath, config] of Object.entries(hostRoutes)) {
    if (routePath !== '/' && pathname.startsWith(routePath)) {
      return config;
    }
  }

  // Default to root route
  return hostRoutes['/'] || null;
}