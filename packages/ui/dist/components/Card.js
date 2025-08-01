import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { cn } from '../utils/cn';
const Card = React.forwardRef(({ className, children, padding = 'md', shadow = 'sm', border = true, rounded = 'md', disabled = false, onClick, ...props }, ref) => {
    const paddingClasses = {
        none: '',
        sm: 'p-3',
        md: 'p-6',
        lg: 'p-8',
    };
    const shadowClasses = {
        none: '',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
    };
    const roundedClasses = {
        none: '',
        sm: 'rounded-sm',
        md: 'rounded-lg',
        lg: 'rounded-xl',
    };
    return (_jsx("div", { ref: ref, className: cn('bg-white text-gray-950', paddingClasses[padding], shadowClasses[shadow], roundedClasses[rounded], border && 'border border-gray-200', onClick && !disabled && 'cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200', disabled && 'opacity-50 cursor-not-allowed', className), onClick: onClick && !disabled ? onClick : undefined, ...props, children: children }));
});
Card.displayName = 'Card';
const CardHeader = React.forwardRef(({ className, children, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('flex flex-col space-y-1.5 pb-4 mb-4', className), ...props, children: children })));
CardHeader.displayName = 'CardHeader';
const CardTitle = React.forwardRef(({ className, children, size = 'md', ...props }, ref) => {
    const sizeClasses = {
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-2xl',
    };
    return (_jsx("h3", { ref: ref, className: cn(sizeClasses[size], 'font-semibold leading-none tracking-tight text-gray-900', className), ...props, children: children }));
});
CardTitle.displayName = 'CardTitle';
const CardDescription = React.forwardRef(({ className, children, ...props }, ref) => (_jsx("p", { ref: ref, className: cn('text-sm text-gray-500', className), ...props, children: children })));
CardDescription.displayName = 'CardDescription';
const CardContent = React.forwardRef(({ className, children, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('pt-0', className), ...props, children: children })));
CardContent.displayName = 'CardContent';
const CardFooter = React.forwardRef(({ className, children, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('flex items-center pt-4 mt-4 border-t border-gray-200', className), ...props, children: children })));
CardFooter.displayName = 'CardFooter';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
