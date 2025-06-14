'use client'

import { useState, useEffect, useCallback, type ReactNode, type ComponentType } from 'react';

// Error recovery strategies and utilities

export interface RecoveryStrategy {
  canRecover: (error: Error) => boolean;
  recover: (error: Error) => Promise<any>;
  description: string;
}

export interface RecoveryOptions {
  strategies: RecoveryStrategy[];
  maxAttempts?: number;
  onRecoveryAttempt?: (strategy: RecoveryStrategy, attempt: number) => void;
  onRecoverySuccess?: (strategy: RecoveryStrategy) => void;
  onRecoveryFailure?: (error: Error) => void;
}

// Common recovery strategies
export const commonRecoveryStrategies: RecoveryStrategy[] = [
  // Network connectivity recovery
  {
    canRecover: (error: Error) => {
      return error.message.includes('fetch') || 
             error.message.includes('network') ||
             error.name === 'NetworkError';
    },
    recover: async (error: Error) => {
      // Wait for network to be available
      if (!navigator.onLine) {
        await waitForOnline();
      }
      
      // Simple connectivity test
      try {
        await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        return { recovered: true, strategy: 'network' };
      } catch {
        throw new Error('Network connectivity test failed');
      }
    },
    description: 'Restore network connectivity'
  },

  // Cache refresh recovery
  {
    canRecover: (error: Error) => {
      return error.message.includes('cache') ||
             error.message.includes('stale') ||
             error.message.includes('outdated');
    },
    recover: async (error: Error) => {
      // Clear relevant caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      }
      
      // Clear localStorage cache
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache_') || key.startsWith('data_')) {
          localStorage.removeItem(key);
        }
      });
      
      return { recovered: true, strategy: 'cache_refresh' };
    },
    description: 'Clear and refresh cached data'
  },

  // Authentication refresh recovery
  {
    canRecover: (error: Error) => {
      return error.message.includes('401') ||
             error.message.includes('unauthorized') ||
             error.message.includes('token');
    },
    recover: async (error: Error) => {
      try {
        // Attempt to refresh authentication token
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Token refresh failed');
        }
        
        const { token } = await response.json();
        localStorage.setItem('authToken', token);
        
        return { recovered: true, strategy: 'auth_refresh', token };
      } catch (refreshError) {
        // Redirect to login if refresh fails
        window.location.href = '/login';
        throw refreshError;
      }
    },
    description: 'Refresh authentication credentials'
  },

  // Service worker recovery
  {
    canRecover: (error: Error) => {
      return error.message.includes('service worker') ||
             error.message.includes('worker') ||
             error.message.includes('sw');
    },
    recover: async (error: Error) => {
      if ('serviceWorker' in navigator) {
        // Unregister existing service worker
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
        
        // Re-register service worker
        await navigator.serviceWorker.register('/sw.js');
        
        return { recovered: true, strategy: 'service_worker_refresh' };
      }
      
      throw new Error('Service Worker not supported');
    },
    description: 'Refresh service worker registration'
  },

  // Database connection recovery
  {
    canRecover: (error: Error) => {
      return error.message.includes('database') ||
             error.message.includes('connection') ||
             error.message.includes('timeout');
    },
    recover: async (error: Error) => {
      // Test database connectivity
      try {
        const response = await fetch('/api/health/database', {
          method: 'GET',
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          throw new Error('Database health check failed');
        }
        
        return { recovered: true, strategy: 'database_reconnect' };
      } catch {
        throw new Error('Database recovery failed');
      }
    },
    description: 'Restore database connectivity'
  },

  // Memory cleanup recovery
  {
    canRecover: (error: Error) => {
      return error.message.includes('memory') ||
             error.message.includes('heap') ||
             error.name === 'QuotaExceededError';
    },
    recover: async (error: Error) => {
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      // Clear non-essential data from memory
      clearNonEssentialData();
      
      // Clear large objects from localStorage
      clearLargeStorageItems();
      
      return { recovered: true, strategy: 'memory_cleanup' };
    },
    description: 'Free up memory resources'
  }
];

// Recovery orchestrator
export async function attemptRecovery(
  error: Error, 
  options: RecoveryOptions
): Promise<{ recovered: boolean; strategy?: RecoveryStrategy; result?: any }> {
  const { strategies, maxAttempts = 3 } = options;
  
  for (const strategy of strategies) {
    if (!strategy.canRecover(error)) {
      continue;
    }
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        options.onRecoveryAttempt?.(strategy, attempt);
        
        const result = await strategy.recover(error);
        
        options.onRecoverySuccess?.(strategy);
        
        return {
          recovered: true,
          strategy,
          result
        };
      } catch (recoveryError) {
        console.error(
          `Recovery strategy "${strategy.description}" failed on attempt ${attempt}:`,
          recoveryError
        );
        
        if (attempt === maxAttempts) {
          options.onRecoveryFailure?.(recoveryError as Error);
        }
      }
    }
  }
  
  return { recovered: false };
}

