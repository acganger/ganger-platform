import React from 'react'
import { clsx } from '../utils/clsx'

const styles = {
  base: [
    // Basic layout
    'relative isolate flex size-4.5 items-center justify-center rounded-[0.3125rem] sm:size-4',
    // Background color + shadow applied to inset pseudo element
    'before:absolute before:inset-0 before:-z-10 before:rounded-[calc(0.3125rem-1px)] before:bg-white before:shadow-sm',
    // Background color when checked
    'group-data-checked:before:bg-(--checkbox-checked-bg)',
    // Dark mode adjustments
    'dark:before:hidden dark:bg-white/5 dark:group-data-checked:bg-(--checkbox-checked-bg)',
    // Border
    'border border-zinc-950/15 group-data-checked:border-transparent group-data-hover:group-data-checked:border-transparent group-data-hover:border-zinc-950/30 group-data-checked:bg-(--checkbox-checked-border)',
    'dark:border-white/15 dark:group-data-checked:border-white/5 dark:group-data-hover:group-data-checked:border-white/5 dark:group-data-hover:border-white/30',
    // Inner highlight shadow
    'after:absolute after:inset-0 after:rounded-[calc(0.3125rem-1px)] after:shadow-[inset_0_1px_theme(colors.white/15%)]',
    'dark:after:-inset-px dark:after:hidden dark:after:rounded-[0.3125rem] dark:group-data-checked:after:block',
    // Focus ring
    'group-data-focus:outline-2 group-data-focus:outline-offset-2 group-data-focus:outline-blue-500',
    // Disabled state
    'group-data-disabled:opacity-50',
    'group-data-disabled:border-zinc-950/25 group-data-disabled:bg-zinc-950/5 group-data-disabled:[--checkbox-check:theme(colors.zinc.950/50%)] group-data-disabled:before:bg-transparent',
    'dark:group-data-disabled:border-white/20 dark:group-data-disabled:bg-white/2.5 dark:group-data-disabled:[--checkbox-check:theme(colors.white/50%)] dark:group-data-checked:group-data-disabled:after:hidden'
  ],
  colors: {
    zinc: '[--checkbox-check:theme(colors.white)] [--checkbox-checked-bg:theme(colors.zinc.600)] [--checkbox-checked-border:theme(colors.zinc.700/90%)]',
    red: '[--checkbox-check:theme(colors.white)] [--checkbox-checked-bg:theme(colors.red.600)] [--checkbox-checked-border:theme(colors.red.700/90%)]',
    orange: '[--checkbox-check:theme(colors.white)] [--checkbox-checked-bg:theme(colors.orange.500)] [--checkbox-checked-border:theme(colors.orange.600/90%)]',
    amber: '[--checkbox-check:theme(colors.amber.950)] [--checkbox-checked-bg:theme(colors.amber.400)] [--checkbox-checked-border:theme(colors.amber.500/80%)]',
    yellow: '[--checkbox-check:theme(colors.yellow.950)] [--checkbox-checked-bg:theme(colors.yellow.300)] [--checkbox-checked-border:theme(colors.yellow.400/80%)]',
    lime: '[--checkbox-check:theme(colors.lime.950)] [--checkbox-checked-bg:theme(colors.lime.300)] [--checkbox-checked-border:theme(colors.lime.400/80%)]',
    green: '[--checkbox-check:theme(colors.white)] [--checkbox-checked-bg:theme(colors.green.600)] [--checkbox-checked-border:theme(colors.green.700/90%)]',
    emerald: '[--checkbox-check:theme(colors.white)] [--checkbox-checked-bg:theme(colors.emerald.600)] [--checkbox-checked-border:theme(colors.emerald.700/90%)]',
    teal: '[--checkbox-check:theme(colors.white)] [--checkbox-checked-bg:theme(colors.teal.600)] [--checkbox-checked-border:theme(colors.teal.700/90%)]',
    cyan: '[--checkbox-check:theme(colors.cyan.950)] [--checkbox-checked-bg:theme(colors.cyan.300)] [--checkbox-checked-border:theme(colors.cyan.400/80%)]',
    sky: '[--checkbox-check:theme(colors.white)] [--checkbox-checked-bg:theme(colors.sky.500)] [--checkbox-checked-border:theme(colors.sky.600/80%)]',
    blue: '[--checkbox-check:theme(colors.white)] [--checkbox-checked-bg:theme(colors.blue.600)] [--checkbox-checked-border:theme(colors.blue.700/90%)]',
    indigo: '[--checkbox-check:theme(colors.white)] [--checkbox-checked-bg:theme(colors.indigo.500)] [--checkbox-checked-border:theme(colors.indigo.600/90%)]',
    violet: '[--checkbox-check:theme(colors.white)] [--checkbox-checked-bg:theme(colors.violet.500)] [--checkbox-checked-border:theme(colors.violet.600/90%)]',
    purple: '[--checkbox-check:theme(colors.white)] [--checkbox-checked-bg:theme(colors.purple.500)] [--checkbox-checked-border:theme(colors.purple.600/90%)]',
    fuchsia: '[--checkbox-check:theme(colors.white)] [--checkbox-checked-bg:theme(colors.fuchsia.500)] [--checkbox-checked-border:theme(colors.fuchsia.600/90%)]',
    pink: '[--checkbox-check:theme(colors.white)] [--checkbox-checked-bg:theme(colors.pink.500)] [--checkbox-checked-border:theme(colors.pink.600/90%)]',
    rose: '[--checkbox-check:theme(colors.white)] [--checkbox-checked-bg:theme(colors.rose.500)] [--checkbox-checked-border:theme(colors.rose.600/90%)]'
  }
}

