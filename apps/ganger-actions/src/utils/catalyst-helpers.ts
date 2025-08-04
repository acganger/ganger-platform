// Helper functions for Catalyst UI component compatibility

// Map old Badge variant to Catalyst className
export function getBadgeClassName(variant: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'error' | 'info'): string {
  const variantMap = {
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    destructive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  };
  
  return variantMap[variant] || variantMap.secondary;
}

// Map old Button variant to Catalyst props
export function getButtonProps(variant: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'link') {
  switch (variant) {
    case 'primary':
      return { color: 'blue' as const };
    case 'secondary':
      return { outline: true };
    case 'ghost':
      return { plain: true };
    case 'destructive':
      return { color: 'red' as const };
    case 'outline':
      return { outline: true };
    case 'link':
      return { plain: true, className: 'text-blue-600 hover:text-blue-500' };
    default:
      return {};
  }
}

// Re-export cn from @ganger/utils
export { cn } from '@ganger/utils';