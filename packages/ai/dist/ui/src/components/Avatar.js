"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Avatar = Avatar;
const jsx_runtime_1 = require("react/jsx-runtime");
const cn_1 = require("../utils/cn");
const avatarSizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
};
const getInitials = (name) => {
    return name
        .split(' ')
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
};
const getAvatarColors = (name) => {
    const colors = [
        'bg-red-500 text-white',
        'bg-blue-500 text-white',
        'bg-green-500 text-white',
        'bg-purple-500 text-white',
        'bg-yellow-500 text-black',
        'bg-pink-500 text-white',
        'bg-indigo-500 text-white',
        'bg-gray-500 text-white',
    ];
    const hash = name.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return colors[Math.abs(hash) % colors.length];
};
function Avatar({ src, alt = '', size = 'md', initials, className, ...props }) {
    const displayInitials = initials || (alt ? getInitials(alt) : '?');
    const colorClass = alt ? getAvatarColors(alt) : 'bg-gray-500 text-white';
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, cn_1.cn)('inline-flex items-center justify-center rounded-full overflow-hidden', avatarSizes[size], !src && colorClass, className), ...props, children: src ? ((0, jsx_runtime_1.jsx)("img", { src: src, alt: alt, className: "w-full h-full object-cover", onError: (e) => {
                // Fallback to initials if image fails to load
                const target = e.target;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                    parent.textContent = displayInitials;
                    parent.className = (0, cn_1.cn)(parent.className, colorClass);
                }
            } })) : ((0, jsx_runtime_1.jsx)("span", { className: "font-medium leading-none", children: displayInitials })) }));
}
