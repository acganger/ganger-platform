'use client'

import { useAuth } from '@ganger/auth';
import { AppLayout, PageHeader, LoadingSpinner } from '@ganger/ui';
import { ComplianceDashboard } from '@/components/dashboard/ComplianceDashboard';
import { useCompliance } from '@/lib/compliance-context';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { state, actions } = useCompliance();

  useEffect(() => {
    // Load dashboard data when component mounts
    if (user && !authLoading) {
      actions.loadDashboardData();
    }
  }, [user, authLoading, actions]);

  // Show loading if auth is loading
  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h1>
            <p className="text-gray-600 mb-6">
              Please log in with your @gangerdermatology.com account to access the compliance dashboard.
            </p>
            <button 
              onClick={() => window.location.href = '/auth/login'}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Login with Google
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Check if user has manager+ role
  const hasManagerAccess = user.role && ['manager', 'admin', 'hr'].includes(user.role.toLowerCase());
  
  if (!hasManagerAccess) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Restricted
            </h1>
            <p className="text-gray-600">
              The Compliance Training Dashboard is only available to managers, HR staff, and administrators.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
        <PageHeader 
          title="Compliance Training Dashboard"
          subtitle={`Welcome, ${user.name || user.email}`}
        />
        
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error Loading Dashboard
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{state.error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      actions.clearError();
                      actions.loadDashboardData(state.filters);
                    }}
                    className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ComplianceDashboard />
      </AppLayout>
  );
}