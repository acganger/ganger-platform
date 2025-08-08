
import { clsx } from '../utils/clsx'

const styles = {
  base: [
    // Base layout
    'relative inline-flex cursor-pointer rounded-full p-[3px]',
    // Transitions
    'transition-colors duration-200 ease-in-out',
    // Focus
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    // Disabled
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  sizes: {
    sm: 'h-5 w-9',
    md: 'h-6 w-11',
    lg: 'h-7 w-14',
  },
  thumbSizes: {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  },
  thumbTranslate: {
    sm: 'translate-x-4',
    md: 'translate-x-5',
    lg: 'translate-x-7',
  },
  colors: {
    // Unchecked state always uses zinc/gray
    unchecked: 'bg-zinc-200 ring-1 ring-black/5 dark:bg-zinc-700 dark:ring-white/15',
    // Checked states by color
    zinc: 'bg-zinc-600 ring-zinc-700/90 dark:bg-zinc-400',
    red: 'bg-red-600 ring-red-700/90 dark:bg-red-500',
    orange: 'bg-orange-500 ring-orange-600/90 dark:bg-orange-400',
    amber: 'bg-amber-400 ring-amber-500/80 dark:bg-amber-300',
    yellow: 'bg-yellow-300 ring-yellow-400/80 dark:bg-yellow-200',
    lime: 'bg-lime-300 ring-lime-400/80 dark:bg-lime-200',
    green: 'bg-green-600 ring-green-700/90 dark:bg-green-500',
    emerald: 'bg-emerald-500 ring-emerald-600/90 dark:bg-emerald-400',
    teal: 'bg-teal-600 ring-teal-700/90 dark:bg-teal-500',
    cyan: 'bg-cyan-300 ring-cyan-400/80 dark:bg-cyan-200',
    sky: 'bg-sky-500 ring-sky-600/80 dark:bg-sky-400',
    blue: 'bg-blue-600 ring-blue-700/90 dark:bg-blue-500',
    indigo: 'bg-indigo-500 ring-indigo-600/90 dark:bg-indigo-400',
    violet: 'bg-violet-500 ring-violet-600/90 dark:bg-violet-400',
    purple: 'bg-purple-500 ring-purple-600/90 dark:bg-purple-400',
    fuchsia: 'bg-fuchsia-500 ring-fuchsia-600/90 dark:bg-fuchsia-400',
    pink: 'bg-pink-500 ring-pink-600/90 dark:bg-pink-400',
    rose: 'bg-rose-500 ring-rose-600/90 dark:bg-rose-400',
  },
}

export interface SwitchProps {
  /** Whether the switch is checked */
  checked: boolean
  /** Callback when switch state changes */
  onChange: (checked: boolean) => void
  /** Whether the switch is disabled */
  disabled?: boolean
  /** Size variant */
  size?: keyof typeof styles.sizes
  /** Color variant when checked */
  color?: keyof typeof styles.colors
  /** Additional CSS classes */
  className?: string
  /** ID for accessibility */
  id?: string
  /** ARIA label */
  'aria-label'?: string
  /** ARIA described by */
  'aria-describedby'?: string
}

export function Switch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  color = 'blue',
  className,
  id,
  ...ariaProps
}: SwitchProps) {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      id={id}
      className={clsx(
        className,
        styles.base,
        styles.sizes[size],
        checked ? styles.colors[color] : styles.colors.unchecked
      )}
      {...ariaProps}
    >
      <span
        aria-hidden="true"
        className={clsx(
          // Base
          'pointer-events-none inline-block rounded-full bg-white shadow-sm ring-1 ring-black/5',
          'transition-transform duration-200 ease-in-out',
          // Dark mode
          'dark:bg-white dark:ring-0',
          // Size
          styles.thumbSizes[size],
          // Position
          checked ? styles.thumbTranslate[size] : 'translate-x-0'
        )}
      />
    </button>
  )
}

// Legacy API compatibility
export interface SwitchLegacyProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  /** @deprecated Use 'size' prop instead */
  size?: 'sm' | 'md' | 'lg'
  className?: string
  id?: string
  'aria-label'?: string
  'aria-describedby'?: string
}

export function SwitchLegacy({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  className,
  id,
  ...ariaProps
}: SwitchLegacyProps) {
  return (
    <Switch
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      size={size}
      color="blue"
      className={className}
      id={id}
      {...ariaProps}
    />
  )
}