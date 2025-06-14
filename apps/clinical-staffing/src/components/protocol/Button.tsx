import Link from 'next/link'
import { clsx } from 'clsx'

const baseStyles = 
  'inline-flex items-center justify-center rounded-lg py-2 px-3 text-sm font-semibold outline-offset-2 transition-colors'

const variantStyles = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-500 focus-visible:outline-blue-600 active:bg-blue-700 active:text-blue-100',
  secondary:
    'bg-gray-50 text-gray-900 hover:bg-gray-100 focus-visible:outline-gray-600 active:bg-gray-200 active:text-gray-600',
  filled:
    'bg-gray-900 text-white hover:bg-gray-700 focus-visible:outline-gray-900 active:bg-gray-800 active:text-gray-300',
  outline:
    'border border-gray-300 text-gray-700 hover:border-gray-400 focus-visible:outline-gray-600 active:bg-gray-50 active:text-gray-600',
  ghost:
    'text-gray-700 hover:bg-gray-100 focus-visible:outline-gray-600 active:bg-gray-200 active:text-gray-600',
}

type ButtonProps = {
  variant?: keyof typeof variantStyles
} & (
  | React.ComponentPropsWithoutRef<typeof Link>
  | (React.ComponentPropsWithoutRef<'button'> & { href?: undefined })
)

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonProps) {
  className = clsx(baseStyles, variantStyles[variant], className)

  return typeof props.href === 'undefined' ? (
    <button className={className} {...props} />
  ) : (
    <Link className={className} {...props} />
  )
}