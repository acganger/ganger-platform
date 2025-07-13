/**
 * Time Slot Grid Component
 * Professional time slot selection grid for pharmaceutical scheduling
 */

import React from 'react';
import { Clock, Users, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@ganger/ui';
import type { TimeSlot } from '@/types';

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  showDuration?: boolean;
  className?: string;
}

const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  slots,
  selectedSlot,
  onSlotSelect,
  showDuration = true,
  className
}) => {
  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Group slots by time for better organization
  const groupedSlots = slots.reduce((groups, slot) => {
    const timeKey = `${slot.startTime}-${slot.endTime}`;
    if (!groups[timeKey]) {
      groups[timeKey] = [];
    }
    groups[timeKey].push(slot);
    return groups;
  }, {} as Record<string, TimeSlot[]>);

  // Sort time groups
  const sortedTimeGroups = Object.entries(groupedSlots).sort(([a], [b]) => {
    const [aStart] = a.split('-');
    const [bStart] = b.split('-');
    return aStart.localeCompare(bStart);
  });

  if (slots.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">No time slots available</p>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Time slots grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {sortedTimeGroups.map(([timeKey, timeSlots]) => {
          // Use the first slot as representative (they should all have same time)
          const representativeSlot = timeSlots[0];
          const isSelected = selectedSlot?.id === representativeSlot.id;
          const isAvailable = representativeSlot.available;

          return (
            <Button
              key={timeKey}
              onClick={() => isAvailable && onSlotSelect(representativeSlot)}
              disabled={!isAvailable}
              variant={isSelected ? "primary" : "outline"}
              className={clsx(
                'h-auto min-h-[80px] p-4',
                'flex flex-col items-center justify-center space-y-2',
                {
                  'border-primary': isSelected,
                  'opacity-50 cursor-not-allowed': !isAvailable
                }
              )}
            >
              {/* Time Display */}
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span className="font-semibold text-sm">
                  {formatTime(representativeSlot.startTime)}
                </span>
              </div>

              {/* Duration */}
              {showDuration && (
                <div className="text-xs opacity-75">
                  {formatDuration(representativeSlot.duration)} session
                </div>
              )}

              {/* Availability indicator */}
              {isAvailable && representativeSlot.optimizationScore && (
                <div className="text-xs opacity-75">
                  Score: {representativeSlot.optimizationScore}/100
                </div>
              )}

              {/* Conflict reason */}
              {!isAvailable && representativeSlot.conflictReason && (
                <div className="flex items-center space-x-1 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <span className="truncate max-w-[80px]">
                    {representativeSlot.conflictReason}
                  </span>
                </div>
              )}
            </Button>
          );
        })}
      </div>

      {/* Selected slot details */}
      {selectedSlot && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            Selected Time Slot
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Time:</span>
              <div className="text-blue-800">
                {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
              </div>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Duration:</span>
              <div className="text-blue-800">
                {formatDuration(selectedSlot.duration)}
              </div>
            </div>
          </div>
          
          {selectedSlot.optimizationScore && (
            <div className="mt-2 text-sm">
              <span className="text-blue-700 font-medium">Optimization Score:</span>
              <div className="text-blue-800">
                {selectedSlot.optimizationScore}/100 - 
                {selectedSlot.optimizationScore >= 80 ? ' Excellent time' :
                 selectedSlot.optimizationScore >= 60 ? ' Good time' :
                 selectedSlot.optimizationScore >= 40 ? ' Fair time' : ' Limited availability'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600 pt-4 border-t">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-600 rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotGrid;