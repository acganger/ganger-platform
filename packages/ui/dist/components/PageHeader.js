import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function PageHeader({ title, subtitle, actions, className = '' }) {
    return (_jsx("div", { className: `border-b border-gray-200 pb-5 mb-6 ${className}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight", children: title }), subtitle && (_jsx("p", { className: "mt-1 text-sm text-gray-500", children: subtitle }))] }), actions && (_jsx("div", { className: "flex items-center gap-2", children: actions }))] }) }));
}
