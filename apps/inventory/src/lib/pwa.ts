// PWA utilities for service worker and offline functionality
// Global toast instance for use in non-component contexts

// Initialize global toast when available
if (typeof window !== 'undefined') {
  // This will be set when the first component using useToast mounts
  (window as any).__gangerToast = null;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Simple toast function for non-React contexts
function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (typeof window !== 'undefined' && (window as any).__gangerToast) {
    (window as any).__gangerToast({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      description: message,
      variant: type === 'error' ? 'destructive' : 'default'
    });
  } else {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isOnline: boolean = true;
  private syncManager: any | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.initializeListeners();
    }
  }

  private initializeListeners() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', this.handleAppInstalled);
  }

  // Register service worker
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      try {
        const registration = await navigator.serviceWorker.register('/inventory/sw.js', {
          scope: '/inventory/'
        });

        console.log('Service Worker registered:', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                showToast('New version available! Please refresh the page.', 'info');
              }
            });
          }
        });

        // Initialize sync manager
        if ('sync' in registration) {
          this.syncManager = registration.sync as any;
        }

        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return undefined;
      }
    }
    return undefined;
  }

  // Handle online event
  private handleOnline = () => {
    this.isOnline = true;
    showToast('You are back online!', 'success');
    this.syncOfflineData();
  };

  // Handle offline event
  private handleOffline = () => {
    this.isOnline = false;
    showToast('You are offline. Some features may be limited.', 'info');
  };

  // Handle beforeinstallprompt event
  private handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    this.deferredPrompt = event as BeforeInstallPromptEvent;
    
    // Show install button or banner
    this.showInstallPrompt();
  };

  // Handle app installed event
  private handleAppInstalled = () => {
    console.log('PWA was installed');
    this.deferredPrompt = null;
    showToast('App installed successfully!', 'success');
  };

  // Show install prompt
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    // Show custom install UI
    const shouldInstall = await this.showCustomInstallUI();

    if (shouldInstall) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      this.deferredPrompt = null;
      return true;
    }
    
    return false;
  }

  // Show custom install UI
  private async showCustomInstallUI(): Promise<boolean> {
    // This would typically show a custom UI component
    // For now, we'll use a simple confirm dialog
    return confirm('Install Ganger Inventory app for offline access and better performance?');
  }

  // Check if app is installable
  isInstallable(): boolean {
    return this.deferredPrompt !== null;
  }

  // Check online status
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Sync offline data
  async syncOfflineData() {
    if (!this.syncManager) return;

    try {
      await this.syncManager.register('sync-inventory-updates');
      console.log('Background sync registered');
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }

  // Cache API response
  async cacheAPIResponse(url: string, response: any) {
    if ('caches' in window) {
      try {
        const cache = await caches.open('ganger-inventory-api-v1');
        const responseToCache = new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json' }
        });
        await cache.put(url, responseToCache);
      } catch (error) {
        console.error('Failed to cache API response:', error);
      }
    }
  }

  // Get cached API response
  async getCachedAPIResponse(url: string): Promise<any | null> {
    if ('caches' in window) {
      try {
        const cache = await caches.open('ganger-inventory-api-v1');
        const response = await cache.match(url);
        if (response) {
          return await response.json();
        }
      } catch (error) {
        console.error('Failed to get cached API response:', error);
      }
    }
    return null;
  }

  // Save offline action to IndexedDB
  async saveOfflineAction(action: {
    type: 'CREATE' | 'UPDATE' | 'DELETE';
    endpoint: string;
    data: any;
    timestamp: number;
  }) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('GangerInventoryDB', 1);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offline_actions'], 'readwrite');
        const store = transaction.objectStore('offline_actions');
        
        const addRequest = store.add({
          ...action,
          id: `${action.type}_${Date.now()}_${Math.random()}`
        });
        
        addRequest.onsuccess = () => resolve(addRequest.result);
        addRequest.onerror = () => reject(addRequest.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('offline_actions')) {
          db.createObjectStore('offline_actions', { keyPath: 'id' });
        }
      };
    });
  }

  // Get pending offline actions
  async getPendingOfflineActions(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('GangerInventoryDB', 1);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offline_actions'], 'readonly');
        const store = transaction.objectStore('offline_actions');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
    });
  }

  // Clear offline action
  async clearOfflineAction(id: string) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('GangerInventoryDB', 1);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offline_actions'], 'readwrite');
        const store = transaction.objectStore('offline_actions');
        const deleteRequest = store.delete(id);
        
        deleteRequest.onsuccess = () => resolve(deleteRequest.result);
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
    });
  }

  // Check if running as installed PWA
  isRunningStandalone(): boolean {
    return (window.matchMedia('(display-mode: standalone)').matches) ||
           ('standalone' in window.navigator && (window.navigator as any).standalone) ||
           document.referrer.includes('android-app://');
  }

  // Clean up
  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', this.handleAppInstalled);
  }
}

// Create singleton instance
export const pwaManager = new PWAManager();

// Export utility functions
export const registerServiceWorker = () => pwaManager.registerServiceWorker();
export const showInstallPrompt = () => pwaManager.showInstallPrompt();
export const isInstallable = () => pwaManager.isInstallable();
export const isOnline = () => pwaManager.getOnlineStatus();
export const syncOfflineData = () => pwaManager.syncOfflineData();
export const cacheAPIResponse = (url: string, response: any) => pwaManager.cacheAPIResponse(url, response);
export const getCachedAPIResponse = (url: string) => pwaManager.getCachedAPIResponse(url);
export const saveOfflineAction = (action: any) => pwaManager.saveOfflineAction(action);
export const getPendingOfflineActions = () => pwaManager.getPendingOfflineActions();
export const clearOfflineAction = (id: string) => pwaManager.clearOfflineAction(id);
export const isRunningStandalone = () => pwaManager.isRunningStandalone();