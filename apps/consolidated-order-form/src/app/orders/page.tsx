'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { useAuth } from '@ganger/auth'
import { StaffPortalLayout } from '@ganger/ui/staff'
import { Card, Button, Badge, Table, LoadingSpinner, Select } from '@ganger/ui'
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

  if (loading) {
    return (
      <StaffPortalLayout
        title="Order History"
        user={user}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Orders', href: '/orders' }
        ]}
      >
        <Card>
          <Card.Content className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3">Loading orders...</span>
          </Card.Content>
        </Card>
      </StaffPortalLayout>
    )
  }

  return (
    <StaffPortalLayout
      title="Order History"
      user={user}
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Orders', href: '/orders' }
      ]}
      actions={
        <Button href="/create">
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <Card.Content className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-semibold">{orders.length}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Draft Orders</p>
                  <p className="text-2xl font-semibold">
                    {orders.filter(o => o.status === 'draft').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-gray-500" />
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Submitted</p>
                  <p className="text-2xl font-semibold">
                    {orders.filter(o => o.status === 'submitted').length}
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold">
                    {orders.filter(o => o.status === 'ordered').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <Card.Content className="p-4">
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
                onValueChange={setDepartmentFilter}
              >
                <Select.Trigger className="w-48">
                  <Select.Value placeholder="Filter by department" />
                </Select.Trigger>
                <Select.Content>
                  {getDepartments().map(dept => (
                    <Select.Item key={dept} value={dept}>
                      {dept === 'all' ? 'All Departments' : dept}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          </Card.Content>
        </Card>

        {/* Orders Table */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold">Orders</h3>
          </Card.Header>
          <Card.Content>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No orders found</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  href="/create"
                >
                  Create First Order
                </Button>
              </div>
            ) : (
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.Head>Order #</Table.Head>
                    <Table.Head>Created</Table.Head>
                    <Table.Head>Department</Table.Head>
                    <Table.Head>Order Type</Table.Head>
                    <Table.Head>Requested By</Table.Head>
                    <Table.Head>Status</Table.Head>
                    <Table.Head>Actions</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredOrders.map((order) => (
                    <Table.Row key={order.id}>
                      <Table.Cell className="font-medium">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <span>{order.order_number}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center space-x-1 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>{order.department}</Table.Cell>
                      <Table.Cell>
                        <Badge variant="outline" size="sm">
                          {order.order_type}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>{order.requested_by}</Table.Cell>
                      <Table.Cell>{getStatusBadge(order.status)}</Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            href={`/orders/${order.id}`}
                          >
                            View
                          </Button>
                          {order.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              href={`/orders/${order.id}/edit`}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            )}
          </Card.Content>
        </Card>
      </div>
    </StaffPortalLayout>
  )
}