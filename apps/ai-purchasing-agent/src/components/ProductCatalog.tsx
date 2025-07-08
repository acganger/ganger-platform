'use client'

import { useState } from 'react'
import { Card, CardContent, Button, Input, Badge, Select, LoadingSpinner } from '@ganger/ui'
import { useCart } from '@/contexts/CartContext'
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  ShoppingCart,
  Check,
  AlertTriangle
} from 'lucide-react'
import type { StandardizedProduct } from '@ganger/types'

interface ProductCatalogProps {
  products: StandardizedProduct[]
  loading?: boolean
  onProductClick?: (product: StandardizedProduct) => void
}

export function ProductCatalog({ 
  products, 
  loading = false,
  onProductClick 
}: ProductCatalogProps) {
  const { addToCart, isInCart, getItemQuantity } = useCart()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set())

  // Get unique categories
  const categories = ['all', ...new Set(products.map(p => p.category))]

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const handleAddToCart = (product: StandardizedProduct) => {
    const quantity = quantities[product.id] || 1
    addToCart(product, quantity)
    
    // Show confirmation
    setAddedProducts(prev => new Set(prev).add(product.id))
    setTimeout(() => {
      setAddedProducts(prev => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }, 2000)
  }

  const handleQuantityChange = (productId: string, value: string) => {
    const quantity = parseInt(value) || 1
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, quantity)
    }))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3">Loading products...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products by name, SKU, or manufacturer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={categories.map(category => ({
                  value: category,
                  label: category === 'all' ? 'All Categories' : category
                }))}
                className="w-48"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {filteredProducts.length} of {products.length} products
        </p>
        <p className="text-sm text-gray-500">
          {filteredProducts.filter(p => p.is_critical).length} critical items
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const inCart = isInCart(product.id)
          const cartQuantity = getItemQuantity(product.id)
          const isAdded = addedProducts.has(product.id)
          
          return (
            <Card 
              key={product.id} 
              className={`hover:shadow-lg transition-shadow cursor-pointer ${
                inCart ? 'ring-2 ring-green-500' : ''
              }`}
              onClick={() => onProductClick?.(product)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Product Header */}
                  <div className="flex items-start justify-between">
                    <Package className="h-8 w-8 text-gray-400" />
                    <div className="flex gap-2">
                      {product.is_critical && (
                        <Badge variant="destructive" size="sm">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Critical
                        </Badge>
                      )}
                      {inCart && (
                        <Badge variant="success" size="sm">
                          <Check className="h-3 w-3 mr-1" />
                          In Cart ({cartQuantity})
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {product.category}
                    </p>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>Category: {product.category}</p>
                    <p>Package: {product.standard_package_size} {product.unit_of_measure}</p>
                  </div>

                  {/* Add to Cart Section */}
                  <div 
                    className="border-t pt-3 space-y-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={quantities[product.id] || 1}
                        onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                        className="w-20"
                        placeholder="Qty"
                      />
                      <span className="text-xs text-gray-500">
                        × {product.standard_package_size} {product.unit_of_measure}
                      </span>
                    </div>
                    
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleAddToCart(product)}
                      variant={isAdded ? 'outline' : 'primary'}
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Added!
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No products found matching your criteria</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}