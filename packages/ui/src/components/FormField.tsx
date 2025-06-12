import React from 'react';
import { cn } from '../utils/cn';

interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helper?: string;
  help?: string; // Alias for helper for backward compatibility
  children: React.ReactNode;
  className?: string;
  id?: string; // For linking label to input
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helper,
  help,
  children,
  className,
  id,
}) => {
  // Use help as alias for helper if provided
  const helperText = help || helper;
  
  // Generate unique IDs for accessibility
  const generatedId = React.useId();
  const fieldId = id || generatedId;
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;
  
  // Clone children to add accessibility attributes
  const enhancedChildren = React.cloneElement(children as React.ReactElement, {
    id: fieldId,
    'aria-invalid': error ? 'true' : 'false',
    'aria-describedby': [
      error ? errorId : null,
      helperText ? helperId : null
    ].filter(Boolean).join(' ') || undefined,
    'aria-required': required ? 'true' : undefined,
  } as React.HTMLAttributes<HTMLElement>);
  
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      
      <div>
        {enhancedChildren}
      </div>
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p id={helperId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export { FormField };