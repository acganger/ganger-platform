"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppLayout = AppLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const auth_1 = require("@ganger/auth");
function AppLayout({ children, className = '' }) {
    const { user, signOut } = (0, auth_1.useAuth)();
    return ((0, jsx_runtime_1.jsxs)("div", { className: `min-h-screen bg-gray-50 ${className}`, children: [(0, jsx_runtime_1.jsx)("header", { className: "bg-white shadow-sm border-b border-gray-200", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center h-16", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center", children: (0, jsx_runtime_1.jsx)("h1", { className: "text-xl font-semibold text-gray-900", children: "Ganger Platform" }) }), user && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-sm text-gray-700", children: user.email }), (0, jsx_runtime_1.jsx)("button", { onClick: () => signOut(), className: "text-sm text-gray-500 hover:text-gray-700", children: "Sign Out" })] }))] }) }) }), (0, jsx_runtime_1.jsx)("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: children })] }));
}
