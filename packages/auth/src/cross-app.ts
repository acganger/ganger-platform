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
} as const;

export type AppName = keyof typeof APP_URLS;

/**
 * Navigate to another app while preserving authentication
 */
export function navigateToApp(targetApp: AppName, path: string = '', preserveSession: boolean = true) {
  const baseUrl = APP_URLS[targetApp];
  const targetUrl = `${baseUrl}${path}`;
  
  if (preserveSession && typeof window !== 'undefined') {
    // Add session preservation parameters if needed
    const url = new URL(targetUrl);
    url.searchParams.set('sso', 'true');
    window.location.href = url.toString();
  } else {
    window.location.href = targetUrl;
  }
}

/**
 * Get current app name from URL
 */
export function getCurrentApp(): AppName | null {
  if (typeof window === 'undefined') return null;
  
  const currentUrl = window.location.href;
  
  for (const [appName, appUrl] of Object.entries(APP_URLS)) {
    if (currentUrl.startsWith(appUrl)) {
      return appName as AppName;
    }
  }
  
  return null;
}

/**
 * Check if user is navigating from another app with SSO
 */
export function isSSONavigation(): boolean {
  if (typeof window === 'undefined') return false;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('sso') === 'true';
}

/**
 * Cross-app session event listener
 * Detects when authentication changes in other apps
 */
export class CrossAppSessionManager {
  private listeners: ((event: 'signin' | 'signout') => void)[] = [];
  private channel: BroadcastChannel | null = null;
  
  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('ganger-platform-auth');
      this.channel.addEventListener('message', this.handleMessage.bind(this));
    }
  }
  
  private handleMessage(event: MessageEvent) {
    if (event.data?.type === 'auth-change') {
      this.listeners.forEach(listener => listener(event.data.action));
    }
  }
  
  /**
   * Notify other apps of authentication change
   */
  notifyAuthChange(action: 'signin' | 'signout') {
    if (this.channel) {
      this.channel.postMessage({
        type: 'auth-change',
        action,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Listen for authentication changes from other apps
   */
  onAuthChange(listener: (event: 'signin' | 'signout') => void) {
    this.listeners.push(listener);
    
    // Return cleanup function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Cleanup resources
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
 * Global session manager instance
 */
export const sessionManager = new CrossAppSessionManager();

/**
 * App-specific redirect URLs for OAuth
 */
export function getAppAuthCallbackUrl(appName: AppName): string {
  const baseUrl = APP_URLS[appName];
  return `${baseUrl}/auth/callback`;
}

/**
 * Universal logout - signs out from all apps
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
 * Create navigation menu for app switching
 */
export interface AppMenuItem {
  name: string;
  displayName: string;
  url: string;
  icon?: string;
  description?: string;
}

export function getAppNavigationMenu(): AppMenuItem[] {
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