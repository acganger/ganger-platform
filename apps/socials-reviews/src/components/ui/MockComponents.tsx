'use client'

import React, { ReactNode, ButtonHTMLAttributes, forwardRef } from 'react';
import Image from 'next/image';

// Mock UI components to ensure TypeScript compliance
// These will be replaced with actual @ganger/ui components in production

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'danger' | 'default';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700',
      secondary: 'bg-secondary-600 text-white hover:bg-secondary-700',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
      ghost: 'hover:bg-gray-100 text-gray-700',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      default: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    };
    
    const sizeClasses = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4',
      lg: 'h-12 px-6 text-lg',
    };
    
    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card = ({ children, className = '', onClick }: CardProps) => {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component 
      className={`rounded-lg border bg-white shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </Component>
  );
};

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'blue' | 'green' | 'yellow' | 'gray' | 'red' | 'purple' | 'sky' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const Badge = ({ children, variant = 'primary', size = 'md', className = '', onClick }: BadgeProps) => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium';
  
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    destructive: 'bg-red-100 text-red-800',
    outline: 'border border-gray-300 bg-white text-gray-700',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
    sky: 'bg-sky-100 text-sky-800',
    orange: 'bg-orange-100 text-orange-800',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };
  
  const Component = onClick ? 'button' : 'span';
  
  return (
    <Component 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </Component>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 ${className}`}
      {...props}
    />
  )
);

Input.displayName = 'Input';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={`flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 ${className}`}
      {...props}
    />
  )
);

TextArea.displayName = 'TextArea';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  placeholder?: string;
}

export const Select = ({ value, onChange, options, className = '', placeholder }: SelectProps) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 ${className}`}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const Checkbox = ({ label, checked, onChange, className = '' }: CheckboxProps) => (
  <label className={`flex items-center space-x-2 cursor-pointer ${className}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
    />
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner = ({ size = 'md', className = '' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };
  
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${sizeClasses[size]} ${className}`} />
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  className?: string;
}

export const Modal = ({ isOpen, onClose, title, size = 'md', children, className = '' }: ModalProps) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`bg-white rounded-lg shadow-lg p-6 m-4 w-full ${sizeClasses[size]} ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

interface AlertProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'blue' | 'green' | 'red' | 'purple' | 'gray' | 'yellow';
  className?: string;
}

export const Alert = ({ children, variant = 'primary', className = '' }: AlertProps) => {
  const variantClasses = {
    primary: 'bg-blue-50 border-blue-200 text-blue-800',
    secondary: 'bg-gray-50 border-gray-200 text-gray-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    destructive: 'bg-red-50 border-red-200 text-red-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  return (
    <div className={`rounded-lg border p-4 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

// Additional components needed
export const StatCard = ({ title, value, description, icon: Icon }: {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      {Icon && <Icon className="h-8 w-8 text-gray-400" />}
    </div>
  </Card>
);

export const PageHeader = ({ title, subtitle, actions }: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
    </div>
    {actions && <div>{actions}</div>}
  </div>
);

export const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  </div>
);

// Tab components
interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

export const Tabs = ({ value, onValueChange, children }: TabsProps) => (
  <div data-value={value} data-onchange={onValueChange}>
    {children}
  </div>
);

interface TabsListProps {
  children: ReactNode;
  className?: string;
  role?: string;
}

export const TabsList = ({ children, className = '', role }: TabsListProps) => (
  <div className={`flex space-x-1 bg-gray-100 p-1 rounded-lg ${className}`} role={role}>
    {children}
  </div>
);

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  role?: string;
  'aria-controls'?: string;
  'aria-label'?: string;
}

export const TabsTrigger = ({ children, className = '', ...props }: TabsTriggerProps) => {
  // This would be connected to parent Tabs context in real implementation
  return (
    <button
      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-white hover:shadow-sm ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
  role?: string;
  id?: string;
  'aria-labelledby'?: string;
}

export const TabsContent = ({ children, className = '', ...props }: TabsContentProps) => (
  <div className={`mt-4 ${className}`} {...props}>
    {children}
  </div>
);

// Additional utility components
interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar = ({ src, alt, fallback, size = 'md', className = '' }: AvatarProps) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ${className}`}>
      {src ? (
        <Image src={src} alt={alt || ''} className="h-full w-full object-cover" width={48} height={48} />
      ) : (
        <span className="text-sm font-medium text-gray-600">{fallback}</span>
      )}
    </div>
  );
};

export const Pagination = ({ currentPage, totalPages, onPageChange, showPageNumbers, className = '' }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  className?: string;
}) => (
  <div className={`flex items-center justify-center space-x-2 ${className}`}>
    <Button
      variant="outline"
      size="sm"
      disabled={currentPage <= 1}
      onClick={() => onPageChange(currentPage - 1)}
    >
      Previous
    </Button>
    
    {showPageNumbers && (
      <span className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </span>
    )}
    
    <Button
      variant="outline"
      size="sm"
      disabled={currentPage >= totalPages}
      onClick={() => onPageChange(currentPage + 1)}
    >
      Next
    </Button>
  </div>
);

export const DatePicker = ({ value, onChange, placeholder, ...props }: {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  min?: string;
}) => (
  <Input
    type="date"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    {...props}
  />
);

export const Slider = ({ min, max, step, value: sliderValue, onValueChange, className = '' }: {
  min: number;
  max: number;
  step: number;
  value: number[];
  onValueChange: (value: number[]) => void;
  className?: string;
}) => (
  <input
    type="range"
    min={min}
    max={max}
    step={step}
    value={sliderValue[0]}
    onChange={(e) => onValueChange([parseFloat(e.target.value)])}
    className={`w-full ${className}`}
  />
);

// Dropdown and Tooltip components (simplified)
export const DropdownMenu = ({ trigger, items, content }: {
  trigger: ReactNode;
  items?: Array<{ label: string; icon?: React.ComponentType<{ className?: string }>; onClick: () => void; disabled?: boolean }>;
  content?: ReactNode;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50">
          {content || (
            <div className="py-1">
              {items?.map((item, index) => (
                <button
                  key={index}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 disabled:opacity-50"
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  disabled={item.disabled}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const Tooltip = ({ content, children }: { content: string; children: ReactNode }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-50">
          {content}
        </div>
      )}
    </div>
  );
};