// Auto-recovery wrapper for functions
export function withAutoRecovery<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  recoveryOptions: RecoveryOptions
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const recovery = await attemptRecovery(error as Error, recoveryOptions);
      
      if (recovery.recovered) {
        // Retry the original function after successful recovery
        return await fn(...args);
      } else {
        // Re-throw the original error if recovery failed
        throw error;
      }
    }
  }) as T;
}

// Utility functions
function waitForOnline(): Promise<void> {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve();
    } else {
      const handleOnline = () => {
        window.removeEventListener('online', handleOnline);
        resolve();
      };
      window.addEventListener('online', handleOnline);
    }
  });
}

function clearNonEssentialData(): void {
  // Clear cached images
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('images') || name.includes('assets')) {
          caches.delete(name);
        }
      });
    });
  }
  
  // Clear large arrays/objects from global scope
  if ((window as any).__APP_CACHE__) {
    delete (window as any).__APP_CACHE__;
  }
}

function clearLargeStorageItems(): void {
  const LARGE_ITEM_THRESHOLD = 10000; // 10KB
  
  Object.keys(localStorage).forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value && value.length > LARGE_ITEM_THRESHOLD) {
        // Keep essential items
        if (!key.startsWith('auth') && !key.startsWith('user') && !key.startsWith('settings')) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      // Item might be corrupted, remove it
      localStorage.removeItem(key);
    }
  });
}

// Progressive degradation strategy
export class ProgressiveDegradation {
  private features: Map<string, boolean> = new Map();
  private fallbacks: Map<string, () => any> = new Map();
  
  constructor() {
    this.initializeFeatures();
  }
  
  private initializeFeatures(): void {
    // Test for modern features
    this.features.set('fetch', 'fetch' in window);
    this.features.set('serviceWorker', 'serviceWorker' in navigator);
    this.features.set('indexedDB', 'indexedDB' in window);
    this.features.set('webSockets', 'WebSocket' in window);
    this.features.set('notifications', 'Notification' in window);
    this.features.set('geolocation', 'geolocation' in navigator);
    this.features.set('camera', 'mediaDevices' in navigator);
  }
  
  public isFeatureAvailable(feature: string): boolean {
    return this.features.get(feature) ?? false;
  }
  
  public setFallback(feature: string, fallback: () => any): void {
    this.fallbacks.set(feature, fallback);
  }
  
  public useFeatureOrFallback<T>(feature: string, modernImpl: () => T, fallbackImpl?: () => T): T {
    if (this.isFeatureAvailable(feature)) {
      try {
        return modernImpl();
      } catch (error) {
      }
    }
    
    // Use provided fallback or registered fallback
    const fallback = fallbackImpl || this.fallbacks.get(feature);
    if (fallback) {
      return fallback();
    }
    
    throw new Error(`Feature "${feature}" not available and no fallback provided`);
  }
  
  public degradeGracefully(error: Error): void {
    // Disable features that are causing issues
    if (error.message.includes('fetch')) {
      this.features.set('fetch', false);
    }
    
    if (error.message.includes('IndexedDB')) {
      this.features.set('indexedDB', false);
    }
    
    if (error.message.includes('WebSocket')) {
      this.features.set('webSockets', false);
    }
  }
}

// Singleton instance
export const progressiveDegradation = new ProgressiveDegradation();

// Error recovery React hook
export function useErrorRecovery(strategies: RecoveryStrategy[] = commonRecoveryStrategies) {
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastRecovery, setLastRecovery] = useState<{
    strategy?: RecoveryStrategy;
    success: boolean;
    timestamp: number;
  } | null>(null);

  const attemptErrorRecovery = useCallback(async (error: Error) => {
    setIsRecovering(true);
    
    try {
      const result = await attemptRecovery(error, {
        strategies,
        onRecoveryAttempt: (strategy, attempt) => {
        },
        onRecoverySuccess: (strategy) => {
          setLastRecovery({
            strategy,
            success: true,
            timestamp: Date.now()
          });
        },
        onRecoveryFailure: (recoveryError) => {
          setLastRecovery({
            success: false,
            timestamp: Date.now()
          });
        }
      });
      
      return result;
    } finally {
      setIsRecovering(false);
    }
  }, [strategies]);

  return {
    attemptErrorRecovery,
    isRecovering,
    lastRecovery
  };
}