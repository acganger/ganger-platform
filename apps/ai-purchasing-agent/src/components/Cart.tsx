'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { Button, Badge, Alert } from '@ganger/ui'
import { Card, CardContent, CardHeader } from '@ganger/ui-catalyst'
import { Input } from '@ganger/ui-catalyst'
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Package } from 'lucide-react'
import { formatCurrency } from '@ganger/utils'

interface CartProps {
  onCheckout?: () => void
  showActions?: boolean
}

export function Cart({ onCheckout, showActions = true }: CartProps) {
  const { items, totalItems, updateQuantity, removeFromCart, clearCart } = useCart()
  const [loading, _setLoading] = useState(false) // Loading state for future checkout implementation
  const router = useRouter()

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity >= 0) {
      updateQuantity(productId, newQuantity)
    }
  }

  const estimatedTotal = items.reduce((sum, item) => {
    // This is a rough estimate - actual pricing would come from vendor quotes
    const estimatedPrice = 50 // Default estimate
    return sum + (estimatedPrice * item.quantity)
  }, 0)

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Button variant="outline" onClick={() => router.push('/products')}>
            Browse Products
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Shopping Cart ({totalItems} item{totalItems !== 1 ? 's' : ''})
            </h3>
            {showActions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-red-600 hover:text-red-700"
              >
                Clear Cart
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex items-start space-x-4 p-4 border rounded-lg"
              >
                <Package className="h-10 w-10 text-gray-400 mt-1" />
                
                <div className="flex-1 space-y-2">
                  <div>
                    <h4 className="font-medium">{item.product.name}</h4>
                    <p className="text-sm text-gray-500">
                      {item.product.category} • {item.product.unit_of_measure}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value) || 0)}
                        className="w-20 text-center"
                        min="0"
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <span className="text-sm text-gray-500">
                      × {item.product.standard_package_size || 1} {item.product.unit_of_measure}
                    </span>
                  </div>
                  
                  {item.product.is_critical && (
                    <Badge variant="destructive" size="sm">
                      Critical Item
                    </Badge>
                  )}
                </div>
                
                <div className="text-right space-y-2">
                  <p className="text-sm text-gray-500">Est. ~$50/unit</p>
                  <p className="font-semibold">
                    ~{formatCurrency(50 * item.quantity)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showActions && (
        <>
          <Alert>
            <p className="text-sm">
              Actual pricing will be determined during AI analysis based on vendor quotes, 
              contract pricing, and bulk discounts.
            </p>
          </Alert>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span>Estimated Total:</span>
                  <span className="font-semibold">~{formatCurrency(estimatedTotal)}</span>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push('/products')}
                  >
                    Continue Shopping
                  </Button>
                  
                  <Button
                    className="flex-1"
                    onClick={onCheckout}
                    disabled={loading || items.length === 0}
                  >
                    Proceed to Analysis
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}