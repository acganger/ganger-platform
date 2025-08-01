import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../utils/cn';
export function LoadingSpinner({ size = 'md', className, text, center = false }) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
    };
    const spinner = (_jsx("div", { className: cn('animate-spin', sizes[size]), children: _jsxs("svg", { viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }) }));
    if (text) {
        return (_jsxs("div", { className: cn('flex items-center space-x-2', center && 'justify-center', className), children: [spinner, _jsx("span", { className: "text-gray-600", children: text })] }));
    }
    return (_jsx("div", { className: cn(center && 'flex justify-center', className), children: spinner }));
}
