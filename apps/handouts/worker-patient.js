/**
 * Patient Access Worker for Handouts Generator
 * Domain: handouts.gangerdermatology.com
 * Access: Public (no authentication required)
 * Features: QR code scanning, PDF access, limited handout viewing
 */

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Patient-Portal': 'handouts',
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
          portal: 'patient',
          service: 'handouts-generator',
          timestamp: new Date().toISOString(),
          features: ['qr-scanning', 'pdf-access', 'handout-viewing'],
          access: 'public'
        }), { 
          headers: { 
            ...securityHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      // Patient-specific API routes (limited access)
      if (url.pathname.startsWith('/api/')) {
        return await handlePatientApiRoutes(url, request, env);
      }

      // Try to serve from static assets (Next.js build)
      try {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status !== 404) {
          const newHeaders = new Headers(assetResponse.headers);
          Object.entries(securityHeaders).forEach(([key, value]) => {
            newHeaders.set(key, value);
          });
          
          return new Response(assetResponse.body, {
            status: assetResponse.status,
            statusText: assetResponse.statusText,
            headers: newHeaders
          });
        }
      } catch (error) {
        console.warn('Patient portal assets fetch failed:', error);
      }

      // Fallback to R2 bucket
      return await handleR2Content(url, env);
      
    } catch (error) {
      console.error('Patient portal error:', error);
      return new Response('Service unavailable', { 
        status: 500,
        headers: securityHeaders
      });
    }
  }
};

async function handlePatientApiRoutes(url, request, env) {
  const path = url.pathname.slice(5); // Remove '/api/'
  
  switch (path) {
    case 'templates':
      // Limited template access for patients
      const templates = [
        { id: 'post-procedure', name: 'Post-Procedure Care', category: 'procedures' },
        { id: 'skin-care', name: 'Skin Care Instructions', category: 'general' }
      ];
      
      return new Response(JSON.stringify({ templates }), { 
        headers: { 
          ...securityHeaders,
          'Content-Type': 'application/json'
        }
      });
      
    case 'download':
      // Patient download access (view-only)
      return new Response(JSON.stringify({
        message: 'Patient download endpoint',
        access: 'view-only'
      }), {
        headers: { 
          ...securityHeaders,
          'Content-Type': 'application/json'
        }
      });
      
    default:
      return new Response(JSON.stringify({
        error: 'API endpoint not available for patient access'
      }), { 
        status: 404, 
        headers: { 
          ...securityHeaders,
          'Content-Type': 'application/json'
        }
      });
  }
}

async function handleR2Content(url, env) {
  // Handle root path
  if (url.pathname === '/') {
    url.pathname = '/index.html';
  }
  
  // Handle directory paths
  if (url.pathname.endsWith('/')) {
    url.pathname += 'index.html';
  }
  
  // Handle paths without extensions
  if (!url.pathname.includes('.') && !url.pathname.endsWith('/')) {
    url.pathname += '.html';
  }

  const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
  
  try {
    const object = await env.HANDOUTS_BUCKET.get(key);
    
    if (!object) {
      const indexObject = await env.HANDOUTS_BUCKET.get('index.html');
      if (indexObject) {
        return new Response(indexObject.body, {
          headers: {
            ...securityHeaders,
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
      
      return new Response('Not Found', { 
        status: 404, 
        headers: securityHeaders 
      });
    }

    const contentType = getContentType(key);
    
    return new Response(object.body, {
      headers: {
        ...securityHeaders,
        'Content-Type': contentType,
        'Cache-Control': getCacheControl(key),
        'ETag': object.etag || '',
      },
    });
    
  } catch (error) {
    console.error('Patient portal R2 fetch error:', error);
    return new Response('Service Error', { 
      status: 500, 
      headers: securityHeaders 
    });
  }
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
    'pdf': 'application/pdf'
  };
  return types[ext || ''] || 'application/octet-stream';
}

function getCacheControl(key) {
  if (key.includes('/_next/static/')) {
    return 'public, max-age=31536000, immutable';
  }
  
  if (key.endsWith('.html')) {
    return 'public, max-age=86400';
  }
  
  if (key.endsWith('.pdf')) {
    return 'public, max-age=604800';
  }
  
  return 'public, max-age=86400';
}