import { formatDate } from '@/utils/formatting';
import { StaffAssignmentGridProps, StaffMember, StaffSchedule } from '@/types/staffing';
import { StaffCard } from '@/components/staff/StaffCard';
import { useDragAndDrop, DragItem } from '@/hooks/useDragAndDrop';

export function StaffAssignmentGrid({ 
  staffMembers, 
  schedules, 
  selectedDate, 
  onStaffDragStart,
  onStaffDragEnd
}: StaffAssignmentGridProps) {
  
  const { onDragStart, onDragEnd, isDragging, dragItem } = useDragAndDrop();
  
  const getScheduleForStaff = (staffId: string, date: Date): StaffSchedule | undefined => {
    return schedules.find(s => 
      s.staff_member_id === staffId && 
      s.schedule_date === formatDate(date)
    );
  };

  const getStaffAvailabilityStatus = (staff: StaffMember, date: Date): 'available' | 'assigned' | 'unavailable' => {
    const schedule = getScheduleForStaff(staff.id, date);
    
    if (schedule) {
      return 'assigned';
    }
    
    // Check if staff is unavailable on this date
    const dateString = formatDate(date);
    if (staff.unavailable_dates.includes(dateString)) {
      return 'unavailable';
    }
    
    return 'available';
  };

  const availableStaff = staffMembers.filter(staff => 
    getStaffAvailabilityStatus(staff, selectedDate) === 'available'
  );
  
  const assignedStaff = staffMembers.filter(staff => 
    getStaffAvailabilityStatus(staff, selectedDate) === 'assigned'
  );
  
  const unavailableStaff = staffMembers.filter(staff => 
    getStaffAvailabilityStatus(staff, selectedDate) === 'unavailable'
  );

  return (
    <div className="space-y-6">
      {/* Available Staff */}
      <div>
        <h4 className="text-sm font-medium text-green-700 mb-3">
          Available ({availableStaff.length})
        </h4>
        <div className="space-y-3 min-h-[100px] p-3 rounded-lg border-2 border-dashed border-green-200 bg-green-25">
          {availableStaff.length === 0 ? (
            <div className="text-center text-neutral-500 py-8">
              All staff members are assigned or unavailable
            </div>
          ) : (
            availableStaff.map((staff) => {
              const schedule = getScheduleForStaff(staff.id, selectedDate);
              const dragItemData: DragItem = {
                id: staff.id,
                type: 'staff',
                data: staff
              };
              
              return (
                <div 
                  key={staff.id} 
                  className={`drag-item staff-card cursor-grab ${isDragging && dragItem?.id === staff.id ? 'opacity-50' : ''}`}
                  draggable
                  onDragStart={(e) => {
                    onDragStart(e, dragItemData);
                    onStaffDragStart?.(staff);
                  }}
                  onDragEnd={(e) => {
                    onDragEnd(e);
                    onStaffDragEnd?.();
                  }}
                >
                  <StaffCard
                    staff={staff}
                    schedule={schedule}
                    showAssignment={true}
                    compact={true}
                    status="available"
                  />
                  {/* Drag handle indicator */}
                  <div className="flex items-center justify-center pt-2">
                    <div className="w-8 h-1 bg-neutral-300 rounded-full"></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Assigned Staff */}
      {assignedStaff.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-blue-700 mb-3">
            Assigned ({assignedStaff.length})
          </h4>
          <div className="space-y-3">
            {assignedStaff.map((staff) => {
              const schedule = getScheduleForStaff(staff.id, selectedDate);
              
              return (
                <div key={staff.id} className="staff-card assigned">
                  <StaffCard
                    staff={staff}
                    schedule={schedule}
                    showAssignment={true}
                    compact={true}
                    status="assigned"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unavailable Staff */}
      {unavailableStaff.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-neutral-500 mb-3">
            Unavailable ({unavailableStaff.length})
          </h4>
          <div className="space-y-3">
            {unavailableStaff.map((staff) => (
              <div key={staff.id} className="staff-card unavailable">
                <StaffCard
                  staff={staff}
                  schedule={undefined}
                  showAssignment={false}
                  compact={true}
                  status="unavailable"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}