export interface CheckboxProps {
  /** Whether the checkbox is checked */
  checked?: boolean
  /** Whether the checkbox shows indeterminate state */
  indeterminate?: boolean
  /** Callback when checkbox state changes */
  onChange?: (checked: boolean) => void
  /** Whether the checkbox is disabled */
  disabled?: boolean
  /** Color variant when checked */
  color?: keyof typeof styles.colors
  /** Label text */
  label?: string
  /** Description text */
  description?: string
  /** Error message */
  error?: string
  /** Additional CSS classes */
  className?: string
  /** HTML id attribute */
  id?: string
  /** ARIA label */
  'aria-label'?: string
  /** ARIA described by */
  'aria-describedby'?: string
}

export function Checkbox({
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  color = 'blue',
  label,
  description,
  error,
  className,
  id,
  ...ariaProps
}: CheckboxProps) {
  const generatedId = React.useId()
  const checkboxId = id || generatedId

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && onChange) {
      onChange(e.target.checked)
    }
  }

  const checkboxElement = (
    <div
      className={clsx(
        'group inline-flex focus-within:outline-hidden',
        disabled && 'pointer-events-none',
        className
      )}
      data-slot="control"
      {...(checked && { 'data-checked': '' })}
      {...(indeterminate && { 'data-indeterminate': '' })}
      {...(disabled && { 'data-disabled': '' })}
    >
      <input
        type="checkbox"
        id={checkboxId}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
        ref={(el) => {
          if (el) el.indeterminate = indeterminate
        }}
        {...ariaProps}
      />
      <span className={clsx(styles.base, styles.colors[color])}>
        <svg
          className="size-4 stroke-(--checkbox-check) opacity-0 group-data-checked:opacity-100 sm:h-3.5 sm:w-3.5"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          {/* Checkmark icon */}
          <path
            className="opacity-100 group-data-indeterminate:opacity-0"
            d="M3 8L6 11L11 3.5"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Indeterminate icon */}
          <path
            className="opacity-0 group-data-indeterminate:opacity-100"
            d="M3 7H11"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  )

  // If no label or description, return just the checkbox
  if (!label && !description && !error) {
    return checkboxElement
  }

  // Return checkbox with label/description layout
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1.125rem_1fr] gap-x-4 gap-y-1 sm:grid-cols-[1rem_1fr]">
        <div className="col-start-1 row-start-1 mt-0.75 sm:mt-1">
          {checkboxElement}
        </div>
        
        {(label || description) && (
          <div className="col-start-2 row-start-1">
            {label && (
              <label
                htmlFor={checkboxId}
                className={clsx(
                  'text-sm font-medium cursor-pointer',
                  error ? 'text-red-700 dark:text-red-400' : 'text-zinc-950 dark:text-white',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={clsx(
                'text-sm',
                error ? 'text-red-600 dark:text-red-400' : 'text-zinc-600 dark:text-zinc-400',
                label && 'mt-1',
                disabled && 'opacity-50'
              )}>
                {description}
              </p>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 ml-8 sm:ml-7">
          {error}
        </p>
      )}
    </div>
  )
}

// Legacy API compatibility
export interface CheckboxLegacyProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label text */
  label?: string
  /** Description text */
  description?: string
  /** Error message */
  error?: string
}

export const CheckboxLegacy = React.forwardRef<HTMLInputElement, CheckboxLegacyProps>(
  ({ className, label, description, error, id, checked, onChange, ...props }, _ref) => {
    const handleChange = (isChecked: boolean) => {
      if (onChange) {
        // Create synthetic event for react-hook-form compatibility
        const syntheticEvent = {
          target: { checked: isChecked },
          type: 'change'
        } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }
    }

    return (
      <Checkbox
        checked={checked}
        onChange={handleChange}
        label={label}
        description={description}
        error={error}
        className={className}
        id={id}
        color="blue"
        {...(props as any)}
      />
    )
  }
)

CheckboxLegacy.displayName = 'CheckboxLegacy'