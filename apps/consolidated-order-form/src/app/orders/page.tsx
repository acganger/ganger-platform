'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@ganger/auth'
import { StaffPortalLayout, Button, Badge, LoadingSpinner } from '@ganger/ui'
import { Card, CardContent, CardHeader, Select, DataTable } from '@ganger/ui-catalyst'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Package,
  Calendar,
  Filter,
  Download,
  Plus
} from 'lucide-react'
import { formatDate } from '@ganger/utils'
import type { ConsolidatedOrder } from '@ganger/types'

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<ConsolidatedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'submitted' | 'analyzed' | 'ordered'>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [error, setError] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/orders')
      
      if (!response.ok) {
        throw new Error('Failed to load orders')
      }
      
      const data = await response.json()
      setOrders(data.data)
    } catch (error) {
      console.error('Error loading orders:', error)
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const getDepartments = () => {
    const depts = new Set(orders.map(o => o.department))
    return ['all', ...Array.from(depts)]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'submitted':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'analyzed':
        return <Package className="h-4 w-4 text-purple-500" />
      case 'ordered':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      submitted: 'primary',
      analyzed: 'purple',
      ordered: 'success'
    }
    
    return (
      <Badge variant={variants[status] || 'secondary'} size="sm">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filter === 'all' || order.status === filter
    const matchesDept = departmentFilter === 'all' || order.department === departmentFilter
    return matchesStatus && matchesDept
  })

  // DataTable columns configuration
  const columns = [
    {
      key: 'order_number',
      header: 'Order #',
      render: (order: ConsolidatedOrder) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(order.status)}
          <span className="font-medium">{order.order_number}</span>
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (order: ConsolidatedOrder) => (
        <div className="flex items-center space-x-1 text-sm">
          <Calendar className="h-3 w-3 text-gray-400" />
          <span>{formatDate(order.created_at)}</span>
        </div>
      )
    },
    {
      key: 'department',
      header: 'Department'
    },
    {
      key: 'urgency',
      header: 'Urgency',
      render: (order: ConsolidatedOrder) => (
        <Badge variant="outline" size="sm">
          {order.urgency}
        </Badge>
      )
    },
    {
      key: 'requester_name',
      header: 'Requested By'
    },
    {
      key: 'status',
      header: 'Status',
      render: (order: ConsolidatedOrder) => getStatusBadge(order.status)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (order: ConsolidatedOrder) => (
        <div className="flex gap-2">
          <Link href={`/orders/${order.id}`}>
            <Button
              variant="ghost"
              size="sm"
            >
              View
            </Button>
          </Link>
          {order.status === 'draft' && (
            <Link href={`/orders/${order.id}/edit`}>
              <Button
                variant="ghost"
                size="sm"
              >
                Edit
              </Button>
            </Link>
          )}
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <StaffPortalLayout
        currentApp="consolidated-order-form"
        appDescription="View and manage your order history"
      >
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3">Loading orders...</span>
          </CardContent>
        </Card>
      </StaffPortalLayout>
    )
  }

  return (
    <StaffPortalLayout
      currentApp="consolidated-order-form"
      appDescription="View and manage your order history"
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Order History</h1>
          <Link href="/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </Link>
        </div>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-semibold">{orders.length}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Draft Orders</p>
                  <p className="text-2xl font-semibold">
                    {orders.filter(o => o.status === 'draft').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Submitted</p>
                  <p className="text-2xl font-semibold">
                    {orders.filter(o => o.status === 'submitted').length}
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold">
                    {orders.filter(o => o.status === 'ordered').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Filter className="h-4 w-4 text-gray-500" />
                <div className="flex gap-2">
                  {['all', 'draft', 'submitted', 'analyzed', 'ordered'].map((status) => (
                    <Button
                      key={status}
                      variant={filter === status ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(status as any)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-48"
              >
                {getDepartments().map(dept => (
                  <option key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Orders</h3>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No orders found</p>
                <Link href="/create">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Create First Order
                  </Button>
                </Link>
              </div>
            ) : (
              <DataTable
                data={filteredOrders}
                columns={columns}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </StaffPortalLayout>
  )
}