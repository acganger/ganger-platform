'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { useAuth } from '@ganger/auth'
import { PageLayout } from '@/components/PageLayout'
import { Button, Alert, LoadingSpinner, Badge } from '@ganger/ui'
import { Card, CardContent, CardHeader } from '@ganger/ui-catalyst'
import { VendorPriceGrid } from '@/components/VendorPriceGrid'
import { Package, TrendingUp, DollarSign, Clock } from 'lucide-react'
import type { StandardizedProduct, VendorConfiguration, VendorQuote } from '@ganger/types'

interface ComparisonData {
  product: StandardizedProduct
  vendors: VendorConfiguration[]
  quotes: VendorQuote[]
}

export default function VendorComparisonPage() {
  const { user } = useAuth()
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [products, setProducts] = useState<StandardizedProduct[]>([])

  // Load products on mount
  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products?active=true')
      if (!response.ok) throw new Error('Failed to load products')
      
      const data = await response.json()
      setProducts(data.data)
    } catch (error) {
      setError('Failed to load products')
      console.error(error)
    }
  }

  const loadComparisonData = async () => {
    if (selectedProducts.length === 0) {
      setError('Please select at least one product to compare')
      return
    }

    setLoading(true)
    setError('')

    try {
      const comparisons = await Promise.all(
        selectedProducts.map(async (productId) => {
          const response = await fetch('/api/price-comparison', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productIds: [productId],
              includeInactive: false
            })
          })

          if (!response.ok) throw new Error('Failed to load comparison data')
          
          const data = await response.json()
          return data.data.comparisons[0]
        })
      )

      setComparisonData(comparisons)
    } catch (error) {
      setError('Failed to load vendor comparison data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSavings = (quotes: VendorQuote[]) => {
    if (quotes.length < 2) return 0
    const prices = quotes.map(q => q.total_price)
    const highest = Math.max(...prices)
    const lowest = Math.min(...prices)
    return highest - lowest
  }

  const getLowestPrice = (quotes: VendorQuote[]) => {
    if (quotes.length === 0) return null
    return quotes.reduce((min, q) => q.total_price < min.total_price ? q : min)
  }

  // Future implementation for delivery time display
  // const getAverageDeliveryTime = (vendorId: string, vendors: VendorConfiguration[]) => {
  //   const vendor = vendors.find(v => v.id === vendorId)
  //   return vendor?.average_delivery_days || 'N/A'
  // }

  return (
    <PageLayout
      title="Vendor Price Comparison"
      user={user}
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Vendor Comparison', href: '/vendor-comparison' }
      ]}
    >
      <div className="space-y-6">
        {/* Product Selection */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Select Products to Compare</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      value={product.id}
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, product.id])
                        } else {
                          setSelectedProducts(selectedProducts.filter(id => id !== product.id))
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.category}</div>
                      {product.is_critical && (
                        <Badge variant="destructive" size="sm" className="mt-1">
                          Critical Item
                        </Badge>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedProducts([])}
                    disabled={selectedProducts.length === 0}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    onClick={loadComparisonData}
                    disabled={selectedProducts.length === 0 || loading}
                  >
                    Compare Prices
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-3">Loading vendor comparison data...</span>
            </CardContent>
          </Card>
        )}

        {/* Comparison Results */}
        {!loading && comparisonData.length > 0 && (
          <div className="space-y-6">
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Package className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Products Compared</p>
                      <p className="text-xl font-semibold">{comparisonData.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">Total Potential Savings</p>
                      <p className="text-xl font-semibold">
                        ${comparisonData.reduce((sum, data) => sum + calculateSavings(data.quotes), 0).toFixed(2)}
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
                      <p className="text-sm text-gray-500">Avg Price Variance</p>
                      <p className="text-xl font-semibold">
                        {(comparisonData.reduce((sum, data) => {
                          if (data.quotes.length < 2) return sum
                          const prices = data.quotes.map(q => q.total_price)
                          const avg = prices.reduce((a, b) => a + b) / prices.length
                          const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length
                          return sum + (Math.sqrt(variance) / avg * 100)
                        }, 0) / comparisonData.length).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-500">Vendors Compared</p>
                      <p className="text-xl font-semibold">
                        {new Set(comparisonData.flatMap(d => d.quotes.map(q => q.vendor_id))).size}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Comparisons */}
            {comparisonData.map((data) => (
              <Card key={data.product.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{data.product.name}</h3>
                      <p className="text-sm text-gray-500">
                        {data.product.standard_package_size} • {data.product.category}
                      </p>
                    </div>
                    {data.product.is_critical && (
                      <Badge variant="destructive">Critical Item</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <VendorPriceGrid
                    quotes={data.quotes}
                    vendors={data.vendors}
                    product={data.product}
                  />
                  
                  {/* Summary */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Lowest Price:</span>
                        <div className="font-semibold">
                          ${getLowestPrice(data.quotes)?.unit_price.toFixed(2) || 'N/A'} per unit
                        </div>
                        <div className="text-xs text-gray-500">
                          {getLowestPrice(data.quotes) && 
                            data.vendors.find(v => v.id === getLowestPrice(data.quotes)?.vendor_id)?.vendor_name
                          }
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Potential Savings:</span>
                        <div className="font-semibold text-green-600">
                          ${calculateSavings(data.quotes).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Between highest and lowest
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Fastest Delivery:</span>
                        <div className="font-semibold">
                          {Math.min(...data.vendors.map(v => v.average_delivery_days || 999))} days
                        </div>
                        <div className="text-xs text-gray-500">
                          {data.vendors
                            .filter(v => v.average_delivery_days === Math.min(...data.vendors.map(v => v.average_delivery_days || 999)))
                            .map(v => v.vendor_name)
                            .join(', ')
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}