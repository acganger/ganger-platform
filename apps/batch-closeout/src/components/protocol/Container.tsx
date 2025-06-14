import clsx from 'clsx'

export function Container({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={clsx('mx-auto max-w-2xl lg:max-w-5xl', className)}
      {...props}
    >
      {children}
    </div>
  )
}