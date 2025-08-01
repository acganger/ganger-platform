import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '../utils/cn';
const variantStyles = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
};
export function Progress({ value, max = 100, className, variant = 'default' }) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return (_jsx("div", { className: cn('relative h-2 w-full overflow-hidden rounded-full bg-gray-200', className), role: "progressbar", "aria-valuenow": value, "aria-valuemin": 0, "aria-valuemax": max, children: _jsx("div", { className: cn('h-full transition-all duration-300 ease-in-out', variantStyles[variant]), style: { width: `${percentage}%` } }) }));
}
