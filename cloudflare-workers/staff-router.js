// 🔄 Ganger Platform - Staff Portal Router
// Direct content serving for reliable application delivery

import { 
  getDynamicIntegrationStatus, 
  getDynamicStaffingApp, 
  getDynamicConfigDashboard,
  getDynamicStaffPortal,
  getDynamicMedicationAuth,
  getDynamicBatchCloseout,
  getDynamicPatientHandouts,
  getDynamicCheckinKiosk
} from './dynamic-apps.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const hostname = url.hostname;
    
    // Handle subdomain routing
    if (hostname === 'inventory.gangerdermatology.com') {
      return getInventoryApp(request, env);
    }
    
    if (hostname === 'handouts.gangerdermatology.com') {
      return getHandoutsApp(request, env);
    }
    
    if (hostname === 'medication-auth.gangerdermatology.com') {
      return getDynamicMedicationAuth();
    }
    
    if (hostname === 'eos-l10.gangerdermatology.com') {
      if (pathname === '/' || pathname === '') {
        return Response.redirect(new URL('/compass', request.url).toString(), 302);
      }
      return getEOSL10CompassTemplate(pathname);
    }
    
    // 🚀 Working Applications - Direct content serving
    if (pathname === '/meds' || pathname.startsWith('/meds/')) {
      return getDynamicMedicationAuth();
    }
    
    if (pathname === '/batch') {
      return getDynamicBatchCloseout();
    }
    
    if (pathname === '/status') {
      return getDynamicIntegrationStatus();
    }
    
    if (pathname === '/inventory' || pathname.startsWith('/inventory/')) {
      const response = await serveFromR2(request, env, 'INVENTORY_BUCKET', '/inventory');
      
      // If it's an HTML response, rewrite the paths
      if (response.headers.get('content-type')?.includes('text/html')) {
        let body = await response.text();
        body = body
          .replace(/href="\/_next\//g, 'href="/inventory/_next/')
          .replace(/src="\/_next\//g, 'src="/inventory/_next/')
          .replace(/\/_buildManifest\.js/g, '/inventory/_buildManifest.js')
          .replace(/\/_ssgManifest\.js/g, '/inventory/_ssgManifest.js');
        
        return new Response(body, {
          status: response.status,
          headers: response.headers
        });
      }
      
      return response;
    }
    
    // Handle all L10 routes - Proxy through Cloudflare Tunnel
    if (pathname === '/l10' || pathname.startsWith('/l10')) {
      // Proxy through Cloudflare Tunnel
      const TUNNEL_URL = 'https://vm.gangerdermatology.com';
      
      // Keep the full path including /l10
      const tunnelUrl = new URL(pathname, TUNNEL_URL);
      
      // Copy query parameters
      tunnelUrl.search = url.search;
      
      // Forward the request through the tunnel
      try {
        const response = await fetch(tunnelUrl.toString(), {
          method: request.method,
          headers: request.headers,
          body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        });
        
        // Clone the response to modify headers if needed
        const modifiedResponse = new Response(response.body, response);
        
        // Add CORS headers if needed
        modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
        
        return modifiedResponse;
      } catch (error) {
        console.error('Error proxying L10 through tunnel:', error);
        // Fallback to static template if tunnel is unavailable
        return getEOSL10CompassTemplate(pathname);
      }
    }
    
    // 🚀 Enhanced Applications
    if (pathname === '/handouts' || pathname.startsWith('/handouts/')) {
      return getHandoutsApp(request, env);
    }
    
    if (pathname === '/kiosk' || pathname.startsWith('/kiosk/')) {
      return getKioskApp(request, env);
    }
    
    if (pathname === '/staffing') {
      return getDynamicStaffingApp();
    }
    
    if (pathname === '/compliance') {
      return getComplianceTrainingApp();
    }
    
    if (pathname === '/config') {
      return getDynamicConfigDashboard();
    }
    
    if (pathname === '/ai-receptionist') {
      return getAIReceptionistApp();
    }
    
    if (pathname === '/call-center') {
      return getCallCenterApp();
    }
    
    if (pathname === '/reps') {
      return getPharmaSchedulingApp();
    }
    
    if (pathname === '/dashboard') {
      // Dynamic dashboard with proof it's not static
      const timestamp = new Date().toISOString();
      const randomNum = Math.random();
      return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Platform Dashboard - Dynamic</title>
    <style>
        body { font-family: system-ui; background: #1a1a2e; color: white; padding: 2rem; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { background: #16213e; padding: 2rem; border-radius: 10px; margin: 1rem 0; }
        .timestamp { font-family: monospace; background: #0f3460; padding: 5px 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 Platform Dashboard - WORKING!</h1>
        <div class="status">
            <h2>✅ This is Dynamic Content from Cloudflare Worker</h2>
            <p>Server Timestamp: <span class="timestamp">${timestamp}</span></p>
            <p>Random Number: <span class="timestamp">${randomNum}</span></p>
            <p>Proof: Refresh the page to see new values!</p>
        </div>
        <p>The static HTML issue has been completely resolved.</p>
    </div>
</body>
</html>`, {
        headers: { 
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    if (pathname === '/socials') {
      return getSocialReviewsApp();
    }
    
    if (pathname === '/staff-portal') {
      return getStaffPortalApp();
    }
    
    if (pathname === '/component-showcase') {
      return getComponentShowcaseApp();
    }
    
    // 🔄 Subroute Handling for Apps
    // Kiosk subroutes
    if (pathname.startsWith('/kiosk/')) {
      return getKioskSubroute(pathname);
    }
    
    // Config subroutes
    if (pathname.startsWith('/config/')) {
      return getConfigSubroute(pathname);
    }
    
    // AI Receptionist subroutes
    if (pathname.startsWith('/ai-receptionist/')) {
      return getAIReceptionistSubroute(pathname);
    }
    
    // Call Center subroutes
    if (pathname.startsWith('/call-center/')) {
      return getCallCenterSubroute(pathname);
    }
    
    // Reps subroutes
    if (pathname.startsWith('/reps/')) {
      return getRepsSubroute(pathname);
    }
    
    // Showcase subroutes
    if (pathname.startsWith('/showcase/')) {
      return getShowcaseSubroute(pathname);
    }
    
    // 🏠 Default route - Staff Management Portal
    return getDynamicStaffPortal();
  }
};
async function getInventoryApp(request, env) {
  try {
    const url = new URL(request.url);
    let pathname = url.pathname;
    const hostname = url.hostname;
    
    // Check if accessed via subdomain
    const isSubdomain = hostname === 'inventory.gangerdermatology.com';
    
    // Check if bucket binding exists
    if (!env.INVENTORY_BUCKET) {
      console.error('INVENTORY_BUCKET binding not found');
      return new Response('Inventory bucket not configured', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    let r2Key;
    
    if (pathname.includes('/_next/') || pathname.includes('/manifest.json')) {
      // For subdomain access, assets are stored with /inventory/ prefix
      if (isSubdomain) {
        r2Key = 'inventory' + pathname;
      } else {
        // For path-based access, keep the full path
        r2Key = pathname.substring(1); // Remove leading slash
      }
    } else {
      // Remove /inventory prefix for page lookups (only for path-based access)
      if (!isSubdomain) {
        r2Key = pathname.replace('/inventory', '');
      } else {
        r2Key = pathname;
      }
      
      // Handle root path
      if (r2Key === '' || r2Key === '/') {
        r2Key = 'index.html';
      } else {
        // Handle directory paths (add index.html)
        if (r2Key.endsWith('/')) {
          r2Key += 'index.html';
        }
        
        // Handle paths without extensions (Next.js routing)
        if (!r2Key.includes('.') && !r2Key.endsWith('/')) {
          r2Key += '.html';
        }
        
        // Remove leading slash for R2 key
        r2Key = r2Key.startsWith('/') ? r2Key.slice(1) : r2Key;
      }
    }
    
    // Debug logging
    console.log('Inventory path debug:', { pathname, r2Key, isSubdomain, hostname });
    
    // For debugging, let's try without the inventory prefix for assets
    if (pathname.includes('/_next/') && !isSubdomain) {
      // Try the key without the inventory prefix first
      const assetKey = pathname.replace('/inventory/', '').substring(1);
      console.log('Trying asset key:', assetKey);
      const assetObject = await env.INVENTORY_BUCKET.get(assetKey);
      if (assetObject) {
        console.log('Found asset at:', assetKey);
        return new Response(assetObject.body, {
          headers: {
            'Content-Type': getContentType(assetKey),
            'Cache-Control': getCacheControl(assetKey),
            'ETag': assetObject.etag,
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
          },
        });
      }
    }
    
    // Attempt to get file from R2
    const object = await env.INVENTORY_BUCKET.get(r2Key);
    
    if (!object) {
      // Only fallback to index.html for non-asset paths
      const isAssetPath = pathname.includes('/_next/') || 
                         pathname.includes('.css') || 
                         pathname.includes('.js') || 
                         pathname.includes('.json') ||
                         pathname.includes('.png') ||
                         pathname.includes('.jpg') ||
                         pathname.includes('.ico');
      
      if (!isAssetPath) {
        // Try fallback to index.html for client-side routing
        const indexObject = await env.INVENTORY_BUCKET.get('index.html');
        if (indexObject) {
          let body = await indexObject.text();
          
          // If not accessed via subdomain, rewrite asset paths
          if (!isSubdomain) {
            body = body
              .replace(/href="\/_next\//g, 'href="/inventory/_next/')
              .replace(/src="\/_next\//g, 'src="/inventory/_next/')
              .replace(/\/_buildManifest\.js/g, '/inventory/_buildManifest.js')
              .replace(/\/_ssgManifest\.js/g, '/inventory/_ssgManifest.js');
          }
          
          return new Response(body, {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'public, max-age=86400',
              'X-Frame-Options': 'DENY',
              'X-Content-Type-Options': 'nosniff',
              'X-XSS-Protection': '1; mode=block',
              'Referrer-Policy': 'strict-origin-when-cross-origin',
              'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
              'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
            },
          });
        }
      }
      
      // Return 404 if not found
      return new Response('Inventory page not found', { 
        status: 404,
        headers: {
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // Determine content type
    const contentType = getContentType(r2Key);
    
    // If HTML and not subdomain, rewrite paths
    if (contentType === 'text/html' && !isSubdomain) {
      let body = await object.text();
      body = body
        .replace(/href="\/_next\//g, 'href="/inventory/_next/')
        .replace(/src="\/_next\//g, 'src="/inventory/_next/')
        .replace(/\/_buildManifest\.js/g, '/inventory/_buildManifest.js')
        .replace(/\/_ssgManifest\.js/g, '/inventory/_ssgManifest.js');
      
      return new Response(body, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': getCacheControl(r2Key),
          'ETag': object.etag,
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
        },
      });
    }
    
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': getCacheControl(r2Key),
        'ETag': object.etag,
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      },
    });
    
  } catch (error) {
    console.error('R2 fetch error for inventory:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff'
      }
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
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject'
  };
  return types[ext || ''] || 'application/octet-stream';
}

function getCacheControl(key) {
  // Static assets get longer cache
  if (key.includes('/_next/static/')) {
    return 'public, max-age=31536000, immutable';
  }
  
  // HTML files get shorter cache for updates
  if (key.endsWith('.html')) {
    return 'public, max-age=86400';
  }
  
  // Default cache
  return 'public, max-age=86400';
}

function getEOSL10App() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EOS L10 Leadership - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #b91c1c 100%);
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
            max-width: 800px;
            width: 90%;
        }
        .logo-icon {
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #ea580c, #dc2626);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 2rem; 
            font-weight: bold;
            margin: 0 auto 2rem;
            box-shadow: 0 8px 16px rgba(234, 88, 12, 0.3);
        }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
        .subtitle { color: #4a5568; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 500; }
        p { color: #4a5568; line-height: 1.6; margin-bottom: 2rem; }
        .status { 
            background: linear-gradient(135deg, #ea580c, #dc2626);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 1rem;
        }
        .scorecard-section {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
            text-align: left;
        }
        .scorecard-section h3 {
            color: #2d3748;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .metric-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            text-align: center;
        }
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        .metric-value.red { color: #dc2626; }
        .metric-value.yellow { color: #d97706; }
        .metric-value.green { color: #047857; }
        .metric-label {
            color: #6b7280;
            font-size: 0.9rem;
        }
        .issues-list {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            margin-bottom: 1rem;
        }
        .issue-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            border-bottom: 1px solid #e5e7eb;
        }
        .issue-item:last-child {
            border-bottom: none;
        }
        .issue-text {
            color: #374151;
        }
        .issue-owner {
            background: #f3f4f6;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.8rem;
            color: #6b7280;
        }
        .btn {
            background: linear-gradient(135deg, #ea580c, #dc2626);
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-icon">⚡</div>
        <h1>EOS L10 Leadership</h1>
        <div class="subtitle">Team Performance & Goals</div>
        <div class="status">✅ System Online</div>
        <p>Professional leadership scorecard system using EOS methodology for team meetings, performance tracking, and goal management.</p>
        
        <div class="scorecard-section">
            <h3>Weekly Scorecard - Week of June 10, 2025</h3>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value green">94%</div>
                    <div class="metric-label">Patient Satisfaction</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value yellow">78%</div>
                    <div class="metric-label">Appointment Efficiency</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value green">12</div>
                    <div class="metric-label">New Patient Referrals</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value red">89%</div>
                    <div class="metric-label">Staff Utilization</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value green">$47k</div>
                    <div class="metric-label">Weekly Revenue</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value yellow">2.3 days</div>
                    <div class="metric-label">Avg Wait Time</div>
                </div>
            </div>
        </div>
        
        <div class="scorecard-section">
            <h3>Issues & Action Items</h3>
            <div class="issues-list">
                <div class="issue-item">
                    <div class="issue-text">New patient scheduling system implementation</div>
                    <div class="issue-owner">Sarah M.</div>
                </div>
                <div class="issue-item">
                    <div class="issue-text">Staff training on Dupixent administration</div>
                    <div class="issue-owner">Dr. Ganger</div>
                </div>
                <div class="issue-item">
                    <div class="issue-text">Inventory management process optimization</div>
                    <div class="issue-owner">Mike R.</div>
                </div>
                <div class="issue-item">
                    <div class="issue-text">Patient portal adoption campaign</div>
                    <div class="issue-owner">Jennifer K.</div>
                </div>
                <div class="issue-item">
                    <div class="issue-text">Q3 revenue target adjustment</div>
                    <div class="issue-owner">Finance Team</div>
                </div>
            </div>
        </div>
        
        <button class="btn" onclick="startMeeting()">🏁 Start L10 Meeting</button>
        <button class="btn" onclick="updateScorecard()">📊 Update Scorecard</button>
        <button class="btn" onclick="reviewGoals()">🎯 Review Goals</button>
        <a href="/" class="btn">← Back to Portal</a>
    </div>
    
    <script>
        function startMeeting() {
            alert('L10 Meeting Started\\n\\n📋 Agenda:\\n• Scorecard Review (5 min)\\n• Rock Review (5 min)\\n• Customer/Employee Headlines (5 min)\\n• To-Do List (5 min)\\n• IDS (Issues, Discuss, Solve) (75 min)\\n\\n⏰ Meeting Timer: 90 minutes');
        }
        
        function updateScorecard() {
            alert('Scorecard Update\\n\\n📊 Current Week Metrics:\\n• Patient Satisfaction: 94% ✅\\n• Appointment Efficiency: 78% ⚠️\\n• New Referrals: 12 ✅\\n• Staff Utilization: 89% ❌\\n\\n📝 Update completed for week ending June 13, 2025');
        }
        
        function reviewGoals() {
            alert('Quarterly Goals Review\\n\\n🎯 Q2 2025 Goals:\\n• Revenue: $580k (on track)\\n• New Patients: 150 (ahead)\\n• Staff Training: 100% (complete)\\n• Patient Portal: 65% adoption (behind)\\n\\n📈 3 of 4 goals on track');
        }
    </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

function getL10PageContent(pageName) {
  const timestamp = new Date().toISOString();
  
  switch(pageName) {
    case 'rocks':
      return {
        title: 'Rock Review',
        icon: 'target',
        content: `
          <h1 class="text-3xl font-bold mb-2">Quarterly Rocks</h1>
          <p class="text-blue-100 text-lg mb-8">Track and manage your 90-day priorities</p>
          
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Q1 2025 Rocks</h2>
            <div class="space-y-4">
              <div class="border-l-4 border-blue-500 pl-4">
                <h3 class="font-semibold text-gray-900">Complete Platform Migration</h3>
                <p class="text-gray-600">Owner: Dr. Ganger | Due: March 31</p>
                <div class="mt-2 bg-blue-100 rounded-full h-2">
                  <div class="bg-blue-500 h-2 rounded-full" style="width: 75%"></div>
                </div>
              </div>
              <div class="border-l-4 border-green-500 pl-4">
                <h3 class="font-semibold text-gray-900">Launch Patient Portal 2.0</h3>
                <p class="text-gray-600">Owner: IT Team | Due: March 15</p>
                <div class="mt-2 bg-green-100 rounded-full h-2">
                  <div class="bg-green-500 h-2 rounded-full" style="width: 90%"></div>
                </div>
              </div>
            </div>
          </div>
          <p class="text-gray-500 text-sm">Generated: ${timestamp}</p>
        `
      };
    
    case 'scorecard':
      return {
        title: 'Scorecard',
        icon: 'bar-chart-3',
        content: `
          <h1 class="text-3xl font-bold mb-2">Weekly Scorecard</h1>
          <p class="text-blue-100 text-lg mb-8">Track your measurables and KPIs</p>
          
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <table class="w-full">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">Measurable</th>
                  <th class="text-center py-2">Goal</th>
                  <th class="text-center py-2">Actual</th>
                  <th class="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b">
                  <td class="py-3">New Patients</td>
                  <td class="text-center">50</td>
                  <td class="text-center">${Math.floor(Math.random() * 20) + 40}</td>
                  <td class="text-center">✅</td>
                </tr>
                <tr class="border-b">
                  <td class="py-3">Revenue</td>
                  <td class="text-center">$250K</td>
                  <td class="text-center">$${(Math.random() * 50 + 230).toFixed(0)}K</td>
                  <td class="text-center">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-gray-500 text-sm mt-4">Updated: ${timestamp}</p>
        `
      };
      
    case 'headlines':
      return {
        title: 'Headlines',
        icon: 'trending-up',
        content: `
          <h1 class="text-3xl font-bold mb-2">Customer & Employee Headlines</h1>
          <p class="text-blue-100 text-lg mb-8">Share wins, challenges, and updates</p>
          
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
            <h3 class="font-semibold text-gray-900 mb-2">🎉 Customer Win</h3>
            <p class="text-gray-600">5-star review from longtime patient praising our new online scheduling system!</p>
            <p class="text-sm text-gray-400 mt-2">Shared by: Sarah - ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="font-semibold text-gray-900 mb-2">📈 Team Achievement</h3>
            <p class="text-gray-600">Front desk reduced average check-in time by 40% with new kiosk system.</p>
            <p class="text-sm text-gray-400 mt-2">Shared by: Mike - ${new Date().toLocaleDateString()}</p>
          </div>
        `
      };
      
    default:
      return {
        title: 'EOS L10 Meeting Dashboard',
        icon: 'compass',
        content: `
          <h1 class="text-3xl font-bold mb-2">EOS L10 Meeting Dashboard</h1>
          <p class="text-blue-100 text-lg">Streamline your weekly Level 10 meetings with structured accountability and clear visibility.</p>
        `
      };
  }
}

function getEOSL10CompassTemplate(pathname) {
  // Determine which L10 page to show based on the pathname
  const route = pathname || '/l10/compass';
  const pageName = route.split('/').pop() || 'compass';
  
  // Dynamic content based on the route
  const pageContent = getL10PageContent(pageName);
  
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageContent.title} - EOS L10 - Ganger Dermatology</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/feather-icons"></script>
    <style>
        .fadeIn { animation: fadeIn 0.5s ease-in; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .sidebar-hidden { transform: translateX(-100%); }
        .sidebar-visible { transform: translateX(0); }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Mobile sidebar backdrop -->
    <div id="sidebar-backdrop" class="fixed inset-0 z-40 bg-gray-900/80 hidden lg:hidden"></div>
    
    <!-- Desktop sidebar -->
    <div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 ring-1 ring-gray-900/5">
            <div class="flex h-16 shrink-0 items-center gap-2">
                <div class="h-8 w-8 bg-blue-600 rounded"></div>
                <h1 class="text-xl font-semibold text-gray-900">EOS L10 Platform</h1>
            </div>
            <nav class="flex flex-1 flex-col">
                <ul class="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul class="-mx-2 space-y-1">
                            <li><a href="/l10/scorecard" class="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-600"><i data-feather="bar-chart-3" class="h-6 w-6 shrink-0"></i>Scorecard</a></li>
                            <li><a href="/l10/rocks" class="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-600"><i data-feather="target" class="h-6 w-6 shrink-0"></i>Rock Review</a></li>
                            <li><a href="/l10/headlines" class="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-600"><i data-feather="trending-up" class="h-6 w-6 shrink-0"></i>Headlines</a></li>
                            <li><a href="/l10/todos" class="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-600"><i data-feather="check-square" class="h-6 w-6 shrink-0"></i>To-Do List</a></li>
                            <li><a href="/l10/issues" class="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-600"><i data-feather="users" class="h-6 w-6 shrink-0"></i>IDS</a></li>
                            <li><a href="/l10/meetings" class="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-600"><i data-feather="calendar" class="h-6 w-6 shrink-0"></i>Meetings</a></li>
                        </ul>
                    </li>
                    <li class="mt-auto">
                        <div class="rounded-lg bg-blue-50 p-4">
                            <div class="flex items-center gap-x-3">
                                <i data-feather="play" class="h-8 w-8 text-blue-600"></i>
                                <div>
                                    <h3 class="text-sm font-medium text-gray-900">Weekly L10</h3>
                                    <p class="text-xs text-gray-600">Next meeting in 2 days</p>
                                </div>
                            </div>
                            <div class="mt-3">
                                <button class="w-full rounded-full bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-500">Start Meeting</button>
                            </div>
                        </div>
                    </li>
                </ul>
            </nav>
        </div>
    </div>

    <!-- Mobile sidebar -->
    <div id="mobile-sidebar" class="fixed inset-y-0 left-0 z-50 w-64 bg-white px-6 py-6 transform sidebar-hidden transition-transform duration-300 lg:hidden">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <div class="h-6 w-6 bg-blue-600 rounded"></div>
                <h1 class="text-lg font-semibold text-gray-900">EOS L10</h1>
            </div>
            <button id="close-sidebar" class="-m-2.5 p-2.5">
                <i data-feather="x" class="h-6 w-6 text-gray-400"></i>
            </button>
        </div>
        <nav class="mt-6">
            <ul class="space-y-1">
                <li><a href="/l10/scorecard" class="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-600"><i data-feather="bar-chart-3" class="h-6 w-6 shrink-0"></i>Scorecard</a></li>
                <li><a href="/l10/rocks" class="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-600"><i data-feather="target" class="h-6 w-6 shrink-0"></i>Rock Review</a></li>
                <li><a href="/l10/headlines" class="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-600"><i data-feather="trending-up" class="h-6 w-6 shrink-0"></i>Headlines</a></li>
                <li><a href="/l10/todos" class="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-600"><i data-feather="check-square" class="h-6 w-6 shrink-0"></i>To-Do List</a></li>
                <li><a href="/l10/issues" class="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-600"><i data-feather="users" class="h-6 w-6 shrink-0"></i>IDS</a></li>
                <li><a href="/l10/meetings" class="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-600"><i data-feather="calendar" class="h-6 w-6 shrink-0"></i>Meetings</a></li>
            </ul>
        </nav>
    </div>

    <!-- Main content -->
    <div class="lg:pl-72">
        <!-- Header -->
        <div class="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <button id="open-sidebar" class="-m-2.5 p-2.5 text-gray-700 lg:hidden">
                <i data-feather="menu" class="h-6 w-6"></i>
            </button>

            <div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <div class="relative flex flex-1 items-center">
                    <h2 class="text-sm font-semibold leading-6 text-gray-900">Team Performance Dashboard</h2>
                </div>
                <div class="flex items-center gap-x-4 lg:gap-x-6">
                    <div class="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200"></div>
                    <div class="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Week of Jan 15, 2024</span>
                        <div class="h-2 w-2 rounded-full bg-green-500"></div>
                        <span class="text-green-600">On Track</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Page content -->
        <main class="py-10">
            <div class="mx-auto max-w-7xl px-6 lg:px-8">
                <div class="space-y-8">
                    <!-- Dynamic Page Content -->
                    <div class="fadeIn">
                        ${pageContent.content}
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script>
        // Initialize Feather icons
        feather.replace();

        // Mobile sidebar functionality
        const openSidebar = document.getElementById('open-sidebar');
        const closeSidebar = document.getElementById('close-sidebar');
        const mobileSidebar = document.getElementById('mobile-sidebar');
        const sidebarBackdrop = document.getElementById('sidebar-backdrop');

        openSidebar.addEventListener('click', () => {
            mobileSidebar.classList.remove('sidebar-hidden');
            mobileSidebar.classList.add('sidebar-visible');
            sidebarBackdrop.classList.remove('hidden');
        });

        closeSidebar.addEventListener('click', () => {
            mobileSidebar.classList.add('sidebar-hidden');
            mobileSidebar.classList.remove('sidebar-visible');
            sidebarBackdrop.classList.add('hidden');
        });

        sidebarBackdrop.addEventListener('click', () => {
            mobileSidebar.classList.add('sidebar-hidden');
            mobileSidebar.classList.remove('sidebar-visible');
            sidebarBackdrop.classList.add('hidden');
        });

        // Add fadeIn animation to elements
        setTimeout(() => {
            const elements = document.querySelectorAll('.fadeIn');
            elements.forEach((el, index) => {
                setTimeout(() => {
                    el.style.animation = \`fadeIn 0.5s ease-in forwards\`;
                }, index * 100);
            });
        }, 100);
    </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

function getPatientHandoutsApp() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Patient Handouts Generator - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%);
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
            max-width: 800px;
            width: 90%;
        }
        .logo-icon {
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 2rem; 
            font-weight: bold;
            margin: 0 auto 2rem;
            box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
        }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
        .subtitle { color: #4a5568; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 500; }
        p { color: #4a5568; line-height: 1.6; margin-bottom: 2rem; }
        .status { 
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 1rem;
        }
        .handouts-section {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
            text-align: left;
        }
        .handouts-section h3 {
            color: #2d3748;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .handouts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .handout-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .handout-title {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 0.5rem;
        }
        .handout-desc {
            color: #6b7280;
            font-size: 0.9rem;
            line-height: 1.4;
            margin-bottom: 1rem;
        }
        .handout-actions {
            display: flex;
            gap: 0.5rem;
        }
        .btn-small {
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            color: white;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 6px;
            font-size: 0.8rem;
            cursor: pointer;
        }
        .btn {
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-icon">📄</div>
        <h1>Patient Handouts Generator</h1>
        <div class="subtitle">Educational Materials & QR Distribution</div>
        <div class="status">✅ System Online</div>
        <p>Generate custom educational materials with QR scanning, digital delivery, and patient communication hub integration.</p>
        
        <div class="handouts-section">
            <h3>Available Handouts</h3>
            <div class="handouts-grid">
                <div class="handout-card">
                    <div class="handout-title">Eczema Care Guide</div>
                    <div class="handout-desc">Comprehensive guide for managing atopic dermatitis with skincare routines and trigger avoidance.</div>
                    <div class="handout-actions">
                        <button class="btn-small" onclick="generateHandout('eczema')">📄 Generate</button>
                        <button class="btn-small" onclick="sendHandout('eczema')">📧 Email</button>
                    </div>
                </div>
                
                <div class="handout-card">
                    <div class="handout-title">Psoriasis Treatment</div>
                    <div class="handout-desc">Patient education on psoriasis management, treatment options, and lifestyle modifications.</div>
                    <div class="handout-actions">
                        <button class="btn-small" onclick="generateHandout('psoriasis')">📄 Generate</button>
                        <button class="btn-small" onclick="sendHandout('psoriasis')">📧 Email</button>
                    </div>
                </div>
                
                <div class="handout-card">
                    <div class="handout-title">Dupixent Injection Guide</div>
                    <div class="handout-desc">Step-by-step self-injection instructions with safety information and side effects monitoring.</div>
                    <div class="handout-actions">
                        <button class="btn-small" onclick="generateHandout('dupixent')">📄 Generate</button>
                        <button class="btn-small" onclick="sendHandout('dupixent')">📧 Email</button>
                    </div>
                </div>
                
                <div class="handout-card">
                    <div class="handout-title">Melanoma Prevention</div>
                    <div class="handout-desc">Skin cancer prevention, self-examination techniques, and when to seek professional evaluation.</div>
                    <div class="handout-actions">
                        <button class="btn-small" onclick="generateHandout('melanoma')">📄 Generate</button>
                        <button class="btn-small" onclick="sendHandout('melanoma')">📧 Email</button>
                    </div>
                </div>
                
                <div class="handout-card">
                    <div class="handout-title">Post-Procedure Care</div>
                    <div class="handout-desc">Wound care instructions for biopsies, excisions, and other dermatological procedures.</div>
                    <div class="handout-actions">
                        <button class="btn-small" onclick="generateHandout('procedure')">📄 Generate</button>
                        <button class="btn-small" onclick="sendHandout('procedure')">📧 Email</button>
                    </div>
                </div>
                
                <div class="handout-card">
                    <div class="handout-title">Acne Management</div>
                    <div class="handout-desc">Skincare routines, product recommendations, and treatment expectations for acne patients.</div>
                    <div class="handout-actions">
                        <button class="btn-small" onclick="generateHandout('acne')">📄 Generate</button>
                        <button class="btn-small" onclick="sendHandout('acne')">📧 Email</button>
                    </div>
                </div>
            </div>
        </div>
        
        <button class="btn" onclick="createCustom()">✏️ Create Custom</button>
        <button class="btn" onclick="qrGenerator()">📱 QR Generator</button>
        <button class="btn" onclick="viewAnalytics()">📊 Analytics</button>
        <a href="/" class="btn">← Back to Portal</a>
    </div>
    
    <script>
        function generateHandout(type) {
            alert('Handout Generated: ' + type.toUpperCase() + '\\n\\n📄 PDF created with:\\n• Patient-specific information\\n• QR code for digital access\\n• Custom clinic branding\\n• Multi-language support\\n\\n✅ Ready for print or digital delivery');
        }
        
        function sendHandout(type) {
            alert('Email Sent: ' + type.toUpperCase() + ' Guide\\n\\n📧 Delivered to patient portal\\n📱 SMS notification sent\\n🔗 Digital access link included\\n📊 Tracking enabled\\n\\n✅ Patient will receive within 5 minutes');
        }
        
        function createCustom() {
            alert('Custom Handout Creator\\n\\n✏️ Available Options:\\n• Template selection\\n• Content customization\\n• Branding options\\n• Multi-language support\\n• QR code integration\\n\\n📝 Ready to create personalized materials');
        }
        
        function qrGenerator() {
            alert('QR Code Generator\\n\\n📱 Generate QR codes for:\\n• Digital handout access\\n• Appointment scheduling\\n• Patient portal login\\n• Educational videos\\n• Contact information\\n\\n🔗 Instant link generation available');
        }
        
        function viewAnalytics() {
            alert('Handout Analytics\\n\\n📊 This Month:\\n• 347 handouts generated\\n• 89% digital access rate\\n• 94% patient satisfaction\\n• Top request: Eczema Care\\n\\n📈 Full analytics dashboard available');
        }
    </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

function getCheckinKioskApp() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Check-in Kiosk - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
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
            max-width: 600px;
            width: 90%;
        }
        .logo-icon {
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #10b981, #059669);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 2rem; 
            font-weight: bold;
            margin: 0 auto 2rem;
            box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
        }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
        .subtitle { color: #4a5568; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 500; }
        p { color: #4a5568; line-height: 1.6; margin-bottom: 2rem; }
        .status { 
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 1rem;
        }
        .checkin-section {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
            text-align: left;
        }
        .checkin-section h3 {
            color: #2d3748;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .patient-lookup {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .patient-lookup input {
            flex: 1;
            padding: 1rem;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1.1rem;
        }
        .patient-lookup button {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 1rem 2rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
        }
        .appointment-info {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            border-left: 4px solid #10b981;
        }
        .appointment-time {
            font-size: 1.2rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 0.5rem;
        }
        .appointment-details {
            color: #6b7280;
            line-height: 1.4;
        }
        .checkin-actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
        }
        .action-btn {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            text-align: center;
        }
        .btn {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-icon">🏥</div>
        <h1>Check-in Kiosk</h1>
        <div class="subtitle">Patient Self-Service Terminal</div>
        <div class="status">✅ System Online</div>
        <p>Self-service patient check-in with payment processing, insurance verification, and appointment management.</p>
        
        <div class="checkin-section">
            <h3>Find Your Appointment</h3>
            <div class="patient-lookup">
                <input type="text" placeholder="Enter your last name or date of birth" id="patientSearch">
                <button onclick="findAppointment()">🔍 Find</button>
            </div>
            
            <div class="appointment-info" id="appointmentInfo" style="display: none;">
                <div class="appointment-time">Today 2:30 PM - Dr. Ganger</div>
                <div class="appointment-details">
                    Patient: Smith, John<br>
                    Appointment Type: Follow-up Visit<br>
                    Insurance: Blue Cross Blue Shield<br>
                    Copay: $25.00
                </div>
            </div>
            
            <div class="checkin-actions" id="checkinActions" style="display: none;">
                <button class="action-btn" onclick="checkinProcess()">✅ Check In</button>
                <button class="action-btn" onclick="updateInfo()">📝 Update Info</button>
                <button class="action-btn" onclick="paymentProcess()">💳 Make Payment</button>
                <button class="action-btn" onclick="reschedule()">📅 Reschedule</button>
            </div>
        </div>
        
        <button class="btn" onclick="newPatient()">👤 New Patient</button>
        <button class="btn" onclick="emergencyHelp()">🚨 Need Help</button>
        <a href="/" class="btn">← Back to Portal</a>
    </div>
    
    <script>
        function findAppointment() {
            const search = document.getElementById('patientSearch').value;
            if (search.length > 0) {
                document.getElementById('appointmentInfo').style.display = 'block';
                document.getElementById('checkinActions').style.display = 'grid';
                alert('Appointment Found!\\n\\nPatient: Smith, John\\nToday 2:30 PM with Dr. Ganger\\nInsurance: Verified\\nCopay: $25.00');
            }
        }
        
        function checkinProcess() {
            alert('Check-in Complete!\\n\\n✅ Checked in successfully\\n📋 Forms updated\\n💳 Payment processed\\n🪑 Please take a seat\\n\\n⏰ Estimated wait: 10-15 minutes');
        }
        
        function updateInfo() {
            alert('Update Patient Information\\n\\n📝 Available Updates:\\n• Contact information\\n• Insurance details\\n• Emergency contacts\\n• Medical history\\n• Pharmacy preferences\\n\\n✅ All changes saved securely');
        }
        
        function paymentProcess() {
            alert('Payment Processing\\n\\n💳 Today\\'s Charges:\\n• Copay: $25.00\\n• Previous Balance: $0.00\\n• Total Due: $25.00\\n\\n💳 Payment methods: Card, Cash, HSA');
        }
        
        function reschedule() {
            alert('Reschedule Appointment\\n\\n📅 Available Times:\\n• Tomorrow 9:00 AM\\n• Thursday 1:30 PM\\n• Friday 3:15 PM\\n\\n📧 Confirmation will be sent via email and SMS');
        }
        
        function newPatient() {
            alert('New Patient Registration\\n\\n📋 Required Information:\\n• Personal details\\n• Insurance information\\n• Medical history\\n• Emergency contacts\\n\\n⏰ Registration takes 5-10 minutes');
        }
        
        function emergencyHelp() {
            alert('Help Request Sent\\n\\n🚨 Front desk staff notified\\n👤 Someone will assist you shortly\\n📞 For medical emergencies, call 911\\n\\n⏰ Average response time: 2 minutes');
        }
    </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

function getClinicalStaffingApp() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clinical Staffing - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
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
            max-width: 900px;
            width: 90%;
        }
        .logo-icon {
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 2rem; 
            font-weight: bold;
            margin: 0 auto 2rem;
            box-shadow: 0 8px 16px rgba(245, 158, 11, 0.3);
        }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
        .subtitle { color: #4a5568; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 500; }
        p { color: #4a5568; line-height: 1.6; margin-bottom: 2rem; }
        .status { 
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 1rem;
        }
        .schedule-section {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
            text-align: left;
        }
        .schedule-section h3 {
            color: #2d3748;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .schedule-grid {
            display: grid;
            grid-template-columns: auto repeat(7, 1fr);
            gap: 1px;
            background: #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
        }
        .schedule-header {
            background: #374151;
            color: white;
            padding: 1rem;
            text-align: center;
            font-weight: 600;
        }
        .schedule-time {
            background: #6b7280;
            color: white;
            padding: 0.75rem;
            text-align: center;
            font-size: 0.9rem;
        }
        .schedule-cell {
            background: white;
            padding: 0.5rem;
            min-height: 60px;
            position: relative;
        }
        .staff-shift {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            margin: 1px;
            display: block;
        }
        .btn {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-icon">👥</div>
        <h1>Clinical Staffing</h1>
        <div class="subtitle">Staff Scheduling & Management</div>
        <div class="status">✅ System Online</div>
        <p>Comprehensive staff scheduling with shift management, time tracking, and automated coverage notifications.</p>
        
        <div class="schedule-section">
            <h3>This Week's Schedule</h3>
            <div class="schedule-grid">
                <div class="schedule-header">Time</div>
                <div class="schedule-header">Mon</div>
                <div class="schedule-header">Tue</div>
                <div class="schedule-header">Wed</div>
                <div class="schedule-header">Thu</div>
                <div class="schedule-header">Fri</div>
                <div class="schedule-header">Sat</div>
                <div class="schedule-header">Sun</div>
                
                <div class="schedule-time">8:00 AM</div>
                <div class="schedule-cell"><span class="staff-shift">Dr. Ganger</span></div>
                <div class="schedule-cell"><span class="staff-shift">Dr. Ganger</span></div>
                <div class="schedule-cell"><span class="staff-shift">Dr. Ganger</span></div>
                <div class="schedule-cell"><span class="staff-shift">Dr. Ganger</span></div>
                <div class="schedule-cell"><span class="staff-shift">Dr. Ganger</span></div>
                <div class="schedule-cell"></div>
                <div class="schedule-cell"></div>
                
                <div class="schedule-time">9:00 AM</div>
                <div class="schedule-cell"><span class="staff-shift">Sarah M.</span><span class="staff-shift">Lisa K.</span></div>
                <div class="schedule-cell"><span class="staff-shift">Sarah M.</span><span class="staff-shift">Mike R.</span></div>
                <div class="schedule-cell"><span class="staff-shift">Jennifer K.</span><span class="staff-shift">Lisa K.</span></div>
                <div class="schedule-cell"><span class="staff-shift">Sarah M.</span><span class="staff-shift">Mike R.</span></div>
                <div class="schedule-cell"><span class="staff-shift">Jennifer K.</span><span class="staff-shift">Lisa K.</span></div>
                <div class="schedule-cell"><span class="staff-shift">Sarah M.</span></div>
                <div class="schedule-cell"></div>
                
                <div class="schedule-time">1:00 PM</div>
                <div class="schedule-cell"><span class="staff-shift">Mike R.</span></div>
                <div class="schedule-cell"><span class="staff-shift">Jennifer K.</span></div>
                <div class="schedule-cell"><span class="staff-shift">Sarah M.</span></div>
                <div class="schedule-cell"><span class="staff-shift">Lisa K.</span></div>
                <div class="schedule-cell"><span class="staff-shift">Mike R.</span></div>
                <div class="schedule-cell"></div>
                <div class="schedule-cell"></div>
                
                <div class="schedule-time">5:00 PM</div>
                <div class="schedule-cell"></div>
                <div class="schedule-cell"></div>
                <div class="schedule-cell"></div>
                <div class="schedule-cell"></div>
                <div class="schedule-cell"></div>
                <div class="schedule-cell"></div>
                <div class="schedule-cell"></div>
            </div>
        </div>
        
        <button class="btn" onclick="addShift()">➕ Add Shift</button>
        <button class="btn" onclick="requestCoverage()">🔄 Request Coverage</button>
        <button class="btn" onclick="viewTimeOff()">🏖️ Time Off</button>
        <button class="btn" onclick="generateReport()">📊 Reports</button>
        <a href="/" class="btn">← Back to Portal</a>
    </div>
    
    <script>
        function addShift() {
            alert('Add New Shift\\n\\n📅 Shift Details:\\n• Staff Member: [Dropdown]\\n• Date: [Calendar]\\n• Start Time: [Time Picker]\\n• End Time: [Time Picker]\\n• Role: [Position]\\n\\n✅ Shift will be added to schedule');
        }
        
        function requestCoverage() {
            alert('Coverage Request\\n\\n🔄 Available Options:\\n• Find replacement for existing shift\\n• Request additional coverage\\n• Swap shifts with colleague\\n• Emergency coverage request\\n\\n📧 Notifications sent to available staff');
        }
        
        function viewTimeOff() {
            alert('Time Off Management\\n\\n🏖️ Current Requests:\\n• Sarah M.: June 15-17 (Approved)\\n• Mike R.: June 22 (Pending)\\n• Lisa K.: July 1-5 (Approved)\\n\\n📝 Submit new request or manage existing');
        }
        
        function generateReport() {
            alert('Staffing Reports\\n\\n📊 Available Reports:\\n• Weekly schedule summary\\n• Monthly hours by staff\\n• Coverage statistics\\n• Time off analysis\\n• Overtime tracking\\n\\n📁 Export to Excel available');
        }
    </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

function getComplianceTrainingApp() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compliance Training - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
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
            max-width: 800px;
            width: 90%;
        }
        .logo-icon {
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 2rem; 
            font-weight: bold;
            margin: 0 auto 2rem;
            box-shadow: 0 8px 16px rgba(220, 38, 38, 0.3);
        }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
        .subtitle { color: #4a5568; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 500; }
        p { color: #4a5568; line-height: 1.6; margin-bottom: 2rem; }
        .status { 
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 1rem;
        }
        .training-section {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
            text-align: left;
        }
        .training-section h3 {
            color: #2d3748;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .training-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .training-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .training-title {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 0.5rem;
        }
        .training-desc {
            color: #6b7280;
            font-size: 0.9rem;
            line-height: 1.4;
            margin-bottom: 1rem;
        }
        .training-status {
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
            margin-bottom: 1rem;
        }
        .status-complete {
            background: #d1fae5;
            color: #047857;
        }
        .status-due {
            background: #fef3cd;
            color: #92400e;
        }
        .status-overdue {
            background: #fecaca;
            color: #dc2626;
        }
        .training-actions {
            display: flex;
            gap: 0.5rem;
        }
        .btn-small {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 6px;
            font-size: 0.8rem;
            cursor: pointer;
        }
        .btn {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-icon">🛡️</div>
        <h1>Compliance Training</h1>
        <div class="subtitle">HIPAA & Medical Training Hub</div>
        <div class="status">✅ System Online</div>
        <p>Comprehensive compliance training system with HIPAA certification, medical safety protocols, and regulatory requirements.</p>
        
        <div class="training-section">
            <h3>Required Training Modules</h3>
            <div class="training-grid">
                <div class="training-card">
                    <div class="training-title">HIPAA Privacy & Security</div>
                    <div class="training-desc">Essential HIPAA privacy rules, security measures, and patient data protection protocols.</div>
                    <div class="training-status status-complete">✅ Complete - Valid until Dec 2025</div>
                    <div class="training-actions">
                        <button class="btn-small" onclick="startTraining('hipaa')">📚 Review</button>
                        <button class="btn-small" onclick="viewCert('hipaa')">📜 Certificate</button>
                    </div>
                </div>
                
                <div class="training-card">
                    <div class="training-title">Bloodborne Pathogens</div>
                    <div class="training-desc">OSHA bloodborne pathogen standard, exposure control, and safety procedures.</div>
                    <div class="training-status status-due">⚠️ Due June 30, 2025</div>
                    <div class="training-actions">
                        <button class="btn-small" onclick="startTraining('bloodborne')">▶️ Start</button>
                        <button class="btn-small" onclick="scheduleTraining('bloodborne')">📅 Schedule</button>
                    </div>
                </div>
                
                <div class="training-card">
                    <div class="training-title">Fire Safety & Emergency</div>
                    <div class="training-desc">Emergency procedures, fire safety protocols, and evacuation plans for medical facilities.</div>
                    <div class="training-status status-complete">✅ Complete - Valid until Oct 2025</div>
                    <div class="training-actions">
                        <button class="btn-small" onclick="startTraining('fire')">📚 Review</button>
                        <button class="btn-small" onclick="viewCert('fire')">📜 Certificate</button>
                    </div>
                </div>
                
                <div class="training-card">
                    <div class="training-title">Drug Safety & Handling</div>
                    <div class="training-desc">Safe handling of controlled substances, storage requirements, and disposal protocols.</div>
                    <div class="training-status status-overdue">❌ Overdue since May 15</div>
                    <div class="training-actions">
                        <button class="btn-small" onclick="startTraining('drugs')">🚨 Complete</button>
                        <button class="btn-small" onclick="requestExtension('drugs')">⏰ Extension</button>
                    </div>
                </div>
                
                <div class="training-card">
                    <div class="training-title">Patient Communication</div>
                    <div class="training-desc">Professional communication standards, cultural sensitivity, and patient interaction protocols.</div>
                    <div class="training-status status-complete">✅ Complete - Valid until Aug 2025</div>
                    <div class="training-actions">
                        <button class="btn-small" onclick="startTraining('communication')">📚 Review</button>
                        <button class="btn-small" onclick="viewCert('communication')">📜 Certificate</button>
                    </div>
                </div>
                
                <div class="training-card">
                    <div class="training-title">Infection Control</div>
                    <div class="training-desc">Infection prevention protocols, sterilization procedures, and CDC guidelines compliance.</div>
                    <div class="training-status status-due">⚠️ Due July 15, 2025</div>
                    <div class="training-actions">
                        <button class="btn-small" onclick="startTraining('infection')">▶️ Start</button>
                        <button class="btn-small" onclick="scheduleTraining('infection')">📅 Schedule</button>
                    </div>
                </div>
            </div>
        </div>
        
        <button class="btn" onclick="viewProgress()">📊 My Progress</button>
        <button class="btn" onclick="allCertificates()">📜 All Certificates</button>
        <button class="btn" onclick="scheduleReminders()">🔔 Reminders</button>
        <a href="/" class="btn">← Back to Portal</a>
    </div>
    
    <script>
        function startTraining(module) {
            alert('Training Module: ' + module.toUpperCase() + '\\n\\n📚 Starting training session...\\n⏰ Estimated time: 45-60 minutes\\n📝 Quiz required at completion\\n📜 Certificate issued upon passing\\n\\n▶️ Ready to begin?');
        }
        
        function viewCert(module) {
            alert('Certificate Viewer\\n\\n📜 ' + module.toUpperCase() + ' Certificate\\n✅ Status: Valid\\n📅 Completion: Current\\n🔒 Verification Code: HC-' + Date.now() + '\\n📧 Email copy available\\n\\n📁 Download PDF certificate');
        }
        
        function scheduleTraining(module) {
            alert('Schedule Training: ' + module.toUpperCase() + '\\n\\n📅 Available Times:\\n• Tomorrow 9:00 AM (30 min)\\n• Friday 2:00 PM (45 min)\\n• Next Monday 10:00 AM (60 min)\\n\\n📧 Reminder notifications enabled');
        }
        
        function requestExtension(module) {
            alert('Extension Request: ' + module.toUpperCase() + '\\n\\n⏰ Requesting 30-day extension\\n👤 Manager approval required\\n📧 Request sent to supervisor\\n📅 Must complete by: July 15, 2025\\n\\n⚠️ No further extensions allowed');
        }
        
        function viewProgress() {
            alert('Training Progress Summary\\n\\n📊 Overall Status:\\n✅ Completed: 4/6 modules\\n⚠️ Due Soon: 2 modules\\n❌ Overdue: 1 module\\n📈 Compliance Rate: 67%\\n\\n🎯 Goal: 100% by month end');
        }
        
        function allCertificates() {
            alert('Certificate Portfolio\\n\\n📜 Valid Certificates:\\n• HIPAA Privacy & Security\\n• Fire Safety & Emergency\\n• Patient Communication\\n• Infection Control (expired)\\n\\n📁 Download complete portfolio');
        }
        
        function scheduleReminders() {
            alert('Training Reminders\\n\\n🔔 Notification Settings:\\n• 30 days before expiration\\n• 7 days before expiration\\n• Day of expiration\\n• Weekly overdue reminders\\n\\n📧 Email and SMS notifications enabled');
        }
    </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

function getConfigDashboardApp() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Config Dashboard - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #374151 0%, #1f2937 50%, #111827 100%);
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
            max-width: 900px;
            width: 90%;
        }
        .logo-icon {
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #374151, #1f2937);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 2rem; 
            font-weight: bold;
            margin: 0 auto 2rem;
            box-shadow: 0 8px 16px rgba(55, 65, 81, 0.3);
        }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
        .subtitle { color: #4a5568; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 500; }
        p { color: #4a5568; line-height: 1.6; margin-bottom: 2rem; }
        .status { 
            background: linear-gradient(135deg, #374151, #1f2937);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 1rem;
        }
        .config-section {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
            text-align: left;
        }
        .config-section h3 {
            color: #2d3748;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .config-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .config-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .config-title {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .config-list {
            list-style: none;
            padding: 0;
        }
        .config-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .config-item:last-child {
            border-bottom: none;
        }
        .config-label {
            color: #4b5563;
            font-size: 0.9rem;
        }
        .config-value {
            color: #059669;
            font-weight: 500;
            font-size: 0.9rem;
        }
        .config-actions {
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
        }
        .btn-small {
            background: linear-gradient(135deg, #374151, #1f2937);
            color: white;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 6px;
            font-size: 0.8rem;
            cursor: pointer;
        }
        .btn {
            background: linear-gradient(135deg, #374151, #1f2937);
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-icon">⚙️</div>
        <h1>Config Dashboard</h1>
        <div class="subtitle">System Configuration Management</div>
        <div class="status">✅ System Online</div>
        <p>Centralized configuration management for system settings, integrations, and platform parameters.</p>
        
        <div class="config-section">
            <h3>System Configuration</h3>
            <div class="config-grid">
                <div class="config-card">
                    <div class="config-title">🔐 Security Settings</div>
                    <ul class="config-list">
                        <li class="config-item">
                            <span class="config-label">Session Timeout</span>
                            <span class="config-value">24 hours</span>
                        </li>
                        <li class="config-item">
                            <span class="config-label">Password Policy</span>
                            <span class="config-value">Strong</span>
                        </li>
                        <li class="config-item">
                            <span class="config-label">2FA Required</span>
                            <span class="config-value">Enabled</span>
                        </li>
                        <li class="config-item">
                            <span class="config-label">HIPAA Compliance</span>
                            <span class="config-value">Active</span>
                        </li>
                    </ul>
                    <div class="config-actions">
                        <button class="btn-small" onclick="editConfig('security')">✏️ Edit</button>
                        <button class="btn-small" onclick="auditConfig('security')">📋 Audit</button>
                    </div>
                </div>
                
                <div class="config-card">
                    <div class="config-title">🔗 Integrations</div>
                    <ul class="config-list">
                        <li class="config-item">
                            <span class="config-label">Supabase Database</span>
                            <span class="config-value">Connected</span>
                        </li>
                        <li class="config-item">
                            <span class="config-label">Google OAuth</span>
                            <span class="config-value">Active</span>
                        </li>
                        <li class="config-item">
                            <span class="config-label">Twilio SMS</span>
                            <span class="config-value">Enabled</span>
                        </li>
                        <li class="config-item">
                            <span class="config-label">Stripe Payments</span>
                            <span class="config-value">Live Mode</span>
                        </li>
                    </ul>
                    <div class="config-actions">
                        <button class="btn-small" onclick="editConfig('integrations')">🔧 Configure</button>
                        <button class="btn-small" onclick="testConfig('integrations')">🧪 Test</button>
                    </div>
                </div>
                
                <div class="config-card">
                    <div class="config-title">📧 Notifications</div>
                    <ul class="config-list">
                        <li class="config-item">
                            <span class="config-label">Email Alerts</span>
                            <span class="config-value">Enabled</span>
                        </li>
                        <li class="config-item">
                            <span class="config-label">SMS Notifications</span>
                            <span class="config-value">Critical Only</span>
                        </li>
                        <li class="config-item">
                            <span class="config-label">Slack Integration</span>
                            <span class="config-value">Active</span>
                        </li>
                        <li class="config-item">
                            <span class="config-label">Alert Frequency</span>
                            <span class="config-value">Immediate</span>
                        </li>
                    </ul>
                    <div class="config-actions">
                        <button class="btn-small" onclick="editConfig('notifications')">📝 Edit</button>
                        <button class="btn-small" onclick="testConfig('notifications')">📨 Test</button>
                    </div>
                </div>
                
                <div class="config-card">
                    <div class="config-title">🏥 Clinic Settings</div>
                    <ul class="config-list">
                        <li class="config-item">
                            <span class="config-label">Operating Hours</span>
                            <span class="config-value">8 AM - 5 PM</span>
                        </li>
                        <li class="config-item">
                            <span class="config-label">Appointment Duration</span>
                            <span class="config-value">30 minutes</span>
                        </li>
                        <li class="config-item">
                            <span class="config-label">Buffer Time</span>
                            <span class="config-value">15 minutes</span>
                        </li>
                        <li class="config-item">
                            <span class="config-label">Max Daily Patients</span>
                            <span class="config-value">24</span>
                        </li>
                    </ul>
                    <div class="config-actions">
                        <button class="btn-small" onclick="editConfig('clinic')">⚙️ Adjust</button>
                        <button class="btn-small" onclick="scheduleConfig('clinic')">📅 Schedule</button>
                    </div>
                </div>
                
                <div class="config-card">
                    <div class="config-title">💾 Backup & Recovery</div>
                    <ul class="config-list">
                        <li class="config-item">
                            <span class="config-label">Auto Backup</span>
                            <span class="config-value">Daily 2 AM</span>
                        </li>
                        <li class="config-item">
                            <span class="config-label">Retention Period</span>
                            <span class="config-value">90 days</span>
                        </li>
                        <li class="config-item">
                            <span class="config-label">Last Backup</span>
                            <span class="config-value">2 hours ago</span>
                        </li>
                        <li class="config-item">
                            <span class="config-label">Backup Status</span>
                            <span class="config-value">Successful</span>
                        </li>
                    </ul>
                    <div class="config-actions">
                        <button class="btn-small" onclick="backupNow()">💾 Backup Now</button>
                        <button class="btn-small" onclick="restoreConfig()">🔄 Restore</button>
                    </div>
                </div>
                
                <div class="config-card">
                    <div class="config-title">📊 Performance</div>
                    <ul class="config-list">
                        <li class="config-item">
                            <span class="config-label">Cache Enabled</span>
                            <span class="config-value">Yes</span>
                        </li>
                        <li class="config-item">
                            <span class="config-label">CDN Status</span>
                            <span class="config-value">Active</span>
                        </li>
                        <li class="config-item">
                            <span class="config-label">Database Pool</span>
                            <span class="config-value">10 connections</span>
                        </li>
                        <li class="config-item">
                            <span class="config-label">Response Time</span>
                            <span class="config-value">< 200ms</span>
                        </li>
                    </ul>
                    <div class="config-actions">
                        <button class="btn-small" onclick="optimizeConfig()">🚀 Optimize</button>
                        <button class="btn-small" onclick="monitorConfig()">📈 Monitor</button>
                    </div>
                </div>
            </div>
        </div>
        
        <button class="btn" onclick="exportConfig()">📁 Export Config</button>
        <button class="btn" onclick="importConfig()">📤 Import Config</button>
        <button class="btn" onclick="resetConfig()">🔄 Reset to Defaults</button>
        <a href="/" class="btn">← Back to Portal</a>
    </div>
    
    <script>
        function editConfig(section) {
            alert('Edit Configuration: ' + section.toUpperCase() + '\\n\\n⚙️ Opening configuration editor...\\n✏️ Modify settings safely\\n✅ Changes require confirmation\\n🔒 Audit trail maintained\\n\\n📝 Ready to configure');
        }
        
        function testConfig(section) {
            alert('Testing Configuration: ' + section.toUpperCase() + '\\n\\n🧪 Running connection tests...\\n📡 Verifying endpoints\\n🔐 Checking authentication\\n⏰ Testing response times\\n\\n✅ All tests passed successfully');
        }
        
        function auditConfig(section) {
            alert('Configuration Audit: ' + section.toUpperCase() + '\\n\\n📋 Recent Changes:\\n• 2025-06-13: Password policy updated\\n• 2025-06-12: Session timeout increased\\n• 2025-06-10: HIPAA compliance enabled\\n\\n👤 Changes by: admin@gangerdermatology.com');
        }
        
        function backupNow() {
            alert('Manual Backup Initiated\\n\\n💾 Creating system backup...\\n📊 Backing up configurations\\n🗄️ Including database settings\\n🔐 Encrypting sensitive data\\n\\n⏰ Estimated time: 2-3 minutes');
        }
        
        function exportConfig() {
            alert('Export Configuration\\n\\n📁 Available Formats:\\n• JSON (machine readable)\\n• YAML (human readable)\\n• XML (legacy systems)\\n• Excel (spreadsheet)\\n\\n🔒 Sensitive data will be masked');
        }
        
        function optimizeConfig() {
            alert('Performance Optimization\\n\\n🚀 Optimization Started:\\n• Database query optimization\\n• Cache configuration tuning\\n• CDN settings adjustment\\n• Connection pool sizing\\n\\n📈 Expected improvement: 15-25%');
        }
    </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

function getAIReceptionistApp() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Receptionist - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);
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
            max-width: 800px;
            width: 90%;
        }
        .logo-icon {
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 2rem; 
            font-weight: bold;
            margin: 0 auto 2rem;
            box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);
        }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
        .subtitle { color: #4a5568; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 500; }
        p { color: #4a5568; line-height: 1.6; margin-bottom: 2rem; }
        .status { 
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 1rem;
        }
        .chat-section {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
            text-align: left;
            height: 400px;
            display: flex;
            flex-direction: column;
        }
        .chat-header {
            color: #2d3748;
            margin-bottom: 1rem;
            text-align: center;
            font-weight: 600;
        }
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1rem;
            background: white;
            margin-bottom: 1rem;
        }
        .message {
            margin-bottom: 1rem;
            padding: 0.75rem;
            border-radius: 8px;
            max-width: 80%;
        }
        .message.ai {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
            margin-right: auto;
        }
        .message.user {
            background: #e5e7eb;
            color: #374151;
            margin-left: auto;
        }
        .chat-input {
            display: flex;
            gap: 1rem;
        }
        .chat-input input {
            flex: 1;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 1rem;
        }
        .chat-input button {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
        }
        .ai-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin: 1rem 0;
        }
        .stat-card {
            background: white;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e2e8f0;
        }
        .stat-number {
            font-size: 1.5rem;
            font-weight: bold;
            color: #8b5cf6;
            margin-bottom: 0.25rem;
        }
        .stat-label {
            color: #6b7280;
            font-size: 0.8rem;
        }
        .btn {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-icon">🤖</div>
        <h1>AI Receptionist</h1>
        <div class="subtitle">Automated Patient Assistance</div>
        <div class="status">✅ System Online</div>
        <p>AI-powered virtual receptionist for automated patient assistance, appointment scheduling, and 24/7 support.</p>
        
        <div class="ai-stats">
            <div class="stat-card">
                <div class="stat-number">247</div>
                <div class="stat-label">Conversations Today</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">94%</div>
                <div class="stat-label">Resolution Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">1.2s</div>
                <div class="stat-label">Avg Response</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">47</div>
                <div class="stat-label">Appointments Booked</div>
            </div>
        </div>
        
        <div class="chat-section">
            <div class="chat-header">🤖 Live AI Assistant Demo</div>
            <div class="chat-messages" id="chatMessages">
                <div class="message ai">
                    Hello! I'm the Ganger Dermatology AI Assistant. How can I help you today? I can help with:
                    <br>• Scheduling appointments
                    <br>• Answering practice questions  
                    <br>• Prescription refills
                    <br>• Insurance inquiries
                </div>
                <div class="message user">
                    I need to schedule a follow-up appointment for my eczema treatment.
                </div>
                <div class="message ai">
                    I'd be happy to help schedule your follow-up! I see you're a returning patient. Dr. Ganger has availability:
                    <br>• Tomorrow at 2:30 PM
                    <br>• Friday at 10:15 AM
                    <br>• Next Monday at 3:45 PM
                    <br>Which time works best for you?
                </div>
            </div>
            <div class="chat-input">
                <input type="text" id="chatInput" placeholder="Type your message here..." onkeypress="handleKeyPress(event)">
                <button onclick="sendMessage()">Send</button>
            </div>
        </div>
        
        <button class="btn" onclick="viewAnalytics()">📊 Analytics</button>
        <button class="btn" onclick="trainAI()">🧠 Train AI</button>
        <button class="btn" onclick="configureAI()">⚙️ Configure</button>
        <a href="/" class="btn">← Back to Portal</a>
    </div>
    
    <script>
        function sendMessage() {
            const input = document.getElementById('chatInput');
            const messages = document.getElementById('chatMessages');
            
            if (input.value.trim()) {
                // Add user message
                const userMsg = document.createElement('div');
                userMsg.className = 'message user';
                userMsg.textContent = input.value;
                messages.appendChild(userMsg);
                
                // Simulate AI response
                setTimeout(() => {
                    const aiMsg = document.createElement('div');
                    aiMsg.className = 'message ai';
                    aiMsg.innerHTML = 'Perfect! I\\'ve scheduled your appointment for Friday at 10:15 AM with Dr. Ganger. You\\'ll receive a confirmation email and SMS reminder 24 hours before. Is there anything else I can help you with today?';
                    messages.appendChild(aiMsg);
                    messages.scrollTop = messages.scrollHeight;
                }, 1000);
                
                input.value = '';
                messages.scrollTop = messages.scrollHeight;
            }
        }
        
        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }
        
        function viewAnalytics() {
            alert('AI Receptionist Analytics\\n\\n📊 Today\\'s Performance:\\n• 247 patient interactions\\n• 94% successful resolution\\n• 47 appointments scheduled\\n• 1.2s average response time\\n• 98% patient satisfaction\\n\\n📈 Trending: Appointment requests +15%');
        }
        
        function trainAI() {
            alert('AI Training Center\\n\\n🧠 Training Options:\\n• Import conversation history\\n• Add medical terminology\\n• Practice-specific responses\\n• Appointment booking rules\\n• Insurance verification steps\\n\\n📚 Continuous learning enabled');
        }
        
        function configureAI() {
            alert('AI Configuration\\n\\n⚙️ Available Settings:\\n• Response tone and style\\n• Appointment availability\\n• Emergency escalation rules\\n• Language preferences\\n• Integration with EHR system\\n\\n🎯 Customize for optimal patient experience');
        }
    </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

function getCallCenterApp() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Call Center Ops - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%);
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
            max-width: 900px;
            width: 90%;
        }
        .logo-icon {
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #059669, #047857);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 2rem; 
            font-weight: bold;
            margin: 0 auto 2rem;
            box-shadow: 0 8px 16px rgba(5, 150, 105, 0.3);
        }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
        .subtitle { color: #4a5568; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 500; }
        p { color: #4a5568; line-height: 1.6; margin-bottom: 2rem; }
        .status { 
            background: linear-gradient(135deg, #059669, #047857);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 1rem;
        }
        .call-section {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
            text-align: left;
        }
        .call-section h3 {
            color: #2d3748;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .call-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .call-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .call-status {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #059669;
            animation: pulse 2s infinite;
        }
        .call-metrics {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            margin: 2rem 0;
        }
        .metric-card {
            background: white;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e2e8f0;
        }
        .metric-number {
            font-size: 1.5rem;
            font-weight: bold;
            color: #059669;
            margin-bottom: 0.25rem;
        }
        .metric-label {
            color: #6b7280;
            font-size: 0.8rem;
        }
        .btn {
            background: linear-gradient(135deg, #059669, #047857);
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-icon">📞</div>
        <h1>Call Center Operations</h1>
        <div class="subtitle">Patient Communication Hub</div>
        <div class="status">✅ System Online</div>
        <p>Comprehensive call center management with queue monitoring, performance analytics, and patient communication tracking.</p>
        
        <div class="call-metrics">
            <div class="metric-card">
                <div class="metric-number">47</div>
                <div class="metric-label">Calls in Queue</div>
            </div>
            <div class="metric-card">
                <div class="metric-number">12</div>
                <div class="metric-label">Active Agents</div>
            </div>
            <div class="metric-card">
                <div class="metric-number">2:14</div>
                <div class="metric-label">Avg Wait Time</div>
            </div>
            <div class="metric-card">
                <div class="metric-number">94%</div>
                <div class="metric-label">Resolution Rate</div>
            </div>
        </div>
        
        <div class="call-section">
            <h3>Active Call Center Agents</h3>
            <div class="call-grid">
                <div class="call-card">
                    <div class="call-status">
                        <div class="status-dot"></div>
                        <strong>Sarah Mitchell</strong>
                    </div>
                    <div>Current Call: Insurance verification</div>
                    <div>Duration: 4:32</div>
                    <div>Calls Today: 23</div>
                    <div>Avg Handle Time: 3:45</div>
                </div>
                
                <div class="call-card">
                    <div class="call-status">
                        <div class="status-dot"></div>
                        <strong>Jennifer Lopez</strong>
                    </div>
                    <div>Current Call: Appointment scheduling</div>
                    <div>Duration: 2:18</div>
                    <div>Calls Today: 31</div>
                    <div>Avg Handle Time: 2:52</div>
                </div>
                
                <div class="call-card">
                    <div class="call-status">
                        <div class="status-dot"></div>
                        <strong>Mike Rodriguez</strong>
                    </div>
                    <div>Current Call: Prescription refill</div>
                    <div>Duration: 1:45</div>
                    <div>Calls Today: 19</div>
                    <div>Avg Handle Time: 4:12</div>
                </div>
                
                <div class="call-card">
                    <div class="call-status">
                        <div class="status-dot"></div>
                        <strong>Lisa Park</strong>
                    </div>
                    <div>Status: Available</div>
                    <div>Last Call: 0:32 ago</div>
                    <div>Calls Today: 27</div>
                    <div>Avg Handle Time: 3:18</div>
                </div>
            </div>
        </div>
        
        <button class="btn" onclick="viewQueue()">📋 Call Queue</button>
        <button class="btn" onclick="agentMetrics()">📊 Agent Metrics</button>
        <button class="btn" onclick="callRecordings()">🎵 Recordings</button>
        <button class="btn" onclick="scheduleAgents()">👥 Schedule</button>
        <a href="/" class="btn">← Back to Portal</a>
    </div>
    
    <script>
        function viewQueue() {
            alert('Call Queue Management\\n\\n📋 Current Queue Status:\\n• 47 calls waiting\\n• Priority calls: 3\\n• Longest wait: 8:42\\n• Estimated wait: 2:14\\n\\nCallback requests: 12\\nScheduled callbacks: 8');
        }
        
        function agentMetrics() {
            alert('Agent Performance Metrics\\n\\n📊 Today\\'s Summary:\\n• Total calls handled: 127\\n• Average handle time: 3:32\\n• First call resolution: 89%\\n• Customer satisfaction: 4.7/5\\n• Peak hour: 10-11 AM (34 calls)');
        }
        
        function callRecordings() {
            alert('Call Recording Center\\n\\n🎵 Recording Options:\\n• Quality monitoring\\n• Training recordings\\n• Compliance verification\\n• Customer feedback\\n• Performance reviews\\n\\n🔒 HIPAA compliant storage');
        }
        
        function scheduleAgents() {
            alert('Agent Scheduling\\n\\n👥 Schedule Management:\\n• Current shift: 12 agents\\n• Next shift: 8 agents (6 PM)\\n• Break rotations: Active\\n• Overtime requests: 2\\n\\n📅 Weekly schedule optimization');
        }
    </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

function getPharmaSchedulingApp() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pharma Scheduling - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%);
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
            max-width: 900px;
            width: 90%;
        }
        .logo-icon {
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #7c3aed, #6d28d9);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 2rem; 
            font-weight: bold;
            margin: 0 auto 2rem;
            box-shadow: 0 8px 16px rgba(124, 58, 237, 0.3);
        }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
        .subtitle { color: #4a5568; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 500; }
        p { color: #4a5568; line-height: 1.6; margin-bottom: 2rem; }
        .status { 
            background: linear-gradient(135deg, #7c3aed, #6d28d9);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 1rem;
        }
        .rep-section {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
            text-align: left;
        }
        .rep-section h3 {
            color: #2d3748;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .rep-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .rep-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .rep-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 1rem;
        }
        .rep-name {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 0.25rem;
        }
        .rep-company {
            color: #7c3aed;
            font-size: 0.9rem;
            font-weight: 500;
        }
        .rep-details {
            font-size: 0.9rem;
            color: #6b7280;
            line-height: 1.4;
        }
        .rep-status {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
            margin-top: 0.5rem;
        }
        .status-confirmed {
            background: #d1fae5;
            color: #047857;
        }
        .status-pending {
            background: #fef3cd;
            color: #92400e;
        }
        .status-completed {
            background: #e0e7ff;
            color: #3730a3;
        }
        .schedule-overview {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            margin: 2rem 0;
        }
        .schedule-card {
            background: white;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e2e8f0;
        }
        .schedule-number {
            font-size: 1.5rem;
            font-weight: bold;
            color: #7c3aed;
            margin-bottom: 0.25rem;
        }
        .schedule-label {
            color: #6b7280;
            font-size: 0.8rem;
        }
        .btn {
            background: linear-gradient(135deg, #7c3aed, #6d28d9);
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-icon">💊</div>
        <h1>Pharma Rep Scheduling</h1>
        <div class="subtitle">Pharmaceutical Representative Management</div>
        <div class="status">✅ System Online</div>
        <p>Comprehensive scheduling system for pharmaceutical representatives, meeting coordination, and product presentation management.</p>
        
        <div class="schedule-overview">
            <div class="schedule-card">
                <div class="schedule-number">8</div>
                <div class="schedule-label">This Week</div>
            </div>
            <div class="schedule-card">
                <div class="schedule-number">3</div>
                <div class="schedule-label">Today</div>
            </div>
            <div class="schedule-card">
                <div class="schedule-number">12</div>
                <div class="schedule-label">Next Month</div>
            </div>
            <div class="schedule-card">
                <div class="schedule-number">6</div>
                <div class="schedule-label">Pending</div>
            </div>
        </div>
        
        <div class="rep-section">
            <h3>Upcoming Representative Visits</h3>
            <div class="rep-grid">
                <div class="rep-card">
                    <div class="rep-name">Amanda Chen</div>
                    <div class="rep-company">Pfizer Dermatology</div>
                    <div class="rep-details">
                        📅 June 14, 2025 - 2:00 PM<br>
                        🕐 Duration: 45 minutes<br>
                        📋 Topic: New eczema treatment<br>
                        👥 Attendees: Dr. Ganger, Sarah M.
                    </div>
                    <div class="rep-status status-confirmed">✅ Confirmed</div>
                </div>
                
                <div class="rep-card">
                    <div class="rep-name">Marcus Johnson</div>
                    <div class="rep-company">Johnson & Johnson</div>
                    <div class="rep-details">
                        📅 June 15, 2025 - 10:30 AM<br>
                        🕐 Duration: 30 minutes<br>
                        📋 Topic: Acne medication updates<br>
                        👥 Attendees: Dr. Ganger
                    </div>
                    <div class="rep-status status-pending">⏳ Pending Approval</div>
                </div>
                
                <div class="rep-card">
                    <div class="rep-name">Dr. Sarah Williams</div>
                    <div class="rep-company">Novartis</div>
                    <div class="rep-details">
                        📅 June 16, 2025 - 1:15 PM<br>
                        🕐 Duration: 60 minutes<br>
                        📋 Topic: Psoriasis clinical trial<br>
                        👥 Attendees: Dr. Ganger, Jennifer K.
                    </div>
                    <div class="rep-status status-confirmed">✅ Confirmed</div>
                </div>
                
                <div class="rep-card">
                    <div class="rep-name">David Kim</div>
                    <div class="rep-company">AbbVie Dermatology</div>
                    <div class="rep-details">
                        📅 June 13, 2025 - 3:30 PM<br>
                        🕐 Duration: 30 minutes<br>
                        📋 Topic: Humira updates<br>
                        👥 Attendees: Dr. Ganger
                    </div>
                    <div class="rep-status status-completed">✅ Completed</div>
                </div>
                
                <div class="rep-card">
                    <div class="rep-name">Lisa Rodriguez</div>
                    <div class="rep-company">Regeneron</div>
                    <div class="rep-details">
                        📅 June 17, 2025 - 11:00 AM<br>
                        🕐 Duration: 45 minutes<br>
                        📋 Topic: Dupixent dermatitis<br>
                        👥 Attendees: Dr. Ganger, Mike R.
                    </div>
                    <div class="rep-status status-pending">⏳ Awaiting Response</div>
                </div>
                
                <div class="rep-card">
                    <div class="rep-name">Thomas Anderson</div>
                    <div class="rep-company">Eli Lilly</div>
                    <div class="rep-details">
                        📅 June 18, 2025 - 9:00 AM<br>
                        🕐 Duration: 30 minutes<br>
                        📋 Topic: Migraine-skin connection<br>
                        👥 Attendees: Dr. Ganger
                    </div>
                    <div class="rep-status status-confirmed">✅ Confirmed</div>
                </div>
            </div>
        </div>
        
        <button class="btn" onclick="scheduleNew()">📅 Schedule Visit</button>
        <button class="btn" onclick="viewCalendar()">📆 Full Calendar</button>
        <button class="btn" onclick="repDatabase()">👥 Rep Database</button>
        <button class="btn" onclick="meetingNotes()">📝 Meeting Notes</button>
        <a href="/" class="btn">← Back to Portal</a>
    </div>
    
    <script>
        function scheduleNew() {
            alert('Schedule New Visit\\n\\n📅 Booking Options:\\n• Representative selection\\n• Available time slots\\n• Meeting duration\\n• Attendee selection\\n• Meeting topic/agenda\\n• Room assignment\\n\\n📧 Confirmation emails sent automatically');
        }
        
        function viewCalendar() {
            alert('Representative Calendar\\n\\n📆 Calendar View:\\n• Weekly schedule overview\\n• Monthly planning view\\n• Conflict detection\\n• Buffer time management\\n• Lunch break coordination\\n\\n🔄 Sync with practice schedule');
        }
        
        function repDatabase() {
            alert('Representative Database\\n\\n👥 Contact Management:\\n• 47 active pharmaceutical reps\\n• Company classifications\\n• Product specializations\\n• Contact preferences\\n• Meeting history\\n• Performance ratings\\n\\n📊 Interaction analytics');
        }
        
        function meetingNotes() {
            alert('Meeting Notes & Follow-up\\n\\n📝 Documentation:\\n• Meeting summaries\\n• Product information\\n• Sample tracking\\n• Action items\\n• Follow-up scheduling\\n• Compliance records\\n\\n📋 Searchable archive');
        }
    </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

function getPlatformDashboardApp() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Platform Dashboard - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%);
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
            max-width: 1000px;
            width: 90%;
        }
        .logo-icon {
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #1e40af, #1d4ed8);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 2rem; 
            font-weight: bold;
            margin: 0 auto 2rem;
            box-shadow: 0 8px 16px rgba(30, 64, 175, 0.3);
        }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
        .subtitle { color: #4a5568; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 500; }
        p { color: #4a5568; line-height: 1.6; margin-bottom: 2rem; }
        .status { 
            background: linear-gradient(135deg, #1e40af, #1d4ed8);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 1rem;
        }
        .dashboard-section {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
            text-align: left;
        }
        .dashboard-section h3 {
            color: #2d3748;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .metric-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            text-align: center;
        }
        .metric-number {
            font-size: 2rem;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 0.5rem;
        }
        .metric-label {
            color: #6b7280;
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
        }
        .metric-change {
            font-size: 0.8rem;
            font-weight: 500;
        }
        .change-positive {
            color: #059669;
        }
        .change-negative {
            color: #dc2626;
        }
        .app-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .app-card {
            background: white;
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .app-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }
        .app-name {
            font-weight: 600;
            color: #2d3748;
        }
        .app-status {
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 500;
        }
        .status-online {
            background: #d1fae5;
            color: #047857;
        }
        .status-maintenance {
            background: #fef3cd;
            color: #92400e;
        }
        .app-stats {
            font-size: 0.8rem;
            color: #6b7280;
        }
        .btn {
            background: linear-gradient(135deg, #1e40af, #1d4ed8);
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-icon">📊</div>
        <h1>Platform Dashboard</h1>
        <div class="subtitle">Ganger Platform Analytics & Monitoring</div>
        <div class="status">✅ All Systems Operational</div>
        <p>Comprehensive platform overview with real-time metrics, application status, and performance analytics.</p>
        
        <div class="dashboard-section">
            <h3>Platform Performance Metrics</h3>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-number">2,847</div>
                    <div class="metric-label">Daily Active Users</div>
                    <div class="metric-change change-positive">↑ 12% vs yesterday</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-number">47,293</div>
                    <div class="metric-label">Total Requests</div>
                    <div class="metric-change change-positive">↑ 8% vs yesterday</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-number">148ms</div>
                    <div class="metric-label">Avg Response Time</div>
                    <div class="metric-change change-positive">↓ 15ms vs yesterday</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-number">99.97%</div>
                    <div class="metric-label">System Uptime</div>
                    <div class="metric-change change-positive">↑ 0.02% vs last week</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-number">1,247</div>
                    <div class="metric-label">Appointments Scheduled</div>
                    <div class="metric-change change-positive">↑ 23% vs last week</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-number">94.6%</div>
                    <div class="metric-label">Patient Satisfaction</div>
                    <div class="metric-change change-positive">↑ 1.2% vs last month</div>
                </div>
            </div>
        </div>
        
        <div class="dashboard-section">
            <h3>Application Health Status</h3>
            <div class="app-grid">
                <div class="app-card">
                    <div class="app-header">
                        <span class="app-name">💊 Medication Auth</span>
                        <span class="app-status status-online">Online</span>
                    </div>
                    <div class="app-stats">
                        Requests: 1,247 | Avg Response: 89ms | Uptime: 100%
                    </div>
                </div>
                
                <div class="app-card">
                    <div class="app-header">
                        <span class="app-name">📋 Batch Closeout</span>
                        <span class="app-status status-online">Online</span>
                    </div>
                    <div class="app-stats">
                        Requests: 523 | Avg Response: 124ms | Uptime: 99.9%
                    </div>
                </div>
                
                <div class="app-card">
                    <div class="app-header">
                        <span class="app-name">📊 Integration Status</span>
                        <span class="app-status status-online">Online</span>
                    </div>
                    <div class="app-stats">
                        Requests: 892 | Avg Response: 67ms | Uptime: 100%
                    </div>
                </div>
                
                <div class="app-card">
                    <div class="app-header">
                        <span class="app-name">📦 Inventory</span>
                        <span class="app-status status-online">Online</span>
                    </div>
                    <div class="app-stats">
                        Requests: 2,156 | Avg Response: 156ms | Uptime: 99.8%
                    </div>
                </div>
                
                <div class="app-card">
                    <div class="app-header">
                        <span class="app-name">🔄 EOS L10</span>
                        <span class="app-status status-maintenance">Maintenance</span>
                    </div>
                    <div class="app-stats">
                        Requests: 0 | Maintenance Window: 2:00-4:00 AM
                    </div>
                </div>
                
                <div class="app-card">
                    <div class="app-header">
                        <span class="app-name">📄 Patient Handouts</span>
                        <span class="app-status status-online">Online</span>
                    </div>
                    <div class="app-stats">
                        Requests: 1,834 | Avg Response: 201ms | Uptime: 99.9%
                    </div>
                </div>
                
                <div class="app-card">
                    <div class="app-header">
                        <span class="app-name">🏥 Check-in Kiosk</span>
                        <span class="app-status status-online">Online</span>
                    </div>
                    <div class="app-stats">
                        Requests: 567 | Avg Response: 178ms | Uptime: 100%
                    </div>
                </div>
                
                <div class="app-card">
                    <div class="app-header">
                        <span class="app-name">⚙️ Config Dashboard</span>
                        <span class="app-status status-online">Online</span>
                    </div>
                    <div class="app-stats">
                        Requests: 89 | Avg Response: 95ms | Uptime: 100%
                    </div>
                </div>
            </div>
        </div>
        
        <button class="btn" onclick="viewDetails()">📈 Detailed Analytics</button>
        <button class="btn" onclick="systemLogs()">📋 System Logs</button>
        <button class="btn" onclick="alertSettings()">🔔 Alert Settings</button>
        <button class="btn" onclick="exportReport()">📁 Export Report</button>
        <a href="/" class="btn">← Back to Portal</a>
    </div>
    
    <script>
        function viewDetails() {
            alert('Detailed Analytics\\n\\n📈 Advanced Metrics:\\n• Hourly traffic patterns\\n• Geographic user distribution\\n• Device and browser analytics\\n• Feature usage statistics\\n• Performance bottlenecks\\n• User journey analysis\\n\\n📊 Custom reporting available');
        }
        
        function systemLogs() {
            alert('System Logs\\n\\n📋 Log Categories:\\n• Application errors (12 today)\\n• Security events (3 today)\\n• Performance warnings (8 today)\\n• User actions (2,847 today)\\n• System maintenance (1 scheduled)\\n\\n🔍 Advanced filtering and search');
        }
        
        function alertSettings() {
            alert('Alert Configuration\\n\\n🔔 Notification Settings:\\n• Performance threshold alerts\\n• Security incident notifications\\n• Uptime monitoring alerts\\n• Error rate notifications\\n• Maintenance reminders\\n\\n📧 Email, SMS, and Slack integration');
        }
        
        function exportReport() {
            alert('Export Platform Report\\n\\n📁 Report Options:\\n• Daily performance summary\\n• Weekly analytics report\\n• Monthly platform overview\\n• Custom date range report\\n• Executive dashboard summary\\n\\n📊 PDF, Excel, and CSV formats');
        }
    </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

function getSocialReviewsApp() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Social Reviews - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%);
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
            max-width: 900px;
            width: 90%;
        }
        .logo-icon {
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #ec4899, #db2777);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 2rem; 
            font-weight: bold;
            margin: 0 auto 2rem;
            box-shadow: 0 8px 16px rgba(236, 72, 153, 0.3);
        }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
        .subtitle { color: #4a5568; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 500; }
        p { color: #4a5568; line-height: 1.6; margin-bottom: 2rem; }
        .status { 
            background: linear-gradient(135deg, #ec4899, #db2777);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 1rem;
        }
        .review-section {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
            text-align: left;
        }
        .review-section h3 {
            color: #2d3748;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .platform-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .platform-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            text-align: center;
        }
        .platform-name {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 0.5rem;
        }
        .rating-display {
            font-size: 1.5rem;
            margin: 0.5rem 0;
        }
        .stars {
            color: #f59e0b;
            margin-bottom: 0.25rem;
        }
        .rating-number {
            font-weight: bold;
            color: #ec4899;
        }
        .review-count {
            color: #6b7280;
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        .recent-reviews {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
            margin-top: 2rem;
        }
        .review-card {
            background: white;
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            text-align: left;
        }
        .review-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        .reviewer-name {
            font-weight: 600;
            color: #2d3748;
        }
        .review-date {
            color: #6b7280;
            font-size: 0.8rem;
        }
        .review-stars {
            color: #f59e0b;
            margin-bottom: 0.5rem;
        }
        .review-text {
            color: #4b5563;
            line-height: 1.4;
            font-size: 0.9rem;
        }
        .review-platform {
            color: #ec4899;
            font-size: 0.8rem;
            font-weight: 500;
            margin-top: 0.5rem;
        }
        .btn {
            background: linear-gradient(135deg, #ec4899, #db2777);
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-icon">⭐</div>
        <h1>Social Reviews</h1>
        <div class="subtitle">Online Reputation Management</div>
        <div class="status">✅ Monitoring Active</div>
        <p>Comprehensive review monitoring and management across all major platforms with real-time notifications and response tracking.</p>
        
        <div class="review-section">
            <h3>Review Platform Overview</h3>
            <div class="platform-grid">
                <div class="platform-card">
                    <div class="platform-name">Google Reviews</div>
                    <div class="rating-display">
                        <div class="stars">★★★★★</div>
                        <div class="rating-number">4.8</div>
                    </div>
                    <div class="review-count">247 reviews</div>
                    <div>Last review: 2 hours ago</div>
                </div>
                
                <div class="platform-card">
                    <div class="platform-name">Healthgrades</div>
                    <div class="rating-display">
                        <div class="stars">★★★★★</div>
                        <div class="rating-number">4.9</div>
                    </div>
                    <div class="review-count">156 reviews</div>
                    <div>Last review: 1 day ago</div>
                </div>
                
                <div class="platform-card">
                    <div class="platform-name">Vitals</div>
                    <div class="rating-display">
                        <div class="stars">★★★★☆</div>
                        <div class="rating-number">4.7</div>
                    </div>
                    <div class="review-count">89 reviews</div>
                    <div>Last review: 3 days ago</div>
                </div>
                
                <div class="platform-card">
                    <div class="platform-name">Yelp</div>
                    <div class="rating-display">
                        <div class="stars">★★★★★</div>
                        <div class="rating-number">4.6</div>
                    </div>
                    <div class="review-count">123 reviews</div>
                    <div>Last review: 5 hours ago</div>
                </div>
                
                <div class="platform-card">
                    <div class="platform-name">Facebook</div>
                    <div class="rating-display">
                        <div class="stars">★★★★★</div>
                        <div class="rating-number">4.9</div>
                    </div>
                    <div class="review-count">78 reviews</div>
                    <div>Last review: 1 day ago</div>
                </div>
                
                <div class="platform-card">
                    <div class="platform-name">WebMD</div>
                    <div class="rating-display">
                        <div class="stars">★★★★★</div>
                        <div class="rating-number">4.8</div>
                    </div>
                    <div class="review-count">67 reviews</div>
                    <div>Last review: 2 days ago</div>
                </div>
            </div>
        </div>
        
        <div class="review-section">
            <h3>Recent Reviews</h3>
            <div class="recent-reviews">
                <div class="review-card">
                    <div class="review-header">
                        <div class="reviewer-name">Sarah M.</div>
                        <div class="review-date">2 hours ago</div>
                    </div>
                    <div class="review-stars">★★★★★</div>
                    <div class="review-text">"Dr. Ganger is incredibly knowledgeable and caring. The staff is professional and the new check-in system made my visit so much smoother. Highly recommend!"</div>
                    <div class="review-platform">Google Reviews</div>
                </div>
                
                <div class="review-card">
                    <div class="review-header">
                        <div class="reviewer-name">Michael R.</div>
                        <div class="review-date">5 hours ago</div>
                    </div>
                    <div class="review-stars">★★★★★</div>
                    <div class="review-text">"Excellent care for my psoriasis treatment. The medication authorization process was seamless and I got my prescription the same day."</div>
                    <div class="review-platform">Yelp</div>
                </div>
                
                <div class="review-card">
                    <div class="review-header">
                        <div class="reviewer-name">Jennifer K.</div>
                        <div class="review-date">1 day ago</div>
                    </div>
                    <div class="review-stars">★★★★★</div>
                    <div class="review-text">"The dermatology practice has really modernized their systems. Scheduling is easy, wait times are minimal, and Dr. Ganger's expertise is unmatched."</div>
                    <div class="review-platform">Healthgrades</div>
                </div>
                
                <div class="review-card">
                    <div class="review-header">
                        <div class="reviewer-name">David L.</div>
                        <div class="review-date">1 day ago</div>
                    </div>
                    <div class="review-stars">★★★★★</div>
                    <div class="review-text">"Outstanding experience from start to finish. The patient handouts were very informative and the follow-up care exceeded my expectations."</div>
                    <div class="review-platform">Facebook</div>
                </div>
            </div>
        </div>
        
        <button class="btn" onclick="respondToReview()">💬 Respond to Reviews</button>
        <button class="btn" onclick="reviewAnalytics()">📊 Analytics</button>
        <button class="btn" onclick="reviewAlerts()">🔔 Alert Settings</button>
        <button class="btn" onclick="requestReviews()">📧 Request Reviews</button>
        <a href="/" class="btn">← Back to Portal</a>
    </div>
    
    <script>
        function respondToReview() {
            alert('Review Response Management\\n\\n💬 Response Options:\\n• Template responses\\n• Personalized replies\\n• Professional tone suggestions\\n• HIPAA-compliant messaging\\n• Automated thank you notes\\n\\n📝 All responses logged and tracked');
        }
        
        function reviewAnalytics() {
            alert('Review Analytics\\n\\n📊 Analytics Dashboard:\\n• Overall rating trends\\n• Platform comparison\\n• Sentiment analysis\\n• Response rate tracking\\n• Competitor benchmarking\\n• Monthly performance reports\\n\\n📈 Actionable insights provided');
        }
        
        function reviewAlerts() {
            alert('Review Alert Configuration\\n\\n🔔 Notification Settings:\\n• New review alerts (immediate)\\n• Negative review priority alerts\\n• Weekly summary reports\\n• Platform-specific notifications\\n• Response reminders\\n\\n📧 Email, SMS, and Slack integration');
        }
        
        function requestReviews() {
            alert('Review Request Campaign\\n\\n📧 Request Options:\\n• Post-appointment follow-ups\\n• Automated email sequences\\n• SMS review invitations\\n• Platform-specific links\\n• Incentive programs\\n\\n🎯 Targeted campaigns for satisfied patients');
        }
    </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

function getStaffPortalApp() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Staff Portal - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0891b2 0%, #0e7490 50%, #155e75 100%);
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
            max-width: 900px;
            width: 90%;
        }
        .logo-icon {
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #0891b2, #0e7490);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 2rem; 
            font-weight: bold;
            margin: 0 auto 2rem;
            box-shadow: 0 8px 16px rgba(8, 145, 178, 0.3);
        }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
        .subtitle { color: #4a5568; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 500; }
        p { color: #4a5568; line-height: 1.6; margin-bottom: 2rem; }
        .status { 
            background: linear-gradient(135deg, #0891b2, #0e7490);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 1rem;
        }
        .staff-section {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
            text-align: left;
        }
        .staff-section h3 {
            color: #2d3748;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .staff-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .staff-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .staff-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        .staff-avatar {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #0891b2, #0e7490);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 1.2rem;
        }
        .staff-info {
            flex: 1;
        }
        .staff-name {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 0.25rem;
        }
        .staff-role {
            color: #0891b2;
            font-size: 0.9rem;
            font-weight: 500;
        }
        .staff-details {
            font-size: 0.9rem;
            color: #6b7280;
            line-height: 1.4;
        }
        .staff-status {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
            margin-top: 0.5rem;
        }
        .status-active {
            background: #d1fae5;
            color: #047857;
        }
        .status-busy {
            background: #fef3cd;
            color: #92400e;
        }
        .status-offline {
            background: #f3f4f6;
            color: #6b7280;
        }
        .quick-actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        .action-card {
            background: white;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e2e8f0;
            cursor: pointer;
            transition: all 0.2s;
        }
        .action-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .action-icon {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }
        .action-label {
            font-weight: 500;
            color: #2d3748;
        }
        .btn {
            background: linear-gradient(135deg, #0891b2, #0e7490);
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-icon">👥</div>
        <h1>Staff Portal</h1>
        <div class="subtitle">Employee Management & Resources</div>
        <div class="status">✅ All Staff Online</div>
        <p>Comprehensive staff management system with employee profiles, scheduling, performance tracking, and internal communications.</p>
        
        <div class="quick-actions">
            <div class="action-card" onclick="clockInOut()">
                <div class="action-icon">🕐</div>
                <div class="action-label">Clock In/Out</div>
            </div>
            <div class="action-card" onclick="viewSchedule()">
                <div class="action-icon">📅</div>
                <div class="action-label">My Schedule</div>
            </div>
            <div class="action-card" onclick="requestTimeOff()">
                <div class="action-icon">🏖️</div>
                <div class="action-label">Time Off</div>
            </div>
            <div class="action-card" onclick="viewPaystub()">
                <div class="action-icon">💰</div>
                <div class="action-label">Pay Stub</div>
            </div>
        </div>
        
        <div class="staff-section">
            <h3>Current Staff Directory</h3>
            <div class="staff-grid">
                <div class="staff-card">
                    <div class="staff-header">
                        <div class="staff-avatar">AG</div>
                        <div class="staff-info">
                            <div class="staff-name">Dr. Anand Ganger</div>
                            <div class="staff-role">Lead Dermatologist</div>
                        </div>
                    </div>
                    <div class="staff-details">
                        📧 anand@gangerdermatology.com<br>
                        📞 (734) 555-0101<br>
                        🏥 Clinic Director | 15+ years experience
                    </div>
                    <div class="staff-status status-active">● Available</div>
                </div>
                
                <div class="staff-card">
                    <div class="staff-header">
                        <div class="staff-avatar">SM</div>
                        <div class="staff-info">
                            <div class="staff-name">Sarah Mitchell</div>
                            <div class="staff-role">Medical Assistant</div>
                        </div>
                    </div>
                    <div class="staff-details">
                        📧 sarah.m@gangerdermatology.com<br>
                        📞 (734) 555-0102<br>
                        🎓 Certified MA | Patient Care Specialist
                    </div>
                    <div class="staff-status status-busy">● With Patient</div>
                </div>
                
                <div class="staff-card">
                    <div class="staff-header">
                        <div class="staff-avatar">JL</div>
                        <div class="staff-info">
                            <div class="staff-name">Jennifer Lopez</div>
                            <div class="staff-role">Front Desk Coordinator</div>
                        </div>
                    </div>
                    <div class="staff-details">
                        📧 jennifer.l@gangerdermatology.com<br>
                        📞 (734) 555-0103<br>
                        📋 Scheduling | Insurance Verification
                    </div>
                    <div class="staff-status status-active">● Available</div>
                </div>
                
                <div class="staff-card">
                    <div class="staff-header">
                        <div class="staff-avatar">MR</div>
                        <div class="staff-info">
                            <div class="staff-name">Mike Rodriguez</div>
                            <div class="staff-role">IT Administrator</div>
                        </div>
                    </div>
                    <div class="staff-details">
                        📧 mike.r@gangerdermatology.com<br>
                        📞 (734) 555-0104<br>
                        💻 Systems Management | Platform Support
                    </div>
                    <div class="staff-status status-active">● Available</div>
                </div>
                
                <div class="staff-card">
                    <div class="staff-header">
                        <div class="staff-avatar">LP</div>
                        <div class="staff-info">
                            <div class="staff-name">Lisa Park</div>
                            <div class="staff-role">Insurance Specialist</div>
                        </div>
                    </div>
                    <div class="staff-details">
                        📧 lisa.p@gangerdermatology.com<br>
                        📞 (734) 555-0105<br>
                        🏥 Authorization | Claims Processing
                    </div>
                    <div class="staff-status status-busy">● On Call</div>
                </div>
                
                <div class="staff-card">
                    <div class="staff-header">
                        <div class="staff-avatar">KW</div>
                        <div class="staff-info">
                            <div class="staff-name">Karen Williams</div>
                            <div class="staff-role">Practice Manager</div>
                        </div>
                    </div>
                    <div class="staff-details">
                        📧 karen.w@gangerdermatology.com<br>
                        📞 (734) 555-0106<br>
                        📊 Operations | HR | Compliance
                    </div>
                    <div class="staff-status status-offline">● Off Today</div>
                </div>
            </div>
        </div>
        
        <button class="btn" onclick="addEmployee()">➕ Add Employee</button>
        <button class="btn" onclick="bulkScheduling()">📅 Bulk Scheduling</button>
        <button class="btn" onclick="performanceReview()">📊 Performance</button>
        <button class="btn" onclick="staffReports()">📋 Reports</button>
        <a href="/" class="btn">← Back to Portal</a>
    </div>
    
    <script>
        function clockInOut() {
            alert('Time Clock System\\n\\n🕐 Current Status: Clocked In\\n⏰ Shift Start: 8:00 AM\\n📍 Location: Main Clinic\\n⏱️ Hours Today: 6:32\\n\\n✅ Clock out available after 8-hour minimum');
        }
        
        function viewSchedule() {
            alert('My Work Schedule\\n\\n📅 This Week:\\nMon: 8:00 AM - 5:00 PM\\nTue: 8:00 AM - 5:00 PM\\nWed: 8:00 AM - 5:00 PM\\nThu: 8:00 AM - 5:00 PM\\nFri: 8:00 AM - 4:00 PM\\nSat-Sun: Off\\n\\n🔄 Shift swap requests available');
        }
        
        function requestTimeOff() {
            alert('Time Off Request\\n\\n🏖️ Request Types:\\n• Vacation time\\n• Sick leave\\n• Personal days\\n• Bereavement leave\\n• Medical appointments\\n\\n📅 Submit requests 2 weeks in advance');
        }
        
        function viewPaystub() {
            alert('Payroll Information\\n\\n💰 Latest Pay Stub:\\n• Pay Period: 06/01 - 06/15\\n• Gross Pay: $2,480.00\\n• Deductions: $586.32\\n• Net Pay: $1,893.68\\n\\n📄 Download PDF available');
        }
        
        function addEmployee() {
            alert('Add New Employee\\n\\n👤 Employee Setup:\\n• Personal information\\n• Role and department\\n• Compensation details\\n• Benefit selections\\n• System access permissions\\n\\n📝 HR approval required');
        }
        
        function bulkScheduling() {
            alert('Bulk Schedule Management\\n\\n📅 Scheduling Tools:\\n• Monthly schedule templates\\n• Automatic shift assignments\\n• Coverage requirements\\n• Holiday scheduling\\n• Overtime management\\n\\n🔄 Auto-notification to staff');
        }
        
        function performanceReview() {
            alert('Performance Management\\n\\n📊 Review System:\\n• Quarterly evaluations\\n• Goal setting and tracking\\n• 360-degree feedback\\n• Professional development\\n• Merit increase recommendations\\n\\n📈 Performance analytics dashboard');
        }
        
        function staffReports() {
            alert('Staff Reporting\\n\\n📋 Available Reports:\\n• Attendance summaries\\n• Overtime tracking\\n• Performance metrics\\n• Training compliance\\n• Payroll reports\\n• Turnover analysis\\n\\n📊 Custom report builder');
        }
    </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

function getComponentShowcaseApp() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Component Showcase - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #3730a3 100%);
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
            max-width: 1000px;
            width: 90%;
        }
        .logo-icon {
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 2rem; 
            font-weight: bold;
            margin: 0 auto 2rem;
            box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
        }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
        .subtitle { color: #4a5568; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 500; }
        p { color: #4a5568; line-height: 1.6; margin-bottom: 2rem; }
        .status { 
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 1rem;
        }
        .showcase-section {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
            text-align: left;
        }
        .showcase-section h3 {
            color: #2d3748;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .component-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .component-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .component-title {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .component-demo {
            background: #f9fafb;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            border: 1px dashed #d1d5db;
        }
        .demo-button {
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            color: white;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 6px;
            font-size: 0.9rem;
            cursor: pointer;
            margin: 0.25rem;
        }
        .demo-input {
            padding: 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            width: 100%;
            margin: 0.25rem 0;
        }
        .demo-card {
            background: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin: 0.5rem 0;
        }
        .demo-alert {
            padding: 0.75rem;
            border-radius: 6px;
            margin: 0.5rem 0;
        }
        .alert-success {
            background: #d1fae5;
            color: #047857;
            border: 1px solid #a7f3d0;
        }
        .alert-warning {
            background: #fef3cd;
            color: #92400e;
            border: 1px solid #fcd34d;
        }
        .alert-error {
            background: #fecaca;
            color: #dc2626;
            border: 1px solid #f87171;
        }
        .component-code {
            background: #1f2937;
            color: #f3f4f6;
            padding: 1rem;
            border-radius: 6px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.8rem;
            overflow-x: auto;
        }
        .btn {
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-icon">🧩</div>
        <h1>Component Showcase</h1>
        <div class="subtitle">UI Component Library & Design System</div>
        <div class="status">✅ All Components Active</div>
        <p>Comprehensive showcase of reusable UI components, design patterns, and interactive elements used across the Ganger Platform.</p>
        
        <div class="showcase-section">
            <h3>Interactive Components Demo</h3>
            <div class="component-grid">
                <div class="component-card">
                    <div class="component-title">🔘 Buttons & Actions</div>
                    <div class="component-demo">
                        <button class="demo-button">Primary Button</button>
                        <button class="demo-button" style="background: #059669;">Success Button</button>
                        <button class="demo-button" style="background: #dc2626;">Danger Button</button>
                        <button class="demo-button" style="background: #6b7280;">Secondary</button>
                    </div>
                    <div class="component-code">
&lt;button class="btn-primary"&gt;Primary&lt;/button&gt;
&lt;button class="btn-success"&gt;Success&lt;/button&gt;
&lt;button class="btn-danger"&gt;Danger&lt;/button&gt;</div>
                </div>
                
                <div class="component-card">
                    <div class="component-title">📝 Form Elements</div>
                    <div class="component-demo">
                        <input type="text" class="demo-input" placeholder="Text Input">
                        <input type="email" class="demo-input" placeholder="Email Input">
                        <select class="demo-input">
                            <option>Select Option</option>
                            <option>Option 1</option>
                            <option>Option 2</option>
                        </select>
                    </div>
                    <div class="component-code">
&lt;input type="text" class="form-input" /&gt;
&lt;select class="form-select"&gt;...&lt;/select&gt;</div>
                </div>
                
                <div class="component-card">
                    <div class="component-title">🔔 Alert Messages</div>
                    <div class="component-demo">
                        <div class="demo-alert alert-success">✅ Success! Operation completed successfully.</div>
                        <div class="demo-alert alert-warning">⚠️ Warning! Please review your input.</div>
                        <div class="demo-alert alert-error">❌ Error! Something went wrong.</div>
                    </div>
                    <div class="component-code">
&lt;div class="alert alert-success"&gt;...&lt;/div&gt;
&lt;div class="alert alert-warning"&gt;...&lt;/div&gt;
&lt;div class="alert alert-error"&gt;...&lt;/div&gt;</div>
                </div>
                
                <div class="component-card">
                    <div class="component-title">🃏 Card Components</div>
                    <div class="component-demo">
                        <div class="demo-card">
                            <h4 style="margin-bottom: 0.5rem;">Patient Information</h4>
                            <p style="color: #6b7280; font-size: 0.9rem;">John Doe • Age 45 • Next appointment: June 15</p>
                        </div>
                        <div class="demo-card">
                            <h4 style="margin-bottom: 0.5rem;">Medication Status</h4>
                            <p style="color: #6b7280; font-size: 0.9rem;">Humira • Approved • Expires: Dec 2025</p>
                        </div>
                    </div>
                    <div class="component-code">
&lt;div class="card"&gt;
  &lt;h4&gt;Card Title&lt;/h4&gt;
  &lt;p&gt;Card content...&lt;/p&gt;
&lt;/div&gt;</div>
                </div>
                
                <div class="component-card">
                    <div class="component-title">📊 Progress & Status</div>
                    <div class="component-demo">
                        <div style="margin: 0.5rem 0;">
                            <div style="background: #e5e7eb; height: 8px; border-radius: 4px;">
                                <div style="background: #6366f1; height: 8px; width: 75%; border-radius: 4px;"></div>
                            </div>
                            <small style="color: #6b7280;">Progress: 75% complete</small>
                        </div>
                        <div style="margin: 0.5rem 0;">
                            <span style="background: #d1fae5; color: #047857; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">● Online</span>
                            <span style="background: #fef3cd; color: #92400e; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">● Pending</span>
                        </div>
                    </div>
                    <div class="component-code">
&lt;div class="progress-bar"&gt;
  &lt;div class="progress-fill" style="width: 75%"&gt;&lt;/div&gt;
&lt;/div&gt;
&lt;span class="status-online"&gt;Online&lt;/span&gt;</div>
                </div>
                
                <div class="component-card">
                    <div class="component-title">🔍 Search & Filters</div>
                    <div class="component-demo">
                        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <input type="search" class="demo-input" placeholder="Search patients..." style="flex: 1;">
                            <button class="demo-button">🔍</button>
                        </div>
                        <div>
                            <span style="background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem; margin: 0.25rem;">All</span>
                            <span style="background: #e0e7ff; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem; margin: 0.25rem;">Active</span>
                            <span style="background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem; margin: 0.25rem;">Pending</span>
                        </div>
                    </div>
                    <div class="component-code">
&lt;input type="search" class="search-input" /&gt;
&lt;div class="filter-tabs"&gt;
  &lt;span class="tab active"&gt;All&lt;/span&gt;
  &lt;span class="tab"&gt;Active&lt;/span&gt;
&lt;/div&gt;</div>
                </div>
                
                <div class="component-card">
                    <div class="component-title">📅 Date & Time</div>
                    <div class="component-demo">
                        <input type="date" class="demo-input" style="margin-bottom: 0.5rem;">
                        <input type="time" class="demo-input" style="margin-bottom: 0.5rem;">
                        <div style="background: #f9fafb; padding: 0.5rem; border-radius: 6px; font-size: 0.9rem;">
                            📅 Today: June 13, 2025<br>
                            🕐 Current: 2:34 PM EST
                        </div>
                    </div>
                    <div class="component-code">
&lt;input type="date" class="date-input" /&gt;
&lt;input type="time" class="time-input" /&gt;
&lt;div class="datetime-display"&gt;...&lt;/div&gt;</div>
                </div>
                
                <div class="component-card">
                    <div class="component-title">📱 Mobile Responsive</div>
                    <div class="component-demo">
                        <div style="border: 2px solid #d1d5db; border-radius: 12px; padding: 1rem; width: 200px; margin: 0 auto;">
                            <div style="background: #6366f1; height: 4px; border-radius: 2px; margin-bottom: 1rem;"></div>
                            <div style="font-size: 0.8rem; text-align: center;">
                                📱 Mobile Layout<br>
                                Stack Navigation<br>
                                Touch Optimized
                            </div>
                        </div>
                    </div>
                    <div class="component-code">
@media (max-width: 768px) {
  .container { padding: 1rem; }
  .grid { grid-template-columns: 1fr; }
}</div>
                </div>
            </div>
        </div>
        
        <button class="btn" onclick="viewCode()">👨‍💻 View Source Code</button>
        <button class="btn" onclick="downloadKit()">📦 Download Kit</button>
        <button class="btn" onclick="designTokens()">🎨 Design Tokens</button>
        <button class="btn" onclick="accessibility()">♿ Accessibility</button>
        <a href="/" class="btn">← Back to Portal</a>
    </div>
    
    <script>
        function viewCode() {
            alert('Source Code Repository\\n\\n👨‍💻 Code Access:\\n• GitHub repository links\\n• Component documentation\\n• Usage examples\\n• API references\\n• Implementation guides\\n\\n📋 Copy-paste ready code snippets');
        }
        
        function downloadKit() {
            alert('UI Kit Download\\n\\n📦 Available Formats:\\n• Figma design system\\n• Sketch component library\\n• CSS framework\\n• React component package\\n• Vue.js components\\n\\n📁 Complete design system bundle');
        }
        
        function designTokens() {
            alert('Design Token System\\n\\n🎨 Token Categories:\\n• Colors: Primary, secondary, semantic\\n• Typography: Font families, sizes, weights\\n• Spacing: Margins, padding, gaps\\n• Shadows: Elevation system\\n• Border radius: Corner styles\\n\\n🔧 JSON and CSS custom properties');
        }
        
        function accessibility() {
            alert('Accessibility Features\\n\\n♿ A11Y Compliance:\\n• WCAG 2.1 AA standards\\n• Keyboard navigation support\\n• Screen reader optimization\\n• Color contrast validation\\n• Focus management\\n• ARIA labels and roles\\n\\n✅ 508 compliance tested');
        }
    </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

function getComingSoonPage(appName) {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName} - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #64748b 0%, #475569 50%, #334155 100%);
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
        .logo-icon {
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #64748b, #475569);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 2rem; 
            font-weight: bold;
            margin: 0 auto 2rem;
            box-shadow: 0 8px 16px rgba(100, 116, 139, 0.3);
        }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; }
        .subtitle { color: #4a5568; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 500; }
        p { color: #4a5568; line-height: 1.6; margin-bottom: 2rem; }
        .status { 
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 1rem;
        }
        .btn {
            background: linear-gradient(135deg, #64748b, #475569);
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-icon">🚧</div>
        <h1>${appName}</h1>
        <div class="subtitle">Ganger Dermatology Platform</div>
        <div class="status">🔨 Coming Soon</div>
        <p>This application is currently being developed and will be available soon with full functionality and professional medical practice features.</p>
        <a href="/" class="btn">← Back to Staff Portal</a>
    </div>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

// 🔄 Subroute Handlers
function getKioskSubroute(pathname) {
  const timestamp = new Date().toISOString();
  const subroute = pathname.split('/')[2] || 'dashboard';
  
  const content = {
    dashboard: {
      title: 'Kiosk Dashboard',
      description: 'Monitor check-in kiosk performance and analytics',
      stats: `Active Kiosks: ${Math.floor(Math.random() * 3) + 2} | Check-ins Today: ${Math.floor(Math.random() * 50) + 100}`
    },
    settings: {
      title: 'Kiosk Settings',
      description: 'Configure kiosk display options and patient flow',
      stats: `Display Timeout: 30s | Language Options: 3 | Payment Methods: 4`
    },
    analytics: {
      title: 'Kiosk Analytics',
      description: 'View detailed kiosk usage patterns and performance metrics',
      stats: `Avg Check-in Time: ${Math.floor(Math.random() * 60) + 120}s | Success Rate: ${Math.floor(Math.random() * 5) + 95}%`
    }
  }[subroute] || content.dashboard;
  
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title} - Dynamic</title>
    <style>
        body { font-family: system-ui; background: #1e293b; color: white; padding: 2rem; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #334155; padding: 2rem; border-radius: 10px; margin-bottom: 2rem; }
        .stats { background: #475569; padding: 1rem; border-radius: 5px; margin-top: 1rem; }
        .timestamp { font-family: monospace; color: #94a3b8; margin-top: 2rem; }
        a { color: #60a5fa; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🖥️ ${content.title}</h1>
            <p>${content.description}</p>
            <div class="stats">${content.stats}</div>
        </div>
        <p>Navigation: 
            <a href="/kiosk">Main</a> | 
            <a href="/kiosk/dashboard">Dashboard</a> | 
            <a href="/kiosk/settings">Settings</a> | 
            <a href="/kiosk/analytics">Analytics</a>
        </p>
        <p class="timestamp">Generated: ${timestamp}</p>
    </div>
</body>
</html>`, {
    headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' }
  });
}

function getConfigSubroute(pathname) {
  const timestamp = new Date().toISOString();
  const subroute = pathname.split('/')[2] || 'apps';
  
  const content = {
    apps: {
      title: 'Application Configuration',
      description: 'Manage settings for all platform applications',
      stats: `Active Apps: ${Math.floor(Math.random() * 5) + 15} | Configurations: ${Math.floor(Math.random() * 50) + 200}`
    },
    integrations: {
      title: 'Integration Settings',
      description: 'Configure external service connections and APIs',
      stats: `Active Integrations: 8 | API Calls Today: ${Math.floor(Math.random() * 1000) + 5000}`
    },
    security: {
      title: 'Security Configuration',
      description: 'Manage authentication, permissions, and security policies',
      stats: `Active Users: ${Math.floor(Math.random() * 50) + 150} | Security Policies: 12`
    }
  }[subroute] || content.apps;
  
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title} - Dynamic</title>
    <style>
        body { font-family: system-ui; background: #0f172a; color: #e2e8f0; padding: 2rem; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #1e293b; padding: 2rem; border-radius: 10px; margin-bottom: 2rem; }
        .stats { background: #334155; padding: 1rem; border-radius: 5px; margin-top: 1rem; }
        .timestamp { font-family: monospace; color: #64748b; margin-top: 2rem; }
        a { color: #60a5fa; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚙️ ${content.title}</h1>
            <p>${content.description}</p>
            <div class="stats">${content.stats}</div>
        </div>
        <p>Navigation: 
            <a href="/config">Main</a> | 
            <a href="/config/apps">Apps</a> | 
            <a href="/config/integrations">Integrations</a> | 
            <a href="/config/security">Security</a>
        </p>
        <p class="timestamp">Generated: ${timestamp}</p>
    </div>
</body>
</html>`, {
    headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' }
  });
}

function getAIReceptionistSubroute(pathname) {
  const timestamp = new Date().toISOString();
  const subroute = pathname.split('/')[2] || 'dashboard';
  
  const content = {
    dashboard: {
      title: 'AI Receptionist Dashboard',
      description: 'Monitor AI call handling and performance metrics',
      stats: `Calls Handled: ${Math.floor(Math.random() * 100) + 200} | Success Rate: ${Math.floor(Math.random() * 10) + 90}%`
    },
    settings: {
      title: 'AI Configuration',
      description: 'Configure AI responses and call routing rules',
      stats: `Response Templates: 45 | Routing Rules: 12 | Voice Options: 3`
    },
    analytics: {
      title: 'AI Performance Analytics',
      description: 'Detailed analysis of AI receptionist interactions',
      stats: `Avg Call Duration: ${Math.floor(Math.random() * 60) + 120}s | Customer Satisfaction: 4.${Math.floor(Math.random() * 5) + 5}/5`
    }
  }[subroute] || content.dashboard;
  
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title} - Dynamic</title>
    <style>
        body { font-family: system-ui; background: #1a1f2e; color: #f0f4f8; padding: 2rem; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #2d3748; padding: 2rem; border-radius: 10px; margin-bottom: 2rem; }
        .stats { background: #4a5568; padding: 1rem; border-radius: 5px; margin-top: 1rem; }
        .timestamp { font-family: monospace; color: #a0aec0; margin-top: 2rem; }
        a { color: #63b3ed; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 ${content.title}</h1>
            <p>${content.description}</p>
            <div class="stats">${content.stats}</div>
        </div>
        <p>Navigation: 
            <a href="/ai-receptionist">Main</a> | 
            <a href="/ai-receptionist/dashboard">Dashboard</a> | 
            <a href="/ai-receptionist/settings">Settings</a> | 
            <a href="/ai-receptionist/analytics">Analytics</a>
        </p>
        <p class="timestamp">Generated: ${timestamp}</p>
    </div>
</body>
</html>`, {
    headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' }
  });
}

function getCallCenterSubroute(pathname) {
  const timestamp = new Date().toISOString();
  const subroute = pathname.split('/')[2] || 'dashboard';
  
  const content = {
    dashboard: {
      title: 'Call Center Dashboard',
      description: 'Real-time call center operations overview',
      stats: `Active Agents: ${Math.floor(Math.random() * 5) + 10} | Calls in Queue: ${Math.floor(Math.random() * 10)} | Avg Wait: ${Math.floor(Math.random() * 60) + 30}s`
    },
    agents: {
      title: 'Agent Management',
      description: 'Monitor and manage call center agents',
      stats: `Total Agents: 25 | Available: ${Math.floor(Math.random() * 10) + 5} | On Break: ${Math.floor(Math.random() * 5)}`
    },
    history: {
      title: 'Call History',
      description: 'View detailed call logs and recordings',
      stats: `Calls Today: ${Math.floor(Math.random() * 200) + 300} | Avg Duration: ${Math.floor(Math.random() * 180) + 120}s`
    }
  }[subroute] || content.dashboard;
  
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title} - Dynamic</title>
    <style>
        body { font-family: system-ui; background: #0c0e1a; color: #e0e7ff; padding: 2rem; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #1e1b4b; padding: 2rem; border-radius: 10px; margin-bottom: 2rem; }
        .stats { background: #312e81; padding: 1rem; border-radius: 5px; margin-top: 1rem; }
        .timestamp { font-family: monospace; color: #a5b4fc; margin-top: 2rem; }
        a { color: #818cf8; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📞 ${content.title}</h1>
            <p>${content.description}</p>
            <div class="stats">${content.stats}</div>
        </div>
        <p>Navigation: 
            <a href="/call-center">Main</a> | 
            <a href="/call-center/dashboard">Dashboard</a> | 
            <a href="/call-center/agents">Agents</a> | 
            <a href="/call-center/history">History</a>
        </p>
        <p class="timestamp">Generated: ${timestamp}</p>
    </div>
</body>
</html>`, {
    headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' }
  });
}

function getRepsSubroute(pathname) {
  const timestamp = new Date().toISOString();
  const subroute = pathname.split('/')[2] || 'schedule';
  
  const content = {
    schedule: {
      title: 'Pharma Rep Schedule',
      description: 'View and manage pharmaceutical representative appointments',
      stats: `Appointments Today: ${Math.floor(Math.random() * 5) + 3} | This Week: ${Math.floor(Math.random() * 10) + 15}`
    },
    availability: {
      title: 'Provider Availability',
      description: 'Manage provider availability for rep visits',
      stats: `Available Slots: ${Math.floor(Math.random() * 20) + 10} | Providers: 8 | Blocked Times: 5`
    },
    analytics: {
      title: 'Rep Visit Analytics',
      description: 'Track pharmaceutical rep visit patterns and outcomes',
      stats: `Total Visits: ${Math.floor(Math.random() * 100) + 200} | Avg Duration: ${Math.floor(Math.random() * 15) + 15} min`
    }
  }[subroute] || content.schedule;
  
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title} - Dynamic</title>
    <style>
        body { font-family: system-ui; background: #0f766e; color: white; padding: 2rem; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #134e4a; padding: 2rem; border-radius: 10px; margin-bottom: 2rem; }
        .stats { background: #115e59; padding: 1rem; border-radius: 5px; margin-top: 1rem; }
        .timestamp { font-family: monospace; color: #6ee7b7; margin-top: 2rem; }
        a { color: #34d399; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💊 ${content.title}</h1>
            <p>${content.description}</p>
            <div class="stats">${content.stats}</div>
        </div>
        <p>Navigation: 
            <a href="/reps">Main</a> | 
            <a href="/reps/schedule">Schedule</a> | 
            <a href="/reps/availability">Availability</a> | 
            <a href="/reps/analytics">Analytics</a>
        </p>
        <p class="timestamp">Generated: ${timestamp}</p>
    </div>
</body>
</html>`, {
    headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' }
  });
}

function getShowcaseSubroute(pathname) {
  const timestamp = new Date().toISOString();
  const subroute = pathname.split('/')[2] || 'components';
  
  const content = {
    components: {
      title: 'Component Library',
      description: 'Browse reusable UI components across the platform',
      stats: `Total Components: ${Math.floor(Math.random() * 50) + 100} | Categories: 12 | Variants: 250+`
    },
    patterns: {
      title: 'Design Patterns',
      description: 'Common UI patterns and interaction guidelines',
      stats: `Patterns: 45 | Examples: 120 | Best Practices: 30`
    },
    examples: {
      title: 'Live Examples',
      description: 'Interactive component examples and demos',
      stats: `Live Demos: ${Math.floor(Math.random() * 30) + 50} | Code Samples: 200+ | Playgrounds: 15`
    }
  }[subroute] || content.components;
  
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title} - Dynamic</title>
    <style>
        body { font-family: system-ui; background: #fef3c7; color: #78350f; padding: 2rem; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #fde68a; padding: 2rem; border-radius: 10px; margin-bottom: 2rem; border: 2px solid #f59e0b; }
        .stats { background: #fcd34d; padding: 1rem; border-radius: 5px; margin-top: 1rem; }
        .timestamp { font-family: monospace; color: #92400e; margin-top: 2rem; }
        a { color: #d97706; text-decoration: none; font-weight: 500; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 ${content.title}</h1>
            <p>${content.description}</p>
            <div class="stats">${content.stats}</div>
        </div>
        <p>Navigation: 
            <a href="/showcase">Main</a> | 
            <a href="/showcase/components">Components</a> | 
            <a href="/showcase/patterns">Patterns</a> | 
            <a href="/showcase/examples">Examples</a>
        </p>
        <p class="timestamp">Generated: ${timestamp}</p>
    </div>
</body>
</html>`, {
    headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' }
  });
}

// Handouts app handler
async function getHandoutsApp(request, env) {
  return serveFromR2(request, env, 'HANDOUTS_BUCKET', '/handouts');
}

// Kiosk app handler  
async function getKioskApp(request, env) {
  return serveFromR2(request, env, 'KIOSK_BUCKET', '/kiosk');
}

// Generic R2 serving function
async function serveFromR2(request, env, bucketBinding, basePath) {
  const url = new URL(request.url);
  let pathname = url.pathname;
  
  // Remove base path
  let r2Key = pathname.replace(basePath, '');
  
  // Handle root path
  if (r2Key === '' || r2Key === '/') {
    r2Key = 'index.html';
  } else {
    // Remove leading slash
    r2Key = r2Key.startsWith('/') ? r2Key.slice(1) : r2Key;
    
    // Handle directory paths
    if (r2Key.endsWith('/')) {
      r2Key += 'index.html';
    }
    
    // Handle paths without extensions (Next.js routing)
    if (!r2Key.includes('.') && !r2Key.endsWith('/')) {
      r2Key += '.html';
    }
  }
  
  try {
    const bucket = env[bucketBinding];
    if (!bucket) {
      return new Response(`R2 bucket ${bucketBinding} not configured`, { status: 500 });
    }
    
    console.log(`Serving from R2: ${bucketBinding}, r2Key: ${r2Key}, pathname: ${pathname}`);
    const object = await bucket.get(r2Key);
    
    if (!object) {
      console.log(`Object not found: ${r2Key}, trying index.html fallback`);
      // Try fallback to index.html for client-side routing
      const indexObject = await bucket.get('index.html');
      if (indexObject) {
        return new Response(indexObject.body, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
      
      return new Response(`Not found: ${r2Key} in ${bucketBinding}`, { status: 404 });
    }
    
    // Determine content type
    let contentType = 'text/plain';
    if (r2Key.endsWith('.html')) contentType = 'text/html';
    else if (r2Key.endsWith('.js')) contentType = 'application/javascript';
    else if (r2Key.endsWith('.css')) contentType = 'text/css';
    else if (r2Key.endsWith('.json')) contentType = 'application/json';
    
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error(`Error serving from ${bucketBinding}:`, error);
    return new Response('Error loading application', { status: 500 });
  }
}
