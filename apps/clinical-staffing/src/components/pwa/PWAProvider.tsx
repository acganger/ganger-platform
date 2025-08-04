'use client';

import { useEffect } from 'react';
import { registerServiceWorker, clearOldCache } from '../../lib/pwa';
import { OfflineIndicator } from './OfflineIndicator';
import { InstallPrompt } from './InstallPrompt';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Clear old cache data periodically
    const clearCache = async () => {
      try {
        await clearOldCache(7); // Keep 7 days of cache
      } catch (error) {
        console.error('Failed to clear old cache:', error);
      }
    };

    // Clear cache on startup
    clearCache();

    // Clear cache every 24 hours
    const interval = setInterval(clearCache, 24 * 60 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {children}
      <OfflineIndicator />
      <InstallPrompt />
    </>
  );
}