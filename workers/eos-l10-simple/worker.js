/**
 * Ganger Platform - EOS L10 Simple Worker
 * Serves the EOS Level 10 Meeting Management application
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        app: 'eos-l10',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Serve the EOS L10 application
    return new Response(getEOSL10HTML(), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};

function getEOSL10HTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EOS L10 Meeting Management - Ganger Dermatology</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E📊%3C/text%3E%3C/svg%3E">
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
                        <span class="text-white font-bold text-xl">📊</span>
                    </div>
                    <div class="ml-4">
                        <h1 class="text-3xl font-bold text-gray-900">EOS L10 Meeting Management</h1>
                        <p class="text-gray-600">Level 10 Meetings • Scorecards • Rocks • Issues</p>
                    </div>
                </div>
                <a href="/staff" class="text-sm text-gray-500 hover:text-gray-700">← Back to Staff Portal</a>
            </div>
        </header>

        <!-- Navigation -->
        <nav class="mb-8">
            <div class="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
                <button class="px-4 py-2 rounded-md bg-purple-100 text-purple-700 font-medium">Dashboard</button>
                <button class="px-4 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">Compass</button>
                <button class="px-4 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">Scorecard</button>
                <button class="px-4 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">Rocks</button>
                <button class="px-4 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">Issues</button>
                <button class="px-4 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">To-dos</button>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Quick Stats -->
            <div class="lg:col-span-3">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white rounded-lg shadow-sm p-6">
                        <div class="flex items-center">
                            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <span class="text-green-600 text-sm">✓</span>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm font-medium text-gray-600">Rocks On Track</p>
                                <p class="text-2xl font-semibold text-gray-900">8</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white rounded-lg shadow-sm p-6">
                        <div class="flex items-center">
                            <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <span class="text-yellow-600 text-sm">⚠</span>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm font-medium text-gray-600">Issues Open</p>
                                <p class="text-2xl font-semibold text-gray-900">3</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white rounded-lg shadow-sm p-6">
                        <div class="flex items-center">
                            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span class="text-blue-600 text-sm">📈</span>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm font-medium text-gray-600">Scorecard</p>
                                <p class="text-2xl font-semibold text-gray-900">85%</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white rounded-lg shadow-sm p-6">
                        <div class="flex items-center">
                            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span class="text-purple-600 text-sm">✓</span>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm font-medium text-gray-600">To-dos Done</p>
                                <p class="text-2xl font-semibold text-gray-900">12</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Current Rocks -->
            <div class="lg:col-span-2">
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Current 90-Day Rocks</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                                <p class="font-medium text-gray-900">Implement New EMR System</p>
                                <p class="text-sm text-gray-600">Owner: Dr. Ganger • Due: March 31</p>
                            </div>
                            <span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">On Track</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                                <p class="font-medium text-gray-900">Staff Training Program</p>
                                <p class="text-sm text-gray-600">Owner: Sarah M. • Due: March 15</p>
                            </div>
                            <span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">On Track</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                            <div>
                                <p class="font-medium text-gray-900">Patient Portal Enhancement</p>
                                <p class="text-sm text-gray-600">Owner: IT Team • Due: April 15</p>
                            </div>
                            <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">At Risk</span>
                        </div>
                    </div>
                    <button class="mt-4 w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                        View All Rocks
                    </button>
                </div>
            </div>

            <!-- Issues List -->
            <div>
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Open Issues</h3>
                    <div class="space-y-3">
                        <div class="p-3 bg-red-50 rounded-lg">
                            <p class="font-medium text-gray-900 text-sm">Network connectivity issues</p>
                            <p class="text-xs text-gray-600">Reported 2 days ago</p>
                        </div>
                        <div class="p-3 bg-yellow-50 rounded-lg">
                            <p class="font-medium text-gray-900 text-sm">Staff scheduling conflicts</p>
                            <p class="text-xs text-gray-600">Reported 1 day ago</p>
                        </div>
                        <div class="p-3 bg-blue-50 rounded-lg">
                            <p class="font-medium text-gray-900 text-sm">Patient portal feedback</p>
                            <p class="text-xs text-gray-600">Reported today</p>
                        </div>
                    </div>
                    <button class="mt-4 w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                        View All Issues
                    </button>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="mt-8">
            <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button class="p-4 bg-purple-50 rounded-lg text-left hover:bg-purple-100 transition-colors">
                        <div class="text-purple-600 text-2xl mb-2">📅</div>
                        <p class="font-medium text-gray-900">Start L10 Meeting</p>
                        <p class="text-sm text-gray-600">Begin this week's meeting</p>
                    </button>
                    <button class="p-4 bg-green-50 rounded-lg text-left hover:bg-green-100 transition-colors">
                        <div class="text-green-600 text-2xl mb-2">🎯</div>
                        <p class="font-medium text-gray-900">Update Scorecard</p>
                        <p class="text-sm text-gray-600">Enter weekly metrics</p>
                    </button>
                    <button class="p-4 bg-blue-50 rounded-lg text-left hover:bg-blue-100 transition-colors">
                        <div class="text-blue-600 text-2xl mb-2">📊</div>
                        <p class="font-medium text-gray-900">Review Compass</p>
                        <p class="text-sm text-gray-600">Check vision alignment</p>
                    </button>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            EOS L10 Meeting Management • Ganger Dermatology • Powered by Cloudflare Workers
        </footer>
    </div>

    <script>
        // Add some basic interactivity
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', function(e) {
                if (this.textContent.includes('Start L10 Meeting')) {
                    alert('L10 Meeting functionality will be available in the full application deployment.');
                } else if (this.textContent.includes('Update Scorecard')) {
                    alert('Scorecard functionality will be available in the full application deployment.');
                } else if (this.textContent.includes('Review Compass')) {
                    alert('Compass functionality will be available in the full application deployment.');
                }
            });
        });
        
        // Navigation functionality
        document.querySelectorAll('nav button').forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                document.querySelectorAll('nav button').forEach(b => {
                    b.className = 'px-4 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100';
                });
                // Add active class to clicked button
                this.className = 'px-4 py-2 rounded-md bg-purple-100 text-purple-700 font-medium';
            });
        });
    </script>
</body>
</html>`;
}