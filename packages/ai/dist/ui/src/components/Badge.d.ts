import React from 'react';
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}
export declare function Badge({ variant, size, className, children, ...props }: BadgeProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Badge.d.ts.map