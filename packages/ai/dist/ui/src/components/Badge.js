"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Badge = Badge;
const jsx_runtime_1 = require("react/jsx-runtime");
const cn_1 = require("../utils/cn");
const badgeVariants = {
    primary: 'bg-blue-600 text-white border-blue-600',
    secondary: 'bg-gray-100 text-gray-900 border-gray-200',
    success: 'bg-green-600 text-white border-green-600',
    warning: 'bg-yellow-600 text-white border-yellow-600',
    destructive: 'bg-red-600 text-white border-red-600',
    outline: 'bg-transparent text-gray-700 border-gray-300'
};
const badgeSizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
};
function Badge({ variant = 'primary', size = 'md', className, children, ...props }) {
    return ((0, jsx_runtime_1.jsx)("span", { className: (0, cn_1.cn)('inline-flex items-center rounded-full border font-medium leading-none', badgeVariants[variant], badgeSizes[size], className), ...props, children: children }));
}
