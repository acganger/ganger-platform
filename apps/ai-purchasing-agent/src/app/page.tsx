'use client'

import { useAuth } from '@ganger/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@ganger/ui'
import { Button } from '@ganger/ui'
import { StatCard } from '@ganger/ui'
import { ShoppingCartIcon, ChartBarIcon, CurrencyDollarIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

export default function AIAgentDashboard() {
  const { user } = useAuth()

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
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          AI Purchasing Agent Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back, {user?.email}. Monitor and optimize medical supply procurement.
        </p>
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
    </div>
  )
}