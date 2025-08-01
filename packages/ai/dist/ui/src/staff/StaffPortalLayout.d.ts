interface QuickAction {
    name: string;
    path: string;
    external?: boolean;
    description?: string;
}
interface WorkflowConnection {
    name: string;
    path: string;
    description: string;
    category: string;
}
interface StaffPortalLayoutProps {
    children: React.ReactNode;
    currentApp: string;
    relatedApps?: string[];
    quickActions?: QuickAction[];
    workflowConnections?: WorkflowConnection[];
    preservePWA?: boolean;
    hasExternalInterface?: boolean;
    specialIntegrations?: string[];
    preserveFinancialWorkflows?: boolean;
    complianceMode?: boolean;
    appDescription?: string;
    interfaceNote?: string;
    integrationNotes?: Record<string, string>;
}
export declare function StaffPortalLayout({ children, currentApp, relatedApps, quickActions, workflowConnections, preservePWA, hasExternalInterface, specialIntegrations, preserveFinancialWorkflows, complianceMode, appDescription, interfaceNote, integrationNotes }: StaffPortalLayoutProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=StaffPortalLayout.d.ts.map