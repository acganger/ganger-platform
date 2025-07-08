'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@ganger/auth'
import { PageLayout } from '@/components/PageLayout'
import { ProductCatalog } from '@/components/ProductCatalog'
import { useCart } from '@/contexts/CartContext'
import { Button, Badge, Alert } from '@ganger/ui'
import { ShoppingCart } from 'lucide-react'
import type { StandardizedProduct } from '@ganger/types'

export default function ProductsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { totalItems } = useCart()
  const [products, setProducts] = useState<StandardizedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products?active=true')
      
      if (!response.ok) {
        throw new Error('Failed to load products')
      }
      
      const data = await response.json()
      setProducts(data.data)
    } catch (error) {
      console.error('Error loading products:', error)
      setError('Failed to load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleProductClick = (product: StandardizedProduct) => {
    // Could navigate to a product detail page
    // For now, we'll just let the catalog handle adding to cart
  }

  return (
    <PageLayout
      title="Product Catalog"
      user={user}
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Products', href: '/products' }
      ]}
      actions={
        <Button
          onClick={() => router.push('/cart')}
          variant="outline"
          className="relative"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          View Cart
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
      }
    >
      <div className="space-y-6">
        {/* Instructions */}
        <Alert>
          <div className="font-semibold">AI-Powered Procurement</div>
          <div className="text-sm mt-1">
            Browse our catalog and add items to your cart. Our AI will analyze your selections
            to find the best prices, identify bulk buying opportunities, and ensure contract compliance.
          </div>
        </Alert>

        {/* Error Display */}
        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {/* Product Catalog */}
        <ProductCatalog
          products={products}
          loading={loading}
          onProductClick={handleProductClick}
        />
      </div>
    </PageLayout>
  )
}