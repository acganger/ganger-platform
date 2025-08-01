export declare function useStaffAuth(): {
    user: import("..").AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    profile: import("..").UserProfile | null;
    signIn: (redirectTo?: string) => Promise<void>;
    signOut: () => Promise<void>;
    permissions: Record<string, "admin" | "write" | "read" | "none">;
    activeTeam: import("..").Team | null;
    teamRole: "viewer" | "leader" | "member" | null;
};
