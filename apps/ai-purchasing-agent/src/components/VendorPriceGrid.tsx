'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@ganger/ui'
import { Badge } from '@ganger/ui'
import { Button } from '@ganger/ui'
import { CheckCircleIcon, TruckIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'
import type { VendorQuote, VendorConfiguration, StandardizedProduct } from '@ganger/types'

interface VendorPriceGridProps {
  product: StandardizedProduct
  quotes: VendorQuote[]
  vendors: VendorConfiguration[]
  recommendedVendorId?: string
  onSelectVendor?: (vendorId: string, quote: VendorQuote) => void
}

export function VendorPriceGrid({
  product,
  quotes,
  vendors,
  recommendedVendorId,
  onSelectVendor
}: VendorPriceGridProps) {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)

  // Sort quotes by total price
  const sortedQuotes = useMemo(() => {
    return [...quotes].sort((a, b) => a.total_price - b.total_price)
  }, [quotes])

  const getVendor = (vendorId: string) => {
    return vendors.find(v => v.id === vendorId)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDeliveryDate = (date: string) => {
    const deliveryDate = new Date(date)
    const today = new Date()
    const daysUntilDelivery = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDelivery === 0) return 'Today'
    if (daysUntilDelivery === 1) return 'Tomorrow'
    if (daysUntilDelivery <= 7) return `${daysUntilDelivery} days`
    
    return deliveryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleSelectVendor = (vendorId: string, quote: VendorQuote) => {
    setSelectedVendorId(vendorId)
    onSelectVendor?.(vendorId, quote)
  }

  if (sortedQuotes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No vendor quotes available for this product.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Price Comparison for {product.name}
        </h3>
        <Badge variant="secondary">
          {product.standard_package_size}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedQuotes.map((quote, index) => {
          const vendor = getVendor(quote.vendor_id)
          if (!vendor) return null

          const isRecommended = vendor.id === recommendedVendorId
          const isSelected = vendor.id === selectedVendorId
          const isLowestPrice = index === 0
          const savings = sortedQuotes[sortedQuotes.length - 1].total_price - quote.total_price
          const savingsPercent = (savings / sortedQuotes[sortedQuotes.length - 1].total_price) * 100

          return (
            <Card
              key={quote.id}
              className={`relative transition-all ${
                isSelected 
                  ? 'ring-2 ring-primary-500 bg-primary-50' 
                  : 'hover:shadow-md cursor-pointer'
              }`}
              onClick={() => handleSelectVendor(vendor.id, quote)}
            >
              {isRecommended && (
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                    <StarIcon className="h-3 w-3" />
                    <span>AI Pick</span>
                  </div>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{vendor.vendor_name}</CardTitle>
                    {quote.is_contract_pricing && (
                      <Badge variant="success" className="mt-1 text-xs">
                        Contract Price
                      </Badge>
                    )}
                  </div>
                  {isLowestPrice && (
                    <Badge variant="primary" className="text-xs">
                      Best Price
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Price Information */}
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(quote.total_price)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatCurrency(quote.unit_price)}/unit
                    </span>
                  </div>
                  {savings > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      Save {formatCurrency(savings)} ({savingsPercent.toFixed(0)}%)
                    </p>
                  )}
                </div>

                {/* Shipping & Delivery */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <TruckIcon className="h-4 w-4 mr-1" />
                    <span>{formatDeliveryDate(quote.estimated_delivery_date || '')}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    <span>
                      {quote.shipping_cost === 0 
                        ? 'Free ship' 
                        : `+${formatCurrency(quote.shipping_cost || 0)}`
                      }
                    </span>
                  </div>
                </div>

                {/* Stock Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircleIcon className={`h-4 w-4 mr-1 ${
                      quote.is_in_stock ? 'text-green-500' : 'text-red-500'
                    }`} />
                    <span className={`text-sm ${
                      quote.is_in_stock ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {quote.is_in_stock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  {quote.product_match_score && (
                    <span className="text-xs text-gray-500">
                      {(quote.product_match_score * 100).toFixed(0)}% match
                    </span>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  variant={isSelected ? 'primary' : 'secondary'}
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelectVendor(vendor.id, quote)
                  }}
                >
                  {isSelected ? 'Selected' : 'Select Vendor'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Price Range</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(sortedQuotes[0].total_price)} - {formatCurrency(sortedQuotes[sortedQuotes.length - 1].total_price)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Potential Savings</p>
            <p className="text-lg font-semibold text-green-600">
              Up to {formatCurrency(sortedQuotes[sortedQuotes.length - 1].total_price - sortedQuotes[0].total_price)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}