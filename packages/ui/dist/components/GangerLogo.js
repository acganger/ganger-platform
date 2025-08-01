import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image from 'next/image';
const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16'
};
export function GangerLogo({ size = 'md', variant = 'full', className = '', href }) {
    const logoElement = (_jsx("div", { className: `flex items-center ${className}`, children: _jsx(Image, { src: "/gd-logo.png", alt: "Ganger Dermatology", width: variant === 'icon' ? 40 : 200, height: 40, className: `${sizeClasses[size]} w-auto object-contain`, priority: true }) }));
    if (href) {
        return (_jsx("a", { href: href, className: "transition-opacity hover:opacity-80", children: logoElement }));
    }
    return logoElement;
}
export function GangerHeader({ title, subtitle, className = '' }) {
    return (_jsx("header", { className: `bg-white border-b border-gray-200 ${className}`, children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsx("div", { className: "flex items-center justify-between h-16", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(GangerLogo, { href: "/", size: "lg" }), title && (_jsxs("div", { className: "border-l border-gray-300 pl-4", children: [_jsx("h1", { className: "text-xl font-semibold text-gray-900", children: title }), subtitle && (_jsx("p", { className: "text-sm text-gray-500 mt-1", children: subtitle }))] }))] }) }) }) }));
}
/**
 * Compact logo for sidebars and small spaces
 */
export function GangerLogoCompact({ className = '' }) {
    return (_jsxs("div", { className: `flex items-center ${className}`, children: [_jsx(GangerLogo, { variant: "icon", size: "sm" }), _jsx("span", { className: "ml-2 text-sm font-medium text-gray-700 hidden sm:block", children: "Ganger Dermatology" })] }));
}
