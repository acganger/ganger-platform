'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@ganger/auth'
import { PageLayout } from '@/components/PageLayout'
import { Card, CardContent, CardHeader, Button, Badge, LoadingSpinner, DataTable } from '@ganger/ui'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Filter,
  Download
} from 'lucide-react'
import { formatDate, formatCurrency } from '@ganger/utils'
import type { PurchaseRequest } from '@ganger/types'

export default function PurchaseRequestsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'draft' | 'submitted' | 'approved' | 'ordered'>('all')

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/purchase-requests')
      
      if (!response.ok) {
        throw new Error('Failed to load purchase requests')
      }
      
      const data = await response.json()
      setRequests(data.data)
    } catch (error) {
      console.error('Error loading requests:', error)
      setError('Failed to load purchase requests')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'submitted':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'ordered':
        return <CheckCircle className="h-4 w-4 text-purple-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      submitted: 'primary',
      approved: 'success',
      ordered: 'purple'
    }
    
    return (
      <Badge variant={variants[status] || 'secondary'} size="sm">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter)

  if (loading) {
    return (
      <PageLayout
        title="Purchase Requests"
        user={user}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Purchase Requests', href: '/purchase-requests' }
        ]}
      >
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3">Loading purchase requests...</span>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Purchase Requests"
      user={user}
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Purchase Requests', href: '/purchase-requests' }
      ]}
      actions={
        <Button onClick={() => router.push('/products')}>
          Create New Request
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Requests</p>
                  <p className="text-2xl font-semibold">{requests.length}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Analysis</p>
                  <p className="text-2xl font-semibold">
                    {requests.filter(r => r.status === 'submitted').length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Approved</p>
                  <p className="text-2xl font-semibold">
                    {requests.filter(r => r.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="text-2xl font-semibold">
                    ${requests.reduce((sum, r) => sum + (r.total_estimated_cost || 0), 0).toFixed(0)}
                  </p>
                </div>
                <Download className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Filter className="h-4 w-4 text-gray-500" />
              <div className="flex gap-2">
                {['all', 'draft', 'submitted', 'approved', 'ordered'].map((status) => (
                  <Button
                    key={status}
                    variant={filter === status ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(status as any)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                    {status !== 'all' && (
                      <span className="ml-2 text-xs">
                        ({requests.filter(r => r.status === status).length})
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              {filter === 'all' ? 'All Requests' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Requests`}
            </h3>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No purchase requests found</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push('/products')}
                >
                  Create First Request
                </Button>
              </div>
            ) : (
              <DataTable
                data={filteredRequests}
                columns={[
                  {
                    header: 'Request ID',
                    key: 'id',
                    render: (row) => (
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(row.status)}
                        <span className="font-medium">#{row.id.slice(-8)}</span>
                      </div>
                    )
                  },
                  {
                    header: 'Created',
                    key: 'created_at',
                    render: (row) => formatDate(row.created_at)
                  },
                  {
                    header: 'Department',
                    key: 'department'
                  },
                  {
                    header: 'Items',
                    key: 'items',
                    render: (row) => '-'
                  },
                  {
                    header: 'Est. Cost',
                    key: 'total_estimated_cost',
                    render: (row) => formatCurrency(row.total_estimated_cost || 0)
                  },
                  {
                    header: 'Status',
                    key: 'status',
                    render: (row) => getStatusBadge(row.status)
                  },
                  {
                    header: 'Savings',
                    key: 'ai_savings_identified',
                    render: (row) => {
                      const savings = row.estimated_savings
                      return savings ? (
                        <span className="text-green-600 font-medium">
                          {formatCurrency(savings)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )
                    }
                  },
                  {
                    header: '',
                    key: 'actions',
                    render: (row) => (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/purchase-requests/${row.id}`)}
                      >
                        View
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )
                  }
                ]}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}