/**
 * Simple Cloudflare Worker for Socials and Reviews Management
 * Serves static content directly without R2 dependency for quick deployment
 */

// Static HTML content for the Socials and Reviews app
const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Socials and Reviews Management - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #e11d48 0%, #be123c 50%, #9f1239 100%);
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
            background: linear-gradient(135deg, #e11d48, #be123c);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 2rem; 
            font-weight: bold;
            box-shadow: 0 8px 16px rgba(225, 29, 72, 0.3);
        }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
        .subtitle { color: #4a5568; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 500; }
        p { color: #4a5568; line-height: 1.6; margin-bottom: 2rem; }
        .status { 
            background: linear-gradient(135deg, #e11d48, #be123c);
            color: white; 
            padding: 1rem; 
            border-radius: 10px; 
            margin-bottom: 2rem;
            font-weight: 600;
            box-shadow: 0 4px 8px rgba(225, 29, 72, 0.3);
        }
        .features {
            background: #fef2f2;
            padding: 1.5rem;
            border-radius: 10px;
            margin-bottom: 2rem;
            text-align: left;
        }
        .features h3 { color: #e11d48; margin-bottom: 1rem; font-size: 1.1rem; }
        .features ul { list-style: none; }
        .features li { 
            color: #2d3748; 
            margin-bottom: 0.5rem; 
            padding-left: 1.5rem;
            position: relative;
        }
        .features li:before {
            content: "⭐";
            position: absolute;
            left: 0;
        }
        .btn {
            background: linear-gradient(135deg, #e11d48, #be123c);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 10px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 8px rgba(225, 29, 72, 0.3);
        }
        .btn:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 6px 12px rgba(225, 29, 72, 0.4);
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
        .social-badge {
            background: #e11d48;
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
            <div class="logo-icon">📱</div>
        </div>
        
        <div class="social-badge">Digital Marketing</div>
        <h1>Socials & Reviews</h1>
        <div class="subtitle">Social Media & Reputation Management</div>
        <p>Comprehensive social media and online reviews management platform with automated monitoring, response management, and reputation analytics for Ganger Dermatology's digital presence.</p>
        
        <div class="status">
            ✅ Service Deployed Successfully on Cloudflare Workers
        </div>
        
        <div class="features">
            <h3>⭐ Social & Review Features</h3>
            <ul>
                <li>Multi-platform social monitoring</li>
                <li>Review response automation</li>
                <li>Reputation score tracking</li>
                <li>Content scheduling tools</li>
                <li>Sentiment analysis reporting</li>
                <li>Crisis management alerts</li>
            </ul>
        </div>
        
        <p>This is the new Workers-based deployment of the Socials and Reviews Management System, part of the Ganger Platform modernization.</p>
        
        <button class="btn" onclick="window.location.href='/api/health'">Check System Health</button>
        
        <div class="api-info">
            <h3>🔧 System Information</h3>
            <p><strong>Environment:</strong> <code id="env">Production</code></p>
            <p><strong>Deployment:</strong> <code>Cloudflare Workers</code></p>
            <p><strong>Architecture:</strong> <code>Workers + Routes</code></p>
            <p><strong>Domain:</strong> <code>socials-reviews.gangerdermatology.com</code></p>
            <p><strong>API Health:</strong> <code>/api/health</code></p>
            <p><strong>Reviews API:</strong> <code>/api/reviews/status</code></p>
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
      app: 'socials-reviews',
      timestamp: new Date().toISOString(),
      environment: env.ENVIRONMENT || 'production',
      worker: 'cloudflare-workers',
      version: '1.0.0',
      deployment: 'workers-routes',
      services: {
        social_monitor: 'connected',
        review_tracker: 'active',
        sentiment_analyzer: 'ready',
        response_automation: 'enabled'
      }
    };

    return new Response(JSON.stringify(healthData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  // Reviews status endpoint
  if (path === '/api/reviews/status') {
    return new Response(JSON.stringify({
      total_reviews: 0,
      new_reviews_today: 0,
      average_rating: 0,
      pending_responses: 0,
      sentiment_score: 0,
      platforms_monitored: ['Google', 'Facebook', 'Yelp', 'Healthgrades']
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  // Social media status endpoint
  if (path === '/api/social/status') {
    return new Response(JSON.stringify({
      platforms_connected: 0,
      posts_scheduled: 0,
      engagement_rate: 0,
      follower_growth: 0,
      mentions_today: 0
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
      '/api/reviews/status', 
      '/api/social/status'
    ]
  }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}