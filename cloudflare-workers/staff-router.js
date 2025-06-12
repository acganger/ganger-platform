// 🔄 Ganger Platform - Staff Portal Path-Based Router
// Routes staff.gangerdermatology.com/* to appropriate applications

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // 🎯 Path-based routing configuration
    const routes = {
      '/inventory': 'inventory-production.pages.dev',
      '/handouts': 'handouts-production.pages.dev', 
      '/staffing': 'clinical-staffing-production.pages.dev',
      '/l10': 'eos-l10-production.pages.dev',
      '/meds': 'medication-auth-production.pages.dev',
      '/compliance': 'compliance-training-production.pages.dev',
      '/phones': 'call-center-ops-production.pages.dev',
      '/batch': 'batch-closeout-production.pages.dev',
      '/config': 'config-dashboard-production.pages.dev',
      '/social': 'socials-reviews-production.pages.dev',
      '/status': 'integration-status-production.pages.dev',
      '/pepe': 'ai-receptionist-production.pages.dev',
      '/dashboard': 'platform-dashboard-production.pages.dev'
    };
    
    // 🏠 Check for sub-application routes
    for (const [path, targetDomain] of Object.entries(routes)) {
      if (pathname.startsWith(path)) {
        // Create new URL with target domain
        const targetUrl = new URL(request.url);
        targetUrl.hostname = targetDomain;
        
        // Remove the path prefix for the target app
        if (pathname === path) {
          targetUrl.pathname = '/';
        } else {
          targetUrl.pathname = pathname.substring(path.length);
        }
        
        // Forward the request
        const response = await fetch(targetUrl.toString(), {
          method: request.method,
          headers: request.headers,
          body: request.body
        });
        
        // Add routing headers for debugging
        const newResponse = new Response(response.body, response);
        newResponse.headers.set('X-Ganger-Route', `${path} → ${targetDomain}`);
        newResponse.headers.set('X-Ganger-Original-Path', pathname);
        
        return newResponse;
      }
    }
    
    // 🏠 Default route - Staff Management (main portal)
    const mainStaffUrl = new URL(request.url);
    mainStaffUrl.hostname = 'staff-production.pages.dev';
    
    const response = await fetch(mainStaffUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('X-Ganger-Route', 'main-staff-portal');
    
    return newResponse;
  }
};