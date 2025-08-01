'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Calendar, Phone, DollarSign, BarChart3, ExternalLink, Home } from 'lucide-react';
const BUSINESS_OPERATIONS_APPS = [
    {
        name: 'EOS L10',
        path: '/l10',
        icon: BarChart3,
        category: 'Business',
        description: 'Team management and Level 10 meetings',
        roles: ['staff', 'manager', 'provider'],
        isPWA: true
    },
    {
        name: 'Pharma Scheduling',
        path: '/pharma-scheduling',
        icon: Calendar,
        category: 'Business',
        description: 'Pharmaceutical rep booking and management',
        roles: ['staff', 'manager'],
        hasExternalInterface: true
    },
    {
        name: 'Call Center Operations',
        path: '/phones',
        icon: Phone,
        category: 'Business',
        description: 'Patient communication and 3CX integration',
        roles: ['staff', 'manager'],
        specialIntegration: '3CX'
    },
    {
        name: 'Batch Closeout',
        path: '/batch',
        icon: DollarSign,
        category: 'Business',
        description: 'Financial operations and daily closeout',
        roles: ['staff', 'manager', 'billing']
    }
];
function AppNavigation({ currentApp, workflowConnections }) {
    return (_jsxs("nav", { className: "mt-8", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("h3", { className: "px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider", children: "Business Operations" }), BUSINESS_OPERATIONS_APPS.map((app) => {
                        const isActive = app.path.includes(currentApp);
                        return (_jsxs(Link, { href: app.path, className: `group flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive
                                ? 'bg-blue-100 text-blue-900'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`, children: [_jsx(app.icon, { className: "mr-3 h-5 w-5" }), _jsx("span", { className: "flex-1", children: app.name }), app.isPWA && (_jsx("span", { className: "text-xs text-green-600", children: "PWA" })), app.hasExternalInterface && (_jsx(ExternalLink, { className: "h-3 w-3 text-gray-400" }))] }, app.name));
                    })] }), workflowConnections && workflowConnections.length > 0 && (_jsxs("div", { className: "mt-6 space-y-1", children: [_jsx("h3", { className: "px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider", children: "Related Workflows" }), workflowConnections.map((connection) => (_jsxs(Link, { href: connection.path, className: "group flex flex-col px-3 py-2 text-sm rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900", children: [_jsx("span", { className: "font-medium", children: connection.name }), _jsx("span", { className: "text-xs text-gray-500", children: connection.description })] }, connection.name)))] }))] }));
}
function QuickActionsPanel({ quickActions }) {
    if (!quickActions || quickActions.length === 0)
        return null;
    return (_jsxs("div", { className: "mt-6 p-4 bg-blue-50 rounded-lg", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900 mb-3", children: "Quick Actions" }), _jsx("div", { className: "space-y-2", children: quickActions.map((action) => (_jsxs(Link, { href: action.path, className: `flex items-center text-sm text-blue-600 hover:text-blue-800 ${action.external ? 'cursor-alias' : ''}`, ...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}), children: [action.name, action.external && _jsx(ExternalLink, { className: "ml-1 h-3 w-3" })] }, action.name))) })] }));
}
function Sidebar({ isOpen, setIsOpen, currentApp, quickActions, workflowConnections, appDescription, specialIntegrations }) {
    return (_jsxs(_Fragment, { children: [isOpen && (_jsxs("div", { className: "fixed inset-0 z-50 lg:hidden", children: [_jsx("div", { className: "fixed inset-0 bg-gray-900/80", onClick: () => setIsOpen(false) }), _jsxs("div", { className: "fixed inset-y-0 left-0 z-50 w-64 bg-white px-6 py-6 overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-semibold text-gray-900", children: "Staff Portal" }), _jsx("button", { type: "button", className: "-m-2.5 p-2.5", onClick: () => setIsOpen(false), children: _jsx(X, { className: "h-6 w-6 text-gray-400" }) })] }), appDescription && (_jsx("p", { className: "mt-2 text-sm text-gray-600", children: appDescription })), specialIntegrations && specialIntegrations.length > 0 && (_jsx("div", { className: "mt-3 flex flex-wrap gap-1", children: specialIntegrations.map((integration) => (_jsx("span", { className: "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800", children: integration }, integration))) })), _jsx(AppNavigation, { currentApp: currentApp, workflowConnections: workflowConnections }), _jsx(QuickActionsPanel, { quickActions: quickActions })] })] })), _jsx("div", { className: "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col", children: _jsxs("div", { className: "flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 ring-1 ring-gray-900/5", children: [_jsx("div", { className: "flex h-16 shrink-0 items-center", children: _jsxs(Link, { href: "/", className: "flex items-center", children: [_jsx(Home, { className: "h-8 w-8 text-blue-600 mr-2" }), _jsx("h1", { className: "text-xl font-semibold text-gray-900", children: "Staff Portal" })] }) }), appDescription && (_jsx("p", { className: "text-sm text-gray-600 -mt-3", children: appDescription })), specialIntegrations && specialIntegrations.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-1 -mt-2", children: specialIntegrations.map((integration) => (_jsx("span", { className: "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800", children: integration }, integration))) })), _jsx(AppNavigation, { currentApp: currentApp, workflowConnections: workflowConnections }), _jsx(QuickActionsPanel, { quickActions: quickActions })] }) })] }));
}
function Header({ setIsOpen, currentApp }) {
    const currentAppInfo = BUSINESS_OPERATIONS_APPS.find(app => app.path.includes(currentApp));
    return (_jsxs("div", { className: "sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8", children: [_jsx("button", { type: "button", className: "-m-2.5 p-2.5 text-gray-700 lg:hidden", onClick: () => setIsOpen(true), children: _jsx(Menu, { className: "h-6 w-6" }) }), _jsxs("div", { className: "flex flex-1 gap-x-4 self-stretch lg:gap-x-6", children: [_jsxs("div", { className: "relative flex flex-1 items-center", children: [_jsx("h2", { className: "text-sm font-semibold leading-6 text-gray-900", children: currentAppInfo?.name || 'Business Operations' }), currentAppInfo?.description && (_jsxs("span", { className: "ml-2 text-sm text-gray-500", children: ["\u2022 ", currentAppInfo.description] }))] }), _jsxs("div", { className: "flex items-center gap-x-4 lg:gap-x-6", children: [_jsx("div", { className: "hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" }), _jsx("div", { className: "flex items-center space-x-4 text-sm text-gray-600", children: _jsx("span", { children: "Ganger Dermatology Staff Portal" }) })] })] })] }));
}
export function StaffPortalLayout({ children, currentApp, relatedApps, quickActions, workflowConnections, preservePWA, hasExternalInterface, specialIntegrations, preserveFinancialWorkflows, complianceMode, appDescription, interfaceNote, integrationNotes }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (_jsxs("div", { children: [_jsx(Sidebar, { isOpen: sidebarOpen, setIsOpen: setSidebarOpen, currentApp: currentApp, quickActions: quickActions, workflowConnections: workflowConnections, appDescription: appDescription, specialIntegrations: specialIntegrations }), _jsxs("div", { className: "lg:pl-72", children: [_jsx(Header, { setIsOpen: setSidebarOpen, currentApp: currentApp }), _jsxs("main", { className: "py-4", children: [interfaceNote && (_jsx("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-4", children: _jsx("div", { className: "rounded-md bg-blue-50 p-4", children: _jsx("div", { className: "text-sm text-blue-700", children: interfaceNote }) }) })), _jsx("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: children })] })] })] }));
}
