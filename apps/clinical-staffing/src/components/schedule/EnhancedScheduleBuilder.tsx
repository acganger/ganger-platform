import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button, LoadingSpinner } from '@ganger/ui';
import { Input, Select } from '@ganger/ui-catalyst';
import { formatDate, formatTime } from '@ganger/utils';
import { 
  ScheduleBuilderProps, 
  StaffSchedule, 
  StaffMember,
  Provider 
} from '@/types/staffing';
import { StaffAssignmentGrid } from './StaffAssignmentGrid';
import { ProviderScheduleGrid } from './ProviderScheduleGrid';
import { ShiftTemplates, ShiftTemplate } from './ShiftTemplates';
import { ScheduleGridSkeleton, ProviderScheduleGridSkeleton } from './ScheduleGridSkeleton';
import { apiClient } from '@/lib/api-client';
import { announceToScreenReader, generateId } from '@/utils/accessibility';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { StaffAvailabilityData } from '@/services/deputy-service';
import { permissionService, UserPermissions } from '@/services/permission-service';
import { useRealtimeStaffing } from '@/hooks/useRealtimeStaffing';
import { useDragAndDrop, DropResult } from '@/hooks/useDragAndDrop';

// View modes
type ViewMode = 'day' | 'week' | 'month';
type ProviderViewMode = 'all' | 'single';

interface ConflictInfo {
  type: 'overtime' | 'availability' | 'double_booking';
  message: string;
  requiresApproval: boolean;
  staffMemberId: string;
  providerId: string;
}

