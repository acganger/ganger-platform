// 🔄 Ganger Platform - Staff Portal Path-Based Router
// Routes staff.gangerdermatology.com/* to appropriate applications

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // 🎯 Path-based routing configuration
    const workingRoutes = {
      '/status': 'ganger-integration-status-prod.workers.dev',
      '/meds': 'ganger-medication-auth-prod.workers.dev'
    };
    
    const comingSoonApps = [
      '/inventory', '/handouts', '/l10', '/dashboard', '/compliance', 
      '/phones', '/batch', '/config', '/social', '/pepe', '/staffing'
    ];
    
    // 🏠 Check for working application routes
    for (const [path, targetDomain] of Object.entries(workingRoutes)) {
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