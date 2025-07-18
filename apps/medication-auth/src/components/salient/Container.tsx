import clsx from 'clsx'

type ContainerProps<T extends React.ElementType> = {
  as?: T
  className?: string
  children: React.ReactNode
}

export function Container<T extends React.ElementType = 'div'>({
  as,
  className,
  children,
  ...props
}: ContainerProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof ContainerProps<T>>) {
  let Component = as ?? 'div'

  return (
    <Component
      className={clsx('mx-auto max-w-7xl px-6 lg:px-8', className)}
      {...props}
    >
      <div className="mx-auto max-w-2xl lg:max-w-none">{children}</div>
    </Component>
  )
}