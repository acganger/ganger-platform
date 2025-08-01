"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadingSpinner = LoadingSpinner;
const jsx_runtime_1 = require("react/jsx-runtime");
const cn_1 = require("../utils/cn");
function LoadingSpinner({ size = 'md', className, text, center = false }) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
    };
    const spinner = ((0, jsx_runtime_1.jsx)("div", { className: (0, cn_1.cn)('animate-spin', sizes[size]), children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 24 24", fill: "none", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }) }));
    if (text) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: (0, cn_1.cn)('flex items-center space-x-2', center && 'justify-center', className), children: [spinner, (0, jsx_runtime_1.jsx)("span", { className: "text-gray-600", children: text })] }));
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, cn_1.cn)(center && 'flex justify-center', className), children: spinner }));
}
