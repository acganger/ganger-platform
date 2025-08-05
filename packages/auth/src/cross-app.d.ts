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
 * Navigate to another Ganger Platform application while preserving authentication.
 * Handles SSO navigation between different apps in the platform.
 *
 * @param {AppName} targetApp - Name of the target application to navigate to
 * @param {string} [path=''] - Optional path within the target app (e.g., '/settings')
 * @param {boolean} [preserveSession=true] - Whether to preserve the authentication session
 *
 * @example
 * // Navigate to inventory app
 * navigateToApp('inventory');
 *
 * @example
 * // Navigate to specific page in another app
 * navigateToApp('handouts', '/create');
 *
 * @example
 * // Navigate without SSO (requires new login)
 * navigateToApp('pharma-scheduling', '', false);
 */
export declare function navigateToApp(targetApp: AppName, path?: string, preserveSession?: boolean): void;
/**
 * Get the current application name based on the current URL.
 * Useful for app-specific logic and navigation highlighting.
 *
 * @returns {AppName | null} The current app name or null if not in a recognized app
 *
 * @example
 * // Highlight current app in navigation
 * const currentApp = getCurrentApp();
 * const navItems = apps.map(app => ({
 *   ...app,
 *   isActive: app.name === currentApp
 * }));
 */
export declare function getCurrentApp(): AppName | null;
/**
 * Check if the current navigation is from another app with SSO.
 * Detects cross-app navigation to handle session preservation.
 *
 * @returns {boolean} True if navigating from another app with SSO
 *
 * @example
 * // In auth callback
 * if (isSSONavigation()) {
 *   // Skip certain auth steps for SSO users
 *   redirectToOriginalPage();
 * } else {
 *   // Full auth flow for direct access
 *   performFullAuth();
 * }
 */
export declare function isSSONavigation(): boolean;
/**
 * Cross-app session event manager using BroadcastChannel API.
 * Synchronizes authentication state across multiple browser tabs/windows.
 * Detects when authentication changes in other apps and notifies listeners.
 *
 * @class CrossAppSessionManager
 *
 * @example
 * // Create instance and listen for auth changes
 * const manager = new CrossAppSessionManager();
 * const unsubscribe = manager.onAuthChange((event) => {
 *   if (event === 'signout') {
 *     // Handle signout from another tab
 *   }
 * });
 */
export declare class CrossAppSessionManager {
    private listeners;
    private channel;
    constructor();
    private handleMessage;
    /**
     * Notify other apps/tabs of authentication change.
     * Broadcasts auth events to all listening tabs/windows.
     *
     * @param {'signin' | 'signout'} action - The authentication action that occurred
     *
     * @example
     * // After successful sign in
     * await signIn();
     * sessionManager.notifyAuthChange('signin');
     *
     * @example
     * // After sign out
     * await signOut();
     * sessionManager.notifyAuthChange('signout');
     */
    notifyAuthChange(action: 'signin' | 'signout'): void;
    /**
     * Listen for authentication changes from other apps/tabs.
     *
     * @param {Function} listener - Callback function called when auth changes
     * @returns {Function} Cleanup function to remove the listener
     *
     * @example
     * // Subscribe to auth changes
     * const unsubscribe = sessionManager.onAuthChange((event) => {
     *   if (event === 'signin') {
     *     // Refresh user data
     *     refreshProfile();
     *   } else if (event === 'signout') {
     *     // Clear local state
     *     clearUserData();
     *   }
     * });
     *
     * // Later: cleanup
     * unsubscribe();
     */
    onAuthChange(listener: (event: 'signin' | 'signout') => void): () => void;
    /**
     * Cleanup resources and close connections.
     * Should be called when the session manager is no longer needed.
     *
     * @example
     * // In cleanup/unmount
     * sessionManager.destroy();
     */
    destroy(): void;
}
/**
 * Global session manager instance for cross-app authentication sync.
 * Singleton instance that should be used across the application.
 *
 * @type {CrossAppSessionManager}
 *
 * @example
 * import { sessionManager } from '@ganger/auth';
 *
 * // Listen for auth changes
 * sessionManager.onAuthChange((event) => {
 *   console.log('Auth changed:', event);
 * });
 */
export declare const sessionManager: CrossAppSessionManager;
/**
 * Get the OAuth callback URL for a specific app.
 * Used to configure app-specific OAuth redirect URLs.
 *
 * @param {AppName} appName - Name of the application
 * @returns {string} Full OAuth callback URL for the app
 *
 * @example
 * // Get callback URL for inventory app
 * const callbackUrl = getAppAuthCallbackUrl('inventory');
 * // Returns: 'https://staff.gangerdermatology.com/inventory/auth/callback'
 */
export declare function getAppAuthCallbackUrl(appName: AppName): string;
/**
 * Universal logout that signs out from all Ganger Platform apps.
 * Notifies all open tabs/windows and redirects to main login page.
 *
 * @example
 * // In logout button handler
 * const handleLogout = () => {
 *   universalLogout();
 * };
 */
export declare function universalLogout(): void;
/**
 * Interface for app navigation menu items.
 * Used to build app switcher menus across the platform.
 */
export interface AppMenuItem {
    name: string;
    displayName: string;
    url: string;
    icon?: string;
    description?: string;
}
/**
 * Get the complete app navigation menu for the Ganger Platform.
 * Returns all available apps with their metadata for building navigation UIs.
 *
 * @returns {AppMenuItem[]} Array of app menu items with metadata
 *
 * @example
 * // Build app switcher dropdown
 * function AppSwitcher() {
 *   const apps = getAppNavigationMenu();
 *   const currentApp = getCurrentApp();
 *
 *   return (
 *     <select onChange={(e) => navigateToApp(e.target.value)}>
 *       {apps.map(app => (
 *         <option
 *           key={app.name}
 *           value={app.name}
 *           selected={app.name === currentApp}
 *         >
 *           {app.displayName}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * }
 */
export declare function getAppNavigationMenu(): AppMenuItem[];
