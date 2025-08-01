'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from 'react';
import { cn } from '../utils/cn';
const TabsContext = createContext(undefined);
export function Tabs({ children, defaultValue = '', value, onValueChange, className }) {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const actualValue = value !== undefined ? value : internalValue;
    const handleChange = (newValue) => {
        if (value === undefined) {
            setInternalValue(newValue);
        }
        onValueChange?.(newValue);
    };
    return (_jsx(TabsContext.Provider, { value: { value: actualValue, onChange: handleChange }, children: _jsx("div", { className: cn('w-full', className), children: children }) }));
}
export function TabsList({ children, className }) {
    return (_jsx("div", { className: cn('inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500', className), children: children }));
}
export function TabsTrigger({ children, value, className, disabled }) {
    const context = useContext(TabsContext);
    if (!context)
        throw new Error('TabsTrigger must be used within Tabs');
    const isActive = context.value === value;
    return (_jsx("button", { className: cn('inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50', isActive ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-500 hover:text-gray-950', className), onClick: () => context.onChange(value), disabled: disabled, children: children }));
}
export function TabsContent({ children, value, className }) {
    const context = useContext(TabsContext);
    if (!context)
        throw new Error('TabsContent must be used within Tabs');
    if (context.value !== value)
        return null;
    return (_jsx("div", { className: cn('mt-2', className), children: children }));
}
