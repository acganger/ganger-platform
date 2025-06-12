import { useState, useEffect } from 'react';
import { useAuth } from '@ganger/auth';
import { 
  AppLayout, 
  PageHeader, 
  StatCard, 
  DataTable, 
  Button,
  Input,
  LoadingSpinner 
} from '@ganger/ui';
import { analytics } from '@ganger/utils';

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

export default function InventoryDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
        
        setStats({
          totalItems: 1247,
          lowStock: 23,
          recentOrders: 8,
          monthlyUsage: 342
        });

        setItems([
          {
            id: '1',
            name: 'Surgical Gloves (Medium)',
            category: 'PPE',
            currentStock: 150,
            minStock: 100,
            lastOrdered: '2024-01-15',
            status: 'In Stock'
          },
          {
            id: '2',
            name: 'Bandages 4x4',
            category: 'Wound Care',
            currentStock: 25,
            minStock: 50,
            lastOrdered: '2024-01-10',
            status: 'Low Stock'
          },
          {
            id: '3',
            name: 'Antiseptic Solution',
            category: 'Disinfectants',
            currentStock: 0,
            minStock: 20,
            lastOrdered: '2024-01-05',
            status: 'Out of Stock'
          }
        ]);

        analytics.track('dashboard_loaded', 'navigation', {
          user_role: user?.role,
          total_items: 1247
        });
      } catch (error) {
        // eslint-disable-next-line no-console
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

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
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader 
        title="Inventory Dashboard"
        subtitle="Track and manage medical supplies"
        actions={
          <Button variant="primary" size="sm">
            Add New Item
          </Button>
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
              Filter
            </Button>
            <Button variant="outline" size="sm">
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
              item_name: item.name
            });
          }}
        />
      </div>
    </AppLayout>
  );
}