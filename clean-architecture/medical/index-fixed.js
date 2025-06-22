/**
 * Medical Apps Worker - Proxies to actual Next.js applications
 * Apps: Inventory, Handouts, Medications, Kiosk Admin
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    try {
      // Map routes to their actual deployments
      if (path.startsWith('/inventory')) {
        // Proxy to the actual inventory Pages/Worker deployment
        const targetUrl = new URL(path, 'https://inventory-production.pages.dev');
        targetUrl.search = url.search;
        
        return fetch(targetUrl.toString(), {
          method: request.method,
          headers: request.headers,
          body: request.body,
          redirect: 'manual'
        });
      }
      
      if (path.startsWith('/handouts')) {
        // For now, check if there's a Pages deployment
        const targetUrl = new URL(path, 'https://handouts-production.pages.dev');
        targetUrl.search = url.search;
        
        // Try to proxy, fallback to dynamic content if not found
        try {
          const response = await fetch(targetUrl.toString(), {
            method: request.method,
            headers: request.headers,
            body: request.body,
            redirect: 'manual'
          });
          
          if (response.status === 404) {
            // Fallback to dynamic content
            return handleHandoutsFallback(path, request, env);
          }
          
          return response;
        } catch (e) {
          return handleHandoutsFallback(path, request, env);
        }
      }
      
      if (path.startsWith('/meds')) {
        // Check for meds deployment
        const targetUrl = new URL(path, 'https://medication-auth-production.pages.dev');
        targetUrl.search = url.search;
        
        try {
          return fetch(targetUrl.toString(), {
            method: request.method,
            headers: request.headers,
            body: request.body,
            redirect: 'manual'
          });
        } catch (e) {
          return handleMedsFallback(path, request, env);
        }
      }
      
      if (path.startsWith('/kiosk')) {
        // Check for kiosk deployment
        const targetUrl = new URL(path, 'https://checkin-kiosk-production.pages.dev');
        targetUrl.search = url.search;
        
        try {
          return fetch(targetUrl.toString(), {
            method: request.method,
            headers: request.headers,
            body: request.body,
            redirect: 'manual'
          });
        } catch (e) {
          return handleKioskFallback(path, request, env);
        }
      }
      
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Medical Worker Error:', error);
      return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
    }
  }
};

// Fallback handlers for when actual apps aren't deployed yet
async function handleHandoutsFallback(path, request, env) {
  const timestamp = new Date().toISOString();
  return new Response(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Handouts - Ganger Medical</title>
  <style>
    body { font-family: system-ui; padding: 2rem; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: #1e88e5; color: white; padding: 1.5rem; border-radius: 8px; }
    .content { background: white; padding: 2rem; margin-top: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .timestamp { font-family: monospace; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Patient Handouts Management</h1>
    </div>
    <div class="content">
      <p>Patient education materials and handout generation</p>
      <p class="timestamp">System time: ${timestamp}</p>
      <p><em>Note: This is a fallback page. The actual Next.js app may not be deployed yet.</em></p>
    </div>
  </div>
</body>
</html>
  `, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

async function handleMedsFallback(path, request, env) {
  const timestamp = new Date().toISOString();
  return new Response(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Medication Authorization - Ganger Medical</title>
  <style>
    body { font-family: system-ui; padding: 2rem; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: #16a34a; color: white; padding: 1.5rem; border-radius: 8px; }
    .content { background: white; padding: 2rem; margin-top: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .timestamp { font-family: monospace; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💊 Medication Authorization System</h1>
    </div>
    <div class="content">
      <p>Prior authorization management and tracking</p>
      <p class="timestamp">System time: ${timestamp}</p>
      <p><em>Note: This is a fallback page. The actual Next.js app may not be deployed yet.</em></p>
    </div>
  </div>
</body>
</html>
  `, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

async function handleKioskFallback(path, request, env) {
  const timestamp = new Date().toISOString();
  return new Response(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Check-in Kiosk Admin - Ganger Medical</title>
  <style>
    body { font-family: system-ui; padding: 2rem; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: #7c3aed; color: white; padding: 1.5rem; border-radius: 8px; }
    .content { background: white; padding: 2rem; margin-top: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .timestamp { font-family: monospace; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🖥️ Check-in Kiosk Administration</h1>
    </div>
    <div class="content">
      <p>Kiosk configuration and monitoring dashboard</p>
      <p class="timestamp">System time: ${timestamp}</p>
      <p><em>Note: This is a fallback page. The actual Next.js app may not be deployed yet.</em></p>
    </div>
  </div>
</body>
</html>
  `, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}