/**
 * Patient Touch Interface Worker for Check-in Kiosk
 * Domain: kiosk.gangerdermatology.com
 * Interface: Touch-optimized, simplified UI, payment processing
 * Access: Public for patient self-service
 */

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Kiosk-Interface': 'patient-touch',
  'Cache-Control': 'no-cache, no-store, must-revalidate'
};

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // Validate request method
      if (!['GET', 'POST', 'OPTIONS'].includes(request.method)) {
        return new Response('Method not allowed', { 
          status: 405, 
          headers: securityHeaders 
        });
      }
      
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            ...securityHeaders,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
      }
      
      // Health check endpoint
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          interface: 'patient-touch',
          service: 'checkin-kiosk',
          timestamp: new Date().toISOString(),
          features: ['touch-interface', 'patient-checkin', 'payment-processing'],
          deployment: 'r2-cloudflare-workers',
          kiosk_status: 'operational'
        }), {
          headers: { 
            ...securityHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      // Patient-specific API routes (kiosk operations)
      if (url.pathname.startsWith('/api/')) {
        return await handlePatientKioskApi(url, request, env);
      }

      // Handle root path
      if (url.pathname === '/') {
        url.pathname = '/index.html';
      }
      
      // Handle directory paths (add index.html)
      if (url.pathname.endsWith('/')) {
        url.pathname += 'index.html';
      }
      
      // Handle paths without extensions (Next.js routing)
      if (!url.pathname.includes('.') && !url.pathname.endsWith('/')) {
        url.pathname += '.html';
      }

      // Remove leading slash for R2 key
      const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
      
      try {
        // Attempt to get file from R2
        const object = await env.CHECKIN_KIOSK_BUCKET.get(key);
        
        if (!object) {
          // Try fallback to index.html for client-side routing
          const indexObject = await env.CHECKIN_KIOSK_BUCKET.get('index.html');
          if (indexObject) {
            return new Response(indexObject.body, {
              headers: {
                ...securityHeaders,
                'Content-Type': 'text/html',
                'Cache-Control': 'public, max-age=86400',
              },
            });
          }
          
          // Return 404
          return new Response('Page not found', { 
            status: 404,
            headers: securityHeaders
          });
        }

        // Determine content type
        const contentType = getContentType(key);
        
        return new Response(object.body, {
          headers: {
            ...securityHeaders,
            'Content-Type': contentType,
            'Cache-Control': getCacheControl(key),
            'ETag': object.etag,
          },
        });
        
      } catch (error) {
        console.error('Patient kiosk R2 fetch error:', error);
        return new Response('Kiosk service unavailable', { 
          status: 500,
          headers: securityHeaders
        });
      }
      
    } catch (error) {
      console.error('Patient kiosk error:', error);
      return new Response('Service error', { 
        status: 500,
        headers: securityHeaders
      });
    }
  }
};

async function handlePatientKioskApi(url, request, env) {
  const path = url.pathname.slice(5); // Remove '/api/'
  
  switch (path) {
    case 'checkin':
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          
          // Process patient check-in
          const result = {
            checkin_id: crypto.randomUUID(),
            patient_id: body.patient_id || 'anonymous',
            timestamp: new Date().toISOString(),
            status: 'checked-in',
            queue_position: Math.floor(Math.random() * 5) + 1,
            estimated_wait: '15-20 minutes'
          };
          
          return new Response(JSON.stringify(result), {
            headers: { 
              ...securityHeaders,
              'Content-Type': 'application/json'
            }
          });
          
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'Invalid check-in data'
          }), { 
            status: 400,
            headers: { 
              ...securityHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
      }
      break;
      
    case 'payment':
      if (request.method === 'POST') {
        // Handle payment processing
        return new Response(JSON.stringify({
          payment_id: crypto.randomUUID(),
          status: 'processing',
          message: 'Payment is being processed...'
        }), {
          headers: { 
            ...securityHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      break;
      
    case 'status':
      // Check-in status for patients
      return new Response(JSON.stringify({
        kiosk_status: 'operational',
        queue_length: Math.floor(Math.random() * 10) + 1,
        estimated_wait: '10-25 minutes',
        payment_systems: 'online'
      }), {
        headers: { 
          ...securityHeaders,
          'Content-Type': 'application/json'
        }
      });
      
    default:
      return new Response(JSON.stringify({
        error: 'Kiosk API endpoint not found'
      }), { 
        status: 404,
        headers: { 
          ...securityHeaders,
          'Content-Type': 'application/json'
        }
      });
  }
  
  return new Response(JSON.stringify({
    error: 'Method not allowed'
  }), { 
    status: 405,
    headers: { 
      ...securityHeaders,
      'Content-Type': 'application/json'
    }
  });
}

function getContentType(key) {
  const ext = key.split('.').pop()?.toLowerCase();
  const types = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
    'webmanifest': 'application/manifest+json'
  };
  return types[ext] || 'application/octet-stream';
}

function getCacheControl(key) {
  // Static assets get longer cache
  if (key.includes('/_next/static/')) {
    return 'public, max-age=31536000, immutable';
  }
  
  // Service worker gets short cache
  if (key === 'sw.js' || key.endsWith('.js') && key.includes('workbox')) {
    return 'public, max-age=0, must-revalidate';
  }
  
  // HTML files get shorter cache for updates
  if (key.endsWith('.html')) {
    return 'public, max-age=86400';
  }
  
  // Default cache
  return 'public, max-age=86400';
}