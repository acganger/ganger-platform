// Cross-App Session Management for Ganger Platform
// Enables seamless SSO navigation between applications
/**
 * Application URLs configuration
 */
export const APP_URLS = {
    'eos-l10': 'https://staff.gangerdermatology.com/l10',
    'handouts': 'https://staff.gangerdermatology.com/handouts',
    'inventory': 'https://staff.gangerdermatology.com/inventory',
    'checkin-kiosk': 'https://staff.gangerdermatology.com/checkin-kiosk',
    'medication-auth': 'https://staff.gangerdermatology.com/medication-auth',
    'staff': 'https://staff.gangerdermatology.com/staff',
    'lunch': 'https://lunch.gangerdermatology.com',
    'pharma-scheduling': 'https://staff.gangerdermatology.com/pharma-scheduling'
};
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
export function navigateToApp(targetApp, path = '', preserveSession = true) {
    const baseUrl = APP_URLS[targetApp];
    const targetUrl = `${baseUrl}${path}`;
    if (preserveSession && typeof window !== 'undefined') {
        // Add session preservation parameters if needed
        const url = new URL(targetUrl);
        url.searchParams.set('sso', 'true');
        window.location.href = url.toString();
    }
    else {
        window.location.href = targetUrl;
    }
}
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
export function getCurrentApp() {
    if (typeof window === 'undefined')
        return null;
    const currentUrl = window.location.href;
    for (const [appName, appUrl] of Object.entries(APP_URLS)) {
        if (currentUrl.startsWith(appUrl)) {
            return appName;
        }
    }
    return null;
}
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
export function isSSONavigation() {
    if (typeof window === 'undefined')
        return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('sso') === 'true';
}
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
export class CrossAppSessionManager {
    constructor() {
        this.listeners = [];
        this.channel = null;
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            this.channel = new BroadcastChannel('ganger-platform-auth');
            this.channel.addEventListener('message', this.handleMessage.bind(this));
        }
    }
    handleMessage(event) {
        if (event.data?.type === 'auth-change') {
            this.listeners.forEach(listener => listener(event.data.action));
        }
    }
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
    notifyAuthChange(action) {
        if (this.channel) {
            this.channel.postMessage({
                type: 'auth-change',
                action,
                timestamp: Date.now()
            });
        }
    }
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
    onAuthChange(listener) {
        this.listeners.push(listener);
        // Return cleanup function
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    /**
     * Cleanup resources and close connections.
     * Should be called when the session manager is no longer needed.
     *
     * @example
     * // In cleanup/unmount
     * sessionManager.destroy();
     */
    destroy() {
        if (this.channel) {
            this.channel.close();
            this.channel = null;
        }
        this.listeners = [];
    }
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
export const sessionManager = new CrossAppSessionManager();
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
export function getAppAuthCallbackUrl(appName) {
    const baseUrl = APP_URLS[appName];
    return `${baseUrl}/auth/callback`;
}
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
export function universalLogout() {
    // Notify all apps
    sessionManager.notifyAuthChange('signout');
    // Redirect to main staff portal login
    setTimeout(() => {
        window.location.href = `${APP_URLS.staff}/auth/login`;
    }, 100);
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
export function getAppNavigationMenu() {
    return [
        {
            name: 'eos-l10',
            displayName: 'EOS L10',
            url: APP_URLS['eos-l10'],
            icon: 'target',
            description: 'Team management and EOS implementation'
        },
        {
            name: 'handouts',
            displayName: 'Patient Handouts',
            url: APP_URLS.handouts,
            icon: 'file-text',
            description: 'Custom patient education materials'
        },
        {
            name: 'inventory',
            displayName: 'Inventory',
            url: APP_URLS.inventory,
            icon: 'package',
            description: 'Medical supply tracking and management'
        },
        {
            name: 'checkin-kiosk',
            displayName: 'Check-in Kiosk',
            url: APP_URLS['checkin-kiosk'],
            icon: 'monitor',
            description: 'Patient self-service terminal'
        },
        {
            name: 'medication-auth',
            displayName: 'Medication Auth',
            url: APP_URLS['medication-auth'],
            icon: 'shield-check',
            description: 'Prescription authorization system'
        },
        {
            name: 'pharma-scheduling',
            displayName: 'Pharma Scheduling',
            url: APP_URLS['pharma-scheduling'],
            icon: 'calendar',
            description: 'Pharmaceutical representative scheduling'
        },
        {
            name: 'staff',
            displayName: 'Staff Portal',
            url: APP_URLS.staff,
            icon: 'users',
            description: 'Employee management and HR tools'
        },
        {
            name: 'lunch',
            displayName: 'Lunch System',
            url: APP_URLS.lunch,
            icon: 'coffee',
            description: 'Food ordering and delivery management'
        }
    ];
}
