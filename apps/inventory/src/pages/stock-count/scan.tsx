export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useStaffAuth, AuthGuard } from '@ganger/auth/staff';
import { 
  AppLayout, 
  PageHeader, 
  Button,
  LoadingSpinner,
  toast 
} from '@ganger/ui';
import { Input, Badge } from '@ganger/ui-catalyst';
import { analytics } from '@ganger/utils';
import { useBarcodeScan } from '../../hooks/useBarcodeScan';
import { InventoryItem } from '../../types/inventory';

interface ScannedItem extends InventoryItem {
  scannedQuantity: number;
  needsReorder: boolean;
  notes?: string;
}

function StockCountScanner() {
  const { user, profile } = useStaffAuth();
  const router = useRouter();
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ScannedItem | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  const handleItemScanned = useCallback(async (barcode: string) => {
    setIsLoading(true);
    try {
      // Fetch item details from API
      const response = await fetch(`/api/items/barcode/${encodeURIComponent(barcode)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Item not found. Please check the barcode.');
        } else {
          toast.error('Failed to fetch item details');
        }
        return;
      }

      const item = await response.json() as InventoryItem;
      
      // Check if item was already scanned
      const existingIndex = scannedItems.findIndex(si => si.id === item.id);
      if (existingIndex >= 0) {
        // Update existing item
        setCurrentItem({
          ...item,
          scannedQuantity: scannedItems[existingIndex].scannedQuantity,
          needsReorder: scannedItems[existingIndex].needsReorder,
          notes: scannedItems[existingIndex].notes
        });
      } else {
        // New item
        setCurrentItem({
          ...item,
          scannedQuantity: 0,
          needsReorder: false
        });
      }

      // Focus on quantity input
      setTimeout(() => {
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      }, 100);

      analytics.track('item_scanned', 'interaction', {
        barcode,
        item_id: item.id,
        item_name: item.name
      });

    } catch (error) {
      console.error('Error fetching item:', error);
      toast.error('Failed to process scanned item');
    } finally {
      setIsLoading(false);
    }
  }, [scannedItems]);

  const {
    isScanning,
    startScanning,
    stopScanning,
    videoRef,
    manualInput
  } = useBarcodeScan({
    onScan: handleItemScanned,
    continuous: false,
    beepOnScan: true,
    vibrateOnScan: true
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      manualInput(manualBarcode);
      setManualBarcode('');
    }
  };

  const handleQuantitySubmit = () => {
    if (!currentItem || currentItem.scannedQuantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    // Check if item needs reorder
    const needsReorder = currentItem.scannedQuantity <= currentItem.reorder_point;

    // Update or add to scanned items
    const updatedItem = {
      ...currentItem,
      needsReorder
    };

    const existingIndex = scannedItems.findIndex(si => si.id === currentItem.id);
    if (existingIndex >= 0) {
      const newItems = [...scannedItems];
      newItems[existingIndex] = updatedItem;
      setScannedItems(newItems);
    } else {
      setScannedItems([...scannedItems, updatedItem]);
    }

    toast.success(`${currentItem.name} - Count: ${currentItem.scannedQuantity}${needsReorder ? ' (Reorder needed)' : ''}`);
    
    // Clear current item and prepare for next scan
    setCurrentItem(null);
    
    // Auto-start next scan after a short delay
    setTimeout(() => {
      startScanning();
    }, 500);
  };

  const handleSubmitCounts = async () => {
    if (scannedItems.length === 0) {
      toast.error('No items to submit');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/stock-count/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: scannedItems.map(item => ({
            item_id: item.id,
            counted_quantity: item.scannedQuantity,
            needs_reorder: item.needsReorder,
            notes: item.notes
          })),
          counted_by: user?.email
        })
      });

      if (response.ok) {
        toast.success('Stock counts submitted successfully');
        analytics.track('stock_counts_submitted', 'interaction', {
          item_count: scannedItems.length,
          reorder_count: scannedItems.filter(i => i.needsReorder).length
        });
        
        // Clear and return to dashboard
        setScannedItems([]);
        router.push('/stock-count');
      } else {
        toast.error('Failed to submit stock counts');
      }
    } catch (error) {
      console.error('Error submitting counts:', error);
      toast.error('Failed to submit stock counts');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Stock Count Scanner"
        subtitle="Scan items to update inventory counts"
        actions={
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/stock-count')}
          >
            Back to Dashboard
          </Button>
        }
      />

      <div className="max-w-2xl mx-auto px-4 pb-8">
        {/* Scanner View */}
        {isScanning && (
          <div className="mb-6">
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <video 
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <div className="absolute inset-0 pointer-events-none">
                {/* Scanning overlay */}
                <div className="absolute inset-0 border-2 border-white opacity-20"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-64 h-64 border-2 border-green-500 rounded-lg">
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-white text-sm bg-black bg-opacity-50 inline-block px-3 py-1 rounded">
                  Position barcode within frame
                </p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={stopScanning}
              >
                Stop Scanning
              </Button>
            </div>
          </div>
        )}

        {/* Start Scanning Button */}
        {!isScanning && !currentItem && (
          <div className="text-center py-12">
            <button
              onClick={startScanning}
              className="inline-flex flex-col items-center p-8 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <svg className="w-16 h-16 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span className="text-lg font-semibold text-blue-900">Tap to Scan</span>
              <span className="text-sm text-blue-700 mt-1">Use camera to scan barcode</span>
            </button>
            
            {/* Manual Entry */}
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-2">Or enter barcode manually:</p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter barcode..."
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" variant="outline" size="sm">
                  Submit
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Current Item Entry */}
        {currentItem && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Count</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Item</p>
                <p className="font-medium text-gray-900">{currentItem.name}</p>
                {currentItem.sku && (
                  <p className="text-sm text-gray-500">SKU: {currentItem.sku}</p>
                )}
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Stock Level</p>
                <p className="text-2xl font-bold text-gray-900">{currentItem.current_stock}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Counted Quantity
                </label>
                <Input
                  ref={quantityInputRef}
                  type="number"
                  min="0"
                  value={currentItem.scannedQuantity || ''}
                  onChange={(e) => setCurrentItem({
                    ...currentItem,
                    scannedQuantity: parseInt(e.target.value) || 0
                  })}
                  className="text-2xl font-bold text-center"
                  placeholder="0"
                />
              </div>
              
              {currentItem.scannedQuantity > 0 && currentItem.scannedQuantity <= currentItem.reorder_point && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-800">
                    ⚠️ Stock below reorder point ({currentItem.reorder_point}). Item will be marked for reorder.
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <Input
                  type="text"
                  value={currentItem.notes || ''}
                  onChange={(e) => setCurrentItem({
                    ...currentItem,
                    notes: e.target.value
                  })}
                  placeholder="Add any notes..."
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="primary" 
                  onClick={handleQuantitySubmit}
                  disabled={!currentItem.scannedQuantity || currentItem.scannedQuantity <= 0}
                  className="flex-1"
                >
                  Save & Continue
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentItem(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Scanned Items Summary */}
        {scannedItems.length > 0 && !currentItem && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Scanned Items ({scannedItems.length})
              </h3>
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleSubmitCounts}
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Submit All Counts'}
              </Button>
            </div>
            
            <div className="space-y-3">
              {scannedItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <div className="flex gap-3 mt-1 text-sm text-gray-600">
                      <span>Count: <span className="font-medium">{item.scannedQuantity}</span></span>
                      <span>Previous: {item.current_stock}</span>
                      {item.scannedQuantity !== item.current_stock && (
                        <Badge 
                          color={item.scannedQuantity > item.current_stock ? 'green' : 'red'}
                          className="text-xs"
                        >
                          {item.scannedQuantity > item.current_stock ? '+' : ''}
                          {item.scannedQuantity - item.current_stock}
                        </Badge>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-sm text-gray-500 mt-1">Note: {item.notes}</p>
                    )}
                  </div>
                  {item.needsReorder && (
                    <Badge color="orange" className="ml-2">
                      Reorder
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items needing reorder:</span>
                <span className="font-medium text-orange-600">
                  {scannedItems.filter(i => i.needsReorder).length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6">
              <LoadingSpinner />
              <p className="mt-2 text-gray-600">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Wrap with authentication guard for staff-level access
export default function AuthenticatedStockCountScanner() {
  return (
    <AuthGuard level="staff" appName="inventory">
      <StockCountScanner />
    </AuthGuard>
  );
}