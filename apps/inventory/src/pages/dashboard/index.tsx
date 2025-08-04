export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useStaffAuth, AuthGuard } from '@ganger/auth/staff';
import { 
  AppLayout, 
  PageHeader, 
  StatCard, 
  Button,
  LoadingSpinner,
  toast 
} from '@ganger/ui';
import { Input, DataTable, CardSkeleton, DataTableSkeleton } from '@ganger/ui-catalyst';
import { analytics } from '@ganger/utils';
import { useOffline } from '../../hooks/useOffline';
import { OfflineBanner } from '../../components/OfflineIndicator';
import { MobileInstallBanner } from '../../components/InstallPrompt';

interface InventoryStats {
  totalItems: number;
  lowStock: number;
  recentOrders: number;
  monthlyUsage: number;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  lastOrdered: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

function InventoryDashboard() {
  const { user, profile } = useStaffAuth();
  const { executeAction, isOnline, hasPendingActions } = useOffline();
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Fetch real inventory data from API with offline support
        const [statsResult, itemsResult] = await Promise.all([
          executeAction('/api/stats', { method: 'GET', cache: true }),
          executeAction('/api/items', { method: 'GET', cache: true })
        ]);

        if (statsResult.success) {
          setStats(statsResult.data);
          if (statsResult.offline && statsResult.cached) {
            toast.info('Showing cached data while offline');
          }
        }

        if (itemsResult.success) {
          setItems(itemsResult.data.items || []);
        }

        analytics.track('dashboard_loaded', 'navigation', {
          user_role: profile?.role,
          total_items: stats?.totalItems || 0,
          offline: !isOnline
        });

      } catch (error) {
        console.error('Error loading inventory data:', error);
        // Set fallback/empty state
        setStats({
          totalItems: 0,
          lowStock: 0,
          recentOrders: 0,
          monthlyUsage: 0
        });
        setItems([]);
        
        if (!isOnline) {
          toast.error('Unable to load data while offline');
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [profile, executeAction, isOnline]);

  const handleAddItem = async () => {
    // In a real implementation, this would open a form
    const newItem = {
      name: 'New Item',
      category: 'Medical Supplies',
      minimum_stock: 10,
      unit_of_measure: 'box',
      supplier: 'Default Supplier',
      cost_per_unit: 10.00,
      location: 'Storage Room A'
    };

    const result = await executeAction('/api/items', {
      method: 'POST',
      data: newItem
    });

    if (result.success) {
      if (result.offline) {
        toast.info('Item will be added when connection is restored');
      } else {
        toast.success('Item added successfully');
        // Reload items
        const itemsResult = await executeAction('/api/items', { method: 'GET', cache: true });
        if (itemsResult.success) {
          setItems(itemsResult.data.items || []);
        }
      }
    } else {
      toast.error('Failed to add item');
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'name', header: 'Item Name', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    { key: 'currentStock', header: 'Current Stock', sortable: true },
    { key: 'minStock', header: 'Min Stock', sortable: true },
    { key: 'status', header: 'Status', sortable: true },
    { key: 'lastOrdered', header: 'Last Ordered', sortable: true }
  ];

  if (loading) {
    return (
      <AppLayout>
        <PageHeader 
          title="Inventory Dashboard"
          subtitle="Track and manage medical supplies"
          actions={
            <Button variant="primary" size="sm" disabled>
              Add New Item
            </Button>
          }
        />

        {/* Stats Overview Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>

        {/* Inventory Table Skeleton */}
        <DataTableSkeleton 
          rows={10}
          columns={6}
          showSearch={true}
          showFilters={true}
          showPagination={true}
        />
      </AppLayout>
    );
  }

  return (
    <>
      <OfflineBanner />
      <MobileInstallBanner />
      <AppLayout>
        <PageHeader 
          title="Inventory Dashboard"
          subtitle="Track and manage medical supplies"
          actions={
            <div className="flex items-center gap-2">
              {hasPendingActions && (
                <span className="text-sm text-yellow-600">
                  Pending changes
                </span>
              )}
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleAddItem}
              >
                Add New Item
              </Button>
            </div>
          }
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Items"
            value={stats?.totalItems.toLocaleString() || '0'}
            icon="package"
            trend={{ value: 12, direction: 'up' }}
          />
          <StatCard
            title="Low Stock Items"
            value={stats?.lowStock.toString() || '0'}
            icon="alert-triangle"
            variant="warning"
          />
          <StatCard
            title="Recent Orders"
            value={stats?.recentOrders.toString() || '0'}
            icon="shopping-cart"
            trend={{ value: 5, direction: 'up' }}
          />
          <StatCard
            title="Monthly Usage"
            value={stats?.monthlyUsage.toLocaleString() || '0'}
            icon="trending-up"
          />
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Inventory Items
            </h3>
            <div className="flex gap-4 items-center">
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button variant="outline" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Export
              </Button>
            </div>
          </div>

          <DataTable
            data={filteredItems}
            columns={columns}
            onRowClick={(item) => {
              analytics.track('inventory_item_clicked', 'interaction', {
                item_id: item.id,
                item_name: item.name,
                offline: !isOnline
              });
            }}
          />

          {/* Offline indicator for table */}
          {!isOnline && items.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Showing cached data. Any changes will be synced when you're back online.
              </p>
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
}

// Wrap with authentication guard for staff-level access
export default function AuthenticatedInventoryDashboard() {
  return (
    <AuthGuard level="staff" appName="inventory">
      <InventoryDashboard />
    </AuthGuard>
  );
}