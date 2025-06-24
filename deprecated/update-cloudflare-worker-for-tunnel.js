// Updated Cloudflare Worker to route through tunnel

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Define the tunnel URL
    const TUNNEL_URL = 'https://vm.gangerdermatology.com';
    
    // Route specific apps through the tunnel
    const tunnelRoutes = [
      '/l10',
      '/inventory', 
      '/handouts',
      '/tickets',
      '/staff-portal',
      '/lunch',
      '/pharma',
      '/checkin-kiosk',
      '/medication-auth'
    ];
    
    // Check if this path should go through the tunnel
    for (const route of tunnelRoutes) {
      if (pathname === route || pathname.startsWith(route + '/')) {
        // Proxy to tunnel
        const tunnelUrl = new URL(pathname, TUNNEL_URL);
        tunnelUrl.search = url.search;
        
        try {
          const response = await fetch(tunnelUrl.toString(), {
            method: request.method,
            headers: request.headers,
            body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
          });
          
          // Clone response to modify headers if needed
          const modifiedResponse = new Response(response.body, response);
          
          // Ensure cookies work across the domain
          const setCookieHeader = modifiedResponse.headers.get('set-cookie');
          if (setCookieHeader) {
            // Modify cookie to work on parent domain
            const modifiedCookie = setCookieHeader.replace(
              /domain=[^;]+/gi, 
              'domain=.gangerdermatology.com'
            );
            modifiedResponse.headers.set('set-cookie', modifiedCookie);
          }
          
          return modifiedResponse;
        } catch (error) {
          console.error(`Error proxying ${pathname} to tunnel:`, error);
          return new Response('Service temporarily unavailable', { status: 503 });
        }
      }
    }
    
    // Handle other routes (existing logic)
    // ... rest of your worker code ...
  }
};