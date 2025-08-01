import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { cn } from '../utils/cn';
const Checkbox = React.forwardRef(({ className, label, description, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: "flex items-center h-5", children: _jsx("input", { id: checkboxId, type: "checkbox", className: cn('h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0', error && 'border-red-500', className), ref: ref, ...props }) }), (label || description) && (_jsxs("div", { className: "text-sm", children: [label && (_jsx("label", { htmlFor: checkboxId, className: cn('font-medium text-gray-700 cursor-pointer', error && 'text-red-700'), children: label })), description && (_jsx("p", { className: cn('text-gray-500', label && 'mt-1'), children: description }))] }))] }), error && (_jsx("p", { className: "text-sm text-red-600 ml-7", children: error }))] }));
});
Checkbox.displayName = 'Checkbox';
export { Checkbox };
