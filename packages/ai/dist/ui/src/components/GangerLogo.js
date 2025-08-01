"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangerLogo = GangerLogo;
exports.GangerHeader = GangerHeader;
exports.GangerLogoCompact = GangerLogoCompact;
const jsx_runtime_1 = require("react/jsx-runtime");
const image_1 = __importDefault(require("next/image"));
const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16'
};
function GangerLogo({ size = 'md', variant = 'full', className = '', href }) {
    const logoElement = ((0, jsx_runtime_1.jsx)("div", { className: `flex items-center ${className}`, children: (0, jsx_runtime_1.jsx)(image_1.default, { src: "/gd-logo.png", alt: "Ganger Dermatology", width: variant === 'icon' ? 40 : 200, height: 40, className: `${sizeClasses[size]} w-auto object-contain`, priority: true }) }));
    if (href) {
        return ((0, jsx_runtime_1.jsx)("a", { href: href, className: "transition-opacity hover:opacity-80", children: logoElement }));
    }
    return logoElement;
}
function GangerHeader({ title, subtitle, className = '' }) {
    return ((0, jsx_runtime_1.jsx)("header", { className: `bg-white border-b border-gray-200 ${className}`, children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: (0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-between h-16", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-4", children: [(0, jsx_runtime_1.jsx)(GangerLogo, { href: "/", size: "lg" }), title && ((0, jsx_runtime_1.jsxs)("div", { className: "border-l border-gray-300 pl-4", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-xl font-semibold text-gray-900", children: title }), subtitle && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500 mt-1", children: subtitle }))] }))] }) }) }) }));
}
/**
 * Compact logo for sidebars and small spaces
 */
function GangerLogoCompact({ className = '' }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: `flex items-center ${className}`, children: [(0, jsx_runtime_1.jsx)(GangerLogo, { variant: "icon", size: "sm" }), (0, jsx_runtime_1.jsx)("span", { className: "ml-2 text-sm font-medium text-gray-700 hidden sm:block", children: "Ganger Dermatology" })] }));
}
