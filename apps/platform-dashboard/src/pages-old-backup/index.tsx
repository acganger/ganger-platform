'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';

interface ApplicationCard {
  id: string;
  name: string;
  description: string;
  url: string;
  status: 'active' | 'maintenance' | 'offline';
  lastUpdated: string;
}

interface SystemMetrics {
  totalApplications: number;
  activeUsers: number;
  systemUptime: string;
  alertsCount: number;
}

export default function PlatformDashboard() {
  const [applications, setApplications] = useState<ApplicationCard[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - would be replaced with real API calls
    const mockApplications: ApplicationCard[] = [
      {
        id: 'inventory',
        name: 'Inventory Management',
        description: 'Medical supply tracking with barcode scanning',
        url: '/inventory',
        status: 'active',
        lastUpdated: '2025-01-17T10:30:00Z'
      },
      {
        id: 'handouts',
        name: 'Patient Handouts',
        description: 'Digital handout generation and delivery',
        url: '/handouts',
        status: 'active',
        lastUpdated: '2025-01-17T09:15:00Z'
      },
      {
        id: 'l10',
        name: 'EOS L10 Meetings',
        description: 'Level 10 meeting management platform',
        url: '/l10',
        status: 'active',
        lastUpdated: '2025-01-17T08:45:00Z'
      },
      {
        id: 'compliance',
        name: 'Compliance Training',
        description: 'Staff training and compliance tracking',
        url: '/compliance',
        status: 'active',
        lastUpdated: '2025-01-17T07:20:00Z'
      },
      {
        id: 'status',
        name: 'Integration Status',
        description: 'System monitoring and health dashboard',
        url: '/status',
        status: 'active',
        lastUpdated: '2025-01-17T10:45:00Z'
      },
      {
        id: 'config',
        name: 'Configuration Dashboard',
        description: 'Platform configuration and settings',
        url: '/config',
        status: 'active',
        lastUpdated: '2025-01-17T09:30:00Z'
      }
    ];

    const mockMetrics: SystemMetrics = {
      totalApplications: mockApplications.length,
      activeUsers: 24,
      systemUptime: '99.9%',
      alertsCount: 0
    };

    setApplications(mockApplications);
    setMetrics(mockMetrics);
    setLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredApplications = applications.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Platform Dashboard - Ganger Dermatology</title>
        <meta name="description" content="Central hub for Ganger Platform applications and system status" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Ganger Dermatology Platform Command Center
                </p>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  System Health
                </button>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">All Systems Operational</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* System Metrics */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-blue-600">{metrics.totalApplications}</div>
                <div className="text-sm text-gray-600">Total Applications</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-green-600">{metrics.activeUsers}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-purple-600">{metrics.systemUptime}</div>
                <div className="text-sm text-gray-600">System Uptime</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-orange-600">{metrics.alertsCount}</div>
                <div className="text-sm text-gray-600">Active Alerts</div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 pr-4 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Applications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplications.map((app) => (
              <div key={app.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{app.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Updated: {new Date(app.lastUpdated).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => window.open(`https://staff.gangerdermatology.com${app.url}`, '_blank')}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                    >
                      Launch App
                      <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredApplications.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No applications found matching your search.</div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center text-sm text-gray-500">
              Ganger Platform Dashboard - System Status: Operational
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}