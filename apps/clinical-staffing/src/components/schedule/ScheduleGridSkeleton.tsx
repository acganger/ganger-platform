import React from 'react';
import { Skeleton } from '@ganger/ui-catalyst';

interface ScheduleGridSkeletonProps {
  sections?: number;
  itemsPerSection?: number;
}

export function ScheduleGridSkeleton({ 
  sections = 3, 
  itemsPerSection = 4 
}: ScheduleGridSkeletonProps) {
  return (
    <div className="space-y-6">
      {[...Array(sections)].map((_, sectionIndex) => (
        <div key={sectionIndex}>
          {/* Section header skeleton */}
          <Skeleton variant="text" height={20} width={150} className="mb-3" />
          
          {/* Section content */}
          <div className="space-y-3 min-h-[100px] p-3 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
            {[...Array(itemsPerSection)].map((_, itemIndex) => (
              <div key={itemIndex} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Skeleton variant="text" height={24} width="60%" className="mb-2" />
                    <Skeleton variant="text" height={16} width="40%" className="mb-1" />
                    <Skeleton variant="text" height={16} width="30%" />
                  </div>
                  <Skeleton variant="circular" width={40} height={40} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProviderScheduleGridSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Skeleton variant="text" height={24} width={200} className="mb-2" />
              <Skeleton variant="text" height={16} width={150} />
            </div>
            <Skeleton variant="rectangular" height={32} width={100} />
          </div>
          
          {/* Time slots */}
          <div className="grid grid-cols-4 gap-2">
            {[...Array(8)].map((_, slotIndex) => (
              <Skeleton 
                key={slotIndex} 
                variant="rectangular" 
                height={60} 
                className="rounded" 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}