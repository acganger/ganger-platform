import Image from 'next/image';

/**
 * Props for the GangerLogo component
 */
interface GangerLogoProps {
  /** 
   * Logo size variant
   * @default 'md'
   * - sm: h-8 (32px)
   * - md: h-10 (40px)
   * - lg: h-12 (48px)
   * - xl: h-16 (64px)
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /** 
   * Whether to show just the icon or full logo
   * @default 'full'
   * - icon: Shows only the logo icon (40px width)
   * - full: Shows the complete logo (200px width)
   */
  variant?: 'icon' | 'full';
  
  /** 
   * Custom className for additional styling
   */
  className?: string;
  
  /** 
   * If provided, wraps the logo in an anchor tag
   * Typically used to link back to homepage
   */
  href?: string;
}

const sizeClasses = {
  sm: 'h-8',
  md: 'h-10', 
  lg: 'h-12',
  xl: 'h-16'
};

/**
 * GangerLogo component for brand identity
 * 
 * @description
 * Displays the Ganger Dermatology logo in various sizes and formats.
 * Can be used as a clickable link or static image. Automatically
 * loads with priority for better performance.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <GangerLogo />
 * 
 * // Different sizes
 * <GangerLogo size="sm" />
 * <GangerLogo size="xl" />
 * 
 * // Icon only variant
 * <GangerLogo variant="icon" />
 * 
 * // As a link to homepage
 * <GangerLogo href="/" size="lg" />
 * 
 * // In a navigation bar
 * <nav className="flex items-center justify-between">
 *   <GangerLogo href="/" />
 *   <NavigationMenu />
 * </nav>
 * ```
 * 
 * @component
 */
export function GangerLogo({ 
  size = 'md', 
  variant = 'full',
  className = '',
  href
}: GangerLogoProps) {
  const logoElement = (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/gd-logo.png"
        alt="Ganger Dermatology"
        width={variant === 'icon' ? 40 : 200}
        height={40}
        className={`${sizeClasses[size]} w-auto object-contain`}
        priority
      />
    </div>
  );

  if (href) {
    return (
      <a href={href} className="transition-opacity hover:opacity-80">
        {logoElement}
      </a>
    );
  }

  return logoElement;
}

/**
 * Props for the GangerHeader component
 */
interface GangerHeaderProps {
  /**
   * Main title displayed next to the logo
   */
  title?: string;
  
  /**
   * Subtitle displayed below the title
   */
  subtitle?: string;
  
  /**
   * Additional CSS classes for the header container
   */
  className?: string;
}

/**
 * GangerHeader component for app headers
 * 
 * @description
 * Professional header component that combines the Ganger logo with
 * optional title and subtitle. Creates a consistent header experience
 * across all applications.
 * 
 * @example
 * ```tsx
 * // Basic header with logo only
 * <GangerHeader />
 * 
 * // With title
 * <GangerHeader title="Patient Portal" />
 * 
 * // With title and subtitle
 * <GangerHeader 
 *   title="Inventory Management"
 *   subtitle="Track medical supplies and equipment"
 * />
 * 
 * // With custom styling
 * <GangerHeader 
 *   title="Staff Dashboard"
 *   className="shadow-lg"
 * />
 * ```
 * 
 * @component
 */
export function GangerHeader({ 
  title, 
  subtitle,
  className = ''
}: GangerHeaderProps) {
  return (
    <header className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <GangerLogo href="/" size="lg" />
            {title && (
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-500 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * GangerLogoCompact component for space-constrained areas
 * 
 * @description
 * A compact version of the logo designed for sidebars, mobile views,
 * and other space-constrained areas. Shows the icon with optional
 * text that hides on small screens.
 * 
 * @example
 * ```tsx
 * // In a sidebar
 * <aside className="w-64">
 *   <GangerLogoCompact className="p-4" />
 *   <SidebarNav />
 * </aside>
 * 
 * // In a mobile header
 * <header className="md:hidden">
 *   <GangerLogoCompact />
 * </header>
 * ```
 * 
 * @component
 */
export function GangerLogoCompact({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <GangerLogo variant="icon" size="sm" />
      <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
        Ganger Dermatology
      </span>
    </div>
  );
}