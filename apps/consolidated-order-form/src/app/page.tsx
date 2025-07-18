'use client'

export const dynamic = 'force-dynamic';

import { useState } from 'react'
import { useAuth } from '@ganger/auth'
import { Button } from '@ganger/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@ganger/ui-catalyst'
import { Input, Select } from '@ganger/ui-catalyst'
import { 
  ShoppingBagIcon, 
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline'

// Mock categories - will be replaced with database data
const categories = [
  { id: 'gloves_ppe', name: 'Gloves & PPE', icon: '🧤' },
  { id: 'wound_care', name: 'Wound Care', icon: '🩹' },
  { id: 'syringes', name: 'Syringes & Needles', icon: '💉' },
  { id: 'paper_products', name: 'Paper Products', icon: '📄' },
  { id: 'antiseptics', name: 'Antiseptics', icon: '🧴' },
  { id: 'other', name: 'Other Supplies', icon: '📦' },
]

export default function ConsolidatedOrderForm() {
  useAuth() // Authentication check
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cartItems] = useState(0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Order Medical Supplies
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Select items from our standardized catalog to create your order request.
          </p>
        </div>
        <Button
          onClick={() => window.location.href = '/cart'}
          variant="primary"
        >
          <ShoppingCartIcon className="mr-2 h-4 w-4" />
          View Cart ({cartItems})
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="search"
                  placeholder="Search for supplies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map((cat) => ({
                  value: cat.id,
                  label: `${cat.icon} ${cat.name}`
                }))
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Quick Links */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedCategory(category.id)}
          >
            <div className="p-4 text-center">
              <div className="text-3xl mb-2">{category.icon}</div>
              <p className="text-sm font-medium text-gray-900">{category.name}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Product Grid Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2">Product catalog will be loaded here</p>
            <p className="text-sm">Based on your purchase history</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Your Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2">No recent orders</p>
            <p className="text-sm">Your order history will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}