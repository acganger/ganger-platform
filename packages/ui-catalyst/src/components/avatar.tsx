
import { clsx } from '../utils/clsx'

const styles = {
  base: [
    // Layout
    'inline-grid shrink-0 align-middle [--avatar-radius:20%] *:col-start-1 *:row-start-1',
    // Border
    'outline -outline-offset-1 outline-black/10 dark:outline-white/10',
  ],
  sizes: {
    xs: 'size-6',
    sm: 'size-8', 
    md: 'size-10',
    lg: 'size-12',
    xl: 'size-16',
    '2xl': 'size-20',
  },
  // Professional color variants for medical contexts
  colors: {
    zinc: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100',
    red: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100',
    orange: 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100',
    amber: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100',
    yellow: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100',
    lime: 'bg-lime-100 text-lime-900 dark:bg-lime-900/30 dark:text-lime-100',
    green: 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100',
    emerald: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100',
    teal: 'bg-teal-100 text-teal-900 dark:bg-teal-900/30 dark:text-teal-100',
    cyan: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-100',
    sky: 'bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-100',
    blue: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100',
    indigo: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-100',
    violet: 'bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-100',
    purple: 'bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-100',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-900/30 dark:text-fuchsia-100',
    pink: 'bg-pink-100 text-pink-900 dark:bg-pink-900/30 dark:text-pink-100',
    rose: 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-100',
  }
}

export interface AvatarProps {
  /** Image source URL */
  src?: string | null
  /** Whether the avatar should be square instead of circular */
  square?: boolean
  /** Initials to display when no image */
  initials?: string
  /** Alt text for accessibility */
  alt?: string
  /** Size variant */
  size?: keyof typeof styles.sizes
  /** Color variant for initials background */
  color?: keyof typeof styles.colors
  /** Additional CSS classes */
  className?: string
}

export function Avatar({
  src = null,
  square = false,
  initials,
  alt = '',
  size = 'md',
  color,
  className,
  ...props
}: AvatarProps & React.ComponentPropsWithoutRef<'span'>) {
  // Generate color based on initials or alt text if no color specified
  const getAvatarColor = (): keyof typeof styles.colors => {
    if (color) return color
    
    const text = initials || alt || 'default'
    const colors: (keyof typeof styles.colors)[] = [
      'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
      'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'
    ]
    
    const hash = text.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    
    return colors[Math.abs(hash) % colors.length] || 'zinc'
  }

  const avatarColor = getAvatarColor()

  return (
    <span
      data-slot="avatar"
      {...props}
      className={clsx(
        className,
        styles.base,
        styles.sizes[size],
        square ? 'rounded-(--avatar-radius) *:rounded-(--avatar-radius)' : 'rounded-full *:rounded-full'
      )}
    >
      {initials && !src && (
        <svg
          className={clsx(
            'size-full fill-current p-[5%] text-[48px] font-medium uppercase select-none',
            styles.colors[avatarColor]
          )}
          viewBox="0 0 100 100"
          aria-hidden={alt ? undefined : 'true'}
        >
          {alt && <title>{alt}</title>}
          <text 
            x="50%" 
            y="50%" 
            alignmentBaseline="middle" 
            dominantBaseline="middle" 
            textAnchor="middle" 
            dy=".125em"
          >
            {initials}
          </text>
        </svg>
      )}
      {src && (
        <img 
          className="size-full object-cover" 
          src={src} 
          alt={alt}
          onError={(e) => {
            // Hide image on error, fallback will show initials
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
      )}
      {!initials && !src && (
        <svg
          className={clsx(
            'size-full fill-current p-[5%] text-[48px] font-medium select-none',
            styles.colors[avatarColor]
          )}
          viewBox="0 0 100 100"
          aria-hidden={alt ? undefined : 'true'}
        >
          {alt && <title>{alt}</title>}
          <text 
            x="50%" 
            y="50%" 
            alignmentBaseline="middle" 
            dominantBaseline="middle" 
            textAnchor="middle" 
            dy=".125em"
          >
            ?
          </text>
        </svg>
      )}
    </span>
  )
}

// Legacy API compatibility
export interface AvatarLegacyProps {
  /** Image source URL */
  src?: string
  /** Alt text for accessibility */
  alt?: string
  /** Size variant - legacy API */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Initials to display when no image */
  initials?: string
  /** Additional CSS classes */
  className?: string
}

export function AvatarLegacy({
  src,
  alt = '',
  size = 'md',
  initials,
  className,
  ...props
}: AvatarLegacyProps & React.HTMLAttributes<HTMLDivElement>) {
  // Generate initials from alt text if not provided
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }

  const displayInitials = initials || (alt ? getInitials(alt) : '?')

  return (
    <Avatar
      src={src}
      alt={alt}
      size={size}
      initials={displayInitials}
      className={className}
      {...(props as any)}
    />
  )
}