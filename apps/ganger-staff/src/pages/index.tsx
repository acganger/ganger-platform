export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@ganger/auth';

type AppMetadata = {
  name: string;
  description: string;
  icon: string;
  category: string;
};

type AppData = {
  [key: string]: AppMetadata;
};

const categoryOrder = ['core', 'operations', 'clinical', 'management', 'finance', 'hr', 'admin', 'marketing', 'innovation', 'developer'];

const categoryColors: Record<string, string> = {
  core: 'bg-blue-100 hover:bg-blue-200 border-blue-300',
  operations: 'bg-green-100 hover:bg-green-200 border-green-300',
  clinical: 'bg-purple-100 hover:bg-purple-200 border-purple-300',
  management: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300',
  finance: 'bg-red-100 hover:bg-red-200 border-red-300',
  hr: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300',
  admin: 'bg-gray-100 hover:bg-gray-200 border-gray-300',
  marketing: 'bg-pink-100 hover:bg-pink-200 border-pink-300',
  innovation: 'bg-cyan-100 hover:bg-cyan-200 border-cyan-300',
  developer: 'bg-orange-100 hover:bg-orange-200 border-orange-300',
};

export default function HomePage() {
  const auth = useAuth();
  const [appMetadata, setAppMetadata] = useState<AppData>({});
  const [loadingApps, setLoadingApps] = useState(true);

  // Debug logging
  useEffect(() => {
    console.log('Auth state:', { 
      user: auth.user, 
      loading: auth.loading,
      session: auth.session 
    });
  }, [auth]);

  // Redirect authenticated users to the main actions app
  useEffect(() => {
    if (!auth.loading && auth.user) {
      // Check if user explicitly navigated here (e.g., from app menu)
      const referrer = document.referrer;
      const isInternalNavigation = referrer && new URL(referrer).hostname === window.location.hostname;
      
      // Only redirect if this is the initial landing (not internal navigation)
      if (!isInternalNavigation && window.location.pathname === '/') {
        window.location.href = '/actions';
      }
    }
  }, [auth.user, auth.loading]);

  useEffect(() => {
    async function fetchAppMetadata() {
      try {
        // In production, this would fetch from Edge Config
        // For now, we'll use the static data that matches our Edge Config
        const metadata: AppData = {
          actions: {
            name: 'Ganger Actions',
            description: 'Employee hub and tools',
            icon: '🏢',
            category: 'core'
          },
          inventory: {
            name: 'Inventory Management',
            description: 'Medical supply tracking',
            icon: '📦',
            category: 'operations'
          },
          handouts: {
            name: 'Patient Handouts',
            description: 'Educational materials',
            icon: '📄',
            category: 'clinical'
          },
          'eos-l10': {
            name: 'EOS L10',
            description: 'Team management meetings',
            icon: '👥',
            category: 'management'
          },
          'batch-closeout': {
            name: 'Batch Closeout',
            description: 'Financial batch processing',
            icon: '💰',
            category: 'finance'
          },
          'compliance-training': {
            name: 'Compliance Training',
            description: 'Staff training platform',
            icon: '🎓',
            category: 'hr'
          },
          'clinical-staffing': {
            name: 'Clinical Staffing',
            description: 'Provider scheduling',
            icon: '🗓️',
            category: 'operations'
          },
          'config-dashboard': {
            name: 'Config Dashboard',
            description: 'Platform configuration',
            icon: '⚙️',
            category: 'admin'
          },
          'integration-status': {
            name: 'Integration Status',
            description: 'System monitoring',
            icon: '🔌',
            category: 'admin'
          },
          'ai-receptionist': {
            name: 'AI Receptionist',
            description: 'Automated phone agent',
            icon: '🤖',
            category: 'innovation'
          },
          'call-center-ops': {
            name: 'Call Center',
            description: 'Call management dashboard',
            icon: '📞',
            category: 'operations'
          },
          'medication-auth': {
            name: 'Medication Auth',
            description: 'Prior authorization',
            icon: '💊',
            category: 'clinical'
          },
          'pharma-scheduling': {
            name: 'Pharma Scheduling',
            description: 'Rep visit coordination',
            icon: '🍽️',
            category: 'operations'
          },
          'checkin-kiosk': {
            name: 'Check-in Kiosk',
            description: 'Patient self-service',
            icon: '🖥️',
            category: 'clinical'
          },
          'socials-reviews': {
            name: 'Socials & Reviews',
            description: 'Review management',
            icon: '⭐',
            category: 'marketing'
          },
          'component-showcase': {
            name: 'Component Library',
            description: 'UI components showcase',
            icon: '🎨',
            category: 'developer'
          },
          'platform-dashboard': {
            name: 'Platform Dashboard',
            description: 'System overview',
            icon: '📊',
            category: 'admin'
          }
        };
        setAppMetadata(metadata);
      } catch {
        // Failed to load app metadata
      } finally {
        setLoadingApps(false);
      }
    }

    fetchAppMetadata();
  }, []);

  if (auth.loading || loadingApps) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (!auth.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Ganger Platform</h1>
          <p className="text-gray-600 mb-8">Please sign in to access applications</p>
          <Link href="/auth/signin" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Group apps by category
  const appsByCategory = Object.entries(appMetadata).reduce((acc, [key, app]) => {
    if (!acc[app.category]) acc[app.category] = [];
    acc[app.category].push({ key, ...app });
    return acc;
  }, {} as Record<string, (AppMetadata & { key: string })[]>);

  // Sort categories by predefined order
  const sortedCategories = Object.keys(appsByCategory).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ganger Platform</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {auth.user.email}</p>
            </div>
            <Link href="/auth/logout" className="text-sm text-gray-600 hover:text-gray-900">
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sortedCategories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
              {category.replace('-', ' ')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {appsByCategory[category].map((app) => {
                const appPath = app.key === 'eos-l10' ? 'l10' : app.key.replace('-', '');
                return (
                  <Link
                    key={app.key}
                    href={`/${appPath}`}
                    className={`block p-6 rounded-lg border-2 transition-all ${categoryColors[category] || 'bg-gray-100 hover:bg-gray-200 border-gray-300'}`}
                  >
                    <div className="text-4xl mb-3">{app.icon}</div>
                    <h3 className="font-semibold text-gray-900 mb-1">{app.name}</h3>
                    <p className="text-sm text-gray-600">{app.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}