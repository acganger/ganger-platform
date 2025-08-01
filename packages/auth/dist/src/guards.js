// Authentication Guards for Ganger Platform
'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useAuth } from './context';
/**
 * Default loading component
 */
function DefaultLoadingComponent() {
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }));
}
/**
 * Default unauthorized component
 */
function DefaultUnauthorizedComponent() {
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx("svg", { className: "w-8 h-8 text-red-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" }) }) }), _jsx("h1", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Access Denied" }), _jsx("p", { className: "text-gray-600 mb-6", children: "You don't have permission to access this page. Please contact your administrator if you believe this is an error." }), _jsx("button", { onClick: () => window.location.href = '/', className: "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors", children: "Return to Home" })] }) }));
}
/**
 * Login prompt component
 */
function LoginPromptComponent({ onSignIn }) {
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx("svg", { className: "w-8 h-8 text-blue-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }) }) }), _jsx("h1", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Sign In Required" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Please sign in with your Ganger Dermatology account to continue." }), _jsxs("button", { onClick: onSignIn, className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center", children: [_jsxs("svg", { className: "w-5 h-5 mr-2", viewBox: "0 0 24 24", children: [_jsx("path", { fill: "currentColor", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }), _jsx("path", { fill: "currentColor", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }), _jsx("path", { fill: "currentColor", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }), _jsx("path", { fill: "currentColor", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })] }), "Sign in with Google"] })] }) }));
}
/**
 * Main authentication guard component
 */
export function AuthGuard({ level, appName, teamId, fallback: FallbackComponent, children }) {
    const { user, profile, loading, signIn, hasAppAccess, isTeamMember, isTeamLeader, isAdmin } = useAuth();
    // Show loading while checking authentication
    if (loading) {
        return FallbackComponent ? _jsx(FallbackComponent, {}) : _jsx(DefaultLoadingComponent, {});
    }
    // Check authentication requirements based on level
    switch (level) {
        case 'public':
            // Public access - no authentication required
            return _jsx(_Fragment, { children: children });
        case 'authenticated':
            // Requires any authenticated user
            if (!user) {
                return _jsx(LoginPromptComponent, { onSignIn: () => signIn() });
            }
            return _jsx(_Fragment, { children: children });
        case 'staff':
            // Requires staff-level access
            if (!user) {
                return _jsx(LoginPromptComponent, { onSignIn: () => signIn() });
            }
            if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
                return FallbackComponent ? _jsx(FallbackComponent, {}) : _jsx(DefaultUnauthorizedComponent, {});
            }
            // Additional app-specific check
            if (appName && !hasAppAccess(appName, 'read')) {
                return FallbackComponent ? _jsx(FallbackComponent, {}) : _jsx(DefaultUnauthorizedComponent, {});
            }
            return _jsx(_Fragment, { children: children });
        case 'admin':
            // Requires admin access
            if (!user) {
                return _jsx(LoginPromptComponent, { onSignIn: () => signIn() });
            }
            if (!isAdmin()) {
                return FallbackComponent ? _jsx(FallbackComponent, {}) : _jsx(DefaultUnauthorizedComponent, {});
            }
            return _jsx(_Fragment, { children: children });
        case 'team-member':
            // Requires team membership
            if (!user) {
                return _jsx(LoginPromptComponent, { onSignIn: () => signIn() });
            }
            if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
                return FallbackComponent ? _jsx(FallbackComponent, {}) : _jsx(DefaultUnauthorizedComponent, {});
            }
            if (teamId && !isTeamMember(teamId)) {
                return FallbackComponent ? _jsx(FallbackComponent, {}) : _jsx(DefaultUnauthorizedComponent, {});
            }
            return _jsx(_Fragment, { children: children });
        case 'team-leader':
            // Requires team leadership
            if (!user) {
                return _jsx(LoginPromptComponent, { onSignIn: () => signIn() });
            }
            if (!isAdmin() && (!teamId || !isTeamLeader(teamId))) {
                return FallbackComponent ? _jsx(FallbackComponent, {}) : _jsx(DefaultUnauthorizedComponent, {});
            }
            return _jsx(_Fragment, { children: children });
        default:
            console.warn(`Unknown auth guard level: ${level}`);
            return _jsx(_Fragment, { children: children });
    }
}
/**
 * Higher-order component for authentication guards
 */
