'use client';

import { useEffect, useState } from 'react';
import { showInstallPrompt, isInstallable, isRunningStandalone } from '../../lib/pwa';

export function InstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isRunningStandalone()) {
      return;
    }

    const checkInstallable = () => {
      setCanInstall(isInstallable());
    };

    // Check initial state
    checkInstallable();

    // Listen for when install becomes available
    window.addEventListener('pwa-install-available', checkInstallable);

    // Show banner after a delay if installable
    const timer = setTimeout(() => {
      if (isInstallable()) {
        setShowBanner(true);
      }
    }, 10000); // Show after 10 seconds

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pwa-install-available', checkInstallable);
    };
  }, []);

  const handleInstall = async () => {
    const result = await showInstallPrompt();
    if (result) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Don't show again for 7 days
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Check if we should respect the dismissal
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowBanner(false);
      }
    }
  }, []);

  if (!showBanner || !canInstall) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">Install Clinical Staffing</h3>
          <p className="mt-1 text-sm text-gray-600">
            Install our app for quick access to schedules, offline viewing, and instant notifications.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}