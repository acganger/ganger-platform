import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '../utils/cn';
const variantStyles = {
    default: 'bg-gray-50 text-gray-900 border-gray-200',
    info: 'bg-blue-50 text-blue-900 border-blue-200',
    success: 'bg-green-50 text-green-900 border-green-200',
    warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
    error: 'bg-red-50 text-red-900 border-red-200',
    destructive: 'bg-red-50 text-red-900 border-red-200',
};
export function Alert({ children, variant = 'default', className }) {
    return (_jsx("div", { className: cn('rounded-lg border px-4 py-3 text-sm', variantStyles[variant], className), role: "alert", children: children }));
}
