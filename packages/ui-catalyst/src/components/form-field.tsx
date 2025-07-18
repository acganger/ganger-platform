import React, { forwardRef } from 'react'
import { clsx } from '../utils/clsx'

// FormField styles
const formFieldStyles = {
  container: [
    'space-y-2',
  ],
  label: [
    'block text-sm font-medium',
    'text-zinc-950 dark:text-white',
  ],
  required: [
    'text-red-500 dark:text-red-400',
    'ml-1',
  ],
  error: [
    'text-sm text-red-600 dark:text-red-400',
    'mt-1',
  ],
  helper: [
    'text-sm text-zinc-600 dark:text-zinc-400',
    'mt-1',
  ],
  fieldWrapper: [
    'relative',
  ],
}

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Field label */
  label?: string
  /** Whether the field is required */
  required?: boolean
  /** Error message to display */
  error?: string
  /** Helper text to display */
  helper?: string
  /** Alias for helper (backward compatibility) */
  help?: string
  /** Form field content (input, select, etc.) */
  children: React.ReactNode
  /** Additional CSS classes */
  className?: string
  /** ID for the field (will be applied to child input) */
  id?: string
  /** Whether to show visual error state */
  invalid?: boolean
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  function FormField({
    label,
    required = false,
    error,
    helper,
    help,
    children,
    className,
    id,
    invalid,
    ...props
  }, ref) {
    // Use help as alias for helper if provided
    const helperText = help || helper
    const isInvalid = invalid || !!error
    
    // Generate unique IDs for accessibility
    const generatedId = React.useId()
    const fieldId = id || generatedId
    const errorId = `${fieldId}-error`
    const helperId = `${fieldId}-helper`
    
    // Clone children to add accessibility attributes
    const enhancedChildren = React.isValidElement(children)
      ? React.cloneElement(children, {
          id: fieldId,
          'aria-invalid': isInvalid ? 'true' : 'false',
          'aria-describedby': [
            error ? errorId : null,
            helperText ? helperId : null
          ].filter(Boolean).join(' ') || undefined,
          'aria-required': required ? 'true' : undefined,
          invalid: isInvalid,
        } as any)
      : children
    
    return (
      <div
        ref={ref}
        className={clsx(formFieldStyles.container, className)}
        {...props}
      >
        {label && (
          <label
            htmlFor={fieldId}
            className={clsx(formFieldStyles.label)}
          >
            {label}
            {required && (
              <span
                className={clsx(formFieldStyles.required)}
                aria-label="required"
              >
                *
              </span>
            )}
          </label>
        )}
        
        <div className={clsx(formFieldStyles.fieldWrapper)}>
          {enhancedChildren}
        </div>
        
        {error && (
          <p
            id={errorId}
            className={clsx(formFieldStyles.error)}
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p
            id={helperId}
            className={clsx(formFieldStyles.helper)}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

// Legacy API compatibility
export interface FormFieldLegacyProps {
  label?: string
  required?: boolean
  error?: string
  helper?: string
  help?: string
  children: React.ReactNode
  className?: string
  id?: string
}

export const FormFieldLegacy = forwardRef<HTMLDivElement, FormFieldLegacyProps>(
  function FormFieldLegacy(props, ref) {
    return <FormField ref={ref} {...props} />
  }
)