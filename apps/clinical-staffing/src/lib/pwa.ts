// PWA utilities for service worker and offline functionality

// Simple toast utility for class-based components
const showToast = {
  success: (message: string) => {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { title: 'Success', message, type: 'success' } 
      }));
    }
  },
  info: (message: string) => {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { title: 'Info', message, type: 'info' } 
      }));
    }
  },
  warning: (message: string) => {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { title: 'Warning', message, type: 'warning' } 
      }));
    }
  },
  error: (message: string) => {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { title: 'Error', message, type: 'error' } 
      }));
    }
  }
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface ScheduleUpdate {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: any;
  timestamp: number;
}

interface CachedSchedule {
  providerId: string;
  date: string;
  data: any;
  timestamp: number;
  isOffline?: boolean;
}

class ClinicalStaffingPWA {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isOnline: boolean = true;
  private syncManager: SyncManager | null = null;
  private db: IDBDatabase | null = null;
  private dbName = 'ClinicalStaffingDB';
  private dbVersion = 1;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.initializeListeners();
      this.initializeDB();
    }
  }

  private async initializeDB() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('schedule_updates')) {
          db.createObjectStore('schedule_updates', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('availability_updates')) {
          db.createObjectStore('availability_updates', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('cached_schedules')) {
          const scheduleStore = db.createObjectStore('cached_schedules', { keyPath: 'id' });
          scheduleStore.createIndex('providerId', 'providerId', { unique: false });
          scheduleStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('staff_availability')) {
          const availabilityStore = db.createObjectStore('staff_availability', { keyPath: 'id' });
          availabilityStore.createIndex('staffId', 'staffId', { unique: false });
          availabilityStore.createIndex('date', 'date', { unique: false });
        }
      };
    });
  }

  private initializeListeners() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', this.handleAppInstalled);

    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.handleSWMessage);
    }
  }

  // Register service worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      try {
        const registration = await navigator.serviceWorker.register('/clinical-staffing/sw.js', {
          scope: '/clinical-staffing/'
        });

        console.log('Service Worker registered:', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                showToast.info('New version available! Please refresh for the latest updates.');
              }
            });
          }
        });

        // Initialize sync manager
        if ('sync' in registration) {
          this.syncManager = registration.sync as any;
        }

        // Request periodic sync for schedule updates
        if ('periodicSync' in registration && registration.periodicSync) {
          try {
            await (registration.periodicSync as any).register('refresh-schedules', {
              minInterval: 60 * 60 * 1000 // 1 hour
            });
          } catch (error) {
            console.log('Periodic sync registration failed:', error);
          }
        }

        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Handle online event
  private handleOnline = () => {
    this.isOnline = true;
    showToast.success('You are back online! Syncing changes...');
    this.syncOfflineData();
  };

  // Handle offline event
  private handleOffline = () => {
    this.isOnline = false;
    showToast.warning('You are offline. Changes will be saved and synced when connection is restored.');
  };

  // Handle beforeinstallprompt event
  private handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    this.deferredPrompt = event as BeforeInstallPromptEvent;
    
    // Notify UI that install is available
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  };

  // Handle app installed event
  private handleAppInstalled = () => {
    console.log('Clinical Staffing PWA was installed');
    this.deferredPrompt = null;
    showToast.success('App installed successfully! You can now use it offline.');
  };

  // Handle service worker messages
  private handleSWMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'SYNC_SUCCESS') {
      showToast.success('Schedule changes synced successfully');
      // Refresh the UI data
      window.dispatchEvent(new CustomEvent('schedule-synced', { detail: event.data }));
    }
  };

  // Show install prompt
  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      showToast.success('Installing Clinical Staffing app...');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    this.deferredPrompt = null;
    return true;
  }

  // Check if app is installable
  isInstallable(): boolean {
    return this.deferredPrompt !== null;
  }

  // Check online status
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Check if running as installed PWA
  isRunningStandalone(): boolean {
    return (window.matchMedia('(display-mode: standalone)').matches) ||
           ('standalone' in window.navigator && (window.navigator as any).standalone) ||
           document.referrer.includes('android-app://');
  }

  // Sync offline data
  async syncOfflineData() {
    if (!this.syncManager || !this.isOnline) return;

    try {
      await this.syncManager.register('sync-schedule-updates');
      await this.syncManager.register('sync-availability-updates');
      console.log('Background sync registered');
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }

  // Save schedule update for offline sync
  async saveScheduleUpdate(update: ScheduleUpdate) {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['schedule_updates'], 'readwrite');
      const store = transaction.objectStore('schedule_updates');
      
      const request = store.add({
        ...update,
        id: `${update.type}_${Date.now()}_${Math.random()}`
      });
      
      request.onsuccess = () => {
        resolve(request.result);
        if (!this.isOnline) {
          showToast.info('Schedule change saved offline. Will sync when online.');
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Cache schedule data
  async cacheSchedule(schedule: CachedSchedule) {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached_schedules'], 'readwrite');
      const store = transaction.objectStore('cached_schedules');
      
      const request = store.put({
        ...schedule,
        id: `${schedule.providerId}_${schedule.date}`,
        timestamp: Date.now()
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached schedule
  async getCachedSchedule(providerId: string, date: string): Promise<CachedSchedule | null> {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached_schedules'], 'readonly');
      const store = transaction.objectStore('cached_schedules');
      const request = store.get(`${providerId}_${date}`);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Check if cache is stale (older than 24 hours)
          const isStale = Date.now() - result.timestamp > 24 * 60 * 60 * 1000;
          if (isStale && this.isOnline) {
            resolve(null); // Force refresh from network
          } else {
            resolve({ ...result, isOffline: !this.isOnline });
          }
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get all cached schedules for a date
  async getCachedSchedulesByDate(date: string): Promise<CachedSchedule[]> {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached_schedules'], 'readonly');
      const store = transaction.objectStore('cached_schedules');
      const index = store.index('date');
      const request = index.getAll(date);
      
      request.onsuccess = () => {
        const schedules = request.result || [];
        resolve(schedules.map(s => ({ ...s, isOffline: !this.isOnline })));
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Save staff availability for offline access
  async cacheStaffAvailability(staffId: string, date: string, availability: any) {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['staff_availability'], 'readwrite');
      const store = transaction.objectStore('staff_availability');
      
      const request = store.put({
        id: `${staffId}_${date}`,
        staffId,
        date,
        availability,
        timestamp: Date.now()
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached staff availability
  async getCachedStaffAvailability(staffId: string, date: string): Promise<any | null> {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['staff_availability'], 'readonly');
      const store = transaction.objectStore('staff_availability');
      const request = store.get(`${staffId}_${date}`);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear old cached data
  async clearOldCache(daysToKeep: number = 7) {
    if (!this.db) await this.initializeDB();
    
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    const stores = ['cached_schedules', 'staff_availability'];
    
    for (const storeName of stores) {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.timestamp < cutoffTime) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    }
  }

  // Clean up
  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', this.handleAppInstalled);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', this.handleSWMessage);
    }
    
    if (this.db) {
      this.db.close();
    }
  }
}

// Create singleton instance
export const pwaManager = new ClinicalStaffingPWA();

// Export utility functions
export const registerServiceWorker = () => pwaManager.registerServiceWorker();
export const showInstallPrompt = () => pwaManager.showInstallPrompt();
export const isInstallable = () => pwaManager.isInstallable();
export const isOnline = () => pwaManager.getOnlineStatus();
export const syncOfflineData = () => pwaManager.syncOfflineData();
export const saveScheduleUpdate = (update: ScheduleUpdate) => pwaManager.saveScheduleUpdate(update);
export const cacheSchedule = (schedule: CachedSchedule) => pwaManager.cacheSchedule(schedule);
export const getCachedSchedule = (providerId: string, date: string) => pwaManager.getCachedSchedule(providerId, date);
export const getCachedSchedulesByDate = (date: string) => pwaManager.getCachedSchedulesByDate(date);
export const cacheStaffAvailability = (staffId: string, date: string, availability: any) => pwaManager.cacheStaffAvailability(staffId, date, availability);
export const getCachedStaffAvailability = (staffId: string, date: string) => pwaManager.getCachedStaffAvailability(staffId, date);
export const clearOldCache = (daysToKeep?: number) => pwaManager.clearOldCache(daysToKeep);
export const isRunningStandalone = () => pwaManager.isRunningStandalone();