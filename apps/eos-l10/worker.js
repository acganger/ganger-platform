/**
 * Cloudflare Worker for EOS L10 Platform
 * Serves the L10 management dashboard with Compass UI template
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let pathname = url.pathname;
    
    // Health check endpoint
    if (pathname === '/l10/health' || pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'eos-l10-management',
        deployment: 'r2-cloudflare-workers',
        path: pathname
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // Remove /l10 prefix if present
    if (pathname.startsWith('/l10')) {
      pathname = pathname.substring(4) || '/';
    }

    // Default route - show the Compass template
    if (pathname === '/' || pathname === '/compass') {
      return getEOSL10CompassTemplate();
    }

    // Return 404 for other routes for now
    return new Response('Page not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};

function getEOSL10CompassTemplate() {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EOS L10 Compass Dashboard - Ganger Dermatology</title>
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
    <div id="mobile-sidebar" class="relative z-50 lg:hidden sidebar-hidden transition-transform duration-300">
        <div class="fixed inset-0 flex">
            <div class="relative mr-16 flex w-full max-w-xs flex-1">
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
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    </div>

    <!-- Main content -->
    <div class="lg:pl-72">
        <div class="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <button id="sidebar-toggle" type="button" class="-m-2.5 p-2.5 text-gray-700 lg:hidden">
                <span class="sr-only">Open sidebar</span>
                <i data-feather="menu" class="h-6 w-6"></i>
            </button>

            <div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <div class="relative flex flex-1"></div>
                <div class="flex items-center gap-x-4 lg:gap-x-6">
                    <button type="button" class="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                        <span class="sr-only">View notifications</span>
                        <i data-feather="bell" class="h-6 w-6"></i>
                    </button>
                    <div class="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10"></div>
                    <div class="relative">
                        <button type="button" class="-m-1.5 flex items-center p-1.5">
                            <span class="sr-only">Open user menu</span>
                            <div class="h-8 w-8 rounded-full bg-gray-300"></div>
                            <span class="hidden lg:flex lg:items-center">
                                <span class="ml-4 text-sm font-semibold leading-6 text-gray-900">Team Member</span>
                                <i data-feather="chevron-down" class="ml-2 h-5 w-5 text-gray-400"></i>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <main class="py-10">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="fadeIn">
                    <h1 class="text-3xl font-bold text-gray-900 mb-8">L10 Dashboard</h1>
                    
                    <!-- Quick stats -->
                    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        <div class="bg-white overflow-hidden shadow rounded-lg">
                            <div class="p-5">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0">
                                        <i data-feather="check-circle" class="h-6 w-6 text-green-500"></i>
                                    </div>
                                    <div class="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt class="text-sm font-medium text-gray-500 truncate">To-Dos Complete</dt>
                                            <dd class="text-lg font-semibold text-gray-900">85%</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white overflow-hidden shadow rounded-lg">
                            <div class="p-5">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0">
                                        <i data-feather="target" class="h-6 w-6 text-blue-500"></i>
                                    </div>
                                    <div class="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt class="text-sm font-medium text-gray-500 truncate">Rocks On Track</dt>
                                            <dd class="text-lg font-semibold text-gray-900">7 of 9</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white overflow-hidden shadow rounded-lg">
                            <div class="p-5">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0">
                                        <i data-feather="trending-up" class="h-6 w-6 text-indigo-500"></i>
                                    </div>
                                    <div class="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt class="text-sm font-medium text-gray-500 truncate">Scorecard Health</dt>
                                            <dd class="text-lg font-semibold text-gray-900">92%</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white overflow-hidden shadow rounded-lg">
                            <div class="p-5">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0">
                                        <i data-feather="users" class="h-6 w-6 text-purple-500"></i>
                                    </div>
                                    <div class="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt class="text-sm font-medium text-gray-500 truncate">Open Issues</dt>
                                            <dd class="text-lg font-semibold text-gray-900">12</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent activity -->
                    <div class="bg-white shadow rounded-lg">
                        <div class="px-4 py-5 sm:p-6">
                            <h3 class="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
                            <div class="mt-5">
                                <div class="flow-root">
                                    <ul class="-mb-8">
                                        <li>
                                            <div class="relative pb-8">
                                                <span class="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                                                <div class="relative flex space-x-3">
                                                    <div>
                                                        <span class="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                                                            <i data-feather="check" class="h-5 w-5 text-white"></i>
                                                        </span>
                                                    </div>
                                                    <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                        <div>
                                                            <p class="text-sm text-gray-500">To-Do completed: <span class="font-medium text-gray-900">Update customer database</span></p>
                                                        </div>
                                                        <div class="whitespace-nowrap text-right text-sm text-gray-500">
                                                            <time datetime="2024-01-19">2 hours ago</time>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li>
                                            <div class="relative pb-8">
                                                <span class="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                                                <div class="relative flex space-x-3">
                                                    <div>
                                                        <span class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                                            <i data-feather="target" class="h-5 w-5 text-white"></i>
                                                        </span>
                                                    </div>
                                                    <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                        <div>
                                                            <p class="text-sm text-gray-500">Rock milestone achieved: <span class="font-medium text-gray-900">Q1 Sales Target</span></p>
                                                        </div>
                                                        <div class="whitespace-nowrap text-right text-sm text-gray-500">
                                                            <time datetime="2024-01-19">5 hours ago</time>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li>
                                            <div class="relative pb-8">
                                                <div class="relative flex space-x-3">
                                                    <div>
                                                        <span class="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
                                                            <i data-feather="trending-up" class="h-5 w-5 text-white"></i>
                                                        </span>
                                                    </div>
                                                    <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                        <div>
                                                            <p class="text-sm text-gray-500">Scorecard updated: <span class="font-medium text-gray-900">Weekly metrics reviewed</span></p>
                                                        </div>
                                                        <div class="whitespace-nowrap text-right text-sm text-gray-500">
                                                            <time datetime="2024-01-19">Yesterday</time>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script>
        // Initialize Feather icons
        feather.replace();
        
        // Mobile sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const mobileSidebar = document.getElementById('mobile-sidebar');
        const sidebarBackdrop = document.getElementById('sidebar-backdrop');
        
        sidebarToggle.addEventListener('click', () => {
            mobileSidebar.classList.toggle('sidebar-hidden');
            mobileSidebar.classList.toggle('sidebar-visible');
            sidebarBackdrop.classList.toggle('hidden');
        });
        
        sidebarBackdrop.addEventListener('click', () => {
            mobileSidebar.classList.add('sidebar-hidden');
            mobileSidebar.classList.remove('sidebar-visible');
            sidebarBackdrop.classList.add('hidden');
        });
    </script>
</body>
</html>`, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    }
  });
}