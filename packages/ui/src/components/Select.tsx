import React from 'react';
import { cn } from '../utils/cn';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  helper?: string;
  options: SelectOption[];
  placeholder?: string;
}

/**
 * Select dropdown component
 * 
 * @description
 * A styled select dropdown that supports labels, error states, helper text,
 * and placeholder options. Built with accessibility in mind and includes
 * automatic label association.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * const options = [
 *   { value: 'option1', label: 'Option 1' },
 *   { value: 'option2', label: 'Option 2' },
 *   { value: 'option3', label: 'Option 3', disabled: true }
 * ];
 * 
 * <Select options={options} placeholder="Choose an option" />
 * 
 * // With label and error
 * <Select 
 *   label="Country"
 *   options={countryOptions}
 *   error="Please select a country"
 * />
 * 
 * // With helper text
 * <Select 
 *   label="Department"
 *   options={departmentOptions}
 *   helper="Select your primary department"
 * />
 * 
 * // Controlled component
 * const [selected, setSelected] = useState('');
 * <Select 
 *   value={selected}
 *   onChange={(e) => setSelected(e.target.value)}
 *   options={options}
 * />
 * ```
 * 
 * @component
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helper, options, placeholder, ...props }, ref) => {
    const selectId = React.useId();

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = 'Select';

export { Select };
export type { SelectOption };