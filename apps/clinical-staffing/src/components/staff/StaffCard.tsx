import { Button } from '@ganger/ui';
import { StaffMember, StaffSchedule } from '@/types/staffing';
import { formatTime } from '@/utils/formatting';

interface StaffCardProps {
  staff: StaffMember;
  schedule?: StaffSchedule;
  showAssignment?: boolean;
  compact?: boolean;
  status?: 'available' | 'assigned' | 'unavailable';
  showRemoveButton?: boolean;
  onRemove?: () => void;
}

export function StaffCard({ 
  staff, 
  schedule, 
  showAssignment = false,
  compact = false,
  status = 'available',
  showRemoveButton = false,
  onRemove
}: StaffCardProps) {
  
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'medical_assistant':
        return 'bg-blue-100 text-blue-800';
      case 'nurse':
        return 'bg-green-100 text-green-800';
      case 'technician':
        return 'bg-purple-100 text-purple-800';
      case 'administrative':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-50 border-green-200';
      case 'assigned':
        return 'bg-blue-50 border-blue-200';
      case 'unavailable':
        return 'bg-neutral-50 border-neutral-300';
      default:
        return 'bg-white border-neutral-200';
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getAvailabilityText = () => {
    if (schedule) {
      return `${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}`;
    }
    if (staff.availability_start_time && staff.availability_end_time) {
      return `${formatTime(staff.availability_start_time)} - ${formatTime(staff.availability_end_time)}`;
    }
    return 'Availability not set';
  };

  return (
    <div className={`
      interactive-element gpu-accelerated will-change-transform
      border rounded-lg p-3 transition-all duration-200
      ${getStatusColor(status)}
      ${compact ? 'space-y-1' : 'space-y-2'}
      ${status === 'unavailable' ? 'opacity-60' : ''}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium text-neutral-900 truncate ${compact ? 'text-sm' : 'text-base'}`}>
            {staff.name}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${getRoleColor(staff.role)}
            `}>
              {formatRole(staff.role)}
            </span>
            {status === 'assigned' && schedule && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Assigned
              </span>
            )}
            {status === 'unavailable' && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                Unavailable
              </span>
            )}
          </div>
        </div>
        
        {showRemoveButton && onRemove && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="ml-2 h-6 w-6 p-0 flex items-center justify-center text-neutral-500 hover:text-red-600"
            aria-label={`Remove ${staff.name} from assignment`}
          >
            ×
          </Button>
        )}
      </div>

      {/* Availability/Assignment Info */}
      {showAssignment && (
        <div className="text-xs text-neutral-600">
          <div className="flex items-center justify-between">
            <span>{getAvailabilityText()}</span>
            {schedule && schedule.location && (
              <span className="text-neutral-500">
                {schedule.location.name}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Skills and Certifications (non-compact mode) */}
      {!compact && (
        <div className="space-y-2">
          {staff.skills && staff.skills.length > 0 && (
            <div>
              <span className="text-xs text-neutral-500 block">Skills:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {staff.skills.slice(0, 3).map((skill, index) => (
                  <span key={index} className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
                    {skill}
                  </span>
                ))}
                {staff.skills.length > 3 && (
                  <span className="text-xs text-neutral-500">
                    +{staff.skills.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {staff.certifications && staff.certifications.length > 0 && (
            <div>
              <span className="text-xs text-neutral-500 block">Certifications:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {staff.certifications.slice(0, 2).map((cert, index) => (
                  <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    {cert}
                  </span>
                ))}
                {staff.certifications.length > 2 && (
                  <span className="text-xs text-neutral-500">
                    +{staff.certifications.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assignment Notes */}
      {schedule && schedule.notes && !compact && (
        <div className="text-xs text-neutral-600 bg-neutral-50 p-2 rounded">
          <span className="font-medium">Note:</span> {schedule.notes}
        </div>
      )}

      {/* Drag Handle Indicator */}
      {status === 'available' && (
        <div className="flex items-center justify-center pt-1">
          <div className="w-8 h-1 bg-neutral-300 rounded-full"></div>
        </div>
      )}
    </div>
  );
}