'use client'

import { clsx } from 'clsx'

export function FadeIn({
  children,
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={clsx(
        'animate-fade-in opacity-0 translate-y-6 animation-fill-forwards',
        className
      )}
      style={{
        animationDelay: '0.1s',
        animationDuration: '0.5s',
        animationTimingFunction: 'ease-out'
      }}
      {...props}
    >
      {children}
    </div>
  )
}