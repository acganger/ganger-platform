import React, { forwardRef } from 'react'
import { clsx } from '../utils/clsx'

const styles = {
  base: [
    // Basic layout
    'relative block w-full appearance-none rounded-lg',
    // Sizing
    'px-[calc(0.875rem-1px)] py-[calc(0.625rem-1px)] sm:px-[calc(0.75rem-1px)] sm:py-[calc(0.375rem-1px)]',
    // Typography
    'text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white',
    // Border
    'border border-zinc-950/10 hover:border-zinc-950/20 dark:border-white/10 dark:hover:border-white/20',
    // Background
    'bg-transparent dark:bg-white/5',
    // Focus
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-blue-500',
    // Invalid state
    'data-[invalid]:border-red-500 data-[invalid]:hover:border-red-500 dark:data-[invalid]:border-red-500',
    // Disabled state  
    'disabled:border-zinc-950/20 disabled:bg-zinc-950/5 disabled:text-zinc-950/50 disabled:cursor-not-allowed',
    'dark:disabled:border-white/15 dark:disabled:bg-white/2.5 dark:disabled:text-white/50',
  ],
  wrapper: [
    // Background color + shadow applied to wrapper
    'relative block w-full',
    'before:absolute before:inset-px before:rounded-[calc(0.5rem-1px)] before:bg-white before:shadow-sm',
    'dark:before:hidden',
    // Focus ring on wrapper
    'after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-transparent after:ring-inset',
    'focus-within:after:ring-2 focus-within:after:ring-blue-500',
    // Disabled state for wrapper
    'has-[:disabled]:opacity-50 has-[:disabled]:before:bg-zinc-950/5 has-[:disabled]:before:shadow-none',
    // Invalid state for wrapper
    'has-[data-[invalid]]:before:shadow-red-500/10',
  ]
}

const dateTypes = ['date', 'datetime-local', 'month', 'time', 'week']

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input type */
  type?: 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url' | 'date' | 'datetime-local' | 'month' | 'time' | 'week'
  /** Label text */
  label?: string
  /** Error message */
  error?: string
  /** Helper text */
  helper?: string
  /** Whether input is invalid */
  invalid?: boolean
  /** Additional CSS classes */
  className?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({
    type = 'text',
    label,
    error,
    helper,
    invalid,
    className,
    id,
    ...props
  }, ref) {
    const generatedId = React.useId()
    const inputId = id || generatedId
    const isInvalid = invalid || !!error
    const isDateType = type && dateTypes.includes(type)

    const inputElement = (
      <span className={clsx(styles.wrapper)}>
        <input
          ref={ref}
          type={type}
          id={inputId}
          {...(isInvalid && { 'data-invalid': '' })}
          className={clsx(
            styles.base,
            // Date input specific styles
            isDateType && [
              '[&::-webkit-datetime-edit-fields-wrapper]:p-0',
              '[&::-webkit-date-and-time-value]:min-h-[1.5em]',
              '[&::-webkit-datetime-edit]:inline-flex',
              '[&::-webkit-datetime-edit]:p-0',
              '[&::-webkit-datetime-edit-year-field]:p-0',
              '[&::-webkit-datetime-edit-month-field]:p-0',
              '[&::-webkit-datetime-edit-day-field]:p-0',
              '[&::-webkit-datetime-edit-hour-field]:p-0',
              '[&::-webkit-datetime-edit-minute-field]:p-0',
              '[&::-webkit-datetime-edit-second-field]:p-0',
              '[&::-webkit-datetime-edit-millisecond-field]:p-0',
              '[&::-webkit-datetime-edit-meridiem-field]:p-0',
            ],
            className
          )}
          {...props}
        />
      </span>
    )

    // If no label, error, or helper text, return just the input
    if (!label && !error && !helper) {
      return inputElement
    }

    // Return input with label and helper text layout
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-zinc-950 dark:text-white"
          >
            {label}
          </label>
        )}
        
        {inputElement}
        
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        
        {helper && !error && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {helper}
          </p>
        )}
      </div>
    )
  }
)

// Legacy API compatibility
export interface InputLegacyProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label text */
  label?: string
  /** Error message */
  error?: string
  /** Helper text */
  helper?: string
  /** Input type */
  type?: string
  /** Additional CSS classes */
  className?: string
}

export const InputLegacy = forwardRef<HTMLInputElement, InputLegacyProps>(
  function InputLegacy({
    label,
    error,
    helper,
    type = 'text',
    className,
    ...props
  }, ref) {
    return (
      <Input
        ref={ref}
        type={type as any}
        label={label}
        error={error}
        helper={helper}
        invalid={!!error}
        className={className}
        {...props}
      />
    )
  }
)

InputLegacy.displayName = 'InputLegacy'