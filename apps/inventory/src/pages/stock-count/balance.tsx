export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useStaffAuth, AuthGuard } from '@ganger/auth/staff';
import { 
  AppLayout, 
  PageHeader, 
  Button,
  LoadingSpinner,
  toast 
} from '@ganger/ui';
import { Input, Badge, Select, SelectItem } from '@ganger/ui-catalyst';
import { analytics } from '@ganger/utils';

interface VarianceItem {
  id: string;
  item_id: string;
  item_name: string;
  item_sku?: string;
  expected_quantity: number;
  counted_quantity: number;
  variance: number;
  variance_value: number;
  counted_by: string;
  counted_at: string;
  notes?: string;
  is_variance_approved: boolean;
}

function StockBalancePage() {
  const { user, profile } = useStaffAuth();
  const router = useRouter();
  const [variances, setVariances] = useState<VarianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('pending');
  const [adjustmentNotes, setAdjustmentNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    // Verify supervisor access
    if (profile?.role !== 'admin' && profile?.role !== 'supervisor') {
      toast.error('Supervisor access required');
      router.push('/stock-count');
      return;
    }
    
    loadVariances();
  }, [profile, router]);

  const loadVariances = async () => {
    try {
      const response = await fetch(`/api/stock-count/variances?status=${filterStatus}`);
      
      if (response.ok) {
        const data = await response.json();
        setVariances(data);
      } else {
        toast.error('Failed to load variances');
      }

      analytics.track('stock_balance_loaded', 'navigation', {
        variance_count: variances.length,
        filter_status: filterStatus
      });

    } catch (error) {
      console.error('Error loading variances:', error);
      toast.error('Failed to load variance data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVariances = async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select items to approve');
      return;
    }

    setLoading(true);
    try {
      const approvals = Array.from(selectedItems).map(id => ({
        stock_count_id: id,
        approved_by: user?.email,
        adjustment_notes: adjustmentNotes[id] || ''
      }));

      const response = await fetch('/api/stock-count/approve-variances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approvals })
      });

      if (response.ok) {
        toast.success(`${selectedItems.size} variances approved`);
        analytics.track('variances_approved', 'interaction', {
          count: selectedItems.size,
          approved_by: user?.email
        });
        
        // Clear selections and reload
        setSelectedItems(new Set());
        setAdjustmentNotes({});
        await loadVariances();
      } else {
        toast.error('Failed to approve variances');
      }
    } catch (error) {
      console.error('Error approving variances:', error);
      toast.error('Failed to approve variances');
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const selectAll = () => {
    const pendingItems = variances
      .filter(v => !v.is_variance_approved)
      .map(v => v.id);
    setSelectedItems(new Set(pendingItems));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  if (loading) {
    return (
      <AppLayout>
        <PageHeader 
          title="Balance Stock Counts"
          subtitle="Review and approve count variances"
        />
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  const pendingVariances = variances.filter(v => !v.is_variance_approved);
  const totalVarianceValue = pendingVariances.reduce((sum, v) => sum + Math.abs(v.variance_value), 0);

  return (
    <AppLayout>
      <PageHeader 
        title="Balance Stock Counts"
        subtitle="Review and approve count variances"
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

      <div className="px-4 lg:px-0">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Pending Variances</p>
            <p className="text-2xl font-bold text-gray-900">{pendingVariances.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Variance Value</p>
            <p className="text-2xl font-bold text-red-600">${totalVarianceValue.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Selected for Approval</p>
            <p className="text-2xl font-bold text-blue-600">{selectedItems.size}</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Select
                value={filterStatus}
                onValueChange={(value) => setFilterStatus(value as any)}
                className="w-40"
              >
                <SelectItem value="all">All Variances</SelectItem>
                <SelectItem value="pending">Pending Only</SelectItem>
                <SelectItem value="approved">Approved Only</SelectItem>
              </Select>
              
              {pendingVariances.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                </div>
              )}
            </div>
            
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleApproveVariances}
              disabled={selectedItems.size === 0 || loading}
            >
              Approve Selected ({selectedItems.size})
            </Button>
          </div>
        </div>

        {/* Variance List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {variances.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {variances.map((variance) => (
                <div key={variance.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    {!variance.is_variance_approved && (
                      <input
                        type="checkbox"
                        checked={selectedItems.has(variance.id)}
                        onChange={() => toggleItemSelection(variance.id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{variance.item_name}</p>
                          {variance.item_sku && (
                            <p className="text-sm text-gray-500">SKU: {variance.item_sku}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge 
                            color={variance.is_variance_approved ? 'green' : 'orange'}
                          >
                            {variance.is_variance_approved ? 'Approved' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-gray-600">Expected</p>
                          <p className="font-medium">{variance.expected_quantity}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Counted</p>
                          <p className="font-medium">{variance.counted_quantity}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Variance</p>
                          <p className={`font-medium ${variance.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {variance.variance > 0 ? '+' : ''}{variance.variance}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Value</p>
                          <p className={`font-medium ${variance.variance_value > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${Math.abs(variance.variance_value).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm text-gray-600">
                        <p>Counted by: {variance.counted_by}</p>
                        <p>Date: {new Date(variance.counted_at).toLocaleString()}</p>
                        {variance.notes && (
                          <p className="mt-1">Notes: {variance.notes}</p>
                        )}
                      </div>
                      
                      {!variance.is_variance_approved && selectedItems.has(variance.id) && (
                        <div className="mt-3">
                          <Input
                            type="text"
                            placeholder="Add adjustment notes (optional)..."
                            value={adjustmentNotes[variance.id] || ''}
                            onChange={(e) => setAdjustmentNotes({
                              ...adjustmentNotes,
                              [variance.id]: e.target.value
                            })}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600">No variances to review</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// Wrap with authentication guard for supervisor-level access
export default function AuthenticatedStockBalancePage() {
  return (
    <AuthGuard level="staff" appName="inventory">
      <StockBalancePage />
    </AuthGuard>
  );
}