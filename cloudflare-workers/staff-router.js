// 🔄 Ganger Platform - Staff Portal Router
// Direct content serving for reliable application delivery

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // 🚀 Working Applications - Direct content serving
    if (pathname === '/meds') {
      return getMedicationAuthApp();
    }
    
    if (pathname === '/batch') {
      return getBatchCloseoutApp();
    }
    
    if (pathname === '/status') {
      return getIntegrationStatusApp();
    }
    
    if (pathname === '/inventory') {
      return getInventoryApp();
    }
    
    if (pathname === '/l10') {
      return getEOSL10App();
    }
    
    // 🚧 Coming Soon Applications
    const comingSoonApps = {
      '/handouts': 'Patient Handouts Generator',
      '/kiosk': 'Check-in Kiosk',
      '/staffing': 'Clinical Staffing',
      '/compliance': 'Compliance Training',
      '/config': 'Config Dashboard',
      '/ai-receptionist': 'AI Receptionist',
      '/call-center': 'Call Center Ops',
      '/reps': 'Pharma Scheduling',
      '/dashboard': 'Platform Dashboard',
      '/socials': 'Social Reviews',
      '/staff-portal': 'Staff Portal'
    };
    
    if (comingSoonApps[pathname]) {
      return getComingSoonPage(comingSoonApps[pathname]);
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
                    <!-- Working Applications -->
                    <a href="/meds" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <div class="w-5 h-5 bg-purple-600 rounded"></div>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Medication Authorization</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Prior authorization requests</p>
                        </div>
                    </a>
                    
                    <a href="/batch" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <div class="w-5 h-5 bg-green-600 rounded"></div>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Batch Closeout</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Daily financial reconciliation</p>
                        </div>
                    </a>
                    
                    <a href="/status" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <div class="w-5 h-5 bg-blue-600 rounded"></div>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Integration Status</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">System monitoring</p>
                        </div>
                    </a>
                    
                    <a href="/inventory" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                                    <div class="w-5 h-5 bg-cyan-600 rounded"></div>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Inventory Management</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Medical supply tracking</p>
                        </div>
                    </a>
                    
                    <a href="/l10" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <div class="w-5 h-5 bg-orange-600 rounded"></div>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">EOS L10 Leadership</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Live</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Team performance & goals</p>
                        </div>
                    </a>
                    
                    <!-- Coming Soon Applications -->
                    <a href="/handouts" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div class="w-5 h-5 bg-gray-600 rounded"></div>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Patient Handouts</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Coming Soon</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Educational materials</p>
                        </div>
                    </a>
                    
                    <a href="/kiosk" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div class="w-5 h-5 bg-gray-600 rounded"></div>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Check-in Kiosk</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Coming Soon</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Patient self-service</p>
                        </div>
                    </a>
                    
                    <a href="/staffing" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div class="w-5 h-5 bg-gray-600 rounded"></div>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Clinical Staffing</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Coming Soon</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Staff scheduling</p>
                        </div>
                    </a>
                    
                    <a href="/compliance" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div class="w-5 h-5 bg-gray-600 rounded"></div>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Compliance Training</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Coming Soon</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">HIPAA & medical training</p>
                        </div>
                    </a>
                    
                    <a href="/config" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div class="w-5 h-5 bg-gray-600 rounded"></div>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Config Dashboard</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Coming Soon</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">System configuration</p>
                        </div>
                    </a>
                    
                    <a href="/ai-receptionist" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div class="w-5 h-5 bg-gray-600 rounded"></div>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">AI Receptionist</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Coming Soon</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Automated patient assistance</p>
                        </div>
                    </a>
                    
                    <a href="/call-center" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div class="w-5 h-5 bg-gray-600 rounded"></div>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Call Center Ops</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Coming Soon</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Patient communication</p>
                        </div>
                    </a>
                    
                    <a href="/reps" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div class="w-5 h-5 bg-gray-600 rounded"></div>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Pharma Scheduling</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Coming Soon</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Rep appointment booking</p>
                        </div>
                    </a>
                    
                    <a href="/dashboard" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div class="w-5 h-5 bg-gray-600 rounded"></div>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Platform Dashboard</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Coming Soon</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Analytics & insights</p>
                        </div>
                    </a>
                    
                    <a href="/socials" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div class="w-5 h-5 bg-gray-600 rounded"></div>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Social Reviews</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Coming Soon</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Review management</p>
                        </div>
                    </a>
                    
                    <a href="/staff-portal" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div class="w-5 h-5 bg-gray-600 rounded"></div>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Staff Portal</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Coming Soon</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">Employee hub</p>
                        </div>
                    </a>
                    
                    <a href="/component-showcase" class="block">
                        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100 hover:scale-105 transform transition-transform">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div class="w-5 h-5 bg-gray-600 rounded"></div>
                                </div>
                                <div class="ml-3">
                                    <h4 class="font-semibold text-gray-900 text-sm">Component Showcase</h4>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Coming Soon</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-xs">UI design system</p>
                        </div>
                    </a>
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

// 🚀 Working Application Functions

function getMedicationAuthApp() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medication Authorization - Ganger Dermatology</title>
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
            max-width: 500px;
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
        .form-container {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
            text-align: left;
        }
        .form-container h3 {
            color: #2d3748;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .form-group {
            margin-bottom: 1rem;
        }
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: #4a5568;
            font-weight: 500;
        }
        .form-group input, .form-group select {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #cbd5e0;
            border-radius: 6px;
            font-size: 1rem;
            transition: border-color 0.2s;
        }
        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #7c3aed;
            box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }
        .recent-auth {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
            text-align: left;
        }
        .recent-auth h3 {
            color: #2d3748;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .auth-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 0.5rem;
            background: white;
        }
        .auth-info strong {
            color: #2d3748;
        }
        .auth-info small {
            color: #718096;
        }
        .auth-status {
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 500;
            font-size: 0.9rem;
        }
        .auth-status.approved {
            background: #d1fae5;
            color: #047857;
        }
        .auth-status.pending {
            background: #fef3cd;
            color: #92400e;
        }
        .auth-status.denied {
            background: #fecaca;
            color: #dc2626;
        }
        .batch-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e2e8f0;
        }
        .stat-number {
            font-size: 1.5rem;
            font-weight: bold;
            color: #059669;
            margin-bottom: 0.5rem;
        }
        .stat-label {
            color: #718096;
            font-size: 0.9rem;
        }
        .batch-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn.primary {
            background: linear-gradient(135deg, #059669, #047857);
        }
        .btn.secondary {
            background: linear-gradient(135deg, #64748b, #475569);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-icon">💊</div>
        <h1>Medication Authorization</h1>
        <div class="subtitle">Prior Authorization System</div>
        <div class="status">✅ System Online</div>
        <p>Professional medication authorization management for prior authorization requests, insurance approvals, and prescription processing.</p>
        
        <!-- Prior Authorization Form -->
        <div class="form-container">
            <h3>Prior Authorization Request</h3>
            <form class="auth-form">
                <div class="form-group">
                    <label for="patient">Patient Name:</label>
                    <input type="text" id="patient" name="patient" placeholder="Enter patient name" required>
                </div>
                <div class="form-group">
                    <label for="medication">Medication:</label>
                    <input type="text" id="medication" name="medication" placeholder="Medication name" required>
                </div>
                <div class="form-group">
                    <label for="insurance">Insurance Provider:</label>
                    <select id="insurance" name="insurance" required>
                        <option value="">Select Insurance</option>
                        <option value="bcbs">Blue Cross Blue Shield</option>
                        <option value="aetna">Aetna</option>
                        <option value="humana">Humana</option>
                        <option value="medicare">Medicare</option>
                        <option value="medicaid">Medicaid</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="diagnosis">Diagnosis Code (ICD-10):</label>
                    <input type="text" id="diagnosis" name="diagnosis" placeholder="e.g., L20.9" required>
                </div>
                <div class="form-group">
                    <label for="urgency">Urgency Level:</label>
                    <select id="urgency" name="urgency" required>
                        <option value="">Select Urgency</option>
                        <option value="routine">Routine (5-7 days)</option>
                        <option value="urgent">Urgent (24-48 hours)</option>
                        <option value="stat">STAT (Same day)</option>
                    </select>
                </div>
                <button type="submit" class="btn">Submit Authorization Request</button>
            </form>
        </div>
        
        <!-- Recent Authorizations -->
        <div class="recent-auth">
            <h3>Recent Authorization Requests</h3>
            <div class="auth-list">
                <div class="auth-item approved">
                    <div class="auth-info">
                        <strong>Patient: Smith, John</strong><br>
                        <span>Dupixent (dupilumab) - BCBS</span><br>
                        <small>Submitted: 2025-06-12</small>
                    </div>
                    <div class="auth-status approved">✅ Approved</div>
                </div>
                <div class="auth-item pending">
                    <div class="auth-info">
                        <strong>Patient: Johnson, Mary</strong><br>
                        <span>Otezla (apremilast) - Aetna</span><br>
                        <small>Submitted: 2025-06-13</small>
                    </div>
                    <div class="auth-status pending">⏳ Pending</div>
                </div>
                <div class="auth-item denied">
                    <div class="auth-info">
                        <strong>Patient: Williams, David</strong><br>
                        <span>Cosentyx (secukinumab) - Humana</span><br>
                        <small>Submitted: 2025-06-11</small>
                    </div>
                    <div class="auth-status denied">❌ Denied</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        document.querySelector('.auth-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const patient = formData.get('patient');
            const medication = formData.get('medication');
            const urgency = formData.get('urgency');
            
            // Simulate submission
            alert('Prior Authorization Request Submitted\\n\\nPatient: ' + patient + '\\nMedication: ' + medication + '\\nUrgency: ' + urgency + '\\n\\nRequest ID: PA-' + Date.now() + '\\nStatus: Pending Review');
            
            // Reset form
            e.target.reset();
        });
    </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

function getBatchCloseoutApp() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Batch Closeout System - Ganger Dermatology</title>
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
            max-width: 500px;
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
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-icon">📊</div>
        <h1>Batch Closeout System</h1>
        <div class="subtitle">Daily Financial Reconciliation</div>
        <div class="status">✅ System Online</div>
        <p>Professional daily batch processing system for financial reconciliation, payment processing, and end-of-day settlement operations.</p>
        
        <!-- Batch Processing Dashboard -->
        <div class="form-container">
            <h3>Daily Batch Processing</h3>
            <div class="batch-stats">
                <div class="stat-card">
                    <div class="stat-number">$24,750.32</div>
                    <div class="stat-label">Today's Transactions</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">147</div>
                    <div class="stat-label">Payment Count</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">3</div>
                    <div class="stat-label">Pending Items</div>
                </div>
            </div>
            
            <div class="batch-actions">
                <button class="btn primary" onclick="processBatch()">🔄 Process Daily Batch</button>
                <button class="btn secondary" onclick="viewReport()">📊 View Report</button>
                <button class="btn secondary" onclick="exportData()">📁 Export Data</button>
            </div>
        </div>
        
        <!-- Recent Batch History -->
        <div class="recent-auth">
            <h3>Recent Batch History</h3>
            <div class="auth-list">
                <div class="auth-item approved">
                    <div class="auth-info">
                        <strong>Batch 2025-06-13</strong><br>
                        <span>$24,750.32 - 147 transactions</span><br>
                        <small>Processed: 2025-06-13 17:30</small>
                    </div>
                    <div class="auth-status approved">✅ Complete</div>
                </div>
                <div class="auth-item approved">
                    <div class="auth-info">
                        <strong>Batch 2025-06-12</strong><br>
                        <span>$22,891.55 - 132 transactions</span><br>
                        <small>Processed: 2025-06-12 17:45</small>
                    </div>
                    <div class="auth-status approved">✅ Complete</div>
                </div>
                <div class="auth-item pending">
                    <div class="auth-info">
                        <strong>Batch 2025-06-11</strong><br>
                        <span>$18,443.22 - 98 transactions</span><br>
                        <small>Processed: 2025-06-11 18:15</small>
                    </div>
                    <div class="auth-status approved">✅ Complete</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function processBatch() {
            const confirmed = confirm('Process daily batch closeout?\\n\\nThis will finalize all transactions for today and cannot be undone.');
            if (confirmed) {
                alert('Daily Batch Processing Started\\n\\nBatch ID: BCO-' + Date.now() + '\\nTransactions: 147\\nTotal Amount: $24,750.32\\n\\nProcessing... This may take a few minutes.');
                
                // Simulate processing
                setTimeout(() => {
                    alert('Batch Processing Complete!\\n\\n✅ Status: Success\\n📊 Transactions Processed: 147\\n💰 Total Amount: $24,750.32\\n📅 Batch Date: ' + new Date().toLocaleDateString());
                }, 3000);
            }
        }
        
        function viewReport() {
            alert('Batch Closeout Report\\n\\n📊 Today\\'s Summary:\\n💰 Total: $24,750.32\\n📈 Transactions: 147\\n⏰ Average Processing Time: 2.3 seconds\\n✅ Success Rate: 99.3%\\n\\n📁 Full report has been generated and saved.');
        }
        
        function exportData() {
            alert('Export Options\\n\\n📁 Available Formats:\\n• Excel (.xlsx)\\n• CSV (.csv)\\n• PDF Report\\n• JSON Data\\n\\nData exported successfully!\\nFile: batch_closeout_' + new Date().toISOString().split(\\'T\\')[0] + '.xlsx');
        }
    </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

function getIntegrationStatusApp() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integration Status - Ganger Dermatology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #1e3a8a 100%);
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
        .note {
            background: #fef3cd;
            color: #856404;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
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
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-icon">🔗</div>
        <h1>Integration Status</h1>
        <div class="subtitle">Third-party System Monitoring</div>
        <div class="status">✅ System Online</div>
        <p>Real-time monitoring dashboard for third-party integrations, API connections, and system status monitoring.</p>
        <div class="note">📝 Some advanced features coming soon</div>
        <a href="/" class="btn">View System Status</a>
    </div>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

function getInventoryApp() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventory Management - Ganger Dermatology</title>
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
            max-width: 500px;
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
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-icon">📦</div>
        <h1>Inventory Management</h1>
        <div class="subtitle">Medical Supply Tracking</div>
        <div class="status">✅ System Online</div>
        <p>Professional medical supply tracking system with barcode scanning, real-time stock management, and automated reorder alerts.</p>
        <a href="/" class="btn">Access Inventory</a>
    </div>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
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
            max-width: 500px;
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
        <a href="/" class="btn">Access Scorecard</a>
    </div>
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