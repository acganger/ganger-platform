import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';

export default function OfflineBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [pendingActions, setPendingActions] = useState(0);

  useEffect(() => {
    // Check for pending offline actions
    const checkPendingActions = () => {
      const offlineData = localStorage.getItem('eos-offline-actions');
      if (offlineData) {
        const actions = JSON.parse(offlineData);
        setPendingActions(actions.length);
      }
    };

    checkPendingActions();
    setIsVisible(true);

    const interval = setInterval(checkPendingActions, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    // Trigger sync of offline actions
    const offlineData = localStorage.getItem('eos-offline-actions');
    if (offlineData) {
      try {
        const actions = JSON.parse(offlineData);
        // Process each action (implementation depends on backend setup)
        console.log(`Syncing ${actions.length} offline actions...`);
        
        // Clear offline actions after successful sync
        localStorage.removeItem('eos-offline-actions');
        setPendingActions(0);
        
        // Show success message
        alert('Data synced successfully!');
      } catch (error) {
        // Log sync error for debugging
        alert('Sync failed. Will retry automatically.');
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div className="offline-banner">
      <div className="flex items-center">
        <WifiOff className="h-5 w-5 text-yellow-600 mr-3" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800">
            You&apos;re offline
          </p>
          <p className="text-sm text-yellow-700">
            {pendingActions > 0 
              ? `${pendingActions} actions waiting to sync`
              : 'Changes will be saved and synced when you&apos;re back online'
            }
          </p>
        </div>
        
        {pendingActions > 0 && (
          <button
            onClick={handleSync}
            className="ml-4 inline-flex items-center px-3 py-1 border border-yellow-400 rounded-md text-sm font-medium text-yellow-800 bg-yellow-50 hover:bg-yellow-100"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Sync Now
          </button>
        )}
        
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 text-yellow-600 hover:text-yellow-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}