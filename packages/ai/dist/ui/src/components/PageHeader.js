"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageHeader = PageHeader;
const jsx_runtime_1 = require("react/jsx-runtime");
function PageHeader({ title, subtitle, actions, className = '' }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: `border-b border-gray-200 pb-5 mb-6 ${className}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight", children: title }), subtitle && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-gray-500", children: subtitle }))] }), actions && ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-2", children: actions }))] }) }));
}
