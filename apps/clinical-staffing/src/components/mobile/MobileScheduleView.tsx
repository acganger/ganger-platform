import React, { useState } from 'react';
import { Button } from '@ganger/ui';
import { Card } from '@ganger/ui-catalyst';
import { StaffMember, Provider, StaffSchedule } from '@/types/staffing';
import { formatDate, formatTime } from '@ganger/utils';
import { StaffCard } from '@/components/staff/StaffCard';

interface MobileScheduleViewProps {
  providers: Provider[];
  staffMembers: StaffMember[];
  schedules: StaffSchedule[];
  selectedDate: Date;
  onScheduleUpdate?: (schedules: StaffSchedule[]) => Promise<void>;
}

export function MobileScheduleView({
  providers,
  staffMembers,
  schedules,
  selectedDate,
  onScheduleUpdate
}: MobileScheduleViewProps) {
  const [touchMode, setTouchMode] = useState<'view' | 'edit'>('view');
  const [activeTab, setActiveTab] = useState<'staff' | 'providers'>('staff');

  const getSchedulesForDate = (date: Date) => {
    const dateString = formatDate(date);
    return schedules.filter(s => s.schedule_date === dateString);
  };

  const getAvailableStaff = () => {
    const dateString = formatDate(selectedDate);
    return staffMembers.filter(staff => {
      const isAssigned = schedules.some(s => 
        s.staff_member_id === staff.id && s.schedule_date === dateString
      );
      const isUnavailable = staff.unavailable_dates.includes(dateString);
      return !isAssigned && !isUnavailable && staff.is_active;
    });
  };

  const getAssignedStaff = () => {
    const dateString = formatDate(selectedDate);
    return staffMembers.filter(staff => 
      schedules.some(s => 
        s.staff_member_id === staff.id && s.schedule_date === dateString
      )
    );
  };

  const getScheduleForStaff = (staffId: string): StaffSchedule | undefined => {
    const dateString = formatDate(selectedDate);
    return schedules.find(s => 
      s.staff_member_id === staffId && s.schedule_date === dateString
    );
  };

  const getSchedulesForProvider = (providerId: string): StaffSchedule[] => {
    const dateString = formatDate(selectedDate);
    return schedules.filter(s => 
      s.provider_id === providerId && s.schedule_date === dateString
    );
  };

  const availableStaff = getAvailableStaff();
  const assignedStaff = getAssignedStaff();
  const todaySchedules = getSchedulesForDate(selectedDate);

  return (
    <div className="lg:hidden mobile-schedule-view" data-testid="mobile-schedule-view">
      {/* Mobile Header */}
      <div className="sticky top-0 bg-white z-10 p-4 border-b shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-neutral-900">
            Staff Schedule
          </h2>
          <Button 
            size="sm"
            variant={touchMode === 'edit' ? 'primary' : 'outline'}
            onClick={() => setTouchMode(touchMode === 'edit' ? 'view' : 'edit')}
          >
            {touchMode === 'edit' ? 'View Mode' : 'Edit Mode'}
          </Button>
        </div>
        
        {/* Date Display */}
        <div className="text-sm text-neutral-600">
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b bg-white">
        <button
          className={`flex-1 py-3 px-4 text-center font-medium ${
            activeTab === 'staff'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-neutral-500'
          }`}
          onClick={() => setActiveTab('staff')}
        >
          Staff ({staffMembers.length})
        </button>
        <button
          className={`flex-1 py-3 px-4 text-center font-medium ${
            activeTab === 'providers'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-neutral-500'
          }`}
          onClick={() => setActiveTab('providers')}
        >
          Providers ({providers.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {activeTab === 'staff' && (
          <>
            {/* Available Staff */}
            {availableStaff.length > 0 && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium text-green-700 mb-3">
                    Available ({availableStaff.length})
                  </h3>
                  <div className="space-y-3">
                    {availableStaff.map(staff => (
                      <div key={staff.id} className="mobile-staff-card">
                        <StaffCard
                          staff={staff}
                          showAssignment={true}
                          compact={false}
                          status="available"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Assigned Staff */}
            {assignedStaff.length > 0 && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium text-blue-700 mb-3">
                    Assigned ({assignedStaff.length})
                  </h3>
                  <div className="space-y-3">
                    {assignedStaff.map(staff => {
                      const schedule = getScheduleForStaff(staff.id);
                      return (
                        <div key={staff.id} className="mobile-staff-card">
                          <StaffCard
                            staff={staff}
                            schedule={schedule}
                            showAssignment={true}
                            compact={false}
                            status="assigned"
                            showRemoveButton={touchMode === 'edit'}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}

            {/* Empty State */}
            {availableStaff.length === 0 && assignedStaff.length === 0 && (
              <Card>
                <div className="p-8 text-center">
                  <div className="text-neutral-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-1">
                    No Staff Available
                  </h3>
                  <p className="text-neutral-500 text-sm">
                    All staff members are either assigned or unavailable for this date.
                  </p>
                </div>
              </Card>
            )}
          </>
        )}

        {activeTab === 'providers' && (
          <>
            {providers.map(provider => {
              const assignedSchedules = getSchedulesForProvider(provider.id);
              const isActive = provider.days_of_week.includes(selectedDate.getDay());
              
              if (!isActive) {
                return (
                  <Card key={provider.id}>
                    <div className="p-4 opacity-60">
                      <h3 className="font-medium text-neutral-900 mb-1">
                        {provider.name}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        Not scheduled for this day
                      </p>
                    </div>
                  </Card>
                );
              }

              const coverageStatus = assignedSchedules.length === 0 
                ? 'needs-staff'
                : assignedSchedules.length < provider.requires_staff_count
                ? 'needs-staff'
                : assignedSchedules.length === provider.requires_staff_count
                ? 'fully-staffed'
                : 'over-staffed';

              return (
                <Card key={provider.id}>
                  <div className="p-4">
                    {/* Provider Header */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-neutral-900">
                          {provider.name}
                        </h3>
                        <div className={`
                          w-3 h-3 rounded-full
                          ${coverageStatus === 'fully-staffed' ? 'bg-green-500' : ''}
                          ${coverageStatus === 'needs-staff' ? 'bg-orange-500' : ''}
                          ${coverageStatus === 'over-staffed' ? 'bg-blue-500' : ''}
                        `} />
                      </div>
                      <div className="text-sm text-neutral-600 mb-2">
                        {provider.specialty} • {formatTime(provider.start_time)} - {formatTime(provider.end_time)}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {assignedSchedules.length} / {provider.requires_staff_count} staff assigned
                      </div>
                    </div>

                    {/* Assigned Staff */}
                    {assignedSchedules.length > 0 ? (
                      <div className="space-y-2">
                        {assignedSchedules.map(schedule => {
                          const staff = staffMembers.find(s => s.id === schedule.staff_member_id);
                          if (!staff) return null;

                          return (
                            <div key={schedule.id} className="bg-neutral-50 p-3 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-sm">{staff.name}</div>
                                  <div className="text-xs text-neutral-500 capitalize">
                                    {staff.role.replace('_', ' ')}
                                  </div>
                                </div>
                                {touchMode === 'edit' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 border-2 border-dashed border-neutral-300 rounded-lg">
                        <p className="text-neutral-500 text-sm">
                          No staff assigned
                        </p>
                        {touchMode === 'edit' && (
                          <Button size="sm" variant="outline" className="mt-2">
                            Assign Staff
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}

            {providers.length === 0 && (
              <Card>
                <div className="p-8 text-center">
                  <div className="text-neutral-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-1">
                    No Providers Scheduled
                  </h3>
                  <p className="text-neutral-500 text-sm">
                    No providers are scheduled for this date.
                  </p>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Mobile Summary Bar */}
      <div className="sticky bottom-0 bg-white border-t p-4 shadow-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-neutral-900">
              {availableStaff.length}
            </div>
            <div className="text-xs text-neutral-500">Available</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {assignedStaff.length}
            </div>
            <div className="text-xs text-neutral-500">Assigned</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">
              {providers.filter(p => p.days_of_week.includes(selectedDate.getDay())).length}
            </div>
            <div className="text-xs text-neutral-500">Providers</div>
          </div>
        </div>
      </div>
    </div>
  );
}