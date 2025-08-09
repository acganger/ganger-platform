'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@ganger/auth'
import { PageLayout } from '@/components/PageLayout'
import { Card, CardHeader, CardContent, Button, Badge, Alert, LoadingSpinner, Tabs, TabsList, TabsTrigger, TabsContent } from '@ganger/ui'
import { VendorPriceGrid } from '@/components/VendorPriceGrid'
import { 
  FileText, 
  DollarSign, 
  Package, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Send
} from 'lucide-react'
import { formatDate, formatCurrency } from '@ganger/utils'
import type { PurchaseRequest, StandardizedProduct, VendorQuote, VendorConfiguration } from '@ganger/types'

interface DetailedPurchaseRequest extends PurchaseRequest {
  items: Array<{
    id: string
    product_id: string
    requested_quantity: number
    approved_quantity?: number
    product: StandardizedProduct
  }>
  analysis?: {
    totalSavings: number
    recommendations: any[]
    vendorQuotes: VendorQuote[]
  }
}

export default function PurchaseRequestDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [request, setRequest] = useState<DetailedPurchaseRequest | null>(null)
  const [vendors, setVendors] = useState<VendorConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (id) {
      loadRequestDetails()
    }
  }, [id])

  const loadRequestDetails = async () => {
    try {
      setLoading(true)
      
      // Load purchase request
      const requestResponse = await fetch(`/api/purchase-requests/${id}`)
      if (!requestResponse.ok) throw new Error('Failed to load request')
      
      const requestData = await requestResponse.json()
      
      // Load vendors
      const vendorResponse = await fetch('/api/vendors?active=true')
      if (!vendorResponse.ok) throw new Error('Failed to load vendors')
      
      const vendorData = await vendorResponse.json()
      
      setRequest(requestData.data)
      setVendors(vendorData.data)
    } catch (error) {
      console.error('Error loading request details:', error)
      setError('Failed to load purchase request details')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    try {
      setActionLoading(true)
      const response = await fetch(`/api/purchase-requests/${id}/approve`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to approve request')
      
      await loadRequestDetails()
    } catch (error) {
      console.error('Error approving request:', error)
      setError('Failed to approve request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    try {
      setActionLoading(true)
      const response = await fetch(`/api/purchase-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Rejected by user' })
      })
      
      if (!response.ok) throw new Error('Failed to reject request')
      
      await loadRequestDetails()
    } catch (error) {
      console.error('Error rejecting request:', error)
      setError('Failed to reject request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateOrder = async () => {
    try {
      setActionLoading(true)
      const response = await fetch(`/api/purchase-requests/${id}/create-order`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to create order')
      
      const data = await response.json()
      router.push(`/orders/${data.data.orderId}`)
    } catch (error) {
      console.error('Error creating order:', error)
      setError('Failed to create order')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <PageLayout
        title="Purchase Request Details"
        user={user}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Purchase Requests', href: '/purchase-requests' },
          { label: 'Details', href: `/purchase-requests/${id}` }
        ]}
      >
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3">Loading request details...</span>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  if (!request) {
    return (
      <PageLayout
        title="Purchase Request Not Found"
        user={user}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Purchase Requests', href: '/purchase-requests' },
          { label: 'Not Found', href: `/purchase-requests/${id}` }
        ]}
      >
        <Alert variant="error">
          Purchase request not found
        </Alert>
      </PageLayout>
    )
  }

  const getStatusIcon = () => {
    switch (request.status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'submitted':
        return <Clock className="h-5 w-5 text-blue-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <PageLayout
      title={`Purchase Request #${request.id.slice(-8)}`}
      user={user}
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Purchase Requests', href: '/purchase-requests' },
        { label: `#${request.id.slice(-8)}`, href: `/purchase-requests/${id}` }
      ]}
    >
      <div className="space-y-6">
        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {/* Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  {getStatusIcon()}
                  <h2 className="text-xl font-semibold">
                    Purchase Request #{request.id.slice(-8)}
                  </h2>
                  <Badge variant={
                    request.status === 'approved' ? 'success' :
                    request.status === 'rejected' ? 'destructive' :
                    request.status === 'submitted' ? 'primary' : 'secondary'
                  }>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500 space-x-4">
                  <span>Created: {formatDate(request.created_at)}</span>
                  <span>Department: {request.department}</span>
                  <span>Urgency: {request.urgency}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {request.status === 'submitted' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleReject}
                      disabled={actionLoading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </>
                )}
                
                {request.status === 'approved' && !request.ordered_at && (
                  <Button
                    onClick={handleCreateOrder}
                    disabled={actionLoading}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Create Order
                  </Button>
                )}
                
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Package className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Total Items</p>
                  <p className="text-xl font-semibold">{request.items?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Estimated Cost</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(request.total_estimated_cost || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">AI Savings</p>
                  <p className="text-xl font-semibold text-green-600">
                    {formatCurrency(request.estimated_savings || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500">Confidence</p>
                  <p className="text-xl font-semibold">
                    {(0.85 * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details Tabs */}
        <Tabs defaultValue="items">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="items">Items ({request.items?.length || 0})</TabsTrigger>
            <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="notes">Notes & History</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Requested Items</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {request.items?.map((item, _index) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product.name}</h4>
                        <p className="text-sm text-gray-500">
                          {item.product.category}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span>Requested: {item.requested_quantity} {item.product.unit_of_measure}</span>
                          {item.approved_quantity && (
                            <span className="text-green-600">
                              Approved: {item.approved_quantity} {item.product.unit_of_measure}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.product.is_critical && (
                        <Badge variant="destructive">Critical</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {request.analysis ? (
              <>
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">AI Recommendations</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {request.analysis.recommendations.map((rec, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{rec.title}</h4>
                              <p className="text-sm text-gray-500 mt-1">{rec.description}</p>
                            </div>
                            <Badge variant="success">
                              Save {formatCurrency(rec.savings)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {request.analysis.vendorQuotes && request.items?.[0]?.product && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Vendor Price Comparison</h3>
                    </CardHeader>
                    <CardContent>
                      <VendorPriceGrid
                        quotes={request.analysis.vendorQuotes}
                        vendors={vendors}
                        product={request.items[0].product}
                      />
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Alert>
                AI analysis is pending for this request
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Request Notes</h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {request.notes || 'No notes provided'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Activity History</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm">Request created</p>
                      <p className="text-xs text-gray-500">{formatDate(request.created_at)}</p>
                    </div>
                  </div>
                  
                  {request.submitted_at && (
                    <div className="flex items-start space-x-3">
                      <Send className="h-4 w-4 text-blue-400 mt-1" />
                      <div>
                        <p className="text-sm">Submitted for analysis</p>
                        <p className="text-xs text-gray-500">{formatDate(request.submitted_at)}</p>
                      </div>
                    </div>
                  )}
                  
                  {request.approved_at && (
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-400 mt-1" />
                      <div>
                        <p className="text-sm">Approved by {request.approved_by_email || 'System'}</p>
                        <p className="text-xs text-gray-500">{formatDate(request.approved_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}