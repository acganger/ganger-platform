import React, { useState, useEffect } from 'react';
import { AppLayout, PageHeader, LoadingSpinner } from '@ganger/ui';
import { Card } from '@ganger/ui-catalyst';
import { useAuth } from '@ganger/auth';
import { ScheduleBuilder } from '@/components/schedule/ScheduleBuilder';
import { StaffingSidebar } from '@/components/staff/StaffingSidebar';
import { MobileScheduleView } from '@/components/mobile/MobileScheduleView';
import { apiClient } from '@/lib/api-client';
import { useRealtimeStaffing } from '@/hooks/useRealtimeStaffing';
import { StaffMember, Provider, StaffSchedule, Location as StaffingLocation } from '@/types/staffing';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { announceToScreenReader, announceLoadingState } from '@/utils/accessibility';

export default function StaffingDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { schedules, setSchedules, isConnected } = useRealtimeStaffing();
  
  const [providers, setProviders] = useState<Provider[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [locations, setLocations] = useState<StaffingLocation[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Announce loading state to screen readers
        announceLoadingState(true, 'Loading staffing data');

        // Load locations first
        const locationsResponse = await apiClient.getLocations();
        if (locationsResponse.success && locationsResponse.data) {
          setLocations(locationsResponse.data);
          if (locationsResponse.data.length > 0 && !selectedLocation) {
            setSelectedLocation(locationsResponse.data[0].id);
          }
        }

        // Load staff members
        const staffResponse = await apiClient.getStaffMembers(
          selectedLocation || undefined
        );
        if (staffResponse.success && staffResponse.data) {
          setStaffMembers(staffResponse.data);
        }

        // Load providers
        const providersResponse = await apiClient.getProviders(
          selectedLocation || undefined,
          selectedDate.toISOString().split('T')[0]
        );
        if (providersResponse.success && providersResponse.data) {
          setProviders(providersResponse.data);
        }

        // Load schedules
        const schedulesResponse = await apiClient.getSchedules(
          selectedDate.toISOString().split('T')[0],
          selectedLocation || undefined
        );
        if (schedulesResponse.success && schedulesResponse.data) {
          setSchedules(schedulesResponse.data);
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
        announceToScreenReader(`Error loading staffing data: ${errorMessage}`);
      } finally {
        setIsLoading(false);
        announceLoadingState(false, 'Loading staffing data', 'Staffing data loaded');
      }
    };

    if (user && !authLoading) {
      loadData();
    }
  }, [user, authLoading, selectedDate, selectedLocation, setSchedules]);

  const handleScheduleUpdate = async (updatedSchedules: StaffSchedule[]) => {
    try {
      // Update local state optimistically
      setSchedules(updatedSchedules);
      
      // The actual API calls would be made by the individual components
      // This is just for updating the local state
    } catch (error) {
      // Revert optimistic update if needed
      throw error;
    }
  };

  // Show loading state while authenticating
  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Please sign in to access Clinical Staffing
            </h2>
            <p className="text-neutral-600">
              You need to be authenticated to view and manage staff schedules.
            </p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader 
        title="Clinical Staffing" 
        subtitle="Optimize support staff assignments across locations"
        className="mb-6"
      />
      
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-orange-800 text-sm">
            ⚠️ Real-time updates disconnected. Changes may not appear immediately.
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            Error: {error}
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="h-96">
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" />
              </div>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card className="h-96">
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="md" />
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop view */}
          <div className="hidden lg:grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <ErrorBoundary
                fallback={
                  <Card className="h-full p-8">
                    <div className="text-center">
                      <div className="text-red-400 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-neutral-900 mb-2">
                        Schedule Builder Error
                      </h3>
                      <p className="text-neutral-500 text-sm mb-4">
                        There was an error loading the schedule builder. Please refresh the page.
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
                <Card className="h-full">
                  <ScheduleBuilder
                    providers={providers}
                    staffMembers={staffMembers}
                    schedules={schedules}
                    selectedDate={selectedDate}
                    viewMode="day"
                    onScheduleUpdate={handleScheduleUpdate}
                    isLoading={isLoading}
                  />
                </Card>
              </ErrorBoundary>
            </div>
            
            <div className="lg:col-span-1">
              <ErrorBoundary
                fallback={
                  <Card className="h-full p-6">
                    <div className="text-center">
                      <div className="text-red-400 mb-2">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-medium text-neutral-900 mb-1">
                        Sidebar Error
                      </h4>
                      <p className="text-neutral-500 text-xs">
                        Failed to load sidebar
                      </p>
                    </div>
                  </Card>
                }
              >
                <StaffingSidebar
                  staffMembers={staffMembers}
                  schedules={schedules}
                  selectedDate={selectedDate}
                  selectedLocation={selectedLocation}
                  locations={locations}
                  onLocationChange={setSelectedLocation}
                  onDateChange={setSelectedDate}
                />
              </ErrorBoundary>
            </div>
          </div>

          {/* Mobile view */}
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
                    Mobile View Error
                  </h3>
                  <p className="text-neutral-500 text-sm mb-4">
                    There was an error loading the mobile schedule view.
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
            <MobileScheduleView
              providers={providers}
              staffMembers={staffMembers}
              schedules={schedules}
              selectedDate={selectedDate}
              onScheduleUpdate={handleScheduleUpdate}
            />
          </ErrorBoundary>
        </>
      )}
    </AppLayout>
  );
}