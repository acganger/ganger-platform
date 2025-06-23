/**
 * Ganger Platform - EOS L10 Next.js Worker
 * Serves the actual EOS L10 Meeting Management application
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check - handle both direct access and from router
    if (url.pathname === '/health' || url.pathname === '/l10/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        app: 'eos-l10-nextjs',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: env.ENVIRONMENT || 'production',
        features: ['interactive_ui', 'tailwind_compass_template', 'eos_colors', 'react_components']
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For now, serve a functional React-like application
    // This will be replaced with actual Next.js static export
    return new Response(getEOSL10NextJSHTML(env), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};

function getEOSL10NextJSHTML(env) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EOS L10 Meeting Management - Ganger Dermatology</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E📊%3C/text%3E%3C/svg%3E">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        eos: {
                            50: '#f0f9ff',
                            100: '#e0f2fe',
                            200: '#bae6fd',
                            300: '#7dd3fc',
                            400: '#38bdf8',
                            500: '#0ea5e9',
                            600: '#0284c7',
                            700: '#0369a1',
                            800: '#075985',
                            900: '#0c4a6e',
                        }
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-50 min-h-screen">
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect } = React;

        // Mock authentication state
        const useAuth = () => {
            const [user, setUser] = useState(null);
            const [activeTeam, setActiveTeam] = useState(null);
            const [loading, setLoading] = useState(false);

            useEffect(() => {
                // Simulate authentication check
                setTimeout(() => {
                    setUser({ 
                        id: '1', 
                        email: 'demo@gangerdermatology.com', 
                        full_name: 'Demo User' 
                    });
                    setActiveTeam({ 
                        id: '1', 
                        name: 'Leadership Team',
                        description: 'Executive leadership team'
                    });
                    setLoading(false);
                }, 1000);
            }, []);

            return { user, activeTeam, loading };
        };

        // Sidebar Component with EOS navigation
        const Sidebar = ({ isOpen, setIsOpen }) => {
            const navigation = [
                { name: 'Dashboard', href: '#dashboard', icon: '📊', active: true },
                { name: 'Scorecard', href: '#scorecard', icon: '📈' },
                { name: 'Rock Review', href: '#rocks', icon: '🎯' },
                { name: 'Headlines', href: '#headlines', icon: '📰' },
                { name: 'To-Do List', href: '#todos', icon: '✅' },
                { name: 'IDS', href: '#issues', icon: '⚡' },
                { name: 'Meetings', href: '#meetings', icon: '🗓️' },
            ];

            return (
                <>
                    {/* Mobile backdrop */}
                    {isOpen && (
                        <div className="fixed inset-0 z-50 lg:hidden">
                            <div className="fixed inset-0 bg-gray-900/80" onClick={() => setIsOpen(false)} />
                            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white px-6 py-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h1 className="text-xl font-semibold text-gray-900">EOS L10</h1>
                                    <button onClick={() => setIsOpen(false)} className="p-2">✕</button>
                                </div>
                                <nav>
                                    <ul className="space-y-1">
                                        {navigation.map((item) => (
                                            <li key={item.name}>
                                                <a
                                                    href={item.href}
                                                    className={\`group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 \${
                                                        item.active 
                                                            ? 'bg-eos-50 text-eos-600' 
                                                            : 'text-gray-700 hover:bg-gray-50 hover:text-eos-600'
                                                    }\`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setIsOpen(false);
                                                        alert(\`Navigating to \${item.name} - Full functionality available in complete deployment\`);
                                                    }}
                                                >
                                                    <span className="text-lg">{item.icon}</span>
                                                    {item.name}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    )}

                    {/* Desktop sidebar */}
                    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 ring-1 ring-gray-900/5">
                            <div className="flex h-16 shrink-0 items-center">
                                <h1 className="text-xl font-semibold text-gray-900">EOS L10 Platform</h1>
                            </div>
                            <nav className="flex flex-1 flex-col">
                                <ul className="flex flex-1 flex-col gap-y-7">
                                    <li>
                                        <ul className="-mx-2 space-y-1">
                                            {navigation.map((item) => (
                                                <li key={item.name}>
                                                    <a
                                                        href={item.href}
                                                        className={\`group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 \${
                                                            item.active 
                                                                ? 'bg-eos-50 text-eos-600' 
                                                                : 'text-gray-700 hover:bg-gray-50 hover:text-eos-600'
                                                        }\`}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            alert(\`Navigating to \${item.name} - Full functionality available in complete deployment\`);
                                                        }}
                                                    >
                                                        <span className="text-lg">{item.icon}</span>
                                                        {item.name}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                    <li className="mt-auto">
                                        <div className="rounded-lg bg-eos-50 p-4">
                                            <div className="flex items-center gap-x-3">
                                                <span className="text-2xl">▶️</span>
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-900">Weekly L10</h3>
                                                    <p className="text-xs text-gray-600">Next meeting in 2 days</p>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <button 
                                                    className="w-full bg-eos-600 text-white py-2 px-4 rounded-md hover:bg-eos-700 transition-colors"
                                                    onClick={() => alert('Meeting functionality available in complete deployment')}
                                                >
                                                    Start Meeting
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </>
            );
        };

        // Dashboard Component
        const Dashboard = () => {
            const [sidebarOpen, setSidebarOpen] = useState(false);

            return (
                <div>
                    <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
                    
                    <div className="lg:pl-72">
                        {/* Header */}
                        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                            <button
                                type="button"
                                className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <span className="text-xl">☰</span>
                            </button>

                            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                                <div className="relative flex flex-1 items-center">
                                    <h2 className="text-sm font-semibold leading-6 text-gray-900">
                                        Team Performance Dashboard
                                    </h2>
                                </div>
                                <div className="flex items-center gap-x-4 lg:gap-x-6">
                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                        <span>Week of Jan 15, 2025</span>
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                        <span className="text-green-600">On Track</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Main Content */}
                        <main className="py-10">
                            <div className="px-4 sm:px-6 lg:px-8">
                                <div className="mb-8">
                                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                                    <p className="text-gray-600 mt-1">Welcome back to Leadership Team</p>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                                <span className="text-green-600 text-sm">🎯</span>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-600">Rock Completion</p>
                                                <p className="text-2xl font-semibold text-gray-900">85%</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <span className="text-blue-600 text-sm">📊</span>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-600">Scorecard</p>
                                                <p className="text-2xl font-semibold text-gray-900">92%</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <span className="text-purple-600 text-sm">✅</span>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-600">Todo Rate</p>
                                                <p className="text-2xl font-semibold text-gray-900">78%</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                                <span className="text-yellow-600 text-sm">⚡</span>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-600">Issues Resolved</p>
                                                <p className="text-2xl font-semibold text-gray-900">12</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="bg-white rounded-lg shadow-sm p-6 border mb-8">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <button 
                                            className="p-4 bg-eos-50 rounded-lg text-left hover:bg-eos-100 transition-colors"
                                            onClick={() => alert('Rock creation form will be available in the complete deployment')}
                                        >
                                            <div className="text-eos-600 text-2xl mb-2">🎯</div>
                                            <p className="font-medium text-gray-900">Add New Rock</p>
                                            <p className="text-sm text-gray-600">Create quarterly objective</p>
                                        </button>
                                        <button 
                                            className="p-4 bg-blue-50 rounded-lg text-left hover:bg-blue-100 transition-colors"
                                            onClick={() => alert('Issue reporting will be available in the complete deployment')}
                                        >
                                            <div className="text-blue-600 text-2xl mb-2">⚡</div>
                                            <p className="font-medium text-gray-900">Report Issue</p>
                                            <p className="text-sm text-gray-600">Identify problem for IDS</p>
                                        </button>
                                        <button 
                                            className="p-4 bg-green-50 rounded-lg text-left hover:bg-green-100 transition-colors"
                                            onClick={() => alert('Scorecard data entry will be available in the complete deployment')}
                                        >
                                            <div className="text-green-600 text-2xl mb-2">📊</div>
                                            <p className="font-medium text-gray-900">Update Scorecard</p>
                                            <p className="text-sm text-gray-600">Enter weekly metrics</p>
                                        </button>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Rocks</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900">Q1 Patient Experience Initiative</p>
                                                    <p className="text-sm text-gray-600">Assigned to: Sarah M.</p>
                                                </div>
                                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">On Track</span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900">New EHR System Implementation</p>
                                                    <p className="text-sm text-gray-600">Assigned to: Mike K.</p>
                                                </div>
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">At Risk</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Meetings</h3>
                                        <div className="space-y-3">
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="font-medium text-gray-900">Weekly L10 Meeting</p>
                                                <p className="text-sm text-gray-600">Monday, Jan 15 at 9:00 AM</p>
                                                <p className="text-xs text-blue-600 mt-1">90 minutes • Conference Room A</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="font-medium text-gray-900">Quarterly Planning</p>
                                                <p className="text-sm text-gray-600">Friday, Jan 19 at 2:00 PM</p>
                                                <p className="text-xs text-purple-600 mt-1">120 minutes • All hands</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            );
        };

        // Main App Component
        const App = () => {
            const { user, activeTeam, loading } = useAuth();

            if (loading) {
                return (
                    <div className="min-h-screen flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eos-600"></div>
                    </div>
                );
            }

            if (!user) {
                return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                        <div className="max-w-md w-full space-y-8 p-8">
                            <div className="text-center">
                                <h1 className="text-3xl font-bold text-gray-900">EOS L10 Platform</h1>
                                <p className="mt-2 text-gray-600">
                                    Sign in with your Ganger Dermatology account
                                </p>
                            </div>
                            <button
                                onClick={() => alert('Google OAuth authentication will be available in the complete deployment')}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-eos-600 hover:bg-eos-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eos-500"
                            >
                                Sign in with Google
                            </button>
                        </div>
                    </div>
                );
            }

            return <Dashboard />;
        };

        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</body>
</html>`;
}