export function withAuthGuard(Component, guardProps) {
    return function AuthGuardedComponent(props) {
        return (_jsx(AuthGuard, { ...guardProps, children: _jsx(Component, { ...props }) }));
    };
}
/**
 * Hook for conditional rendering based on permissions
 */
export function useAuthGuard() {
    const auth = useAuth();
    return {
        canAccess: (level, appName, teamId) => {
            switch (level) {
                case 'public':
                    return true;
                case 'authenticated':
                    return !!auth.user;
                case 'staff':
                    return !!auth.user && !!auth.profile &&
                        (auth.profile.role === 'admin' || auth.profile.role === 'staff') &&
                        (!appName || auth.hasAppAccess(appName, 'read'));
                case 'admin':
                    return auth.isAdmin();
                case 'team-member':
                    return !!auth.user && !!auth.profile &&
                        (auth.profile.role === 'admin' || auth.profile.role === 'staff') &&
                        (!teamId || auth.isTeamMember(teamId));
                case 'team-leader':
                    return auth.isAdmin() || (!!teamId && auth.isTeamLeader(teamId));
                default:
                    return false;
            }
        },
        ...auth
    };
}
export function ConditionalRender({ condition, appName, teamId, fallback, children }) {
    const { canAccess } = useAuthGuard();
    if (canAccess(condition, appName, teamId)) {
        return _jsx(_Fragment, { children: children });
    }
    return _jsx(_Fragment, { children: fallback });
}
// Specific guard components for common use cases
export function StaffOnly({ children, fallback }) {
    return (_jsx(ConditionalRender, { condition: "staff", fallback: fallback, children: children }));
}
export function AdminOnly({ children, fallback }) {
    return (_jsx(ConditionalRender, { condition: "admin", fallback: fallback, children: children }));
}
export function TeamMemberOnly({ teamId, children, fallback }) {
    return (_jsx(ConditionalRender, { condition: "team-member", teamId: teamId, fallback: fallback, children: children }));
}
export function TeamLeaderOnly({ teamId, children, fallback }) {
    return (_jsx(ConditionalRender, { condition: "team-leader", teamId: teamId, fallback: fallback, children: children }));
}
export function withAuthComponent(Component, options = {}) {
    return function AuthProtectedComponent(props) {
        const { user, profile, loading, signIn, hasAppAccess, isTeamMember, isTeamLeader, isAdmin } = useAuth();
        // Show loading while checking authentication
        if (loading) {
            return options.fallback ? _jsx(options.fallback, {}) : _jsx(DefaultLoadingComponent, {});
        }
        // Check if user is authenticated
        if (!user) {
            return _jsx(LoginPromptComponent, { onSignIn: () => signIn() });
        }
        // Check role-based access if requiredRoles is specified
        if (options.requiredRoles && options.requiredRoles.length > 0) {
            const userRole = profile?.role;
            const hasRequiredRole = options.requiredRoles.some(role => {
                switch (role) {
                    case 'admin':
                    case 'superadmin':
                        return isAdmin();
                    case 'staff':
                        return userRole === 'admin' || userRole === 'staff';
                    case 'manager':
                        // Manager role maps to staff or admin in our system
                        return userRole === 'admin' || userRole === 'staff';
                    case 'team-leader':
                        return isAdmin() || (options.teamId && isTeamLeader(options.teamId));
                    case 'team-member':
                        return userRole === 'admin' || userRole === 'staff' ||
                            (options.teamId && isTeamMember(options.teamId));
                    case 'viewer':
                        return userRole === 'admin' || userRole === 'staff' || userRole === 'viewer';
                    default:
                        // For any other role, check if it exactly matches the user's role
                        return userRole === role;
                }
            });
            if (!hasRequiredRole) {
                return options.fallback ? _jsx(options.fallback, {}) : _jsx(DefaultUnauthorizedComponent, {});
            }
        }
        // Check level-based access if requiredLevel is specified
        if (options.requiredLevel) {
            const guard = (_jsx(AuthGuard, { level: options.requiredLevel, appName: options.appName, teamId: options.teamId, fallback: options.fallback, children: _jsx(Component, { ...props }) }));
            return guard;
        }
        // Check app-specific access
        if (options.appName && !hasAppAccess(options.appName, 'read')) {
            return options.fallback ? _jsx(options.fallback, {}) : _jsx(DefaultUnauthorizedComponent, {});
        }
        // All checks passed, render the component
        return _jsx(Component, { ...props });
    };
}
