import React from 'react';
import { formatTime } from '@ganger/utils';
import { useDragAndDrop, DragItem } from '@/hooks/useDragAndDrop';
import { announceToScreenReader } from '@/utils/accessibility';

export interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number; // in hours
  role: 'medical_assistant' | 'nurse' | 'technician' | 'administrative';
  color: string;
  description?: string;
}

// Predefined shift templates
export const defaultShiftTemplates: ShiftTemplate[] = [
  {
    id: 'morning-ma',
    name: 'Morning MA',
    startTime: '07:00',
    endTime: '15:00',
    duration: 8,
    role: 'medical_assistant',
    color: 'bg-blue-100 border-blue-300 text-blue-900',
    description: 'Medical Assistant morning shift'
  },
  {
    id: 'afternoon-ma',
    name: 'Afternoon MA',
    startTime: '11:00',
    endTime: '19:00',
    duration: 8,
    role: 'medical_assistant',
    color: 'bg-blue-100 border-blue-300 text-blue-900',
    description: 'Medical Assistant afternoon shift'
  },
  {
    id: 'full-day-nurse',
    name: 'Full Day Nurse',
    startTime: '08:00',
    endTime: '17:00',
    duration: 9,
    role: 'nurse',
    color: 'bg-green-100 border-green-300 text-green-900',
    description: 'Nurse full day shift'
  },
  {
    id: 'morning-tech',
    name: 'Morning Tech',
    startTime: '07:30',
    endTime: '15:30',
    duration: 8,
    role: 'technician',
    color: 'bg-purple-100 border-purple-300 text-purple-900',
    description: 'Technician morning shift'
  },
  {
    id: 'admin-full',
    name: 'Admin Full Day',
    startTime: '08:00',
    endTime: '17:00',
    duration: 9,
    role: 'administrative',
    color: 'bg-orange-100 border-orange-300 text-orange-900',
    description: 'Administrative full day'
  },
  {
    id: 'half-day-am',
    name: 'Half Day AM',
    startTime: '08:00',
    endTime: '12:00',
    duration: 4,
    role: 'medical_assistant',
    color: 'bg-indigo-100 border-indigo-300 text-indigo-900',
    description: 'Half day morning shift'
  },
  {
    id: 'half-day-pm',
    name: 'Half Day PM',
    startTime: '13:00',
    endTime: '17:00',
    duration: 4,
    role: 'medical_assistant',
    color: 'bg-indigo-100 border-indigo-300 text-indigo-900',
    description: 'Half day afternoon shift'
  }
];

interface ShiftTemplatesProps {
  onShiftDragStart?: (template: ShiftTemplate) => void;
  onShiftDragEnd?: () => void;
  customTemplates?: ShiftTemplate[];
}

export function ShiftTemplates({ 
  onShiftDragStart, 
  onShiftDragEnd,
  customTemplates = []
}: ShiftTemplatesProps) {
  const { onDragStart, onDragEnd, isDragging, dragItem } = useDragAndDrop();
  
  const allTemplates = [...defaultShiftTemplates, ...customTemplates];

  const handleTemplateDragStart = (e: React.DragEvent, template: ShiftTemplate) => {
    const dragItemData: DragItem = {
      id: template.id,
      type: 'shift-template',
      data: template
    };
    
    onDragStart(e, dragItemData);
    onShiftDragStart?.(template);
    announceToScreenReader(`Started dragging ${template.name} shift template`);
  };

  const handleTemplateDragEnd = (e: React.DragEvent) => {
    onDragEnd(e);
    onShiftDragEnd?.();
    announceToScreenReader('Finished dragging shift template');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
      <h3 className="text-lg font-medium text-neutral-900 mb-4">
        Shift Templates
      </h3>
      
      <div className="text-sm text-neutral-600 mb-4">
        Drag shift templates to assign staff to time slots
      </div>

      <div className="grid grid-cols-1 gap-3">
        {allTemplates.map((template) => (
          <div
            key={template.id}
            className={`
              shift-template cursor-grab rounded-lg border-2 p-3 transition-all
              ${template.color}
              ${isDragging && dragItem?.id === template.id ? 'opacity-50' : ''}
              hover:shadow-md hover:scale-105
            `}
            draggable
            onDragStart={(e) => handleTemplateDragStart(e, template)}
            onDragEnd={handleTemplateDragEnd}
            role="button"
            aria-label={`${template.name} shift template, ${formatTime(template.startTime)} to ${formatTime(template.endTime)}, ${template.duration} hours`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                announceToScreenReader(`Selected ${template.name} shift template. Use arrow keys to navigate and space to drop.`);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {template.name}
                </div>
                <div className="text-xs mt-1 opacity-80">
                  {formatTime(template.startTime)} - {formatTime(template.endTime)}
                </div>
                {template.description && (
                  <div className="text-xs mt-1 opacity-70">
                    {template.description}
                  </div>
                )}
              </div>
              <div className="ml-3 text-right">
                <div className="text-sm font-medium">
                  {template.duration}h
                </div>
                <div className="text-xs opacity-70 capitalize">
                  {template.role.replace('_', ' ')}
                </div>
              </div>
            </div>
            
            {/* Visual drag indicator */}
            <div className="flex items-center justify-center mt-2 opacity-50">
              <svg className="w-6 h-1" fill="currentColor">
                <rect width="6" height="1" rx="0.5" />
                <rect y="3" width="6" height="1" rx="0.5" />
                <rect y="6" width="6" height="1" rx="0.5" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
        <h4 className="text-sm font-medium text-neutral-700 mb-2">
          Quick Tips:
        </h4>
        <ul className="text-xs text-neutral-600 space-y-1">
          <li>• Drag templates to provider schedules</li>
          <li>• Templates auto-match staff by role</li>
          <li>• System checks for 40h/week limits</li>
          <li>• Conflicts require manager approval</li>
        </ul>
      </div>
    </div>
  );
}