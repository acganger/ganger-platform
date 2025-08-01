/**
 * Application URLs configuration
 */
export declare const APP_URLS: {
    readonly 'eos-l10': "https://staff.gangerdermatology.com/l10";
    readonly handouts: "https://staff.gangerdermatology.com/handouts";
    readonly inventory: "https://staff.gangerdermatology.com/inventory";
    readonly 'checkin-kiosk': "https://staff.gangerdermatology.com/checkin-kiosk";
    readonly 'medication-auth': "https://staff.gangerdermatology.com/medication-auth";
    readonly staff: "https://staff.gangerdermatology.com/staff";
    readonly lunch: "https://lunch.gangerdermatology.com";
    readonly 'pharma-scheduling': "https://staff.gangerdermatology.com/pharma-scheduling";
};
export type AppName = keyof typeof APP_URLS;
/**
 * Navigate to another app while preserving authentication
 */
export declare function navigateToApp(targetApp: AppName, path?: string, preserveSession?: boolean): void;
/**
 * Get current app name from URL
 */
export declare function getCurrentApp(): AppName | null;
/**
 * Check if user is navigating from another app with SSO
 */
export declare function isSSONavigation(): boolean;
/**
 * Cross-app session event listener
 * Detects when authentication changes in other apps
 */
export declare class CrossAppSessionManager {
    private listeners;
    private channel;
    constructor();
    private handleMessage;
    /**
     * Notify other apps of authentication change
     */
    notifyAuthChange(action: 'signin' | 'signout'): void;
    /**
     * Listen for authentication changes from other apps
     */
    onAuthChange(listener: (event: 'signin' | 'signout') => void): () => void;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
/**
 * Global session manager instance
 */
export declare const sessionManager: CrossAppSessionManager;
/**
 * App-specific redirect URLs for OAuth
 */
export declare function getAppAuthCallbackUrl(appName: AppName): string;
/**
 * Universal logout - signs out from all apps
 */
export declare function universalLogout(): void;
/**
 * Create navigation menu for app switching
 */
export interface AppMenuItem {
    name: string;
    displayName: string;
    url: string;
    icon?: string;
    description?: string;
}
export declare function getAppNavigationMenu(): AppMenuItem[];
