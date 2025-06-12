'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = ''
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Specialized virtualized table for compliance matrix
interface VirtualizedMatrixProps {
  employees: any[];
  trainings: any[];
  completions: any[];
  rowHeight?: number;
  headerHeight?: number;
  containerHeight?: number;
  renderRow: (employee: any, index: number) => React.ReactNode;
  renderHeader: () => React.ReactNode;
}

export function VirtualizedMatrix({
  employees,
  trainings,
  completions,
  rowHeight = 48,
  headerHeight = 56,
  containerHeight = 600,
  renderRow,
  renderHeader
}: VirtualizedMatrixProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  }, []);

  // Calculate visible employee range
  const overscan = 3;
  const visibleContentHeight = containerHeight - headerHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(
    employees.length - 1,
    Math.ceil((scrollTop + visibleContentHeight) / rowHeight) + overscan
  );

  const visibleEmployees = employees.slice(startIndex, endIndex + 1);
  const totalHeight = employees.length * rowHeight;
  const offsetY = startIndex * rowHeight;

  return (
    <div className="virtualized-matrix border rounded-lg overflow-hidden">
      {/* Fixed Header */}
      <div 
        className="sticky top-0 z-10 bg-white border-b"
        style={{ 
          height: headerHeight,
          marginLeft: -scrollLeft 
        }}
      >
        {renderHeader()}
      </div>

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        className="overflow-auto"
        style={{ height: visibleContentHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            {visibleEmployees.map((employee, index) => (
              <div key={startIndex + index} style={{ height: rowHeight }}>
                {renderRow(employee, startIndex + index)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}