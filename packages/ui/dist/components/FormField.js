import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { cn } from '../utils/cn';
const FormField = ({ label, required, error, helper, help, children, className, id, }) => {
    // Use help as alias for helper if provided
    const helperText = help || helper;
    // Generate unique IDs for accessibility
    const generatedId = React.useId();
    const fieldId = id || generatedId;
    const errorId = `${fieldId}-error`;
    const helperId = `${fieldId}-helper`;
    // Clone children to add accessibility attributes
    const enhancedChildren = React.cloneElement(children, {
        id: fieldId,
        'aria-invalid': error ? 'true' : 'false',
        'aria-describedby': [
            error ? errorId : null,
            helperText ? helperId : null
        ].filter(Boolean).join(' ') || undefined,
        'aria-required': required ? 'true' : undefined,
    });
    return (_jsxs("div", { className: cn('space-y-2', className), children: [label && (_jsxs("label", { htmlFor: fieldId, className: "block text-sm font-medium text-gray-700", children: [label, required && _jsx("span", { className: "text-red-500 ml-1", "aria-label": "required", children: "*" })] })), _jsx("div", { children: enhancedChildren }), error && (_jsx("p", { id: errorId, className: "text-sm text-red-600", role: "alert", "aria-live": "polite", children: error })), helperText && !error && (_jsx("p", { id: helperId, className: "text-sm text-gray-500", children: helperText }))] }));
};
export { FormField };
