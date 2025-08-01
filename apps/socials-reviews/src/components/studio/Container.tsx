import clsx from 'clsx'

export function Container({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={clsx('mx-auto max-w-7xl px-6 lg:px-8', className)}
      {...props}
    >
      {children}
    </div>
  )
}