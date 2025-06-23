/**
 * Simple R2 Test with PUT support
 * Based exactly on Cloudflare R2 documentation examples
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1) || 'index.html';
    
    // Health check
    if (key === 'health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        binding: !!env.STATIC_ASSETS,
        bucket_name: 'ganger-eos-l10-assets',
        method: request.method
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      switch (request.method) {
        case 'PUT':
          // Upload object to R2
          await env.STATIC_ASSETS.put(key, request.body);
          return new Response(`Put ${key} successfully!`);
          
        case 'GET':
          // Get object from R2 (exact Cloudflare pattern)
          const object = await env.STATIC_ASSETS.get(key);
          
          if (object === null) {
            return new Response(`Object ${key} not found`, { status: 404 });
          }
          
          return new Response(object.body, {
            headers: {
              'Content-Type': key.endsWith('.html') ? 'text/html' : 'application/octet-stream',
              'Cache-Control': 'public, max-age=3600'
            }
          });
          
        case 'DELETE':
          // Delete object from R2
          await env.STATIC_ASSETS.delete(key);
          return new Response(`Deleted ${key}!`);
          
        default:
          return new Response('Method not allowed', { status: 405 });
      }
      
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  }
};