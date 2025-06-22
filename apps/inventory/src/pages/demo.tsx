import { AppLayout, PageHeader, StatCard, DataTable, Button, Input } from '@ganger/ui';
import { useState } from 'react';

// Demo data
const demoStats = {
  totalItems: 142,
  lowStock: 8,
  recentOrders: 24,
  monthlyUsage: 3567
};

const demoItems = [
  { id: '1', name: 'Sterile Gauze 4x4', category: 'Wound Care', currentStock: 250, minStock: 100, lastOrdered: '2025-01-15', status: 'In Stock' },
  { id: '2', name: 'Nitrile Gloves (L)', category: 'PPE', currentStock: 45, minStock: 50, lastOrdered: '2025-01-10', status: 'Low Stock' },
  { id: '3', name: 'Alcohol Prep Pads', category: 'Antiseptics', currentStock: 500, minStock: 200, lastOrdered: '2025-01-12', status: 'In Stock' },
  { id: '4', name: 'Surgical Masks', category: 'PPE', currentStock: 180, minStock: 100, lastOrdered: '2025-01-08', status: 'In Stock' },
  { id: '5', name: 'Bandage Tape 1"', category: 'Wound Care', currentStock: 75, minStock: 50, lastOrdered: '2025-01-14', status: 'In Stock' }
];

export default function InventoryDemoPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [items] = useState(demoItems);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <PageHeader
        title="Inventory Management Demo"
        actions={
          <Button variant="primary">
            Add New Item
          </Button>
        }
      />
      <p className="text-gray-600 mb-6">Medical supply tracking and management system</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Items"
          value={demoStats.totalItems}
          icon="package"
          trend={{ value: 5, direction: 'up' }}
          color="primary"
        />
        <StatCard
          title="Low Stock Alert"
          value={demoStats.lowStock}
          icon="alert-triangle"
          color="danger"
        />
        <StatCard
          title="Recent Orders"
          value={demoStats.recentOrders}
          icon="shopping-cart"
          trend={{ value: 12, direction: 'up' }}
          color="success"
        />
        <StatCard
          title="Monthly Usage"
          value={`${demoStats.monthlyUsage}`}
          icon="trending-up"
          trend={{ value: 8.5, direction: 'up' }}
          color="info"
        />
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <Input
          type="search"
          placeholder="Search inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={filteredItems}
          columns={[
            { key: 'name', label: 'Item Name', sortable: true },
            { key: 'category', label: 'Category', sortable: true },
            { 
              key: 'currentStock', 
              label: 'Current Stock', 
              sortable: true,
              render: (value: number, item: any) => (
                <span className={item.currentStock < item.minStock ? 'text-red-600 font-semibold' : ''}>
                  {value}
                </span>
              )
            },
            { key: 'minStock', label: 'Min Stock', sortable: true },
            { key: 'lastOrdered', label: 'Last Ordered', sortable: true },
            { 
              key: 'status', 
              label: 'Status',
              render: (value: string) => (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  value === 'In Stock' ? 'bg-green-100 text-green-800' :
                  value === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {value}
                </span>
              )
            }
          ]}
        />
      </div>
    </AppLayout>
  );
}