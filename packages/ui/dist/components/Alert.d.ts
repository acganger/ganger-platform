import React from 'react';
export interface AlertProps {
    children: React.ReactNode;
    variant?: 'default' | 'info' | 'success' | 'warning' | 'error' | 'destructive';
    className?: string;
}
export declare function Alert({ children, variant, className }: AlertProps): import("react/jsx-runtime").JSX.Element;
