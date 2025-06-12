import React, { useState } from 'react';
import { AppLayout, PageHeader, Card } from '@ganger/ui';
import { useAuth } from '@ganger/auth';
import { CoverageAnalytics } from '@/components/analytics/CoverageAnalytics';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Please sign in to access Analytics
            </h2>
            <p className="text-neutral-600">
              You need to be authenticated to view analytics data.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader 
        title="Staffing Analytics" 
        subtitle="Performance metrics and insights for clinical staffing optimization"
        className="mb-6"
      />
      
      <ErrorBoundary
        fallback={
          <Card className="p-8">
            <div className="text-center">
              <div className="text-red-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Analytics Error
              </h3>
              <p className="text-neutral-500 text-sm mb-4">
                There was an error loading the analytics dashboard. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Refresh Page
              </button>
            </div>
          </Card>
        }
      >
        <CoverageAnalytics selectedLocation={selectedLocation} />
      </ErrorBoundary>
    </AppLayout>
  );
}