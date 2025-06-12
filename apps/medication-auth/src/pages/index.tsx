import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuthorizations } from '@/hooks/useAuthorizations';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { AuthorizationDashboard } from '@/components/dashboard/AuthorizationDashboard';
import { AuthorizationFilters } from '@/components/dashboard/AuthorizationFilters';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { Layout } from '@/components/shared/Layout';
import { RealtimeStatus } from '@/components/shared/RealtimeStatus';
import { supabase } from '@/lib/supabase';
import type { AuthorizationFilters as AuthFilters } from '@/types';

export default function DashboardPage() {
  const [filters, setFilters] = useState<AuthFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  
  const {
    data: authorizationsData,
    isLoading,
    error,
    refetch
  } = useAuthorizations(filters, currentPage, 20);

  // Set up real-time updates
  useRealtimeUpdates(undefined, userId || undefined);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    
    getCurrentUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleFiltersChange = (newFilters: AuthFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <Head>
        <title>Medication Authorization Dashboard - Ganger Platform</title>
        <meta 
          name="description" 
          content="AI-powered medication authorization management dashboard" 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="py-6">
                <div className="md:flex md:items-center md:justify-between">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                      Medication Authorization Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                      AI-powered prior authorization management and tracking
                    </p>
                  </div>
                  <div className="mt-4 flex items-center space-x-4 md:mt-0 md:ml-4">
                    <RealtimeStatus />
                    <QuickActions />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Dashboard Stats */}
            <div className="mb-8">
              <DashboardStats />
            </div>

            {/* Filters and Search */}
            <div className="mb-6">
              <AuthorizationFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </div>

            {/* Authorization List */}
            <div className="bg-white shadow-sm rounded-lg">
              <AuthorizationDashboard
                authorizations={authorizationsData?.data || []}
                pagination={authorizationsData?.pagination}
                isLoading={isLoading}
                error={error}
                onPageChange={handlePageChange}
                onRefresh={refetch}
              />
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}