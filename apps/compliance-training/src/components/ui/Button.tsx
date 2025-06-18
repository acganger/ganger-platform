import Link from 'next/link'
import clsx from 'clsx'

const baseStyles = {
  solid:
    'group inline-flex items-center justify-center rounded-full py-2 px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2',
  outline:
    'group inline-flex ring-1 items-center justify-center rounded-full py-2 px-4 text-sm',
}

const variantStyles = {
  solid: {
    slate:
      'bg-slate-900 text-white hover:bg-slate-700 hover:text-slate-100 active:bg-slate-800 active:text-slate-300 focus-visible:outline-slate-900',
    blue: 'bg-blue-600 text-white hover:text-slate-100 hover:bg-blue-500 active:bg-blue-800 active:text-blue-100 focus-visible:outline-blue-600',
    white:
      'bg-white text-slate-900 hover:bg-blue-50 active:bg-blue-200 active:text-slate-600 focus-visible:outline-white',
    red: 'bg-red-600 text-white hover:text-slate-100 hover:bg-red-500 active:bg-red-800 active:text-red-100 focus-visible:outline-red-600',
    green: 'bg-green-600 text-white hover:text-slate-100 hover:bg-green-500 active:bg-green-800 active:text-green-100 focus-visible:outline-green-600',
  },
  outline: {
    slate:
      'ring-slate-200 text-slate-700 hover:text-slate-900 hover:ring-slate-300 active:bg-slate-100 active:text-slate-600 focus-visible:outline-blue-600 focus-visible:ring-slate-300',
    white:
      'ring-slate-700 text-white hover:ring-slate-500 active:ring-slate-700 active:text-slate-400 focus-visible:outline-white',
    blue: 'ring-blue-200 text-blue-700 hover:text-blue-900 hover:ring-blue-300 active:bg-blue-100 active:text-blue-600 focus-visible:outline-blue-600 focus-visible:ring-blue-300',
  },
}

type ButtonVariant = keyof typeof baseStyles
type ButtonColor = 'slate' | 'blue' | 'white' | 'red' | 'green'

interface ButtonPropsBase {
  className?: string;
  variant?: ButtonVariant;
  color?: ButtonColor;
  children?: React.ReactNode;
}

interface ButtonAsButton extends ButtonPropsBase, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonPropsBase> {
  href?: never;
}

interface ButtonAsLink extends ButtonPropsBase, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonPropsBase> {
  href: string;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({ className, variant = 'solid', color = 'slate', href, ...props }: ButtonProps) {
  const computedClassName = clsx(
    baseStyles[variant],
    variant === 'outline'
      ? variantStyles.outline[color]
      : variant === 'solid'
        ? variantStyles.solid[color]
        : undefined,
    className,
  )

  return typeof href === 'undefined' ? (
    <button className={computedClassName} {...(props as ButtonAsButton)} />
  ) : (
    <Link className={computedClassName} href={href} {...(props as Omit<ButtonAsLink, 'href'>)} />
  )
}