/**
 * Ganger Platform - Pharma Scheduling Simple Worker
 * Serves the Pharmaceutical Representative Scheduling application
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        app: 'pharma-scheduling',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Serve the Pharma Scheduling application
    return new Response(getPharmaSchedulingHTML(), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};

function getPharmaSchedulingHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pharma Rep Scheduling - Ganger Dermatology</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E💊%3C/text%3E%3C/svg%3E">
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center">
                        <span class="text-white font-bold text-xl">💊</span>
                    </div>
                    <div class="ml-4">
                        <h1 class="text-3xl font-bold text-gray-900">Pharmaceutical Rep Scheduling</h1>
                        <p class="text-gray-600">Schedule appointments • Manage reps • Track visits</p>
                    </div>
                </div>
                <a href="/staff" class="text-sm text-gray-500 hover:text-gray-700">← Back to Staff Portal</a>
            </div>
        </header>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <span class="text-green-600 text-sm">📅</span>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-gray-600">Today's Visits</p>
                        <p class="text-2xl font-semibold text-gray-900">3</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span class="text-blue-600 text-sm">📋</span>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-gray-600">This Week</p>
                        <p class="text-2xl font-semibold text-gray-900">12</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span class="text-purple-600 text-sm">👥</span>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-gray-600">Active Reps</p>
                        <p class="text-2xl font-semibold text-gray-900">24</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <span class="text-yellow-600 text-sm">⏱</span>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-gray-600">Pending</p>
                        <p class="text-2xl font-semibold text-gray-900">5</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Today's Schedule -->
            <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                            <p class="font-medium text-gray-900">Pfizer - Dermatology Division</p>
                            <p class="text-sm text-gray-600">Rep: Sarah Johnson • 10:00 AM - 10:30 AM</p>
                            <p class="text-xs text-gray-500">Product: Eucrisa, Crisaborole</p>
                        </div>
                        <span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Confirmed</span>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                            <p class="font-medium text-gray-900">Regeneron Pharmaceuticals</p>
                            <p class="text-sm text-gray-600">Rep: Mike Chen • 2:00 PM - 2:30 PM</p>
                            <p class="text-xs text-gray-500">Product: Dupixent</p>
                        </div>
                        <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Confirmed</span>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div>
                            <p class="font-medium text-gray-900">AbbVie Dermatology</p>
                            <p class="text-sm text-gray-600">Rep: Lisa Rodriguez • 4:00 PM - 4:30 PM</p>
                            <p class="text-xs text-gray-500">Product: Skyrizi</p>
                        </div>
                        <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Pending</span>
                    </div>
                </div>
                <button class="mt-4 w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                    View Full Schedule
                </button>
            </div>

            <!-- Pending Requests -->
            <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Pending Requests</h3>
                <div class="space-y-4">
                    <div class="p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-medium text-gray-900">Johnson & Johnson</p>
                                <p class="text-sm text-gray-600">Rep: David Kim</p>
                                <p class="text-xs text-gray-500">Requested: Tomorrow 11:00 AM</p>
                            </div>
                            <div class="flex space-x-2">
                                <button class="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700">Accept</button>
                                <button class="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700">Decline</button>
                            </div>
                        </div>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-medium text-gray-900">Novartis Pharmaceuticals</p>
                                <p class="text-sm text-gray-600">Rep: Amanda Smith</p>
                                <p class="text-xs text-gray-500">Requested: Friday 3:00 PM</p>
                            </div>
                            <div class="flex space-x-2">
                                <button class="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700">Accept</button>
                                <button class="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700">Decline</button>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    View All Requests
                </button>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="mt-8">
            <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button class="p-4 bg-green-50 rounded-lg text-left hover:bg-green-100 transition-colors">
                        <div class="text-green-600 text-2xl mb-2">📅</div>
                        <p class="font-medium text-gray-900">Schedule Visit</p>
                        <p class="text-sm text-gray-600">Book new appointment</p>
                    </button>
                    <button class="p-4 bg-blue-50 rounded-lg text-left hover:bg-blue-100 transition-colors">
                        <div class="text-blue-600 text-2xl mb-2">👥</div>
                        <p class="font-medium text-gray-900">Manage Reps</p>
                        <p class="text-sm text-gray-600">Add or update rep info</p>
                    </button>
                    <button class="p-4 bg-purple-50 rounded-lg text-left hover:bg-purple-100 transition-colors">
                        <div class="text-purple-600 text-2xl mb-2">📊</div>
                        <p class="font-medium text-gray-900">View Reports</p>
                        <p class="text-sm text-gray-600">Monthly visit analytics</p>
                    </button>
                    <button class="p-4 bg-yellow-50 rounded-lg text-left hover:bg-yellow-100 transition-colors">
                        <div class="text-yellow-600 text-2xl mb-2">⚙️</div>
                        <p class="font-medium text-gray-900">Settings</p>
                        <p class="text-sm text-gray-600">Configure preferences</p>
                    </button>
                </div>
            </div>
        </div>

        <!-- Calendar Preview -->
        <div class="mt-8">
            <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">This Week</h3>
                <div class="grid grid-cols-7 gap-1 text-center text-sm">
                    <!-- Calendar header -->
                    <div class="font-medium text-gray-500 p-2">Mon</div>
                    <div class="font-medium text-gray-500 p-2">Tue</div>
                    <div class="font-medium text-gray-500 p-2">Wed</div>
                    <div class="font-medium text-gray-500 p-2">Thu</div>
                    <div class="font-medium text-gray-500 p-2">Fri</div>
                    <div class="font-medium text-gray-500 p-2">Sat</div>
                    <div class="font-medium text-gray-500 p-2">Sun</div>
                    
                    <!-- Calendar days -->
                    <div class="p-2 bg-green-100 rounded">
                        <div class="font-medium">14</div>
                        <div class="text-xs text-green-600">2 visits</div>
                    </div>
                    <div class="p-2 bg-blue-100 rounded">
                        <div class="font-medium">15</div>
                        <div class="text-xs text-blue-600">3 visits</div>
                    </div>
                    <div class="p-2 bg-purple-100 rounded">
                        <div class="font-medium">16</div>
                        <div class="text-xs text-purple-600">1 visit</div>
                    </div>
                    <div class="p-2">
                        <div class="font-medium">17</div>
                        <div class="text-xs text-gray-400">No visits</div>
                    </div>
                    <div class="p-2 bg-yellow-100 rounded">
                        <div class="font-medium">18</div>
                        <div class="text-xs text-yellow-600">2 pending</div>
                    </div>
                    <div class="p-2">
                        <div class="font-medium">19</div>
                        <div class="text-xs text-gray-400">Weekend</div>
                    </div>
                    <div class="p-2">
                        <div class="font-medium">20</div>
                        <div class="text-xs text-gray-400">Weekend</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            Pharmaceutical Rep Scheduling • Ganger Dermatology • Powered by Cloudflare Workers
        </footer>
    </div>

    <script>
        // Add basic interactivity
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', function(e) {
                if (this.textContent.includes('Accept')) {
                    this.textContent = 'Accepted';
                    this.className = 'px-3 py-1 bg-green-100 text-green-800 text-xs rounded-md';
                    this.disabled = true;
                } else if (this.textContent.includes('Decline')) {
                    this.textContent = 'Declined';
                    this.className = 'px-3 py-1 bg-red-100 text-red-800 text-xs rounded-md';
                    this.disabled = true;
                } else if (this.textContent.includes('Schedule Visit') || 
                          this.textContent.includes('View Full Schedule') ||
                          this.textContent.includes('Manage Reps')) {
                    alert('This functionality will be available in the full application deployment.');
                }
            });
        });
    </script>
</body>
</html>`;
}