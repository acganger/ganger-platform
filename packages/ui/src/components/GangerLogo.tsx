import React from 'react';
import Image from 'next/image';

interface GangerLogoProps {
  /** Logo size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show just the icon or full logo */
  variant?: 'icon' | 'full';
  /** Custom className */
  className?: string;
  /** Whether logo should be clickable */
  href?: string;
}

const sizeClasses = {
  sm: 'h-8',
  md: 'h-10', 
  lg: 'h-12',
  xl: 'h-16'
};

export function GangerLogo({ 
  size = 'md', 
  variant = 'full',
  className = '',
  href
}: GangerLogoProps) {
  const logoElement = (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/gd-logo.png"
        alt="Ganger Dermatology"
        width={variant === 'icon' ? 40 : 200}
        height={40}
        className={`${sizeClasses[size]} w-auto object-contain`}
        priority
      />
    </div>
  );

  if (href) {
    return (
      <a href={href} className="transition-opacity hover:opacity-80">
        {logoElement}
      </a>
    );
  }

  return logoElement;
}

/**
 * Professional header component with Ganger Dermatology branding
 */
interface GangerHeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export function GangerHeader({ 
  title, 
  subtitle,
  className = ''
}: GangerHeaderProps) {
  return (
    <header className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <GangerLogo href="/" size="lg" />
            {title && (
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-500 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Compact logo for sidebars and small spaces
 */
export function GangerLogoCompact({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <GangerLogo variant="icon" size="sm" />
      <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
        Ganger Dermatology
      </span>
    </div>
  );
}