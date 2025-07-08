'use client'

import React, { createContext, useContext, useState } from 'react'
import { cn } from '../utils/cn'

interface TabsContextType {
  value: string
  onChange: (value: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

export interface TabsProps {
  children: React.ReactNode
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

export function Tabs({ children, defaultValue = '', value, onValueChange, className }: TabsProps) {
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
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export interface TabsListProps {
  children: React.ReactNode
  className?: string
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500',
      className
    )}>
      {children}
    </div>
  )
}

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
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-500 hover:text-gray-950',
        className
      )}
      onClick={() => context.onChange(value)}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

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
    <div className={cn('mt-2', className)}>
      {children}
    </div>
  )
}