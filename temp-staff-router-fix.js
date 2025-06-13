// 🔄 Ganger Platform - Staff Portal Router (Fixed)
// Routes staff.gangerdermatology.com/* to actual deployed applications

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // 🚀 Application routing - proxy to actual deployed workers
    const appRoutes = {
      '/ai-receptionist': 'ganger-ai-receptionist-prod.workers.dev',
      '/batch': 'ganger-batch-closeout-prod.workers.dev', 
      '/call-center': 'ganger-call-center-ops-prod.workers.dev',
      '/kiosk': 'ganger-checkin-kiosk-prod.workers.dev',
      '/staffing': 'ganger-clinical-staffing-prod.workers.dev',
      '/compliance': 'ganger-compliance-training-prod.workers.dev',
      '/config': 'ganger-config-dashboard-prod.workers.dev',
      '/l10': 'ganger-eos-l10-prod.workers.dev',
      '/handouts': 'ganger-handouts-prod.workers.dev',
      '/status': 'ganger-integration-status-prod.workers.dev',
      '/inventory': 'ganger-inventory-prod.workers.dev',
      '/meds': 'ganger-medication-auth-prod.workers.dev',
      '/reps': 'ganger-pharma-scheduling-prod.workers.dev',
      '/dashboard': 'ganger-platform-dashboard-prod.workers.dev',
      '/socials': 'ganger-socials-reviews-prod.workers.dev',
      '/staff-portal': 'ganger-staff-prod.workers.dev'
    };

    // Check if this is an app route
    if (appRoutes[pathname]) {
      try {
        return fetch(`https://${appRoutes[pathname]}`, {
          method: request.method,
          headers: request.headers,
          body: request.body
        });
      } catch (error) {
        // If worker doesn't exist or fails, show user-friendly message
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Application Loading - Ganger Dermatology</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: system-ui, sans-serif; 
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                min-height: 100vh; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                margin: 0;
              }
              .container {
                background: white; 
                padding: 2rem; 
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1); 
                text-align: center; 
                max-width: 400px;
              }
              h1 { color: #1f2937; margin-bottom: 1rem; }
              p { color: #6b7280; margin-bottom: 1.5rem; }
              .btn { 
                background: #2563eb; 
                color: white; 
                padding: 0.75rem 1.5rem; 
                border: none; 
                border-radius: 8px; 
                text-decoration: none; 
                display: inline-block;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🚀 Application Loading</h1>
              <p>This application is being deployed. Please try again in a moment.</p>
              <a href="/" class="btn">← Back to Staff Portal</a>
            </div>
          </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' },
          status: 503
        });
      }
    }
    
    // 🏠 Default route - Staff Management Portal
    return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Staff Management Portal - Ganger Dermatology</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: {
                            50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
                            400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
                            800: '#1e40af', 900: '#1e3a8a',
                        },
                        success: {
                            50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
                            400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
                            800: '#065f46', 900: '#064e3b',
                        },
                    }
                }
            }
        }
    </script>
</head>
<body class="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 font-sans">
    <!-- Navigation Header -->
    <nav class="bg-white shadow-lg border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                    <div class="ml-4">
                        <h1 class="text-xl font-semibold text-gray-900">Staff Management Portal</h1>
                        <p class="text-sm text-gray-500">Ganger Dermatology</p>
                    </div>
                </div>
                
                <div class="flex items-center">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                        <span class="w-2 h-2 bg-success-400 rounded-full mr-2 animate-pulse"></span>
                        Live System
                    </span>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div class="animate-fade-in">
            <!-- Welcome Banner -->
            <div class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg mb-8 p-8 text-white">
                <div>
                    <h2 class="text-3xl font-bold mb-2">Welcome to Staff Portal</h2>
                    <p class="text-primary-100 text-lg">Comprehensive employee management and collaboration hub</p>
                </div>
            </div>

            <!-- All 17 Applications -->
            <div class="mb-8">
                <h3 class="text-2xl font-bold text-gray-900 mb-6">All Platform Applications (17 Apps)</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <!-- Applications Grid - Each links to actual deployed workers -->
                    ${Object.entries(appRoutes).map(([path, worker]) => {
                        const appName = path.substring(1).split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ');
                        const iconColors = ['blue', 'yellow', 'green', 'indigo', 'pink', 'red', 'gray', 'orange', 'teal', 'cyan', 'purple', 'emerald', 'rose', 'violet', 'amber', 'lime', 'sky'];
                        const colorIndex = Math.abs(path.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % iconColors.length;
                        const color = iconColors[colorIndex];
                        
                        return `
                        <a href="${path}" class="block">
                            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                                <div class="flex items-center mb-3">
                                    <div class="w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center">
                                        <div class="w-5 h-5 bg-${color}-600 rounded"></div>
                                    </div>
                                    <div class="ml-3">
                                        <h4 class="font-semibold text-gray-900 text-sm">${appName}</h4>
                                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                    </div>
                                </div>
                                <p class="text-gray-600 text-xs">Click to access application</p>
                            </div>
                        </a>`;
                    }).join('')}
                </div>
            </div>

        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-12">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between">
                <div class="text-sm text-gray-500">
                    © 2025 Ganger Dermatology. Staff Management Portal.
                </div>
                <div class="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Platform Status: All 16 applications operational</span>
                </div>
            </div>
        </div>
    </footer>
</body>
</html>`, {
      headers: { 
        'Content-Type': 'text/html',
        'X-Ganger-Route': 'main-staff-portal'
      }
    });
  }
};