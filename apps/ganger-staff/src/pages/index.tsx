export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching completely

import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAuth } from '@ganger/auth';
import Link from 'next/link';

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

  // Monitor auth state changes
  useEffect(() => {
    // Auth state is available via the auth object
    // No need to log sensitive data
  }, [auth, loadingApps]);

  useEffect(() => {
    async function fetchAppMetadata() {
      try {
        // App metadata is hardcoded for now
        // In the future, this could be fetched from a configuration API
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
      <>
        <Head>
          <meta httpEquiv="cache-control" content="no-cache, no-store, must-revalidate" />
          <meta httpEquiv="pragma" content="no-cache" />
          <meta httpEquiv="expires" content="0" />
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading applications...</p>
            <p className="css-test-marker mt-2">CSS Test Marker - Should be red and bold</p>
          </div>
        </div>
      </>
    );
  }

  if (!auth.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Ganger Platform</h1>
            <p className="mt-2 text-gray-600">Sign in to access your applications</p>
          </div>
          
          <div className="mt-8 bg-white py-8 px-6 shadow rounded-lg">
            <button
              onClick={() => auth.signIn()}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
            
            <p className="mt-4 text-center text-sm text-gray-600">
              By signing in, you agree to our terms and conditions
            </p>
          </div>
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
    <>
      <Head>
        <title>Ganger Platform</title>
        <meta httpEquiv="cache-control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="pragma" content="no-cache" />
        <meta httpEquiv="expires" content="0" />
      </Head>
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
                // Map app keys to their URL paths based on vercel.json
                const appPaths: Record<string, string> = {
                  'actions': 'actions',
                  'inventory': 'inventory',
                  'handouts': 'handouts',
                  'eos-l10': 'l10',
                  'batch-closeout': 'batch',
                  'compliance-training': 'compliance',
                  'clinical-staffing': 'clinical-staffing',
                  'config-dashboard': 'config',
                  'integration-status': 'status',
                  'ai-receptionist': 'ai-receptionist',
                  'call-center-ops': 'call-center',
                  'medication-auth': 'medication-auth',
                  'pharma-scheduling': 'pharma',
                  'checkin-kiosk': 'kiosk',
                  'socials-reviews': 'socials',
                  'component-showcase': 'components',
                  'platform-dashboard': 'platform'
                };
                const appPath = appPaths[app.key] || app.key;
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
    </>
  );
}