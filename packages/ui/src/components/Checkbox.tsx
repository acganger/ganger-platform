import React from 'react';
import { cn } from '../utils/cn';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

/**
 * Checkbox component for boolean selections
 * 
 * @description
 * A styled checkbox component that supports labels, descriptions, and error states.
 * Properly associates labels with inputs for accessibility and includes
 * focus styles for keyboard navigation.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Checkbox />
 * 
 * // With label
 * <Checkbox label="I agree to the terms and conditions" />
 * 
 * // With label and description
 * <Checkbox 
 *   label="Subscribe to newsletter"
 *   description="Get weekly updates about new features"
 * />
 * 
 * // With error state
 * <Checkbox 
 *   label="Accept privacy policy"
 *   error="You must accept the privacy policy"
 * />
 * 
 * // Controlled component
 * const [checked, setChecked] = useState(false);
 * <Checkbox 
 *   checked={checked}
 *   onChange={(e) => setChecked(e.target.checked)}
 *   label="Enable notifications"
 * />
 * ```
 * 
 * @component
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;

    return (
      <div className="space-y-2">
        <div className="flex items-start space-x-3">
          <div className="flex items-center h-5">
            <input
              id={checkboxId}
              type="checkbox"
              className={cn(
                'h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0',
                error && 'border-red-500',
                className
              )}
              ref={ref}
              {...props}
            />
          </div>
          {(label || description) && (
            <div className="text-sm">
              {label && (
                <label
                  htmlFor={checkboxId}
                  className={cn(
                    'font-medium text-gray-700 cursor-pointer',
                    error && 'text-red-700'
                  )}
                >
                  {label}
                </label>
              )}
              {description && (
                <p className={cn(
                  'text-gray-500',
                  label && 'mt-1'
                )}>
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 ml-7">{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };