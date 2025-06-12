'use client'

import React, { memo, useMemo } from 'react';
import { cn } from '@ganger/ui';
import { CheckCircle2, AlertTriangle, Clock, Circle, Minus, AlertCircle } from 'lucide-react';

export type ComplianceStatus = 'completed' | 'overdue' | 'due_soon' | 'not_started' | 'not_required';

interface ComplianceStatusBadgeProps {
  status: ComplianceStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  'aria-label'?: string;
  'data-testid'?: string;
  daysUntilDue?: number;
}

interface StatusConfig {
  Icon: React.ComponentType<{ className?: string }>;
  text: string;
  className: string;
  ariaLabel: string;
  priority: number;
}

const statusConfig: Record<ComplianceStatus, StatusConfig> = {
  completed: {
    Icon: CheckCircle2,
    text: 'Completed',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20',
    ariaLabel: 'Training completed',
    priority: 1
  },
  overdue: {
    Icon: AlertTriangle,
    text: 'Overdue',
    className: 'bg-red-50 text-red-700 border-red-200 ring-red-600/20',
    ariaLabel: 'Training overdue - immediate attention required',
    priority: 4
  },
  due_soon: {
    Icon: Clock,
    text: 'Due Soon',
    className: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20',
    ariaLabel: 'Training due soon',
    priority: 3
  },
  not_started: {
    Icon: Circle,
    text: 'Not Started',
    className: 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-600/20',
    ariaLabel: 'Training not started',
    priority: 2
  },
  not_required: {
    Icon: Minus,
    text: 'Not Required',
    className: 'bg-gray-25 text-gray-400 border-gray-100 ring-gray-600/10',
    ariaLabel: 'Training not required for this role',
    priority: 0
  }
};

const sizeClasses = {
  xs: 'px-1.5 py-0.5 text-xs gap-1',
  sm: 'px-2 py-1 text-xs gap-1',
  md: 'px-3 py-1.5 text-sm gap-1.5',
  lg: 'px-4 py-2 text-base gap-2'
};

const iconSizes = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
};

/**
 * ComplianceStatusBadge - Enterprise-grade status indicator with full accessibility
 * 
 * Features:
 * - Full keyboard navigation support
 * - Screen reader optimization
 * - Interactive states with proper focus management
 * - Consistent visual hierarchy
 * - Performance optimized with memo
 */
export const ComplianceStatusBadge = memo<ComplianceStatusBadgeProps>(function ComplianceStatusBadge({
  status,
  size = 'sm',
  showIcon = true,
  showText = true,
  className,
  onClick,
  disabled = false,
  'aria-label': ariaLabel,
  'data-testid': testId,
  daysUntilDue
}) {
  // Validate status prop
  const config = useMemo(() => {
    if (!statusConfig[status]) {
      return statusConfig.not_started;
    }
    return statusConfig[status];
  }, [status]);

  // Enhanced aria-label with dynamic content
  const computedAriaLabel = useMemo(() => {
    if (ariaLabel) return ariaLabel;
    
    let label = config.ariaLabel;
    if (daysUntilDue !== undefined && status === 'due_soon') {
      label += ` - ${daysUntilDue} days remaining`;
    }
    if (daysUntilDue !== undefined && status === 'overdue') {
      label += ` - ${Math.abs(daysUntilDue)} days overdue`;
    }
    return label;
  }, [ariaLabel, config.ariaLabel, daysUntilDue, status]);

  const isClickable = !disabled && onClick;
  const Element = isClickable ? 'button' : 'span';

  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium border rounded-full transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    config.className,
    sizeClasses[size],
    {
      'cursor-pointer hover:shadow-sm hover:scale-105 active:scale-95': isClickable,
      'cursor-not-allowed opacity-60': disabled,
      'focus:ring-2': isClickable,
    },
    className
  );

  return (
    <Element
      className={baseClasses}
      onClick={isClickable ? onClick : undefined}
      disabled={disabled}
      aria-label={computedAriaLabel}
      role={isClickable ? 'button' : 'status'}
      aria-live={status === 'overdue' ? 'assertive' : 'polite'}
      data-testid={testId || `status-badge-${status}`}
      data-status={status}
      data-priority={config.priority}
      tabIndex={isClickable ? 0 : -1}
      type={isClickable ? 'button' : undefined}
    >
      {showIcon && (
        <config.Icon 
          className={cn(
            iconSizes[size],
            'flex-shrink-0',
            showText && 'mr-1'
          )}
          aria-hidden="true"
        />
      )}
      
      {showText && (
        <span className="font-medium leading-none">
          {config.text}
        </span>
      )}
      
      {/* Visual indicator for due soon/overdue with days */}
      {daysUntilDue !== undefined && (status === 'due_soon' || status === 'overdue') && (
        <span 
          className={cn(
            'ml-1 px-1 py-0.5 text-xs font-bold rounded',
            status === 'overdue' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
          )}
          aria-label={status === 'overdue' ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days remaining`}
        >
          {Math.abs(daysUntilDue)}
        </span>
      )}

      {/* Screen reader only status description */}
      <span className="sr-only">
        {status === 'overdue' && 'This training requires immediate attention.'}
        {status === 'due_soon' && 'This training is approaching its deadline.'}
        {status === 'completed' && 'This training has been successfully completed.'}
      </span>
    </Element>
  );
});

ComplianceStatusBadge.displayName = 'ComplianceStatusBadge';

// Export utility functions for external use
export const getStatusPriority = (status: ComplianceStatus): number => {
  return statusConfig[status]?.priority ?? 0;
};

export const sortByStatusPriority = (statuses: ComplianceStatus[]): ComplianceStatus[] => {
  return statuses.sort((a, b) => getStatusPriority(b) - getStatusPriority(a));
};

export const isHighPriorityStatus = (status: ComplianceStatus): boolean => {
  return getStatusPriority(status) >= 3;
};