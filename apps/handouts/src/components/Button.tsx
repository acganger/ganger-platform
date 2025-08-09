import Link from 'next/link'
import clsx from 'clsx'

const variantStyles = {
  primary:
    'rounded-full bg-handouts-600 py-2 px-4 text-sm font-semibold text-white hover:bg-handouts-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-handouts-600/50 active:bg-handouts-800',
  secondary:
    'rounded-full bg-slate-800 py-2 px-4 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 active:text-slate-400',
  education:
    'rounded-full bg-education-600 py-2 px-4 text-sm font-semibold text-white hover:bg-education-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-education-600/50 active:bg-education-800',
  treatment:
    'rounded-full bg-treatment-600 py-2 px-4 text-sm font-semibold text-white hover:bg-treatment-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-treatment-600/50 active:bg-treatment-800',
  medication:
    'rounded-full bg-medication-600 py-2 px-4 text-sm font-semibold text-white hover:bg-medication-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-medication-600/50 active:bg-medication-800',
  procedure:
    'rounded-full bg-procedure-600 py-2 px-4 text-sm font-semibold text-white hover:bg-procedure-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-procedure-600/50 active:bg-procedure-800',
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
  className = clsx(variantStyles[variant as keyof typeof variantStyles], className)

  return typeof props.href === 'undefined' ? (
    <button className={className} {...props} />
  ) : (
    <Link className={className} {...props} />
  )
}