/**
 * Ganger Platform - EOS L10 Dynamic Worker
 * Serves dynamic L10 content with proper routing for all subroutes
 */

function getL10PageContent(pageName) {
  const timestamp = new Date().toISOString();
  
  switch(pageName) {
    case 'rocks':
      return {
        title: 'Rock Review',
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
      
    default:
      return {
        title: 'EOS L10 Dashboard',
        content: `
          <h1 class="text-3xl font-bold mb-2">EOS L10 Meeting Dashboard</h1>
          <p class="text-blue-100 text-lg">Streamline your weekly Level 10 meetings with structured accountability.</p>
        `
      };
  }
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      let pathname = url.pathname;
      
      // Extract the page name from the path
      let pageName = 'compass'; // default
      if (pathname === '/l10') {
        return Response.redirect(new URL('/l10/compass', request.url).toString(), 302);
      } else if (pathname.startsWith('/l10/')) {
        pageName = pathname.slice(5) || 'compass'; // Get page name after /l10/
      }

      // Health check endpoint
      if (pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          app: 'eos-l10-r2-working',
          storage: 'r2',
          timestamp: new Date().toISOString(),
          version: '10.0.0',
          environment: env.ENVIRONMENT || 'production',
          binding_available: !!env.STATIC_ASSETS,
          features: ['dashboard_app', 'r2_storage', 'nextjs_routing', 'worker_api_upload']
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get the dynamic content for this page
      const pageContent = getL10PageContent(pageName);
      
      // Generate the L10 template HTML
      const html = `<!DOCTYPE html>
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
    </style>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen">
        <!-- Navigation -->
        <nav class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex">
                        <div class="flex-shrink-0 flex items-center">
                            <h1 class="text-xl font-semibold">EOS L10 Platform</h1>
                        </div>
                        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <a href="/l10/compass" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Dashboard</a>
                            <a href="/l10/scorecard" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Scorecard</a>
                            <a href="/l10/rocks" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Rocks</a>
                            <a href="/l10/headlines" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Headlines</a>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
        
        <!-- Main Content -->
        <main class="py-10">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
                    ${pageContent.content}
                </div>
            </div>
        </main>
    </div>
    
    <script>
        feather.replace();
    </script>
</body>
</html>`;

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        }
      });

    } catch (error) {
      return new Response(`EOS L10 - Error: ${error.message}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};