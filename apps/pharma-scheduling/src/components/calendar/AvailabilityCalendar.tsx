/**
 * Availability Calendar Component
 * Professional calendar interface for pharmaceutical scheduling
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
// import { format, startOfWeek, addDays, isSameDay, isToday, parseISO } from 'date-fns';
// import { Button } from '@ganger/ui'; // Temporarily disabled due to React type conflicts
import TimeSlotGrid from './TimeSlotGrid';
import { clsx } from 'clsx';
import type { TimeSlot, CalendarWeek } from '@/types';

interface AvailabilityCalendarProps {
  availability: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  loading?: boolean;
  className?: string;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  availability,
  selectedSlot,
  onSlotSelect,
  loading = false,
  className
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    return monday;
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group availability by date and organize into weeks
  const { weeks, availabilityByDate } = useMemo(() => {
    const byDate = new Map<string, TimeSlot[]>();
    
    availability.forEach(slot => {
      const dateKey = slot.date;
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, []);
      }
      byDate.get(dateKey)!.push(slot);
    });

    // Generate weeks with availability data
    const weeksData: CalendarWeek[] = [];
    let weekStart = new Date(currentWeekStart);
    
    // Generate 8 weeks of calendar data
    for (let week = 0; week < 8; week++) {
      const days = [];
      
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(weekStart.getDate() + day);
        const dateKey = currentDate.toISOString().split('T')[0] || '';
        const daySlots = byDate.get(dateKey) || [];
        
        const today = new Date();
        const isToday = currentDate.toDateString() === today.toDateString();
        
        days.push({
          date: dateKey,
          dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
          isToday,
          isAvailable: daySlots.some(slot => slot.available),
          slots: daySlots,
          totalSlots: daySlots.length,
          availableSlots: daySlots.filter(slot => slot.available).length
        });
      }
      
      weeksData.push({
        weekOf: weekStart.toISOString().split('T')[0],
        days
      });
      
      weekStart = new Date(weekStart);
      weekStart.setDate(weekStart.getDate() + 7);
    }

    return {
      weeks: weeksData,
      availabilityByDate: byDate
    };
  }, [availability, currentWeekStart]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newWeekStart);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date === selectedDate ? null : date);
  };

  const selectedDateSlots = selectedDate ? availabilityByDate.get(selectedDate) || [] : [];

  if (loading) {
    return (
      <div className={clsx("bg-white shadow-sm rounded-lg border border-gray-200 p-6", className)}>
        <div className="flex flex-col space-y-1.5 pb-4 mb-4">
          <h3 className="text-xl font-semibold leading-none tracking-tight text-gray-900">Available Time Slots</h3>
        </div>
        <div className="pt-0">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("bg-white shadow-sm rounded-lg border border-gray-200 p-6", className)}>
      <div className="flex flex-col space-y-1.5 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold leading-none tracking-tight text-gray-900 flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5" />
            <span>Available Time Slots</span>
          </h3>
          
          <div className="flex items-center space-x-2">
            <button
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            <button
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onClick={() => navigateWeek('next')}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="pt-0">
        <div className="space-y-6">
          {/* Calendar Grid */}
          <div className="space-y-4">
            {weeks.slice(0, 4).map((week) => (
              <div key={week.weekOf}>
                {/* Week Header */}
                <div className="text-sm font-medium text-gray-500 mb-2">
                  Week of {new Date(week.weekOf).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                
                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {week.days.map((day) => (
                    <button
                      key={day.date}
                      onClick={() => handleDateSelect(day.date)}
                      disabled={!day.isAvailable}
                      className={clsx(
                        'p-3 rounded-lg text-center transition-all border-2',
                        'min-h-[60px] flex flex-col justify-center space-y-1',
                        {
                          // Available dates
                          'bg-green-50 border-green-200 text-green-800 hover:bg-green-100 hover:border-green-300 cursor-pointer':
                            day.isAvailable && !day.isToday && selectedDate !== day.date,
                          
                          // Today
                          'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100':
                            day.isToday && day.isAvailable && selectedDate !== day.date,
                          
                          // Selected date
                          'bg-blue-600 border-blue-600 text-white':
                            selectedDate === day.date,
                          
                          // Unavailable dates
                          'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed':
                            !day.isAvailable
                        }
                      )}
                    >
                      <div className="text-xs font-medium">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-lg font-bold">
                        {new Date(day.date).getDate()}
                      </div>
                      {day.isAvailable && (
                        <div className="text-xs">
                          {day.availableSlots} slot{day.availableSlots !== 1 ? 's' : ''}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots for Selected Date */}
          {selectedDate && selectedDateSlots.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Available Times for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              
              <TimeSlotGrid
                slots={selectedDateSlots}
                selectedSlot={selectedSlot}
                onSlotSelect={onSlotSelect}
              />
            </div>
          )}

          {/* No slots selected message */}
          {!selectedDate && (
            <div className="text-center py-8 border-t">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a Date
              </h3>
              <p className="text-gray-600">
                Click on an available date above to view time slots
              </p>
            </div>
          )}

          {/* No slots available message */}
          {selectedDate && selectedDateSlots.length === 0 && (
            <div className="text-center py-8 border-t">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Time Slots Available
              </h3>
              <p className="text-gray-600">
                Please select a different date or contact us for assistance
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;