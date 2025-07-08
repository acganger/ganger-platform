'use client'

import { useAuth } from '@ganger/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@ganger/ui'
import { Button, Badge } from '@ganger/ui'
import { StatCard } from '@ganger/ui'
import { ShoppingCartIcon, ChartBarIcon, CurrencyDollarIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useCart } from '@/contexts/CartContext'
import { ShoppingCart, Package, TrendingUp, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AIAgentDashboard() {
  const { user } = useAuth()
  const { totalItems } = useCart()
  const router = useRouter()

  const stats = [
    {
      label: 'Active Requests',
      value: '0',
      change: { value: 0, trend: 'up' as const },
      icon: ShoppingCartIcon,
    },
    {
      label: 'Monthly Savings',
      value: '$0',
      change: { value: 0, trend: 'up' as const },
      icon: CurrencyDollarIcon,
    },
    {
      label: 'Recommendations',
      value: '0',
      change: { value: 0, trend: 'up' as const },
      icon: DocumentTextIcon,
    },
    {
      label: 'Compliance Rate',
      value: '0%',
      change: { value: 0, trend: 'up' as const },
      icon: ChartBarIcon,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            AI Purchasing Agent Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back, {user?.email}. Monitor and optimize medical supply procurement.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push('/products')}
            variant="outline"
          >
            <Package className="h-4 w-4 mr-2" />
            Browse Products
          </Button>
          <Button
            onClick={() => router.push('/cart')}
            variant="outline"
            className="relative"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart
            {totalItems > 0 && (
              <Badge 
                variant="destructive" 
                size="sm" 
                className="absolute -top-2 -right-2"
              >
                {totalItems}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            title={stat.label}
            value={stat.value}
            trend={{
              value: stat.change.value,
              direction: stat.change.trend
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Purchase Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              No recent purchase requests to display.
            </p>
            <div className="mt-4">
              <Button onClick={() => window.location.href = '/vendor-comparison'}>
                View All Requests
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              No pending recommendations at this time.
            </p>
            <div className="mt-4">
              <Button onClick={() => window.location.href = '/recommendations'} variant="secondary">
                View Recommendations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/products')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Package className="h-10 w-10 text-blue-500" />
              <div>
                <h3 className="font-semibold">Browse Products</h3>
                <p className="text-sm text-gray-500">Explore our medical supply catalog</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/vendor-comparison')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <TrendingUp className="h-10 w-10 text-green-500" />
              <div>
                <h3 className="font-semibold">Compare Vendors</h3>
                <p className="text-sm text-gray-500">Find the best prices across vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/recommendations')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <FileText className="h-10 w-10 text-purple-500" />
              <div>
                <h3 className="font-semibold">AI Insights</h3>
                <p className="text-sm text-gray-500">View optimization recommendations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}