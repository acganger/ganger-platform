import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from '@ganger/auth';
export function AppLayout({ children, className = '' }) {
    const { user, signOut } = useAuth();
    return (_jsxs("div", { className: `min-h-screen bg-gray-50 ${className}`, children: [_jsx("header", { className: "bg-white shadow-sm border-b border-gray-200", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center h-16", children: [_jsx("div", { className: "flex items-center", children: _jsx("h1", { className: "text-xl font-semibold text-gray-900", children: "Ganger Platform" }) }), user && (_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("span", { className: "text-sm text-gray-700", children: user.email }), _jsx("button", { onClick: () => signOut(), className: "text-sm text-gray-500 hover:text-gray-700", children: "Sign Out" })] }))] }) }) }), _jsx("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: children })] }));
}
