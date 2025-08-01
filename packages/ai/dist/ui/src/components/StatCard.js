"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatCard = StatCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const variantClasses = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
};
const iconClasses = {
    default: 'text-gray-400',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
};
function StatCard({ title, value, icon, trend, variant = 'default', className = '' }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: `
      rounded-lg border p-6 
      ${variantClasses[variant]} 
      ${className}
    `, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-600", children: title }), (0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-semibold text-gray-900", children: value })] }), icon && ((0, jsx_runtime_1.jsx)("div", { className: `text-2xl ${iconClasses[variant]}`, children: (0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 rounded-full bg-current opacity-20" }) }))] }), trend && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-2 flex items-center text-sm", children: [(0, jsx_runtime_1.jsxs)("span", { className: `flex items-center ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`, children: [trend.direction === 'up' ? '↗' : '↘', trend.value, "%"] }), (0, jsx_runtime_1.jsx)("span", { className: "ml-1 text-gray-500", children: "from last month" })] }))] }));
}
