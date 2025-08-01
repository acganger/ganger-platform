"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffPortalLayout = StaffPortalLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const BUSINESS_OPERATIONS_APPS = [
    {
        name: 'EOS L10',
        path: '/l10',
        icon: lucide_react_1.BarChart3,
        category: 'Business',
        description: 'Team management and Level 10 meetings',
        roles: ['staff', 'manager', 'provider'],
        isPWA: true
    },
    {
        name: 'Pharma Scheduling',
        path: '/pharma-scheduling',
        icon: lucide_react_1.Calendar,
        category: 'Business',
        description: 'Pharmaceutical rep booking and management',
        roles: ['staff', 'manager'],
        hasExternalInterface: true
    },
    {
        name: 'Call Center Operations',
        path: '/phones',
        icon: lucide_react_1.Phone,
        category: 'Business',
        description: 'Patient communication and 3CX integration',
        roles: ['staff', 'manager'],
        specialIntegration: '3CX'
    },
    {
        name: 'Batch Closeout',
        path: '/batch',
        icon: lucide_react_1.DollarSign,
        category: 'Business',
        description: 'Financial operations and daily closeout',
        roles: ['staff', 'manager', 'billing']
    }
];
function AppNavigation({ currentApp, workflowConnections }) {
    return ((0, jsx_runtime_1.jsxs)("nav", { className: "mt-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [(0, jsx_runtime_1.jsx)("h3", { className: "px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider", children: "Business Operations" }), BUSINESS_OPERATIONS_APPS.map((app) => {
                        const isActive = app.path.includes(currentApp);
                        return ((0, jsx_runtime_1.jsxs)(link_1.default, { href: app.path, className: `group flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive
                                ? 'bg-blue-100 text-blue-900'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`, children: [(0, jsx_runtime_1.jsx)(app.icon, { className: "mr-3 h-5 w-5" }), (0, jsx_runtime_1.jsx)("span", { className: "flex-1", children: app.name }), app.isPWA && ((0, jsx_runtime_1.jsx)("span", { className: "text-xs text-green-600", children: "PWA" })), app.hasExternalInterface && ((0, jsx_runtime_1.jsx)(lucide_react_1.ExternalLink, { className: "h-3 w-3 text-gray-400" }))] }, app.name));
                    })] }), workflowConnections && workflowConnections.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-6 space-y-1", children: [(0, jsx_runtime_1.jsx)("h3", { className: "px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider", children: "Related Workflows" }), workflowConnections.map((connection) => ((0, jsx_runtime_1.jsxs)(link_1.default, { href: connection.path, className: "group flex flex-col px-3 py-2 text-sm rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: connection.name }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-gray-500", children: connection.description })] }, connection.name)))] }))] }));
}
function QuickActionsPanel({ quickActions }) {
    if (!quickActions || quickActions.length === 0)
        return null;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "mt-6 p-4 bg-blue-50 rounded-lg", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-semibold text-gray-900 mb-3", children: "Quick Actions" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: quickActions.map((action) => ((0, jsx_runtime_1.jsxs)(link_1.default, { href: action.path, className: `flex items-center text-sm text-blue-600 hover:text-blue-800 ${action.external ? 'cursor-alias' : ''}`, ...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}), children: [action.name, action.external && (0, jsx_runtime_1.jsx)(lucide_react_1.ExternalLink, { className: "ml-1 h-3 w-3" })] }, action.name))) })] }));
}
function Sidebar({ isOpen, setIsOpen, currentApp, quickActions, workflowConnections, appDescription, specialIntegrations }) {
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [isOpen && ((0, jsx_runtime_1.jsxs)("div", { className: "fixed inset-0 z-50 lg:hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-gray-900/80", onClick: () => setIsOpen(false) }), (0, jsx_runtime_1.jsxs)("div", { className: "fixed inset-y-0 left-0 z-50 w-64 bg-white px-6 py-6 overflow-y-auto", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-xl font-semibold text-gray-900", children: "Staff Portal" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "-m-2.5 p-2.5", onClick: () => setIsOpen(false), children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-6 w-6 text-gray-400" }) })] }), appDescription && ((0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-gray-600", children: appDescription })), specialIntegrations && specialIntegrations.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "mt-3 flex flex-wrap gap-1", children: specialIntegrations.map((integration) => ((0, jsx_runtime_1.jsx)("span", { className: "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800", children: integration }, integration))) })), (0, jsx_runtime_1.jsx)(AppNavigation, { currentApp: currentApp, workflowConnections: workflowConnections }), (0, jsx_runtime_1.jsx)(QuickActionsPanel, { quickActions: quickActions })] })] })), (0, jsx_runtime_1.jsx)("div", { className: "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 ring-1 ring-gray-900/5", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex h-16 shrink-0 items-center", children: (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/", className: "flex items-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Home, { className: "h-8 w-8 text-blue-600 mr-2" }), (0, jsx_runtime_1.jsx)("h1", { className: "text-xl font-semibold text-gray-900", children: "Staff Portal" })] }) }), appDescription && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-600 -mt-3", children: appDescription })), specialIntegrations && specialIntegrations.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-1 -mt-2", children: specialIntegrations.map((integration) => ((0, jsx_runtime_1.jsx)("span", { className: "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800", children: integration }, integration))) })), (0, jsx_runtime_1.jsx)(AppNavigation, { currentApp: currentApp, workflowConnections: workflowConnections }), (0, jsx_runtime_1.jsx)(QuickActionsPanel, { quickActions: quickActions })] }) })] }));
}
function Header({ setIsOpen, currentApp }) {
    const currentAppInfo = BUSINESS_OPERATIONS_APPS.find(app => app.path.includes(currentApp));
    return ((0, jsx_runtime_1.jsxs)("div", { className: "sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: "-m-2.5 p-2.5 text-gray-700 lg:hidden", onClick: () => setIsOpen(true), children: (0, jsx_runtime_1.jsx)(lucide_react_1.Menu, { className: "h-6 w-6" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-1 gap-x-4 self-stretch lg:gap-x-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative flex flex-1 items-center", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-sm font-semibold leading-6 text-gray-900", children: currentAppInfo?.name || 'Business Operations' }), currentAppInfo?.description && ((0, jsx_runtime_1.jsxs)("span", { className: "ml-2 text-sm text-gray-500", children: ["\u2022 ", currentAppInfo.description] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-x-4 lg:gap-x-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center space-x-4 text-sm text-gray-600", children: (0, jsx_runtime_1.jsx)("span", { children: "Ganger Dermatology Staff Portal" }) })] })] })] }));
}
function StaffPortalLayout({ children, currentApp, relatedApps, quickActions, workflowConnections, preservePWA, hasExternalInterface, specialIntegrations, preserveFinancialWorkflows, complianceMode, appDescription, interfaceNote, integrationNotes }) {
    const [sidebarOpen, setSidebarOpen] = (0, react_1.useState)(false);
    return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(Sidebar, { isOpen: sidebarOpen, setIsOpen: setSidebarOpen, currentApp: currentApp, quickActions: quickActions, workflowConnections: workflowConnections, appDescription: appDescription, specialIntegrations: specialIntegrations }), (0, jsx_runtime_1.jsxs)("div", { className: "lg:pl-72", children: [(0, jsx_runtime_1.jsx)(Header, { setIsOpen: setSidebarOpen, currentApp: currentApp }), (0, jsx_runtime_1.jsxs)("main", { className: "py-4", children: [interfaceNote && ((0, jsx_runtime_1.jsx)("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-4", children: (0, jsx_runtime_1.jsx)("div", { className: "rounded-md bg-blue-50 p-4", children: (0, jsx_runtime_1.jsx)("div", { className: "text-sm text-blue-700", children: interfaceNote }) }) })), (0, jsx_runtime_1.jsx)("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: children })] })] })] }));
}
