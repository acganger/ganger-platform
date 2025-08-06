import React from 'react';

interface TrendData {
  value: number;
  direction: 'up' | 'down';
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  trend?: TrendData;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantClasses = {
  default: 'bg-white border-gray-200',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  danger: 'bg-red-50 border-red-200',
};

const iconClasses = {
  default: 'text-gray-400',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  danger: 'text-red-500',
};

export function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  variant = 'default',
  className = '' 
}: StatCardProps) {
  return (
    <div className={`
      rounded-lg border p-6 
      ${variantClasses[variant]} 
      ${className}
    `}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">
            {title}
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {value}
          </p>
        </div>
        
        {icon && (
          <div className={`text-2xl ${iconClasses[variant]}`}>
            {/* Icon placeholder - would use actual icon library */}
            <div className="w-8 h-8 rounded-full bg-current opacity-20" />
          </div>
        )}
      </div>
      
      {trend && (
        <div className="mt-2 flex items-center text-sm">
          <span className={`flex items-center ${
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.direction === 'up' ? '↗' : '↘'}
            {trend.value}%
          </span>
          <span className="ml-1 text-gray-500">
            from last month
          </span>
        </div>
      )}
    </div>
  );
}