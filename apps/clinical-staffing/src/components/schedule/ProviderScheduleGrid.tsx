import { formatDate, formatTime } from '@ganger/utils';
import { ProviderScheduleGridProps, Provider, StaffSchedule } from '@/types/staffing';
import { StaffCard } from '@/components/staff/StaffCard';
import { useDragAndDrop, DropResult } from '@/hooks/useDragAndDrop';
import { announceToScreenReader, announceDragEnd } from '@/utils/accessibility';

export function ProviderScheduleGrid({ 
  providers, 
  schedules,
  selectedDate, 
  onStaffAssignment
}: ProviderScheduleGridProps) {
  
  // Drag and drop functionality
  const { onDragOver, onDrop, dropTarget } = useDragAndDrop((result: DropResult) => {
    if (result.dragItem.type === 'staff' && onStaffAssignment) {
      const staffMember = result.dragItem.data;
      const providerId = result.dropTarget;
      
      // Call the assignment handler
      onStaffAssignment(staffMember, providerId, selectedDate);
      
      // Announce to screen readers
      const provider = providers.find(p => p.id === providerId);
      announceDragEnd(
        staffMember.name, 
        provider ? `${provider.name}'s schedule` : 'provider schedule'
      );
      
      // General announcement
      announceToScreenReader(`${staffMember.name} assigned to ${provider?.name || 'provider'} for ${formatDate(selectedDate)}`);
    }
  });
  
  const getSchedulesForProvider = (providerId: string, date: Date): StaffSchedule[] => {
    const dateString = formatDate(date);
    return schedules.filter(s => 
      s.provider_id === providerId && 
      s.schedule_date === dateString
    );
  };

  const getProviderCoverageStatus = (provider: Provider, date: Date): 'fully-staffed' | 'needs-staff' | 'over-staffed' => {
    const assignedSchedules = getSchedulesForProvider(provider.id, date);
    const assignedCount = assignedSchedules.length;
    
    if (assignedCount === 0) {
      return 'needs-staff';
    } else if (assignedCount < provider.requires_staff_count) {
      return 'needs-staff';
    } else if (assignedCount === provider.requires_staff_count) {
      return 'fully-staffed';
    } else {
      return 'over-staffed';
    }
  };

  const isProviderActiveOnDate = (provider: Provider, date: Date): boolean => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    return provider.days_of_week.includes(dayOfWeek);
  };

  return (
    <div className="space-y-4">
      {providers.map(provider => {
        const isActive = isProviderActiveOnDate(provider, selectedDate);
        const assignedSchedules = getSchedulesForProvider(provider.id, selectedDate);
        const coverageStatus = getProviderCoverageStatus(provider, selectedDate);
        
        if (!isActive) {
          return (
            <div key={provider.id} className="provider-card opacity-50">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-neutral-900">
                    {provider.name}
                  </h4>
                  <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                    Not scheduled today
                  </span>
                </div>
                <div className="text-sm text-neutral-500">
                  {provider.specialty}
                </div>
              </div>
            </div>
          );
        }

        return (
          <div 
            key={provider.id} 
            className={`provider-card ${coverageStatus} drop-zone ${dropTarget === provider.id ? 'drop-target-active' : ''}`}
            onDragOver={(e) => onDragOver(e, provider.id)}
            onDrop={(e) => onDrop(e, provider.id)}
            role="region"
            aria-label={`${provider.name} schedule - ${coverageStatus.replace('-', ' ')}`}
          >
                <div className="p-4">
                  {/* Provider Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-neutral-900">
                        {provider.name}
                      </h4>
                      <div className="text-sm text-neutral-600">
                        {provider.specialty}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-neutral-600">
                        {formatTime(provider.start_time)} - {formatTime(provider.end_time)}
                      </div>
                      <div className="text-xs text-neutral-500">
                        Needs {provider.requires_staff_count} staff
                      </div>
                    </div>
                  </div>

                  {/* Coverage Status Indicator */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`
                        w-3 h-3 rounded-full
                        ${coverageStatus === 'fully-staffed' ? 'bg-green-500' : ''}
                        ${coverageStatus === 'needs-staff' ? 'bg-orange-500' : ''}
                        ${coverageStatus === 'over-staffed' ? 'bg-blue-500' : ''}
                      `} />
                      <span className="text-sm text-neutral-600">
                        {assignedSchedules.length} / {provider.requires_staff_count} assigned
                      </span>
                    </div>
                    
                    {coverageStatus === 'needs-staff' && (
                      <span className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded">
                        {provider.requires_staff_count - assignedSchedules.length} more needed
                      </span>
                    )}
                    
                    {coverageStatus === 'fully-staffed' && (
                      <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                        Fully staffed
                      </span>
                    )}
                    
                    {coverageStatus === 'over-staffed' && (
                      <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                        Over-staffed
                      </span>
                    )}
                  </div>

                  {/* Assigned Staff */}
                  <div className="space-y-2">
                    {assignedSchedules.length === 0 ? (
                      <div 
                        className={`text-center py-6 border-2 border-dashed rounded-lg transition-colors ${
                          dropTarget === provider.id 
                            ? 'border-primary-400 bg-primary-50' 
                            : 'border-neutral-300'
                        }`}
                        role="application"
                        aria-label="Drop zone for staff assignment"
                      >
                        <p className="text-neutral-500 text-sm">
                          Drop staff members here to assign
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {assignedSchedules.map((schedule: any) => {
                          // Find the staff member for this schedule
                          const staffMember = schedule.staff_member;
                          
                          if (!staffMember) {
                            return (
                              <div key={schedule.id} className="text-xs text-neutral-500 p-2 bg-neutral-100 rounded">
                                Staff member not found
                              </div>
                            );
                          }

                          return (
                            <div key={schedule.id} className="staff-card assigned">
                              <StaffCard
                                staff={staffMember}
                                schedule={schedule}
                                showAssignment={true}
                                compact={true}
                                status="assigned"
                                showRemoveButton={true}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Drop zone placeholder for additional staff */}
                    {assignedSchedules.length < provider.requires_staff_count && (
                      <div 
                        className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${
                          dropTarget === provider.id 
                            ? 'border-primary-400 bg-primary-50' 
                            : 'border-neutral-300'
                        }`}
                        role="application"
                        aria-label="Drop zone for additional staff assignment"
                      >
                        <p className="text-neutral-500 text-xs">
                          Drop here for additional staff
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
        );
      })}
      
      {providers.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          <p>No providers scheduled for this date</p>
          <p className="text-sm mt-2">
            Select a different date or add providers to the schedule
          </p>
        </div>
      )}
    </div>
  );
}