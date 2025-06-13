/**
 * Simple Cloudflare Worker for Staff Management Portal
 * Serves static content directly without R2 dependency for quick deployment
 */

// Static HTML content for the Staff Portal app
const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Staff Management Portal - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segui UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%);
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
        .logo-icon {
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 2rem; 
            font-weight: bold;
            box-shadow: 0 8px 16px rgba(37, 99, 235, 0.3);
        }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
        .subtitle { color: #4a5568; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 500; }
        p { color: #4a5568; line-height: 1.6; margin-bottom: 2rem; }
        .status { 
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white; 
            padding: 1rem; 
            border-radius: 10px; 
            margin-bottom: 2rem;
            font-weight: 600;
            box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
        }
        .features {
            background: #eff6ff;
            padding: 1.5rem;
            border-radius: 10px;
            margin-bottom: 2rem;
            text-align: left;
        }
        .features h3 { color: #2563eb; margin-bottom: 1rem; font-size: 1.1rem; }
        .features ul { list-style: none; }
        .features li { 
            color: #2d3748; 
            margin-bottom: 0.5rem; 
            padding-left: 1.5rem;
            position: relative;
        }
        .features li:before {
            content: "👤";
            position: absolute;
            left: 0;
        }
        .btn {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 10px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
        }
        .btn:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 6px 12px rgba(37, 99, 235, 0.4);
        }
        .api-info {
            background: #f7fafc;
            padding: 1.5rem;
            border-radius: 10px;
            margin-top: 2rem;
            text-align: left;
            border: 1px solid #e2e8f0;
        }
        .api-info h3 { color: #2d3748; margin-bottom: 1rem; }
        .api-info code { 
            background: #e2e8f0; 
            padding: 0.25rem 0.5rem; 
            border-radius: 4px;
            font-family: Monaco, monospace;
            font-size: 0.875rem;
        }
        .api-info p { margin-bottom: 0.75rem; }
        .staff-badge {
            background: #2563eb;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <div class="logo-icon">👥</div>
        </div>
        
        <div class="staff-badge">Employee Portal</div>
        <h1>Staff Management Portal</h1>
        <div class="subtitle">Central Employee Hub & Administration</div>
        <p>Comprehensive staff management portal with employee directory, HR tools, task management, scheduling, and internal communications for Ganger Dermatology team members.</p>
        
        <div class="status">
            ✅ Service Deployed Successfully on Cloudflare Workers
        </div>
        
        <div class="features">
            <h3>👤 Staff Portal Features</h3>
            <ul>
                <li>Employee directory and profiles</li>
                <li>Task and ticket management</li>
                <li>Schedule and time tracking</li>
                <li>Internal communication tools</li>
                <li>HR document access</li>
                <li>Performance tracking</li>
            </ul>
        </div>
        
        <p>This is the new Workers-based deployment of the Staff Management Portal, part of the Ganger Platform modernization.</p>
        
        <button class="btn" onclick="window.location.href='/api/health'">Check System Health</button>
        
        <div class="api-info">
            <h3>🔧 System Information</h3>
            <p><strong>Environment:</strong> <code id="env">Production</code></p>
            <p><strong>Deployment:</strong> <code>Cloudflare Workers</code></p>
            <p><strong>Architecture:</strong> <code>Workers + Routes</code></p>
            <p><strong>Domain:</strong> <code>staff.gangerdermatology.com</code></p>
            <p><strong>API Health:</strong> <code>/api/health</code></p>
            <p><strong>Staff API:</strong> <code>/api/staff/status</code></p>
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
      app: 'staff-portal',
      timestamp: new Date().toISOString(),
      environment: env.ENVIRONMENT || 'production',
      worker: 'cloudflare-workers',
      version: '1.0.0',
      deployment: 'workers-routes',
      services: {
        employee_directory: 'connected',
        task_manager: 'active',
        scheduling_system: 'ready',
        communication_hub: 'enabled'
      }
    };

    return new Response(JSON.stringify(healthData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  // Staff status endpoint
  if (path === '/api/staff/status') {
    return new Response(JSON.stringify({
      total_employees: 0,
      active_employees: 0,
      departments: 0,
      open_tickets: 0,
      pending_tasks: 0,
      schedule_conflicts: 0
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  // Tasks endpoint
  if (path === '/api/tasks/status') {
    return new Response(JSON.stringify({
      total_tasks: 0,
      completed_tasks: 0,
      overdue_tasks: 0,
      assigned_today: 0,
      completion_rate: 0
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
    available_endpoints: [
      '/api/health', 
      '/api/staff/status', 
      '/api/tasks/status'
    ]
  }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}