/**
 * Ganger Platform - Medication Authorization Simple Worker
 * Serves the Medication Prior Authorization application
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        app: 'medication-auth',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Serve the Medication Authorization application
    return new Response(getMedicationAuthHTML(), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};

function getMedicationAuthHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medication Prior Authorization - Ganger Dermatology</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🔐%3C/text%3E%3C/svg%3E">
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="h-12 w-12 bg-red-600 rounded-lg flex items-center justify-center">
                        <span class="text-white font-bold text-xl">🔐</span>
                    </div>
                    <div class="ml-4">
                        <h1 class="text-3xl font-bold text-gray-900">Medication Prior Authorization</h1>
                        <p class="text-gray-600">Prior auths • Insurance verification • Medication management</p>
                    </div>
                </div>
                <a href="/staff" class="text-sm text-gray-500 hover:text-gray-700">← Back to Staff Portal</a>
            </div>
        </header>

        <!-- Dashboard Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <span class="text-yellow-600 text-sm">⏳</span>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-gray-600">Pending Reviews</p>
                        <p class="text-2xl font-semibold text-gray-900">8</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <span class="text-green-600 text-sm">✓</span>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-gray-600">Approved Today</p>
                        <p class="text-2xl font-semibold text-gray-900">12</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <span class="text-red-600 text-sm">✗</span>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-gray-600">Denied</p>
                        <p class="text-2xl font-semibold text-gray-900">2</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span class="text-blue-600 text-sm">⚠</span>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-gray-600">Expiring Soon</p>
                        <p class="text-2xl font-semibold text-gray-900">5</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Pending Authorizations -->
            <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Pending Prior Authorizations</h3>
                <div class="space-y-4">
                    <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-medium text-gray-900">Dupixent (dupilumab)</p>
                                <p class="text-sm text-gray-600">Patient: Sarah M. • DOB: 03/15/1985</p>
                                <p class="text-xs text-gray-500">Insurance: Blue Cross Blue Shield • Policy: PPO</p>
                                <p class="text-xs text-gray-500">Submitted: 2 days ago</p>
                            </div>
                            <div class="text-right">
                                <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Under Review</span>
                                <p class="text-xs text-gray-500 mt-1">Est. 3-5 days</p>
                            </div>
                        </div>
                        <div class="mt-3 flex space-x-2">
                            <button class="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700">View Details</button>
                            <button class="px-3 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700">Follow Up</button>
                        </div>
                    </div>
                    
                    <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-medium text-gray-900">Skyrizi (risankizumab)</p>
                                <p class="text-sm text-gray-600">Patient: John D. • DOB: 07/22/1978</p>
                                <p class="text-xs text-gray-500">Insurance: Aetna • Policy: HMO</p>
                                <p class="text-xs text-gray-500">Submitted: 1 day ago</p>
                            </div>
                            <div class="text-right">
                                <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Pending</span>
                                <p class="text-xs text-gray-500 mt-1">Est. 5-7 days</p>
                            </div>
                        </div>
                        <div class="mt-3 flex space-x-2">
                            <button class="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700">View Details</button>
                            <button class="px-3 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700">Follow Up</button>
                        </div>
                    </div>

                    <div class="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-medium text-gray-900">Otezla (apremilast)</p>
                                <p class="text-sm text-gray-600">Patient: Maria L. • DOB: 12/08/1992</p>
                                <p class="text-xs text-gray-500">Insurance: Cigna • Policy: PPO</p>
                                <p class="text-xs text-gray-500">Submitted: 5 days ago</p>
                            </div>
                            <div class="text-right">
                                <span class="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Urgent</span>
                                <p class="text-xs text-gray-500 mt-1">Overdue</p>
                            </div>
                        </div>
                        <div class="mt-3 flex space-x-2">
                            <button class="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700">Urgent Follow Up</button>
                            <button class="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700">View Details</button>
                        </div>
                    </div>
                </div>
                <button class="mt-4 w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                    View All Pending
                </button>
            </div>

            <!-- Recent Activity -->
            <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div class="space-y-4">
                    <div class="flex items-start space-x-3">
                        <div class="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                            <p class="text-sm font-medium text-gray-900">Prior auth approved</p>
                            <p class="text-xs text-gray-600">Humira for Robert K. - Approved by UnitedHealth</p>
                            <p class="text-xs text-gray-400">2 hours ago</p>
                        </div>
                    </div>
                    
                    <div class="flex items-start space-x-3">
                        <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                            <p class="text-sm font-medium text-gray-900">New submission</p>
                            <p class="text-xs text-gray-600">Enbrel for Jennifer S. - Submitted to BCBS</p>
                            <p class="text-xs text-gray-400">4 hours ago</p>
                        </div>
                    </div>
                    
                    <div class="flex items-start space-x-3">
                        <div class="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                        <div>
                            <p class="text-sm font-medium text-gray-900">Prior auth denied</p>
                            <p class="text-xs text-gray-600">Cosentyx for Michael R. - Appeal required</p>
                            <p class="text-xs text-gray-400">6 hours ago</p>
                        </div>
                    </div>
                    
                    <div class="flex items-start space-x-3">
                        <div class="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div>
                            <p class="text-sm font-medium text-gray-900">Expiration notice</p>
                            <p class="text-xs text-gray-600">Dupixent for Lisa T. expires in 30 days</p>
                            <p class="text-xs text-gray-400">1 day ago</p>
                        </div>
                    </div>
                </div>
                <button class="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    View Activity Log
                </button>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="mt-8">
            <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button class="p-4 bg-red-50 rounded-lg text-left hover:bg-red-100 transition-colors">
                        <div class="text-red-600 text-2xl mb-2">📝</div>
                        <p class="font-medium text-gray-900">New Prior Auth</p>
                        <p class="text-sm text-gray-600">Submit authorization request</p>
                    </button>
                    <button class="p-4 bg-blue-50 rounded-lg text-left hover:bg-blue-100 transition-colors">
                        <div class="text-blue-600 text-2xl mb-2">🔍</div>
                        <p class="font-medium text-gray-900">Check Status</p>
                        <p class="text-sm text-gray-600">Verify authorization status</p>
                    </button>
                    <button class="p-4 bg-green-50 rounded-lg text-left hover:bg-green-100 transition-colors">
                        <div class="text-green-600 text-2xl mb-2">🔄</div>
                        <p class="font-medium text-gray-900">Renewals</p>
                        <p class="text-sm text-gray-600">Process expiring auths</p>
                    </button>
                    <button class="p-4 bg-yellow-50 rounded-lg text-left hover:bg-yellow-100 transition-colors">
                        <div class="text-yellow-600 text-2xl mb-2">📊</div>
                        <p class="font-medium text-gray-900">Reports</p>
                        <p class="text-sm text-gray-600">Authorization analytics</p>
                    </button>
                </div>
            </div>
        </div>

        <!-- Common Medications Quick Reference -->
        <div class="mt-8">
            <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Common Dermatology Medications</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="p-3 bg-gray-50 rounded-lg">
                        <p class="font-medium text-gray-900">Biologics</p>
                        <p class="text-sm text-gray-600">Dupixent, Skyrizi, Humira, Enbrel, Cosentyx</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-lg">
                        <p class="font-medium text-gray-900">Topicals</p>
                        <p class="text-sm text-gray-600">Eucrisa, Protopic, Elidel, Tazorac</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-lg">
                        <p class="font-medium text-gray-900">Oral Medications</p>
                        <p class="text-sm text-gray-600">Otezla, Rinvoq, Methotrexate</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            Medication Prior Authorization • Ganger Dermatology • Powered by Cloudflare Workers
        </footer>
    </div>

    <script>
        // Add basic interactivity
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', function(e) {
                if (this.textContent.includes('View Details')) {
                    alert('Patient details and authorization documentation will be displayed in the full application.');
                } else if (this.textContent.includes('Follow Up') || this.textContent.includes('Urgent Follow Up')) {
                    alert('Follow-up tracking and communication features will be available in the full application.');
                } else if (this.textContent.includes('New Prior Auth')) {
                    alert('Prior authorization submission form will be available in the full application.');
                } else if (this.textContent.includes('Check Status')) {
                    alert('Real-time authorization status checking will be available in the full application.');
                }
            });
        });

        // Simulate real-time updates
        setTimeout(() => {
            const pendingCount = document.querySelector('[data-stat="pending"]');
            if (pendingCount) {
                pendingCount.textContent = '7';
            }
        }, 5000);
    </script>
</body>
</html>`;
}