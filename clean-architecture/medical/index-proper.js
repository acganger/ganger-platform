/**
 * Medical Apps Worker - Routes to actual deployed workers
 * This worker acts as a router for the staff portal paths
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    try {
      // For inventory, we need to check if there's an existing worker deployment
      if (path.startsWith('/inventory')) {
        // First, let's check if the inventory worker is deployed
        // If not, serve a placeholder
        return await routeToWorkerOrFallback(
          request, 
          'ganger-inventory-production.workers.dev',
          path,
          'inventory'
        );
      }
      
      if (path.startsWith('/handouts')) {
        return await routeToWorkerOrFallback(
          request,
          'ganger-handouts-production.workers.dev', 
          path,
          'handouts'
        );
      }
      
      if (path.startsWith('/meds')) {
        return await routeToWorkerOrFallback(
          request,
          'ganger-medication-auth-production.workers.dev',
          path,
          'meds'
        );
      }
      
      if (path.startsWith('/kiosk')) {
        return await routeToWorkerOrFallback(
          request,
          'ganger-checkin-kiosk-production.workers.dev',
          path,
          'kiosk'
        );
      }
      
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Medical Worker Error:', error);
      return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
    }
  }
};

async function routeToWorkerOrFallback(request, workerDomain, path, appName) {
  try {
    // Try to fetch from the actual worker
    const targetUrl = new URL(path, `https://${workerDomain}`);
    targetUrl.search = new URL(request.url).search;
    
    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual',
      // Add a timeout to avoid hanging
      signal: AbortSignal.timeout(5000)
    });
    
    // If we get a response (even 404), the worker exists
    if (response.status !== 523 && response.status !== 522) {
      return response;
    }
  } catch (error) {
    console.log(`Worker ${workerDomain} not reachable, serving fallback`);
  }
  
  // Serve fallback content
  return serveFallbackContent(appName, path);
}

function serveFallbackContent(appName, path) {
  const timestamp = new Date().toISOString();
  const appConfigs = {
    inventory: {
      title: 'Inventory Management',
      icon: '📦',
      color: '#2563eb',
      description: 'Medical supply tracking and management system'
    },
    handouts: {
      title: 'Patient Handouts',
      icon: '📋',
      color: '#1e88e5',
      description: 'Patient education materials and handout generation'
    },
    meds: {
      title: 'Medication Authorization',
      icon: '💊',
      color: '#16a34a',
      description: 'Prior authorization management and tracking'
    },
    kiosk: {
      title: 'Check-in Kiosk',
      icon: '🖥️',
      color: '#7c3aed',
      description: 'Patient check-in kiosk administration'
    }
  };
  
  const config = appConfigs[appName] || appConfigs.inventory;
  
  return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title} - Ganger Platform</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      background: ${config.color};
      color: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header h1 {
      font-size: 1.5rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .container {
      flex: 1;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      width: 100%;
    }
    .status-card {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }
    .status-card h2 {
      color: #334155;
      margin-bottom: 1rem;
      font-size: 1.25rem;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .info-item {
      background: #f1f5f9;
      padding: 1rem;
      border-radius: 6px;
    }
    .info-item label {
      font-size: 0.875rem;
      color: #64748b;
      display: block;
      margin-bottom: 0.25rem;
    }
    .info-item value {
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      color: #334155;
    }
    .deployment-notice {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 6px;
      padding: 1rem;
      margin-top: 2rem;
    }
    .deployment-notice h3 {
      color: #92400e;
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }
    .deployment-notice p {
      color: #78350f;
      font-size: 0.875rem;
    }
    .timestamp {
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      color: #64748b;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${config.icon} ${config.title}</h1>
  </div>
  
  <div class="container">
    <div class="status-card">
      <h2>Application Status</h2>
      <p>${config.description}</p>
      
      <div class="info-grid">
        <div class="info-item">
          <label>Request Path</label>
          <value>${path}</value>
        </div>
        <div class="info-item">
          <label>Worker Status</label>
          <value>Fallback Mode</value>
        </div>
        <div class="info-item">
          <label>Environment</label>
          <value>Production</value>
        </div>
        <div class="info-item">
          <label>Timestamp</label>
          <value class="timestamp">${timestamp}</value>
        </div>
      </div>
    </div>
    
    <div class="deployment-notice">
      <h3>⚠️ Application Deployment Pending</h3>
      <p>The ${config.title} application is not yet deployed to this route. This is a temporary placeholder page served by the medical worker router.</p>
      <p style="margin-top: 0.5rem;">To deploy the actual application:</p>
      <ol style="margin-left: 1.5rem; margin-top: 0.5rem; font-size: 0.875rem;">
        <li>Build the application: <code>cd apps/${appName} && npm run build</code></li>
        <li>Deploy to Cloudflare: <code>npm run deploy</code></li>
        <li>The route will automatically start serving the real application</li>
      </ol>
    </div>
  </div>
</body>
</html>
  `, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Served-By': 'ganger-medical-worker',
      'X-App-Name': appName,
      'X-Timestamp': timestamp
    }
  });
}