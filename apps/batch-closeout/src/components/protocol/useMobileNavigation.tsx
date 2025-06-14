'use client'

import { createContext, useContext } from 'react'

const MobileNavigationContext = createContext(false)

export function MobileNavigationProvider({
  children,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <MobileNavigationContext.Provider value={true}>
      <div {...props}>{children}</div>
    </MobileNavigationContext.Provider>
  )
}

export function useIsInsideMobileNavigation() {
  return useContext(MobileNavigationContext)
}