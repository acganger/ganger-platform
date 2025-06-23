/**
 * Simple R2 Test Worker - Verify R2 connectivity
 */

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // Test R2 binding
      if (url.pathname === '/test-r2') {
        try {
          const object = await env.STATIC_ASSETS.get('index.html');
          return new Response(JSON.stringify({
            success: true,
            objectFound: !!object,
            objectSize: object ? (await object.arrayBuffer()).byteLength : 0,
            binding: 'STATIC_ASSETS working'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            error: error.message,
            binding: 'STATIC_ASSETS failed'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Serve index.html directly
      if (url.pathname === '/' || url.pathname === '/index.html') {
        const object = await env.STATIC_ASSETS.get('index.html');
        if (object) {
          return new Response(object.body, {
            headers: { 'Content-Type': 'text/html' }
          });
        }
        return new Response('index.html not found in R2', { status: 404 });
      }

      return new Response('Test worker - use /test-r2 to verify R2 or / for index.html', {
        headers: { 'Content-Type': 'text/plain' }
      });

    } catch (error) {
      return new Response(`Test worker error: ${error.message}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};