export function EnhancedScheduleBuilder({ 
  providers: initialProviders, 
  staffMembers: initialStaffMembers, 
  schedules: initialSchedules, 
  selectedDate,
  viewMode: initialViewMode = 'day',
  onScheduleUpdate,
  isLoading = false
}: ScheduleBuilderProps) {
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode as ViewMode);
  const [providerViewMode, setProviderViewMode] = useState<ProviderViewMode>('all');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [isDragLoading, setIsDragLoading] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [staffAvailability, setStaffAvailability] = useState<StaffAvailabilityData[]>([]);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [pendingConflict, setPendingConflict] = useState<ConflictInfo | null>(null);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);

  // Services - DeputyService moved to API routes
  
  // Real-time updates
  const { schedules, isConnected } = useRealtimeStaffing({
    locationId: providers[0]?.location_id,
    onUpdate: (updatedSchedules) => {
      onScheduleUpdate(updatedSchedules);
    }
  });

  // Use real-time schedules if available, otherwise use initial
  const currentSchedules = schedules.length > 0 ? schedules : initialSchedules;

  // Drag and drop setup
  const { onDragOver, onDrop, dropTarget } = useDragAndDrop((result: DropResult) => {
    handleDropResult(result);
  });

  // Generate unique IDs for accessibility
  const dateInputId = generateId('date-input');
  const viewModeSelectId = generateId('view-mode-select');
  const providerViewSelectId = generateId('provider-view-select');

  // Load permissions on mount
  useEffect(() => {
    loadUserPermissions();
  }, []);

  // Load staff availability when date changes
  useEffect(() => {
    loadStaffAvailability();
  }, [currentDate, viewMode]);

  const loadUserPermissions = async () => {
    try {
      const userPermissions = await permissionService.getCurrentUserPermissions();
      setPermissions(userPermissions);
      
      // Set default view based on permissions
      if (!userPermissions.canViewAllProviders) {
        setProviderViewMode('single');
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  const loadStaffAvailability = async () => {
    try {
      const endDate = getViewEndDate(currentDate, viewMode);
      // TODO: Replace with API call to /api/staff-availability
      // For now, use fallback availability
      const fallbackAvailability: StaffAvailabilityData[] = staffMembers.map(staff => ({
        staffMemberId: staff.id,
        deputyEmployeeId: 0,
        date: formatDate(currentDate),
        isAvailable: true,
        availableStart: staff.availability_start_time,
        availableEnd: staff.availability_end_time,
        currentHours: 0,
        weeklyHours: 0,
        maxWeeklyHours: staff.max_hours_per_week || 40,
        overtimeApproved: false
      }));
      setStaffAvailability(fallbackAvailability);
    } catch (error) {
      console.error('Failed to load staff availability:', error);
    }
  };

  const getViewEndDate = (startDate: Date, mode: ViewMode): Date => {
    const endDate = new Date(startDate);
    switch (mode) {
      case 'day':
        return endDate;
      case 'week':
        endDate.setDate(endDate.getDate() + 6);
        return endDate;
      case 'month':
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Last day of month
        return endDate;
      default:
        return endDate;
    }
  };

  const handleDropResult = async (result: DropResult) => {
    if (!permissions?.canSchedule) {
      setDragError('You do not have permission to create schedules');
      return;
    }

    const { dragItem, dropTarget: targetId } = result;

    if (dragItem.type === 'shift-template') {
      await handleShiftTemplateDrop(dragItem.data as ShiftTemplate, targetId);
    } else if (dragItem.type === 'staff') {
      await handleStaffDrop(dragItem.data as StaffMember, targetId);
    }
  };

  const handleShiftTemplateDrop = async (template: ShiftTemplate, providerId: string) => {
    setIsDragLoading(true);
    setDragError(null);

    try {
      const provider = providers.find(p => p.id === providerId);
      if (!provider) throw new Error('Provider not found');

      // Find available staff for this shift template
      const eligibleStaff = staffMembers.filter(staff => {
        // Check role match
        if (staff.role !== template.role) return false;

        // Check availability
        const availability = staffAvailability.find(a => 
          a.staffMemberId === staff.id && 
          a.date === formatDate(currentDate)
        );

        return availability?.isAvailable || false;
      });

      if (eligibleStaff.length === 0) {
        throw new Error(`No available ${template.role} staff for this shift`);
      }

      // Auto-assign best matching staff member
      const bestMatch = await findBestStaffMatch(eligibleStaff, provider, template);
      
      if (!bestMatch) {
        throw new Error('No suitable staff member found for this shift');
      }

      // Check for conflicts
      const conflicts = await checkScheduleConflicts(bestMatch, provider, template);
      
      if (conflicts.requiresApproval) {
        setPendingConflict(conflicts);
        return;
      }

      // Create schedule
      await createScheduleAssignment(bestMatch, provider, template);

    } catch (error) {
      setDragError(error instanceof Error ? error.message : 'Failed to assign shift');
    } finally {
      setIsDragLoading(false);
    }
  };

  const handleStaffDrop = async (staff: StaffMember, providerId: string) => {
    setIsDragLoading(true);
    setDragError(null);

    try {
      const provider = providers.find(p => p.id === providerId);
      if (!provider) throw new Error('Provider not found');

      // Check weekly hours - TODO: Replace with API call
      const shiftHours = calculateShiftHours(provider.start_time, provider.end_time);
      const hoursCheck = {
        allowed: true,
        currentHours: 0,
        proposedTotal: shiftHours,
        maxHours: staff.max_hours_per_week || 40,
        requiresApproval: shiftHours > 8, // Simple overtime check
        message: shiftHours > 8 ? 'Shift exceeds 8 hours - approval may be required' : undefined
      };

      if (hoursCheck.requiresApproval) {
        setPendingConflict({
          type: 'overtime',
          message: hoursCheck.message || 'Overtime approval required',
          requiresApproval: true,
          staffMemberId: staff.id,
          providerId: provider.id
        });
        return;
      }

      await createScheduleAssignment(staff, provider);

    } catch (error) {
      setDragError(error instanceof Error ? error.message : 'Failed to assign staff');
    } finally {
      setIsDragLoading(false);
    }
  };

  const findBestStaffMatch = async (
    eligibleStaff: StaffMember[], 
    provider: Provider,
    template: ShiftTemplate
  ): Promise<StaffMember | null> => {
    // Score each staff member
    const scoredStaff = await Promise.all(eligibleStaff.map(async (staff) => {
      let score = 0;

      // Location preference match
      if (staff.location_preferences.includes(provider.location_id)) {
        score += 20;
      }

      // Check weekly hours - prefer staff with fewer hours
      const availability = staffAvailability.find(a => 
        a.staffMemberId === staff.id && 
        a.date === formatDate(currentDate)
      );
      
      if (availability) {
        const remainingHours = (staff.max_hours_per_week || 40) - availability.weeklyHours;
        score += Math.min(remainingHours, 20);
      }

      // Skills match (if provider has preferred skills)
      const skillMatches = staff.skills.filter(skill => 
        provider.preferred_staff_roles.includes(skill)
      ).length;
      score += skillMatches * 5;

      return { staff, score };
    }));

    // Sort by score and return best match
    const sorted = scoredStaff.sort((a, b) => b.score - a.score);
    return sorted[0]?.staff || null;
  };

  const checkScheduleConflicts = async (
    staff: StaffMember,
    provider: Provider,
    template?: ShiftTemplate
  ): Promise<ConflictInfo> => {
    const startTime = template?.startTime || provider.start_time;
    const endTime = template?.endTime || provider.end_time;
    const hours = calculateShiftHours(startTime, endTime);

    // Check weekly hours - TODO: Replace with API call
    const hoursCheck = {
      allowed: true,
      currentHours: 0,
      proposedTotal: hours,
      maxHours: staff.max_hours_per_week || 40,
      requiresApproval: hours > 8, // Simple overtime check
      message: hours > 8 ? 'Shift exceeds 8 hours - approval may be required' : undefined
    };

    if (hoursCheck.requiresApproval) {
      return {
        type: 'overtime',
        message: hoursCheck.message || 'Overtime approval required',
        requiresApproval: true,
        staffMemberId: staff.id,
        providerId: provider.id
      };
    }

    // Check for double booking
    const existingSchedule = currentSchedules.find(s => 
      s.staff_member_id === staff.id && 
      s.schedule_date === formatDate(currentDate) &&
      s.status !== 'cancelled'
    );

    if (existingSchedule) {
      return {
        type: 'double_booking',
        message: 'Staff member is already scheduled for this date',
        requiresApproval: permissions?.canResolveConflicts || false,
        staffMemberId: staff.id,
        providerId: provider.id
      };
    }

    return {
      type: 'availability',
      message: '',
      requiresApproval: false,
      staffMemberId: staff.id,
      providerId: provider.id
    };
  };

  const createScheduleAssignment = async (
    staff: StaffMember,
    provider: Provider,
    template?: ShiftTemplate
  ) => {
    const newSchedule: Omit<StaffSchedule, 'id' | 'created_at' | 'updated_at'> = {
      staff_member_id: staff.id,
      provider_id: provider.id,
      location_id: provider.location_id,
      schedule_date: formatDate(currentDate),
      start_time: template?.startTime || provider.start_time,
      end_time: template?.endTime || provider.end_time,
      role: staff.role,
      status: 'scheduled',
      notes: template 
        ? `Assigned via ${template.name} template` 
        : `Assigned via drag & drop`,
    };

    const response = await apiClient.createSchedule(newSchedule);

    if (!response.success || !response.data) {
      throw new Error('Failed to create schedule');
    }

    const updatedSchedules = [...currentSchedules, response.data];
    await onScheduleUpdate(updatedSchedules);

    announceToScreenReader(`Successfully assigned ${staff.name} to ${provider.name}`);
  };

  const calculateShiftHours = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const handleConflictResolution = async (approved: boolean) => {
    if (!pendingConflict || !approved) {
      setPendingConflict(null);
      return;
    }

    if (pendingConflict.type === 'overtime' && !permissions?.canApproveOvertime) {
      setDragError('You do not have permission to approve overtime');
      setPendingConflict(null);
      return;
    }

    // Proceed with the assignment
    const staff = staffMembers.find(s => s.id === pendingConflict.staffMemberId);
    const provider = providers.find(p => p.id === pendingConflict.providerId);

    if (staff && provider) {
      await createScheduleAssignment(staff, provider);
    }

    setPendingConflict(null);
  };

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent, item: any) => {
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);
    
    // Detect horizontal swipe
    if (deltaX > 50 && deltaX > deltaY) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, targetId: string) => {
    setTouchStartPos(null);
    // Handle drop logic for touch
  };

  // Filter providers based on view mode
  const visibleProviders = useMemo(() => {
    if (providerViewMode === 'all' || !selectedProviderId) {
      return providers;
    }
    return providers.filter(p => p.id === selectedProviderId);
  }, [providers, providerViewMode, selectedProviderId]);

  // Filter staff based on availability
  const availableStaffMembers = useMemo(() => {
    return staffMembers.filter(staff => {
      const availability = staffAvailability.find(a => 
        a.staffMemberId === staff.id && 
        a.date === formatDate(currentDate)
      );
      return availability?.isAvailable || false;
    });
  }, [staffMembers, staffAvailability, currentDate]);

  return (
    <div className="h-full" role="main" aria-label="Enhanced Schedule Builder">
      <div className="p-6">
        {/* Header Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Date selector */}
            <div>
              <label htmlFor={dateInputId} className="sr-only">
                Select date for schedule
              </label>
              <Input
                id={dateInputId}
                type="date"
                value={formatDate(currentDate)}
                onChange={(e) => setCurrentDate(new Date(e.target.value))}
                className="w-48"
                disabled={isLoading}
              />
            </div>
            
            {/* View mode selector */}
            <div>
              <label htmlFor={viewModeSelectId} className="sr-only">
                Select view mode
              </label>
              <Select
                id={viewModeSelectId}
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                disabled={isLoading}
              >
                <option value="day">Day View</option>
                <option value="week">Week View</option>
                <option value="month">Month View</option>
              </Select>
            </div>

            {/* Provider view mode */}
            <div>
              <label htmlFor={providerViewSelectId} className="sr-only">
                Select provider view
              </label>
              <Select
                id={providerViewSelectId}
                value={providerViewMode}
                onChange={(e) => setProviderViewMode(e.target.value as ProviderViewMode)}
                disabled={isLoading || !permissions?.canViewAllProviders}
              >
                <option value="all">All Providers</option>
                <option value="single">Single Provider</option>
              </Select>
            </div>

            {/* Provider selector for single view */}
            {providerViewMode === 'single' && (
              <Select
                value={selectedProviderId || ''}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select Provider</option>
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </Select>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Real-time status indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-neutral-600">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>

            {/* Toggle templates */}
            {permissions?.canSchedule && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
              >
                {showTemplates ? 'Hide' : 'Show'} Templates
              </Button>
            )}
          </div>
        </div>

        {/* Permission-based warnings */}
        {!permissions?.canSchedule && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              You are viewing schedules in read-only mode. Only OS managers can create or modify schedules.
            </p>
          </div>
        )}

        {/* Error Display */}
        {dragError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <p className="text-red-800 text-sm">{dragError}</p>
          </div>
        )}

        {/* Conflict Resolution Dialog */}
        {pendingConflict && (
          <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-medium text-orange-900 mb-2">
              Approval Required
            </h4>
            <p className="text-orange-800 text-sm mb-3">
              {pendingConflict.message}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleConflictResolution(true)}
                disabled={
                  (pendingConflict.type === 'overtime' && !permissions?.canApproveOvertime) ||
                  (pendingConflict.type === 'double_booking' && !permissions?.canResolveConflicts)
                }
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleConflictResolution(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Main Schedule Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Shift Templates Panel */}
          {permissions?.canSchedule && showTemplates && (
            <div className="lg:col-span-3">
              <ErrorBoundary>
                <ShiftTemplates />
              </ErrorBoundary>
            </div>
          )}

          {/* Staff Panel */}
          <div className={permissions?.canSchedule && showTemplates ? 'lg:col-span-4' : 'lg:col-span-5'}>
            <ErrorBoundary>
              <section aria-label="Available Staff">
                <h3 className="text-xl font-medium text-neutral-700 mb-4">
                  Available Staff ({availableStaffMembers.length})
                </h3>
                {isLoading ? (
                  <ScheduleGridSkeleton sections={3} itemsPerSection={3} />
                ) : (
                  <StaffAssignmentGrid 
                    staffMembers={staffMembers}
                    schedules={currentSchedules}
                    selectedDate={currentDate}
                    viewMode={viewMode === 'month' ? 'week' : viewMode}
                  />
                )}
              </section>
            </ErrorBoundary>
          </div>

          {/* Provider Schedules Panel */}
          <div className={permissions?.canSchedule && showTemplates ? 'lg:col-span-5' : 'lg:col-span-7'}>
            <ErrorBoundary>
              <section aria-label="Provider Schedules">
                <h3 className="text-xl font-medium text-neutral-700 mb-4">
                  Provider Schedules
                </h3>
                {isLoading ? (
                  <ProviderScheduleGridSkeleton />
                ) : (
                  <ProviderScheduleGrid
                    providers={visibleProviders}
                    schedules={currentSchedules}
                    selectedDate={currentDate}
                    viewMode={viewMode === 'month' ? 'week' : viewMode}
                    onStaffAssignment={permissions?.canSchedule ? handleStaffDrop : undefined}
                  />
                )}
              </section>
            </ErrorBoundary>
          </div>
        </div>

        {/* Loading Overlay */}
        {isDragLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <LoadingSpinner size="lg" />
              <p className="mt-2 text-sm text-neutral-600">Processing assignment...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}