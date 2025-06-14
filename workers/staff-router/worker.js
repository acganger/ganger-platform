/**
 * Ganger Platform - Staff Router Worker
 * Routes requests to appropriate application workers based on URL path
 */

const WORKER_ROUTES = {
  '/l10': 'ganger-eos-l10-prod.michiganger.workers.dev',
  '/eos-l10': 'ganger-eos-l10-prod.michiganger.workers.dev',
  '/pharma': 'ganger-pharma-scheduling-prod.michiganger.workers.dev',
  '/pharma-scheduling': 'ganger-pharma-scheduling-prod.michiganger.workers.dev',
  '/handouts': 'ganger-handouts-prod.michiganger.workers.dev',
  '/kiosk': 'ganger-checkin-kiosk-prod.michiganger.workers.dev',
  '/checkin-kiosk': 'ganger-checkin-kiosk-prod.michiganger.workers.dev',
  '/inventory': 'ganger-inventory-prod.michiganger.workers.dev',
  '/medication-auth': 'ganger-medication-auth-prod.michiganger.workers.dev',
  '/meds': 'ganger-medication-auth-prod.michiganger.workers.dev',
  '/clinical-staffing': 'ganger-clinical-staffing-prod.michiganger.workers.dev',
  '/staffing': 'ganger-clinical-staffing-prod.michiganger.workers.dev',
  '/platform-dashboard': 'ganger-platform-dashboard-prod.michiganger.workers.dev',
  '/dashboard': 'ganger-platform-dashboard-prod.michiganger.workers.dev',
  '/ai-receptionist': 'ganger-ai-receptionist-prod.michiganger.workers.dev',
  '/receptionist': 'ganger-ai-receptionist-prod.michiganger.workers.dev',
  '/call-center': 'ganger-call-center-ops-prod.michiganger.workers.dev',
  '/call-center-ops': 'ganger-call-center-ops-prod.michiganger.workers.dev',
  '/compliance': 'ganger-compliance-training-prod.michiganger.workers.dev',
  '/compliance-training': 'ganger-compliance-training-prod.michiganger.workers.dev',
  '/config': 'ganger-config-dashboard-prod.michiganger.workers.dev',
  '/config-dashboard': 'ganger-config-dashboard-prod.michiganger.workers.dev',
  '/integration': 'ganger-integration-status-prod.michiganger.workers.dev',
  '/integration-status': 'ganger-integration-status-prod.michiganger.workers.dev',
  '/socials': 'ganger-socials-reviews-prod.michiganger.workers.dev',
  '/socials-reviews': 'ganger-socials-reviews-prod.michiganger.workers.dev',
  '/batch': 'ganger-batch-closeout-prod.michiganger.workers.dev',
  '/batch-closeout': 'ganger-batch-closeout-prod.michiganger.workers.dev'
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Health check endpoint
    if (pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'ganger-staff-router',
        version: '1.0.0'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // API endpoint to list available routes
    if (pathname === '/api/routes') {
      return new Response(JSON.stringify({
        routes: Object.keys(WORKER_ROUTES),
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for exact path match
    if (WORKER_ROUTES[pathname]) {
      const targetWorker = WORKER_ROUTES[pathname];
      const targetUrl = new URL(request.url);
      targetUrl.hostname = targetWorker;
      targetUrl.pathname = pathname === '/l10' ? '/' : pathname; // Root path for l10
      
      // Forward the request to the appropriate worker
      const modifiedRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
      
      try {
        const response = await fetch(modifiedRequest);
        return response;
      } catch (error) {
        return new Response(`Error proxying to ${targetWorker}: ${error.message}`, {
          status: 502,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    }

    // Check for path prefix matches (for deep routes within apps)
    for (const [route, worker] of Object.entries(WORKER_ROUTES)) {
      if (pathname.startsWith(route + '/')) {
        const targetWorker = worker;
        const targetUrl = new URL(request.url);
        targetUrl.hostname = targetWorker;
        
        const modifiedRequest = new Request(targetUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body
        });
        
        try {
          const response = await fetch(modifiedRequest);
          return response;
        } catch (error) {
          return new Response(`Error proxying to ${targetWorker}: ${error.message}`, {
            status: 502,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      }
    }

    // Default staff portal landing page
    if (pathname === '/' || pathname === '/staff') {
      return new Response(getStaffPortalHTML(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // 404 for unmatched routes
    return new Response(`Route not found: ${pathname}. Available routes: ${Object.keys(WORKER_ROUTES).join(', ')}`, {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};

function getStaffPortalHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ganger Dermatology - Staff Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🏥%3C/text%3E%3C/svg%3E">
</head>
<body class="bg-gray-50">
    <div class="min-h-screen">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-4">
                    <div class="flex items-center">
                        <div class="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span class="text-white font-bold text-lg">G</span>
                        </div>
                        <div class="ml-3">
                            <h1 class="text-xl font-semibold text-gray-900">Ganger Dermatology</h1>
                            <p class="text-sm text-gray-600">Staff Portal</p>
                        </div>
                    </div>
                    <div class="text-sm text-gray-500">
                        ${new Date().toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div class="mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome to the Staff Portal</h2>
                <p class="text-gray-600">Access your applications and tools below.</p>
            </div>

            <!-- Application Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <!-- EOS L10 -->
                <a href="/l10" class="group block">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                            <span class="text-purple-600 text-xl">📊</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 group-hover:text-purple-600">EOS L10</h3>
                        <p class="text-sm text-gray-600 mt-1">Meeting management, scorecards, and rocks tracking</p>
                    </div>
                </a>

                <!-- Pharma Scheduling -->
                <a href="/pharma" class="group block">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <span class="text-green-600 text-xl">💊</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 group-hover:text-green-600">Pharma Scheduling</h3>
                        <p class="text-sm text-gray-600 mt-1">Pharmaceutical representative appointments</p>
                    </div>
                </a>

                <!-- Patient Handouts -->
                <a href="/handouts" class="group block">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                            <span class="text-blue-600 text-xl">📄</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600">Patient Handouts</h3>
                        <p class="text-sm text-gray-600 mt-1">Generate and manage patient education materials</p>
                    </div>
                </a>

                <!-- Inventory Management -->
                <a href="/inventory" class="group block">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                            <span class="text-orange-600 text-xl">📦</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 group-hover:text-orange-600">Inventory</h3>
                        <p class="text-sm text-gray-600 mt-1">Medical supply tracking and barcode scanning</p>
                    </div>
                </a>

                <!-- Medication Authorization -->
                <a href="/meds" class="group block">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                            <span class="text-red-600 text-xl">🔐</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 group-hover:text-red-600">Medication Auth</h3>
                        <p class="text-sm text-gray-600 mt-1">Prior authorization and medication management</p>
                    </div>
                </a>

                <!-- Clinical Staffing -->
                <a href="/staffing" class="group block">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                            <span class="text-indigo-600 text-xl">👥</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">Clinical Staffing</h3>
                        <p class="text-sm text-gray-600 mt-1">Staff scheduling and clinical assignments</p>
                    </div>
                </a>

                <!-- Platform Dashboard -->
                <a href="/dashboard" class="group block">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                            <span class="text-gray-600 text-xl">⚡</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 group-hover:text-gray-600">Platform Dashboard</h3>
                        <p class="text-sm text-gray-600 mt-1">System overview and platform management</p>
                    </div>
                </a>

                <!-- AI Receptionist -->
                <a href="/receptionist" class="group block">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                            <span class="text-teal-600 text-xl">🤖</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 group-hover:text-teal-600">AI Receptionist</h3>
                        <p class="text-sm text-gray-600 mt-1">Automated patient communication and scheduling</p>
                    </div>
                </a>

                <!-- Call Center Ops -->
                <a href="/call-center" class="group block">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                            <span class="text-pink-600 text-xl">📞</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 group-hover:text-pink-600">Call Center</h3>
                        <p class="text-sm text-gray-600 mt-1">Patient call management and operations</p>
                    </div>
                </a>

                <!-- Compliance Training -->
                <a href="/compliance" class="group block">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                            <span class="text-yellow-600 text-xl">🎓</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 group-hover:text-yellow-600">Compliance Training</h3>
                        <p class="text-sm text-gray-600 mt-1">Staff training and compliance management</p>
                    </div>
                </a>

                <!-- Config Dashboard -->
                <a href="/config" class="group block">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                            <span class="text-slate-600 text-xl">⚙️</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 group-hover:text-slate-600">Configuration</h3>
                        <p class="text-sm text-gray-600 mt-1">System configuration and settings</p>
                    </div>
                </a>

                <!-- Integration Status -->
                <a href="/integration" class="group block">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                            <span class="text-emerald-600 text-xl">🔗</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 group-hover:text-emerald-600">Integration Status</h3>
                        <p class="text-sm text-gray-600 mt-1">API and system integration monitoring</p>
                    </div>
                </a>

                <!-- Socials & Reviews -->
                <a href="/socials" class="group block">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center mb-4">
                            <span class="text-violet-600 text-xl">💬</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 group-hover:text-violet-600">Socials & Reviews</h3>
                        <p class="text-sm text-gray-600 mt-1">Social media and patient review management</p>
                    </div>
                </a>

                <!-- Batch Closeout -->
                <a href="/batch" class="group block">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                            <span class="text-cyan-600 text-xl">💳</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 group-hover:text-cyan-600">Batch Closeout</h3>
                        <p class="text-sm text-gray-600 mt-1">Payment processing and financial reconciliation</p>
                    </div>
                </a>
            </div>

            <!-- Footer -->
            <footer class="mt-12 pt-8 border-t border-gray-200">
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-500">
                        Ganger Dermatology Staff Portal • Powered by Cloudflare Workers
                    </div>
                    <div class="text-sm text-gray-500">
                        <a href="/health" class="hover:text-gray-700">System Status</a>
                        <span class="mx-2">•</span>
                        <a href="/api/routes" class="hover:text-gray-700">API Routes</a>
                    </div>
                </div>
            </footer>
        </main>
    </div>
</body>
</html>`;
}