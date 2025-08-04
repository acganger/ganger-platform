import React from 'react';
import { cn } from '../utils/cn';
import { InputProps } from '../types';

/**
 * Input component for text entry
 * 
 * @description
 * A flexible input component that supports labels, error states, helper text,
 * and all standard HTML input types. Includes built-in accessibility features
 * with auto-generated IDs for label association.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Input placeholder="Enter your name" />
 * 
 * // With label
 * <Input 
 *   label="Email Address"
 *   type="email"
 *   placeholder="john@example.com"
 * />
 * 
 * // With error state
 * <Input 
 *   label="Password"
 *   type="password"
 *   error="Password must be at least 8 characters"
 * />
 * 
 * // With helper text
 * <Input 
 *   label="Phone Number"
 *   type="tel"
 *   helper="Include country code"
 *   placeholder="+1 (555) 123-4567"
 * />
 * 
 * // Controlled component
 * const [value, setValue] = useState('');
 * <Input 
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 * />
 * ```
 * 
 * @component
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helper, type = 'text', ...props }, ref) => {
    const inputId = React.useId();

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {helper && !error && (
          <p className="text-sm text-gray-500">{helper}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };