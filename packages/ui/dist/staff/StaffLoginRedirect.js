'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '../components/Button';
export function StaffLoginRedirect({ appName, message }) {
    const handleLogin = () => {
        // In a real implementation, this would trigger the OAuth flow
        // For now, we'll show a placeholder
        window.location.href = '/auth/login';
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-md w-full space-y-8", children: [_jsxs("div", { children: [_jsx("div", { className: "mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center", children: _jsx("svg", { className: "h-6 w-6 text-blue-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" }) }) }), _jsx("h2", { className: "mt-6 text-center text-3xl font-extrabold text-gray-900", children: "Staff Authentication Required" }), _jsx("p", { className: "mt-2 text-center text-sm text-gray-600", children: message || `Please sign in to access ${appName}` })] }), _jsxs("div", { className: "mt-8 space-y-6", children: [_jsx("div", { children: _jsx(Button, { onClick: handleLogin, className: "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Sign in with Google Workspace" }) }), _jsx("div", { className: "text-center", children: _jsx("p", { className: "text-xs text-gray-500", children: "This application requires Ganger Dermatology staff credentials" }) })] })] }) }));
}
