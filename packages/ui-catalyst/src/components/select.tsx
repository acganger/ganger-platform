import React, { forwardRef } from 'react'
import { clsx } from '../utils/clsx'

const styles = {
  wrapper: [
    // Basic layout
    'group relative block w-full',
    // Background color + shadow applied to wrapper
    'before:absolute before:inset-px before:rounded-[calc(0.5rem-1px)] before:bg-white before:shadow-sm',
    'dark:before:hidden',
    // Focus ring on wrapper
    'after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-transparent after:ring-inset',
    'focus-within:after:ring-2 focus-within:after:ring-blue-500',
    // Disabled state for wrapper
    'has-[:disabled]:opacity-50 has-[:disabled]:before:bg-zinc-950/5 has-[:disabled]:before:shadow-none',
  ],
  select: [
    // Basic layout
    'relative block w-full appearance-none rounded-lg',
    // Padding with room for chevron icon
    'py-[calc(0.625rem-1px)] pr-10 pl-[calc(0.875rem-1px)] sm:py-[calc(0.375rem-1px)] sm:pr-9 sm:pl-[calc(0.75rem-1px)]',
    // Typography
    'text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white',
    // Border
    'border border-zinc-950/10 hover:border-zinc-950/20 dark:border-white/10 dark:hover:border-white/20',
    // Background
    'bg-transparent dark:bg-white/5',
    // Options styling
    '[&_option]:bg-white dark:[&_option]:bg-zinc-800',
    '[&_optgroup]:font-semibold',
    // Focus
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-blue-500',
    // Invalid state
    'data-[invalid]:border-red-500 data-[invalid]:hover:border-red-500 dark:data-[invalid]:border-red-500',
    // Disabled state  
    'disabled:border-zinc-950/20 disabled:bg-zinc-950/5 disabled:text-zinc-950/50 disabled:cursor-not-allowed',
    'dark:disabled:border-white/15 dark:disabled:bg-white/2.5 dark:disabled:text-white/50',
  ],
  selectMultiple: [
    // Different padding for multi-select
    'px-[calc(0.875rem-1px)] sm:px-[calc(0.75rem-1px)]',
  ],
  icon: [
    'pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2',
  ],
  iconSvg: [
    'size-5 stroke-zinc-500 sm:size-4 dark:stroke-zinc-400',
    'group-has-[:disabled]:stroke-zinc-600',
  ]
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Label text */
  label?: string
  /** Error message */
  error?: string
  /** Helper text */
  helper?: string
  /** Whether select is invalid */
  invalid?: boolean
  /** Select options */
  children: React.ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({
    label,
    error,
    helper,
    invalid,
    className,
    id,
    multiple,
    children,
    ...props
  }, ref) {
    const generatedId = React.useId()
    const selectId = id || generatedId
    const isInvalid = invalid || !!error

    const selectElement = (
      <span className={clsx(styles.wrapper, className)}>
        <select
          ref={ref}
          id={selectId}
          multiple={multiple}
          {...(isInvalid && { 'data-invalid': '' })}
          className={clsx(
            styles.select,
            multiple && styles.selectMultiple
          )}
          {...props}
        >
          {children}
        </select>
        {!multiple && (
          <span className={clsx(styles.icon)}>
            <svg
              className={clsx(styles.iconSvg)}
              viewBox="0 0 16 16"
              aria-hidden="true"
              fill="none"
            >
              <path d="M5.75 10.75L8 13L10.25 10.75" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10.25 5.25L8 3L5.75 5.25" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </span>
    )

    // If no label, error, or helper text, return just the select
    if (!label && !error && !helper) {
      return selectElement
    }

    // Return select with label and helper text layout
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-zinc-950 dark:text-white"
          >
            {label}
          </label>
        )}
        
        {selectElement}
        
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
export interface SelectLegacyProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Label text */
  label?: string
  /** Error message */
  error?: string
  /** Helper text */
  helper?: string
  /** Additional CSS classes */
  className?: string
  /** Select options */
  children: React.ReactNode
}

export const SelectLegacy = forwardRef<HTMLSelectElement, SelectLegacyProps>(
  function SelectLegacy({
    label,
    error,
    helper,
    className,
    children,
    ...props
  }, ref) {
    return (
      <Select
        ref={ref}
        label={label}
        error={error}
        helper={helper}
        invalid={!!error}
        className={className}
        {...props}
      >
        {children}
      </Select>
    )
  }
)

SelectLegacy.displayName = 'SelectLegacy'