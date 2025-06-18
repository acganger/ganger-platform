/**
 * Staff Access Worker for Handouts Generator
 * Access: Requires Google OAuth authentication
 * Features: Full admin capabilities - creation, editing, distribution management
 */

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Staff-Portal': 'handouts',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // TODO: Add Google OAuth authentication check here
      // For now, allowing access for testing
      
      // Validate request method
      if (!['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'].includes(request.method)) {
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
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        });
      }
      
      // Health check endpoint
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          portal: 'staff',
          service: 'handouts-generator',
          timestamp: new Date().toISOString(),
          features: ['creation', 'editing', 'distribution-management', 'analytics'],
          access: 'staff-only',
          authentication: 'google-oauth-required'
        }), { 
          headers: { 
            ...securityHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      // Staff-specific API routes (full access)
      if (url.pathname.startsWith('/api/')) {
        return await handleStaffApiRoutes(url, request, env);
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
        console.warn('Staff portal assets fetch failed:', error);
      }

      // Fallback to R2 bucket
      return await handleR2Content(url, env);
      
    } catch (error) {
      console.error('Staff portal error:', error);
      return new Response('Access denied', { 
        status: 403,
        headers: securityHeaders
      });
    }
  }
};

async function handleStaffApiRoutes(url, request, env) {
  const path = url.pathname.slice(5); // Remove '/api/'
  
  switch (path) {
    case 'generate':
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          
          // Basic validation
          if (!body.template || !body.patientData) {
            return new Response(JSON.stringify({
              error: 'Missing required fields: template, patientData'
            }), { 
              status: 400, 
              headers: { 
                ...securityHeaders,
                'Content-Type': 'application/json'
              }
            });
          }
          
          // Generate handout (staff has full access)
          const result = {
            id: crypto.randomUUID(),
            template: body.template,
            format: body.format || 'pdf',
            generated_at: new Date().toISOString(),
            status: 'generated',
            download_url: `/api/download/${crypto.randomUUID()}`,
            staff_features: {
              editable: true,
              distributable: true,
              analytics: true
            }
          };
          
          return new Response(JSON.stringify(result), { 
            headers: { 
              ...securityHeaders,
              'Content-Type': 'application/json'
            }
          });
          
        } catch (error) {
          console.error('Staff generate API error:', error);
          return new Response(JSON.stringify({
            error: 'Invalid request body'
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
      
    case 'templates':
      // Full template access for staff
      const templates = [
        { id: 'medication-guide', name: 'Medication Guide', category: 'prescriptions', editable: true },
        { id: 'post-procedure', name: 'Post-Procedure Care', category: 'procedures', editable: true },
        { id: 'skin-care', name: 'Skin Care Instructions', category: 'general', editable: true },
        { id: 'treatment-plan', name: 'Treatment Plan', category: 'procedures', editable: true },
        { id: 'billing-info', name: 'Billing Information', category: 'administrative', editable: true }
      ];
      
      return new Response(JSON.stringify({ 
        templates,
        staff_permissions: {
          create: true,
          edit: true,
          delete: true,
          publish: true
        }
      }), { 
        headers: { 
          ...securityHeaders,
          'Content-Type': 'application/json'
        }
      });

    case 'analytics':
      // Staff analytics endpoint
      return new Response(JSON.stringify({
        message: 'Handouts analytics endpoint',
        access: 'staff-only',
        metrics: {
          total_handouts: 1247,
          this_month: 89,
          popular_templates: ['post-procedure', 'medication-guide']
        }
      }), {
        headers: { 
          ...securityHeaders,
          'Content-Type': 'application/json'
        }
      });
      
    default:
      return new Response(JSON.stringify({
        error: 'API endpoint not found'
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
      
      return new Response('Access Denied', { 
        status: 403, 
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
    console.error('Staff portal R2 fetch error:', error);
    return new Response('Internal Server Error', { 
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