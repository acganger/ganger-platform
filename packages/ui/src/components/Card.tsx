import React from 'react';
import { cn } from '../utils/cn';

/**
 * Props for the Card component
 * @extends React.HTMLAttributes<HTMLDivElement>
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Card component for content containers
 * 
 * @description
 * A flexible container component that provides consistent styling for grouped content.
 * Supports customizable padding, shadows, borders, and rounded corners. Can be
 * made interactive with onClick handlers.
 * 
 * @example
 * ```tsx
 * // Basic card
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card description goes here</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Card content goes here</p>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Action</Button>
 *   </CardFooter>
 * </Card>
 * 
 * // Simple card without sections
 * <Card padding="lg" shadow="md">
 *   <h3>Simple Card</h3>
 *   <p>Some content</p>
 * </Card>
 * 
 * // Clickable card
 * <Card onClick={handleClick} className="hover:shadow-lg">
 *   <CardContent>
 *     <p>Click me!</p>
 *   </CardContent>
 * </Card>
 * 
 * // Disabled card
 * <Card disabled>
 *   <CardContent>
 *     <p>This card is disabled</p>
 *   </CardContent>
 * </Card>
 * ```
 * 
 * @component
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    children, 
    padding = 'md',
    shadow = 'sm',
    border = true,
    rounded = 'md',
    disabled = false,
    onClick,
    ...props 
  }, ref) => {
    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
    };

    const shadowClasses = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
    };

    const roundedClasses = {
      none: '',
      sm: 'rounded-sm',
      md: 'rounded-lg',
      lg: 'rounded-xl',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-white text-gray-950',
          paddingClasses[padding],
          shadowClasses[shadow],
          roundedClasses[rounded],
          border && 'border border-gray-200',
          onClick && !disabled && 'cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={onClick && !disabled ? onClick : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

/**
 * CardHeader component for card titles and descriptions
 * 
 * @description
 * Container for card header content, typically used with CardTitle and CardDescription.
 * Adds appropriate spacing and a border below the header.
 * 
 * @component
 */
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-4 mb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * CardTitle component for card headings
 * 
 * @description
 * Displays the main title within a card. Supports different sizes and
 * maintains consistent typography across the application.
 * 
 * @component
 */
const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'text-lg',
      md: 'text-xl',
      lg: 'text-2xl',
    };

    return (
      <h3
        ref={ref}
        className={cn(
          sizeClasses[size],
          'font-semibold leading-none tracking-tight text-gray-900',
          className
        )}
        {...props}
      >
        {children}
      </h3>
    );
  }
);
CardTitle.displayName = 'CardTitle';

/**
 * CardDescription component for supplementary text
 * 
 * @description
 * Displays secondary text within a card header, typically used for
 * descriptions or subtitles beneath the CardTitle.
 * 
 * @component
 */
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500', className)}
      {...props}
    >
      {children}
    </p>
  )
);
CardDescription.displayName = 'CardDescription';

/**
 * CardContent component for main card content
 * 
 * @description
 * Container for the main content of a card. Provides consistent
 * padding and spacing for card body content.
 * 
 * @component
 */
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('pt-0', className)} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

/**
 * CardFooter component for card actions
 * 
 * @description
 * Container for card footer content, typically used for action buttons
 * or additional information. Adds a top border for visual separation.
 * 
 * @component
 */
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4 mt-4 border-t border-gray-200', className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };