'use client'

import { useState, useMemo } from 'react'
import { Badge, Button } from '@ganger/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@ganger/ui-catalyst'
import { Input } from '@ganger/ui-catalyst'
import { 
  TrashIcon, 
  PencilIcon,
  ShoppingCartIcon,
  CalculatorIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import type { StandardizedProduct, ConsolidatedOrderItem } from '@ganger/types'

interface OrderItem extends ConsolidatedOrderItem {
  product: StandardizedProduct
}

interface OrderBuilderProps {
  items: OrderItem[]
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onUpdateJustification?: (itemId: string, justification: string) => void
  onUpdateUrgency?: (itemId: string, urgency: 'routine' | 'urgent') => void
  onSubmitOrder?: () => void
  onSaveDraft?: () => void
  isLoading?: boolean
  department?: string
}

export function OrderBuilder({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateJustification,
  onUpdateUrgency,
  onSubmitOrder,
  onSaveDraft,
  isLoading = false,
  department
}: OrderBuilderProps) {
  const [editingJustification, setEditingJustification] = useState<string | null>(null)
  const [justificationText, setJustificationText] = useState<Record<string, string>>({})

  // Calculate order totals
  const orderSummary = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.requested_quantity, 0)
    const criticalItems = items.filter(item => item.product.is_critical).length
    const urgentItems = items.filter(item => item.urgency_level === 'urgent').length
    
    // Group by category
    const byCategory = items.reduce((acc, item) => {
      const category = item.product.category
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          items: []
        }
      }
      acc[category].count += item.requested_quantity
      acc[category].items.push(item)
      return acc
    }, {} as Record<string, { count: number; items: OrderItem[] }>)

    return {
      totalItems,
      totalProducts: items.length,
      criticalItems,
      urgentItems,
      byCategory
    }
  }, [items])

  const handleJustificationSave = (itemId: string) => {
    const text = justificationText[itemId]
    if (text && onUpdateJustification) {
      onUpdateJustification(itemId, text)
    }
    setEditingJustification(null)
  }

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      gloves_ppe: 'Gloves & PPE',
      wound_care: 'Wound Care',
      syringes: 'Syringes & Needles',
      paper_products: 'Paper Products',
      antiseptics: 'Antiseptics',
      diagnostic_supplies: 'Diagnostic Supplies',
      surgical_supplies: 'Surgical Supplies',
      medications: 'Medications',
      other: 'Other Supplies'
    }
    return names[category] || category
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      gloves_ppe: '🧤',
      wound_care: '🩹',
      syringes: '💉',
      paper_products: '📄',
      antiseptics: '🧴',
      diagnostic_supplies: '🔬',
      surgical_supplies: '🔪',
      medications: '💊',
      other: '📦'
    }
    return icons[category] || '📦'
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Your order is empty</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add products from the catalog to get started
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order Summary</CardTitle>
            {department && (
              <Badge variant="secondary">{department} Department</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-semibold text-gray-900">{orderSummary.totalProducts}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Units</p>
              <p className="text-2xl font-semibold text-gray-900">{orderSummary.totalItems}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Critical Items</p>
              <p className="text-2xl font-semibold text-red-600">{orderSummary.criticalItems}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Urgent Items</p>
              <p className="text-2xl font-semibold text-orange-600">{orderSummary.urgentItems}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items by Category */}
      {Object.entries(orderSummary.byCategory).map(([category, data]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-xl">{getCategoryIcon(category)}</span>
              <span>{getCategoryName(category)}</span>
              <Badge variant="secondary" className="ml-auto">
                {data.items.length} items
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.items.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-3">
                        {item.product.is_critical && (
                          <Badge variant="destructive" className="mt-0.5">Critical</Badge>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.product.standard_package_size} • {item.product.units_per_package} {item.product.unit_of_measure} per package
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Quantity and Urgency */}
                  <div className="mt-4 flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Quantity:</label>
                      <Input
                        type="number"
                        value={item.requested_quantity}
                        onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                        className="w-20"
                        min={item.product.minimum_order_quantity || 1}
                        max={item.product.maximum_order_quantity}
                      />
                      <span className="text-sm text-gray-500">{item.product.unit_of_measure}</span>
                    </div>
                    
                    {onUpdateUrgency && (
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">Urgency:</label>
                        <div className="flex space-x-1">
                          <Button
                            variant={item.urgency_level === 'routine' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => onUpdateUrgency(item.id, 'routine')}
                          >
                            Routine
                          </Button>
                          <Button
                            variant={item.urgency_level === 'urgent' ? 'destructive' : 'ghost'}
                            size="sm"
                            onClick={() => onUpdateUrgency(item.id, 'urgent')}
                          >
                            Urgent
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Justification */}
                  {onUpdateJustification && (
                    <div className="mt-3">
                      {editingJustification === item.id ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="text"
                            placeholder="Add justification (optional)"
                            value={justificationText[item.id] || item.justification || ''}
                            onChange={(e) => setJustificationText({
                              ...justificationText,
                              [item.id]: e.target.value
                            })}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleJustificationSave(item.id)}
                          >
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingJustification(null)}
                          >
                            <XCircleIcon className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">
                            {item.justification || (
                              <span className="italic text-gray-400">No justification provided</span>
                            )}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingJustification(item.id)
                              setJustificationText({
                                ...justificationText,
                                [item.id]: item.justification || ''
                              })
                            }}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Usage Hint */}
                  {item.product.average_monthly_usage && (
                    <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                      <CalculatorIcon className="h-3 w-3 inline mr-1" />
                      Average monthly usage: {item.product.average_monthly_usage} {item.product.unit_of_measure}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Actions */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>Review your order before submitting</span>
          </div>
          <div className="flex items-center space-x-3">
            {onSaveDraft && (
              <Button
                variant="secondary"
                onClick={onSaveDraft}
                disabled={isLoading}
              >
                Save Draft
              </Button>
            )}
            {onSubmitOrder && (
              <Button
                variant="primary"
                onClick={onSubmitOrder}
                disabled={isLoading || items.length === 0}
              >
                {isLoading ? 'Submitting...' : 'Submit Order'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}