"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStaffAuth = useStaffAuth;
const context_1 = require("../context");
function useStaffAuth() {
    const auth = (0, context_1.useAuth)();
    return {
        user: auth.user,
        isAuthenticated: !!auth.user,
        isLoading: auth.loading,
        profile: auth.profile,
        signIn: auth.signIn,
        signOut: auth.signOut,
        permissions: auth.appPermissions,
        activeTeam: auth.activeTeam,
        teamRole: auth.teamRole
    };
}
