import Link from 'next/link'
import { clsx } from 'clsx'

const baseStyles = {
  solid:
    'group inline-flex items-center justify-center rounded-full py-2 px-4 text-sm font-semibold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2',
  outline:
    'group inline-flex ring-1 items-center justify-center rounded-full py-2 px-4 text-sm focus:outline-none',
}

const variantStyles = {
  solid: {
    slate:
      'bg-slate-900 text-white hover:bg-slate-700 focus-visible:outline-slate-900 active:bg-slate-800 active:text-slate-300',
    blue: 'bg-blue-600 text-white hover:text-slate-100 hover:bg-blue-500 focus-visible:outline-blue-600 active:bg-blue-800 active:text-blue-100',
    white:
      'bg-white text-slate-900 hover:bg-blue-50 focus-visible:outline-white active:bg-blue-200 active:text-slate-600',
  },
  outline: {
    slate:
      'ring-slate-200 text-slate-700 hover:text-slate-900 hover:ring-slate-300 focus-visible:outline-blue-600 focus-visible:ring-slate-300 active:bg-slate-100 active:text-slate-600',
    blue: 'ring-blue-200 text-blue-700 hover:text-blue-900 hover:ring-blue-300 focus-visible:outline-blue-600 focus-visible:ring-blue-300 active:bg-blue-100 active:text-blue-600',
    white:
      'ring-slate-700 text-white hover:ring-slate-500 focus-visible:outline-white focus-visible:ring-slate-500 active:ring-slate-700 active:text-slate-400',
  },
}

type ButtonProps = {
  variant?: keyof typeof variantStyles
  color?: keyof typeof variantStyles.solid & keyof typeof variantStyles.outline
} & (
  | React.ComponentPropsWithoutRef<typeof Link>
  | (React.ComponentPropsWithoutRef<'button'> & { href?: undefined })
)

export function Button({
  variant = 'solid',
  color = 'slate',
  className,
  ...props
}: ButtonProps) {
  className = clsx(
    baseStyles[variant],
    variantStyles[variant][color],
    className,
  )

  return typeof props.href === 'undefined' ? (
    <button className={className} {...props} />
  ) : (
    <Link className={className} {...props} />
  )
}