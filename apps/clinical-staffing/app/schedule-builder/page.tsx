'use client'

import { useState, useEffect } from 'react';
import { useStaffAuth } from '@ganger/auth';
import { LoadingSpinner, StaffLoginRedirect } from '@ganger/ui';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { EnhancedScheduleBuilder } from '@/components/schedule/EnhancedScheduleBuilder';
import { Provider, StaffMember, StaffSchedule } from '@/types/staffing';
import { apiClient } from '@/lib/api-client';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

// Cloudflare Workers Edge Runtime
// export const runtime = 'edge'; // Removed for Vercel compatibility
export const dynamic = 'force-dynamic';

export default function ScheduleBuilderPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useStaffAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (isAuthenticated) {
      loadScheduleData();
    }
  }, [isAuthenticated]);

  const loadScheduleData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load all data in parallel
      const [providersResponse, staffResponse, schedulesResponse] = await Promise.all([
        apiClient.getProviders(),
        apiClient.getStaffMembers(),
        apiClient.getSchedules()
      ]);

      if (!providersResponse.success || !staffResponse.success || !schedulesResponse.success) {
        throw new Error('Failed to load schedule data');
      }

      setProviders(providersResponse.data || []);
      setStaffMembers(staffResponse.data || []);
      setSchedules(schedulesResponse.data || []);
    } catch (error) {
      console.error('Failed to load schedule data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load schedule data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleUpdate = async (updatedSchedules: StaffSchedule[]) => {
    setSchedules(updatedSchedules);
    // Optionally refresh data from server
    // await loadScheduleData();
  };
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <StaffLoginRedirect appName="clinical-staffing" />;
  }
  
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="flex items-center text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <div className="w-px h-6 bg-neutral-300" />
              <h1 className="text-2xl font-bold text-neutral-900">Schedule Builder</h1>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={loadScheduleData}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      <ErrorBoundary>
        <EnhancedScheduleBuilder
          providers={providers}
          staffMembers={staffMembers}
          schedules={schedules}
          selectedDate={selectedDate}
          viewMode="day"
          onScheduleUpdate={handleScheduleUpdate}
          isLoading={isLoading}
        />
      </ErrorBoundary>
    </main>
  );
}