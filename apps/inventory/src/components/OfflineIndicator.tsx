import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOffline } from '../hooks/useOffline';

export function OfflineIndicator() {
  const { isOnline, pendingActions } = useOffline({ showToasts: false });
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Show indicator when offline or has pending actions
    setShowIndicator(!isOnline || pendingActions.length > 0);
  }, [isOnline, pendingActions]);

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className={`
            flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
            ${isOnline ? 'bg-blue-50 border border-blue-200' : 'bg-yellow-50 border border-yellow-200'}
          `}>
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {isOnline ? (
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                </svg>
              )}
            </div>

            {/* Status Text */}
            <div className="flex-1">
              <p className={`text-sm font-medium ${isOnline ? 'text-blue-900' : 'text-yellow-900'}`}>
                {isOnline ? 'Syncing...' : 'Offline Mode'}
              </p>
              {pendingActions.length > 0 && (
                <p className={`text-xs mt-0.5 ${isOnline ? 'text-blue-700' : 'text-yellow-700'}`}>
                  {pendingActions.length} pending {pendingActions.length === 1 ? 'change' : 'changes'}
                </p>
              )}
            </div>

            {/* Spinner for syncing */}
            {isOnline && pendingActions.length > 0 && (
              <div className="flex-shrink-0">
                <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Mobile-optimized offline banner
export function OfflineBanner() {
  const { isOnline } = useOffline({ showToasts: false });
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setShowBanner(!isOnline);
  }, [isOnline]);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-yellow-50 border-b border-yellow-200"
        >
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-yellow-800">
                  You're offline. Changes will be saved locally and synced when you're back online.
                </p>
              </div>
              <button
                onClick={() => setShowBanner(false)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}