import React, { useState, useCallback, useEffect } from 'react';
import { Button, LoadingSpinner } from '@ganger/ui';
import { Input, Skeleton } from '@ganger/ui-catalyst';
import { formatDate } from '@/utils/formatting';
import { ScheduleBuilderProps, StaffSchedule, StaffMember } from '@/types/staffing';
import { StaffAssignmentGrid } from './StaffAssignmentGrid';
import { ProviderScheduleGrid } from './ProviderScheduleGrid';
import { ScheduleGridSkeleton, ProviderScheduleGridSkeleton } from './ScheduleGridSkeleton';
import { apiClient } from '@/lib/api-client';
import { announceToScreenReader, generateId } from '@/utils/accessibility';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

export function ScheduleBuilder({ 
  providers, 
  staffMembers, 
  schedules, 
  selectedDate,
  viewMode: initialViewMode = 'day',
  onScheduleUpdate,
  isLoading = false
}: ScheduleBuilderProps) {
  const [viewMode, setViewMode] = useState<'day' | 'week'>(initialViewMode);
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [isDragLoading, setIsDragLoading] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  
  // Generate unique IDs for accessibility
  const dateInputId = generateId('date-input');
  const viewModeSelectId = generateId('view-mode-select');
  const staffPanelId = generateId('staff-panel');
  const providerPanelId = generateId('provider-panel');

  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(date);
    announceToScreenReader(`Date changed to ${formatDate(date)}`);
  }, []);

  const handleViewModeChange = useCallback((mode: 'day' | 'week') => {
    setViewMode(mode);
    announceToScreenReader(`View mode changed to ${mode} view`);
  }, []);

  const handleDragEnd = useCallback(async (result: any) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a valid area
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    setIsDragLoading(true);
    setDragError(null);

    try {
      // Parse the draggable ID to get staff member ID
      const staffMemberId = draggableId;
      
      // Parse the destination to get provider ID and time slot
      const destinationParts = destination.droppableId.split('-');
      if (destinationParts[0] !== 'provider') {
        throw new Error('Invalid drop target');
      }
      
      const providerId = destinationParts[1];
      const timeSlot = destinationParts[2] || '08:00'; // Default time slot

      // Find the provider to get schedule details
      const provider = providers.find(p => p.id === providerId);
      if (!provider) {
        throw new Error('Provider not found');
      }

      // Create new schedule entry
      const newSchedule: Omit<StaffSchedule, 'id' | 'created_at' | 'updated_at'> = {
        staff_member_id: staffMemberId,
        provider_id: providerId,
        location_id: provider.location_id,
        schedule_date: formatDate(currentDate),
        start_time: provider.start_time,
        end_time: provider.end_time,
        role: 'assigned', // This could be determined by staff member role
        status: 'scheduled',
        notes: `Assigned via drag & drop at ${new Date().toLocaleTimeString()}`,
      };

      // Check if staff member is already assigned to this provider on this date
      const existingSchedule = schedules.find(s => 
        s.staff_member_id === staffMemberId && 
        s.provider_id === providerId && 
        s.schedule_date === formatDate(currentDate)
      );

      let updatedSchedules: StaffSchedule[];

      if (existingSchedule) {
        // Update existing schedule
        const response = await apiClient.updateSchedule(existingSchedule.id, {
          start_time: provider.start_time,
          end_time: provider.end_time,
          status: 'scheduled',
          notes: newSchedule.notes,
        });

        if (!response.success || !response.data) {
          throw new Error('Failed to update schedule');
        }

        updatedSchedules = schedules.map(s => 
          s.id === existingSchedule.id ? response.data! : s
        );
      } else {
        // Create new schedule
        const response = await apiClient.createSchedule(newSchedule);

        if (!response.success || !response.data) {
          throw new Error('Failed to create schedule');
        }

        updatedSchedules = [...schedules, response.data];
      }

      // Update parent component
      await onScheduleUpdate(updatedSchedules);

    } catch (error) {
      setDragError(error instanceof Error ? error.message : 'Failed to assign staff');
    } finally {
      setIsDragLoading(false);
    }
  }, [providers, schedules, currentDate, onScheduleUpdate]);

  // Staff assignment handler for drag and drop
  const handleStaffAssignment = useCallback(async (staff: StaffMember, providerId: string, date: Date) => {
    try {
      setIsDragLoading(true);
      setDragError(null);
      
      const provider = providers.find(p => p.id === providerId);
      announceToScreenReader(`Assigning ${staff.name} to ${provider?.name || 'provider'}`);
      
      // Find existing schedule for this staff member and date
      const existingSchedule = schedules.find(s => 
        s.staff_member_id === staff.id && 
        s.schedule_date === formatDate(date)
      );

      let updatedSchedules: StaffSchedule[];

      if (existingSchedule) {
        // Update existing schedule
        const response = await apiClient.updateSchedule(existingSchedule.id, {
          provider_id: providerId,
          location_id: provider?.location_id || '',
          start_time: provider?.start_time || '09:00',
          end_time: provider?.end_time || '17:00',
          role: staff.role,
          status: 'scheduled',
          notes: existingSchedule.notes,
        });

        if (!response.success || !response.data) {
          throw new Error('Failed to update schedule');
        }

        updatedSchedules = schedules.map(s => 
          s.id === existingSchedule.id ? response.data! : s
        );
      } else {
        // Create new schedule
        const newSchedule = {
          staff_member_id: staff.id,
          provider_id: providerId,
          location_id: provider?.location_id || '',
          schedule_date: formatDate(date),
          start_time: provider?.start_time || '09:00',
          end_time: provider?.end_time || '17:00',
          role: staff.role,
          status: 'scheduled' as const,
          notes: '',
        };

        const response = await apiClient.createSchedule(newSchedule);

        if (!response.success || !response.data) {
          throw new Error('Failed to create schedule');
        }

        updatedSchedules = [...schedules, response.data];
      }

      // Update parent component
      await onScheduleUpdate(updatedSchedules);
      
      announceToScreenReader(`Successfully assigned ${staff.name} to ${provider?.name || 'provider'}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign staff';
      setDragError(errorMessage);
      announceToScreenReader(`Error: ${errorMessage}`);
    } finally {
      setIsDragLoading(false);
    }
  }, [providers, schedules, currentDate, onScheduleUpdate]);

  const handleRefresh = useCallback(() => {
    announceToScreenReader('Refreshing schedule data');
    window.location.reload();
  }, []);
  
  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        handleRefresh();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleRefresh]);

  return (
    <div className="h-full" role="main" aria-label="Schedule Builder">
      <div className="p-6">
        {/* Header Controls */}
        <div 
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
          role="toolbar"
          aria-label="Schedule controls"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div>
              <label htmlFor={dateInputId} className="sr-only">
                Select date for schedule
              </label>
              <Input
                id={dateInputId}
                type="date"
                value={formatDate(currentDate)}
                onChange={(e) => handleDateChange(new Date(e.target.value))}
                className="w-48"
                disabled={isLoading}
                aria-describedby={`${dateInputId}-description`}
              />
              <div id={`${dateInputId}-description`} className="sr-only">
                Currently viewing schedule for {formatDate(currentDate)}
              </div>
            </div>
            
            <div>
              <label htmlFor={viewModeSelectId} className="sr-only">
                Select view mode
              </label>
              <select
                id={viewModeSelectId}
                value={viewMode}
                onChange={(e) => handleViewModeChange(e.target.value as 'day' | 'week')}
                className="w-32 px-3 py-2 border border-neutral-300 rounded-md text-sm focus-visible"
                disabled={isLoading}
                aria-describedby={`${viewModeSelectId}-description`}
              >
                <option value="day">Day View</option>
                <option value="week">Week View</option>
              </select>
              <div id={`${viewModeSelectId}-description`} className="sr-only">
                Currently in {viewMode} view mode
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading || isDragLoading}
            aria-label="Refresh schedule data"
            aria-describedby="refresh-shortcut"
          >
            {isLoading || isDragLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Loading...
              </>
            ) : (
              'Refresh'
            )}
          </Button>
          <div id="refresh-shortcut" className="sr-only">
            Keyboard shortcut: Alt+R
          </div>
        </div>

        {/* Error Display */}
        {dragError && (
          <div 
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
            role="alert"
            aria-live="polite"
          >
            <p className="text-red-800 text-sm">
              Error: {dragError}
            </p>
          </div>
        )}

        {/* Loading Overlay */}
        {isDragLoading && (
          <div className="loading-overlay" role="status" aria-live="polite">
            <LoadingSpinner size="lg" />
            <span className="sr-only">Updating schedule...</span>
          </div>
        )}

        {/* Main Schedule Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Staff Assignments Panel */}
          <ErrorBoundary>
            <section 
              id={staffPanelId}
              aria-labelledby={`${staffPanelId}-heading`}
              className="focus-visible"
              tabIndex={-1}
            >
              <h3 
                id={`${staffPanelId}-heading`}
                className="text-xl font-medium text-neutral-700 mb-4"
              >
                Available Staff
              </h3>
              {isLoading ? (
                <ScheduleGridSkeleton sections={3} itemsPerSection={3} />
              ) : (
                <StaffAssignmentGrid 
                  staffMembers={staffMembers}
                  schedules={schedules}
                  selectedDate={currentDate}
                  viewMode={viewMode}
                />
              )}
            </section>
          </ErrorBoundary>

          {/* Provider Schedules Panel */}
          <ErrorBoundary>
            <section 
              id={providerPanelId}
              aria-labelledby={`${providerPanelId}-heading`}
              className="focus-visible"
              tabIndex={-1}
            >
              <h3 
                id={`${providerPanelId}-heading`}
                className="text-xl font-medium text-neutral-700 mb-4"
              >
                Provider Schedules
              </h3>
              {isLoading ? (
                <ProviderScheduleGridSkeleton />
              ) : (
                <ProviderScheduleGrid
                  providers={providers}
                  schedules={schedules}
                  selectedDate={currentDate}
                  viewMode={viewMode}
                  onStaffAssignment={handleStaffAssignment}
                />
              )}
            </section>
          </ErrorBoundary>
        </div>

        {/* Instructions */}
        <aside 
          className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          role="complementary"
          aria-labelledby="instructions-heading"
        >
          <h4 id="instructions-heading" className="text-sm font-medium text-blue-900 mb-2">
            How to use:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1" role="list">
            <li role="listitem">• Drag staff members from the left panel to provider slots on the right</li>
            <li role="listitem">• Use the date picker to view different days</li>
            <li role="listitem">• Switch between day and week views using the view selector</li>
            <li role="listitem">• Use Alt+R to refresh the schedule data</li>
            <li role="listitem">• Changes are saved automatically and synchronized in real-time</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}