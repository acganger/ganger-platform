import React from 'react';
export interface TabsProps {
    children: React.ReactNode;
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    className?: string;
}
export declare function Tabs({ children, defaultValue, value, onValueChange, className }: TabsProps): import("react/jsx-runtime").JSX.Element;
export interface TabsListProps {
    children: React.ReactNode;
    className?: string;
}
export declare function TabsList({ children, className }: TabsListProps): import("react/jsx-runtime").JSX.Element;
export interface TabsTriggerProps {
    children: React.ReactNode;
    value: string;
    className?: string;
    disabled?: boolean;
}
export declare function TabsTrigger({ children, value, className, disabled }: TabsTriggerProps): import("react/jsx-runtime").JSX.Element;
export interface TabsContentProps {
    children: React.ReactNode;
    value: string;
    className?: string;
}
export declare function TabsContent({ children, value, className }: TabsContentProps): import("react/jsx-runtime").JSX.Element | null;
