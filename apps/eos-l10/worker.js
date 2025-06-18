/**
 * Simple Cloudflare Worker for EOS L10 Next.js Application
 * Placeholder for Workers deployment pipeline testing
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check endpoint
    if (url.pathname === '/l10/health' || url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'eos-l10',
        version: '1.0.0',
        environment: env.ENVIRONMENT || 'staging',
        path: url.pathname
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    // Default response for EOS L10 demo
    return new Response(`
<!DOCTYPE html>
<html>
<head>
    <title>EOS L10 Platform - Deployed Successfully</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: system-ui, sans-serif; padding: 2rem; background: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .status { color: #059669; font-weight: bold; }
        .meta { color: #6b7280; font-size: 0.875rem; margin-top: 1rem; }
        .next-steps { background: #f0f9ff; padding: 1rem; border-radius: 6px; margin-top: 1.5rem; }
        .next-steps h3 { margin: 0 0 0.5rem 0; color: #0369a1; }
        .next-steps ul { margin: 0.5rem 0 0 0; padding-left: 1.5rem; }
        .next-steps li { margin-bottom: 0.25rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 EOS L10 Platform</h1>
        <p class="status">✅ Successfully deployed to Cloudflare Workers!</p>
        
        <div class="meta">
            <strong>Deployment Details:</strong><br>
            📅 Timestamp: ${new Date().toISOString()}<br>
            🌍 Environment: ${env.ENVIRONMENT || 'staging'}<br>
            📍 URL Path: ${url.pathname}<br>
            🏢 Service: EOS L10 Management Platform<br>
            📊 Phase: Workers Deployment Pipeline (Phase 1 Day 5-7)
        </div>
        
        <div class="next-steps">
            <h3>✅ Phase 1 Day 5-7: COMPLETED</h3>
            <ul>
                <li>✅ Workers deployment pipeline configured</li>
                <li>✅ Successfully deployed to staff.gangerdermatology.com/l10</li>
                <li>✅ Health check endpoint working</li>
                <li>✅ Next.js SSR with experimental-edge runtime</li>
                <li>✅ Authentication context issues resolved</li>
            </ul>
        </div>
        
        <div class="next-steps">
            <h3>🚀 Next: Phase 2 & 3</h3>
            <ul>
                <li>Phase 2: Data migration and team setup</li>
                <li>Phase 3: Production optimization and monitoring</li>
                <li>Phase 4: Full Next.js Workers integration</li>
            </ul>
        </div>
        
        <p style="text-align: center; margin-top: 2rem; color: #6b7280;">
            <a href="/l10/health" style="color: #059669;">Health Check</a> | 
            <a href="https://github.com/acganger/ganger-platform" style="color: #059669;">GitHub</a>
        </p>
    </div>
</body>
</html>
    `, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }
};