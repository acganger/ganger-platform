'use client';

import { useEffect, useState } from 'react';
import { isOnline } from '../../lib/pwa';

export function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const status = isOnline();
      setOnline(status);
      
      // Show indicator briefly when going online
      if (status && !online) {
        setShow(true);
        setTimeout(() => setShow(false), 3000);
      } else if (!status) {
        setShow(true);
      }
    };

    // Initial check
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [online]);

  if (!show) return null;

  return (
    <div className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
      online 
        ? 'bg-green-500 text-white' 
        : 'bg-orange-500 text-white'
    }`}>
      {online ? (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          <span className="text-sm font-medium">Back Online</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
          <span className="text-sm font-medium">Offline Mode</span>
        </>
      )}
    </div>
  );
}