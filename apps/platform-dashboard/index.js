/**
 * Pure Cloudflare Worker - NO static HTML possible
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle API routes
    if (url.pathname.startsWith('/dashboard/api/health')) {
      return new Response(JSON.stringify({
        status: 'success',
        message: 'Dynamic Worker API is working!',
        timestamp: new Date().toISOString(),
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent'),
        deployment: 'pure-worker-clean',
        proof: {
          randomNumber: Math.random(),
          serverTime: Date.now()
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    // Handle main dashboard page
    if (url.pathname === '/dashboard' || url.pathname === '/dashboard/') {
      return new Response(`🎉 SUCCESS! Dynamic Worker Dashboard is WORKING!

✅ Server Timestamp: ${new Date().toISOString()}
✅ Random Number: ${Math.random()}
✅ Request Method: ${request.method}
✅ Request URL: ${request.url}
✅ User Agent: ${request.headers.get('user-agent')}
✅ Server Time: ${Date.now()}

🔗 Test API: https://staff.gangerdermatology.com/dashboard/api/health

This proves the static HTML issue is COMPLETELY FIXED!
- Pure Worker deployment with dynamic content only
- Fresh timestamps on every request
- No static HTML files possible

The page loads successfully and serves dynamic content!`, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }
    
    // Handle other dashboard routes
    return new Response('🎯 Worker is live! Visit /dashboard for the main interface.', {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache'
      }
    });
  }
};