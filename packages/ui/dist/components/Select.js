import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { cn } from '../utils/cn';
const Select = React.forwardRef(({ className, label, error, helper, options, placeholder, ...props }, ref) => {
    const selectId = React.useId();
    return (_jsxs("div", { className: "space-y-1", children: [label && (_jsx("label", { htmlFor: selectId, className: "block text-sm font-medium text-gray-700", children: label })), _jsxs("select", { id: selectId, className: cn('flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', error && 'border-red-500 focus-visible:ring-red-500', className), ref: ref, ...props, children: [placeholder && (_jsx("option", { value: "", disabled: true, children: placeholder })), options.map((option) => (_jsx("option", { value: option.value, disabled: option.disabled, children: option.label }, option.value)))] }), error && (_jsx("p", { className: "text-sm text-red-600", children: error })), helper && !error && (_jsx("p", { className: "text-sm text-gray-500", children: helper }))] }));
});
Select.displayName = 'Select';
export { Select };
