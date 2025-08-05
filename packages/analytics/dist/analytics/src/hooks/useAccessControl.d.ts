export declare function useAccessControl(): {
    isManager: boolean;
    isAdmin: boolean;
    canViewAllMetrics: boolean;
    canExportData: boolean;
    canViewFinancialMetrics: boolean;
    canViewStaffMetrics: boolean;
    canViewClinicalMetrics: boolean;
    user: import("@ganger/auth").AuthUser | null;
    profile: import("@ganger/auth").UserProfile | null;
};
