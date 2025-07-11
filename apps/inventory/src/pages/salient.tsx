'use client'

export const dynamic = 'force-dynamic';

import { AuthGuard } from '@ganger/auth/staff'
import { InventoryLayout } from '@/components/salient/InventoryLayout'
import { Container } from '@/components/salient/Container'
import { FadeIn, FadeInStagger } from '@/components/salient/FadeIn'
import { Button } from '@/components/salient/Button'
import { Package, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'

// Mock inventory data
const inventoryStats = [
  { label: 'Total Items', value: '1,247', change: '+23', period: 'this month' },
  { label: 'Low Stock Alerts', value: '12', change: '-5', period: 'from last week' },
  { label: 'Items Added', value: '34', change: '+8', period: 'this week' },
  { label: 'Avg Stock Level', value: '78%', change: '+3%', period: 'vs target' }
]

const recentItems = [
  {
    id: 'INV-2024-001',
    name: 'Surgical Gloves (Medium)',
    category: 'PPE',
    currentStock: 250,
    minStock: 100,
    maxStock: 500,
    status: 'in-stock',
    supplier: 'MedSupply Co',
    lastUpdated: '2024-01-15T10:30:00Z'
  },
  {
    id: 'INV-2024-002',
    name: 'Dermatology Examination Table Paper',
    category: 'Disposables',
    currentStock: 45,
    minStock: 50,
    maxStock: 200,
    status: 'low-stock',
    supplier: 'Healthcare Essentials',
    lastUpdated: '2024-01-15T09:15:00Z'
  },
  {
    id: 'INV-2024-003',
    name: 'Betadine Antiseptic Solution',
    category: 'Medications',
    currentStock: 0,
    minStock: 25,
    maxStock: 100,
    status: 'out-of-stock',
    supplier: 'Pharma Direct',
    lastUpdated: '2024-01-14T16:45:00Z'
  }
]

const stockCategories = [
  { name: 'PPE & Safety', items: 145, lowStock: 3, value: '$12,450' },
  { name: 'Disposables', items: 298, lowStock: 8, value: '$8,750' },
  { name: 'Medications', items: 187, lowStock: 1, value: '$24,890' },
  { name: 'Equipment', items: 89, lowStock: 0, value: '$156,780' },
  { name: 'Cleaning Supplies', items: 67, lowStock: 2, value: '$3,420' },
  { name: 'Office Supplies', items: 461, lowStock: 12, value: '$5,680' }
]

function StockStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    'in-stock': { icon: CheckCircle, color: 'text-green-700 bg-green-100', label: 'In Stock' },
    'low-stock': { icon: AlertTriangle, color: 'text-yellow-700 bg-yellow-100', label: 'Low Stock' },
    'out-of-stock': { icon: Package, color: 'text-red-700 bg-red-100', label: 'Out of Stock' }
  }

  const config = statusConfig[status as keyof typeof statusConfig]
  const Icon = config?.icon || CheckCircle

  return (
    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config?.color}`}>
      <Icon className="h-3 w-3" />
      <span>{config?.label}</span>
    </span>
  )
}

function InventoryItemCard({ item }: { item: typeof recentItems[0] }) {
  const stockPercentage = Math.round((item.currentStock / item.maxStock) * 100)

  return (
    <FadeIn>
      <div className="relative rounded-3xl bg-white p-6 shadow-md shadow-slate-900/5 ring-1 ring-slate-900/5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
            <p className="text-sm text-slate-600">{item.category}</p>
            <p className="text-xs text-slate-500 mt-1">{item.id}</p>
          </div>
          <StockStatusBadge status={item.status} />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Stock Level</span>
            <span className="font-medium text-slate-900">{item.currentStock} / {item.maxStock}</span>
          </div>
          <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                stockPercentage > 50 ? 'bg-green-500' : 
                stockPercentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(stockPercentage, 5)}%` }}
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Supplier: {item.supplier}</span>
            <span>Updated: {new Date(item.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </FadeIn>
  )
}

function StatCard({ stat }: { stat: typeof inventoryStats[0] }) {
  return (
    <FadeIn>
      <div className="rounded-3xl bg-white p-6 shadow-md shadow-slate-900/5 ring-1 ring-slate-900/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
          </div>
          <TrendingUp className="h-8 w-8 text-blue-600" />
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
            {stat.change}
          </span>
          <span className="text-slate-500 ml-1">{stat.period}</span>
        </div>
      </div>
    </FadeIn>
  )
}

function CategoryCard({ category }: { category: typeof stockCategories[0] }) {
  return (
    <FadeIn>
      <div className="rounded-3xl bg-white p-6 shadow-md shadow-slate-900/5 ring-1 ring-slate-900/5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
            <p className="text-sm text-slate-600 mt-1">{category.items} items total</p>
          </div>
          {category.lowStock > 0 && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
              {category.lowStock} low
            </span>
          )}
        </div>
        
        <div className="mt-4">
          <p className="text-2xl font-bold text-slate-900">{category.value}</p>
          <p className="text-xs text-slate-500">Total inventory value</p>
        </div>
      </div>
    </FadeIn>
  )
}

function InventorySalient() {
  return (
    <InventoryLayout>
      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <FadeIn className="max-w-2xl">
          <h1 className="font-display text-5xl font-medium tracking-tight text-slate-900 sm:text-7xl">
            Smart medical inventory management system.
          </h1>
          <p className="mt-6 text-xl text-slate-600">
            Track medical supplies, monitor stock levels, and automate reordering 
            with real-time alerts and comprehensive analytics.
          </p>
          <div className="mt-10 flex gap-x-6">
            <Button href="/items/new">Add New Item</Button>
            <Button href="/dashboard" variant="outline">
              View Dashboard
            </Button>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <FadeIn>
          <h2 className="text-center font-display text-sm font-semibold tracking-wider text-slate-900 uppercase">
            Inventory Overview
          </h2>
        </FadeIn>
        <FadeInStagger className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {inventoryStats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </FadeInStagger>
      </Container>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <FadeIn>
          <h2 className="font-display text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl">
            Stock Categories
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Monitor inventory across different medical supply categories and their current status.
          </p>
        </FadeIn>
        <FadeInStagger className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {stockCategories.map((category) => (
            <CategoryCard key={category.name} category={category} />
          ))}
        </FadeInStagger>
      </Container>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <FadeIn>
          <h2 className="font-display text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl">
            Recent Inventory Activity
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Track recent changes and monitor items that need attention.
          </p>
        </FadeIn>
        <FadeInStagger className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {recentItems.map((item) => (
            <InventoryItemCard key={item.id} item={item} />
          ))}
        </FadeInStagger>
      </Container>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <FadeIn className="rounded-3xl bg-slate-50 py-20 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl">
              Ready to optimize your inventory management?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Start tracking your medical supplies more efficiently with automated alerts and analytics.
            </p>
            <Button href="/items/new" className="mt-10">
              Add Your First Item
            </Button>
          </div>
        </FadeIn>
      </Container>
    </InventoryLayout>
  )
}

// Wrap with authentication guard for staff-level access
export default function AuthenticatedInventorySalient() {
  return (
    <AuthGuard level="staff" appName="inventory">
      <InventorySalient />
    </AuthGuard>
  );
}