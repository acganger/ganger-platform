import React from 'react';
import { cn } from '../utils/cn';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const switchSizes = {
  sm: {
    switch: 'w-9 h-5',
    thumb: 'w-4 h-4',
    translate: 'translate-x-4'
  },
  md: {
    switch: 'w-11 h-6',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5'
  },
  lg: {
    switch: 'w-14 h-7',
    thumb: 'w-6 h-6',
    translate: 'translate-x-7'
  }
};

export function Switch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  className,
  id,
  ...ariaProps
}: SwitchProps) {
  const sizeConfig = switchSizes[size];

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      id={id}
      className={cn(
        'relative inline-flex items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        sizeConfig.switch,
        checked
          ? 'bg-blue-600'
          : 'bg-gray-200',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer',
        className
      )}
      {...ariaProps}
    >
      <span
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ease-in-out',
          sizeConfig.thumb,
          checked ? sizeConfig.translate : 'translate-x-0'
        )}
      />
    </button>
  );
}