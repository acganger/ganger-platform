import React from 'react';
import { cn } from '../utils/cn';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  initials?: string;
  className?: string;
}

const avatarSizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl'
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

const getAvatarColors = (name: string): string => {
  const colors = [
    'bg-red-500 text-white',
    'bg-blue-500 text-white',
    'bg-green-500 text-white',
    'bg-purple-500 text-white',
    'bg-yellow-500 text-black',
    'bg-pink-500 text-white',
    'bg-indigo-500 text-white',
    'bg-gray-500 text-white',
  ];
  
  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

export function Avatar({ 
  src, 
  alt = '', 
  size = 'md', 
  initials,
  className,
  ...props 
}: AvatarProps) {
  const displayInitials = initials || (alt ? getInitials(alt) : '?');
  const colorClass = alt ? getAvatarColors(alt) : 'bg-gray-500 text-white';

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full overflow-hidden',
        avatarSizes[size],
        !src && colorClass,
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.textContent = displayInitials;
              parent.className = cn(parent.className, colorClass);
            }
          }}
        />
      ) : (
        <span className="font-medium leading-none">{displayInitials}</span>
      )}
    </div>
  );
}