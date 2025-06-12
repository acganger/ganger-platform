/**
 * Simple Cloudflare Worker for Medication Authorization App
 * Serves static content directly without R2 dependency for quick deployment
 */

// Static HTML content for the medication auth app
const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medication Authorization - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 3rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            width: 90%;
        }
        .logo { width: 80px; height: 80px; margin: 0 auto 2rem; }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
        p { color: #4a5568; line-height: 1.6; margin-bottom: 2rem; }
        .status { 
            background: #48bb78; 
            color: white; 
            padding: 1rem; 
            border-radius: 10px; 
            margin-bottom: 2rem;
            font-weight: 600;
        }
        .btn {
            background: #4299e1;
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 10px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
        }
        .btn:hover { background: #3182ce; transform: translateY(-2px); }
        .api-info {
            background: #f7fafc;
            padding: 1.5rem;
            border-radius: 10px;
            margin-top: 2rem;
            text-align: left;
        }
        .api-info h3 { color: #2d3748; margin-bottom: 1rem; }
        .api-info code { 
            background: #e2e8f0; 
            padding: 0.25rem 0.5rem; 
            border-radius: 4px;
            font-family: Monaco, monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <!-- Ganger Dermatology Logo would go here -->
            <div style="width: 80px; height: 80px; background: #4299e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: bold;">GD</div>
        </div>
        
        <h1>Medication Authorization</h1>
        <p>Prior Authorization Assistant for Ganger Dermatology</p>
        
        <div class="status">
            ✅ Service Deployed Successfully on Cloudflare Workers
        </div>
        
        <p>This is the new Workers-based deployment of the Medication Authorization application, part of the Ganger Platform modernization.</p>
        
        <button class="btn" onclick="window.location.href='/api/health'">Check API Health</button>
        
        <div class="api-info">
            <h3>🔧 Development Information</h3>
            <p><strong>Environment:</strong> <code id="env">Production</code></p>
            <p><strong>Deployment:</strong> <code>Cloudflare Workers</code></p>
            <p><strong>Architecture:</strong> <code>Workers + Routes</code></p>
            <p><strong>Domain:</strong> <code>meds.gangerdermatology.com</code></p>
            <p><strong>API Endpoint:</strong> <code>/api/health</code></p>
        </div>
    </div>

    <script>
        // Update environment info
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('env').textContent = data.environment || 'Production';
            })
            .catch(err => console.log('API check failed:', err));
    </script>
</body>
</html>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle API routes
    if (path.startsWith('/api/')) {
      return handleApiRoute(request, env, path);
    }

    // For all other routes, serve the index page
    return new Response(INDEX_HTML, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=300',
        'X-Powered-By': 'Cloudflare Workers'
      }
    });
  }
};

async function handleApiRoute(request, env, path) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  if (path === '/api/health') {
    const healthData = {
      status: 'healthy',
      app: 'medication-auth',
      timestamp: new Date().toISOString(),
      environment: env.ENVIRONMENT || 'production',
      worker: 'cloudflare-workers',
      version: '1.0.0',
      deployment: 'workers-routes'
    };

    return new Response(JSON.stringify(healthData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  // Authorization status endpoint
  if (path === '/api/auth/status') {
    return new Response(JSON.stringify({
      authenticated: false,
      message: 'Authentication not yet implemented',
      supabase_configured: !!(env.NEXT_PUBLIC_SUPABASE_URL),
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  // Default API response
  return new Response(JSON.stringify({
    error: 'API endpoint not found',
    available_endpoints: ['/api/health', '/api/auth/status']
  }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}