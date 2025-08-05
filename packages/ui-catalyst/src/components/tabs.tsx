'use client'

import React, { createContext, useContext, useState } from 'react'
import { clsx } from '../utils/clsx'

// Tabs context interface
interface TabsContextType {
  value: string
  onChange: (value: string) => void
}

// Tabs context
const TabsContext = createContext<TabsContextType | undefined>(undefined)

// Tabs styles
const tabsStyles = {
  container: [
    'w-full',
  ],
  list: [
    'inline-flex items-center justify-center',
    'rounded-lg',
    'bg-zinc-100 dark:bg-zinc-800',
    'p-1',
    'text-zinc-500 dark:text-zinc-400',
  ],
  trigger: [
    'inline-flex items-center justify-center',
    'whitespace-nowrap rounded-md',
    'px-3 py-1.5',
    'text-sm font-medium',
    'ring-offset-white dark:ring-offset-zinc-950',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-blue-500 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  triggerActive: [
    'bg-white dark:bg-zinc-900',
    'text-zinc-950 dark:text-zinc-50',
    'shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10',
  ],
  triggerInactive: [
    'text-zinc-500 dark:text-zinc-400',
    'hover:text-zinc-900 dark:hover:text-zinc-100',
    'hover:bg-zinc-50 dark:hover:bg-zinc-700/50',
  ],
  content: [
    'mt-4',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-blue-500 focus-visible:ring-offset-2',
  ],
  variants: {
    default: {
      list: '',
      trigger: '',
    },
    pills: {
      list: 'bg-transparent space-x-2',
      trigger: 'rounded-full border border-zinc-200 dark:border-zinc-700',
    },
    underline: {
      list: 'bg-transparent border-b border-zinc-200 dark:border-zinc-800 rounded-none p-0',
      trigger: 'rounded-none border-b-2 border-transparent pb-2 hover:border-zinc-300 dark:hover:border-zinc-600 data-[state=active]:border-blue-500',
    },
  }
}

// Main Tabs component
export interface TabsProps {
  children: React.ReactNode
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  variant?: 'default' | 'pills' | 'underline'
}

export function Tabs({ 
  children, 
  defaultValue = '', 
  value, 
  onValueChange, 
  className,
  variant = 'default'
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const actualValue = value !== undefined ? value : internalValue

  const handleChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ value: actualValue, onChange: handleChange }}>
      <div 
        className={clsx(tabsStyles.container, className)}
        data-variant={variant}
      >
        {children}
      </div>
    </TabsContext.Provider>
  )
}

// TabsList component
export interface TabsListProps {
  children: React.ReactNode
  className?: string
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div 
      className={clsx(
        tabsStyles.list,
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  )
}

// TabsTrigger component
export interface TabsTriggerProps {
  children: React.ReactNode
  value: string
  className?: string
  disabled?: boolean
}

export function TabsTrigger({ children, value, className, disabled }: TabsTriggerProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')

  const isActive = context.value === value

  return (
    <button
      className={clsx(
        tabsStyles.trigger,
        isActive ? tabsStyles.triggerActive : tabsStyles.triggerInactive,
        className
      )}
      onClick={() => context.onChange(value)}
      disabled={disabled}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      id={`tab-${value}`}
      data-state={isActive ? 'active' : 'inactive'}
    >
      {children}
    </button>
  )
}

// TabsContent component
export interface TabsContentProps {
  children: React.ReactNode
  value: string
  className?: string
}

export function TabsContent({ children, value, className }: TabsContentProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')

  if (context.value !== value) return null

  return (
    <div 
      className={clsx(tabsStyles.content, className)}
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
    >
      {children}
    </div>
  )
}

// Legacy API compatibility
export interface TabsLegacyProps {
  children: React.ReactNode
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

export function TabsLegacy(props: TabsLegacyProps) {
  return <Tabs {...props} />
}

export interface TabsListLegacyProps {
  children: React.ReactNode
  className?: string
}

export function TabsListLegacy(props: TabsListLegacyProps) {
  return <TabsList {...props} />
}

export interface TabsTriggerLegacyProps {
  children: React.ReactNode
  value: string
  className?: string
  disabled?: boolean
}

export function TabsTriggerLegacy(props: TabsTriggerLegacyProps) {
  return <TabsTrigger {...props} />
}

export interface TabsContentLegacyProps {
  children: React.ReactNode
  value: string
  className?: string
}

export function TabsContentLegacy(props: TabsContentLegacyProps) {
  return <TabsContent {...props} />
}