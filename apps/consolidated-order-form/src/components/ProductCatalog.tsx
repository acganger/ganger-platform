'use client'

import { useState, useMemo } from 'react'
import { Badge, Button } from '@ganger/ui'
import { Card, CardContent } from '@ganger/ui-catalyst'
import { Input } from '@ganger/ui-catalyst'
import { 
  PlusIcon, 
  MinusIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'
import type { StandardizedProduct, ProductCategory } from '@ganger/types'

interface ProductCatalogProps {
  products: StandardizedProduct[]
  selectedCategory?: ProductCategory | 'all'
  searchQuery?: string
  onAddToCart: (product: StandardizedProduct, quantity: number) => void
  cartItems?: Map<string, number> // productId -> quantity
  showUsageHints?: boolean
}


export function ProductCatalog({
  products,
  selectedCategory = 'all',
  searchQuery = '',
  onAddToCart,
  cartItems = new Map(),
  showUsageHints = true
}: ProductCatalogProps) {
  const [quantities, setQuantities] = useState<Map<string, number>>(new Map())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Filter and search products
  const filteredProducts = useMemo(() => {
    let filtered = products

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Sort by critical items first, then by name
    return filtered.sort((a, b) => {
      if (a.is_critical && !b.is_critical) return -1
      if (!a.is_critical && b.is_critical) return 1
      return a.name.localeCompare(b.name)
    })
  }, [products, selectedCategory, searchQuery])

  const getQuantity = (productId: string) => {
    return quantities.get(productId) || 0
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 0) return
    
    const product = products.find(p => p.id === productId)
    if (!product) return

    // Enforce min/max quantities
    const finalQuantity = Math.min(
      Math.max(quantity, 0),
      product.maximum_order_quantity || 999
    )

    if (finalQuantity === 0) {
      quantities.delete(productId)
    } else {
      setQuantities(new Map(quantities.set(productId, finalQuantity)))
    }
  }

  const handleAddToCart = (product: StandardizedProduct) => {
    const quantity = getQuantity(product.id) || product.minimum_order_quantity || 1
    onAddToCart(product, quantity)
    // Reset quantity after adding
    quantities.delete(product.id)
    setQuantities(new Map(quantities))
  }

  const formatPackageSize = (product: StandardizedProduct) => {
    return `${product.standard_package_size} (${product.units_per_package} ${product.unit_of_measure})`
  }

  const getCategoryIcon = (category: ProductCategory) => {
    const icons: Record<ProductCategory, string> = {
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

  const ProductCard = ({ product }: { product: StandardizedProduct }) => {
    const quantity = getQuantity(product.id)
    const inCart = cartItems.get(product.id) || 0
    const isLowStock = product.reorder_point && product.average_monthly_usage && 
                       product.average_monthly_usage < (product.reorder_point * 0.5)

    return (
      <Card className="h-full flex flex-col">
        <CardContent className="flex-1 flex flex-col p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getCategoryIcon(product.category)}</span>
                <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
              </div>
              {product.is_critical && (
                <Badge variant="destructive" className="mt-1 text-xs">
                  <StarIcon className="h-3 w-3 mr-1" />
                  Critical Item
                </Badge>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-2 mb-4 flex-1">
            <p className="text-sm text-gray-600 line-clamp-2">
              {product.description || 'No description available'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                {formatPackageSize(product)}
              </Badge>
              {inCart > 0 && (
                <Badge variant="primary" className="text-xs">
                  <ShoppingCartIcon className="h-3 w-3 mr-1" />
                  {inCart} in cart
                </Badge>
              )}
            </div>
          </div>

          {/* Usage Hints */}
          {showUsageHints && product.average_monthly_usage && (
            <div className="mb-4 p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center text-blue-700">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  <span>Avg. monthly: {product.average_monthly_usage} {product.unit_of_measure}</span>
                </div>
                {isLowStock && (
                  <div className="flex items-center text-orange-600">
                    <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                    <span>Low stock</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quantity Controls */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateQuantity(product.id, quantity - 1)}
                disabled={quantity <= 0}
                className="p-1"
              >
                <MinusIcon className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                className="w-20 text-center"
                min={0}
                max={product.maximum_order_quantity}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateQuantity(product.id, quantity + 1)}
                disabled={product.maximum_order_quantity ? quantity >= product.maximum_order_quantity : false}
                className="p-1"
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-500">{product.unit_of_measure}</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => handleAddToCart(product)}
              disabled={quantity === 0}
            >
              Add to Order
            </Button>
          </div>

          {/* Min/Max Info */}
          {(product.minimum_order_quantity || product.maximum_order_quantity) && (
            <p className="mt-2 text-xs text-gray-500 text-center">
              {product.minimum_order_quantity && `Min: ${product.minimum_order_quantity}`}
              {product.minimum_order_quantity && product.maximum_order_quantity && ' • '}
              {product.maximum_order_quantity && `Max: ${product.maximum_order_quantity}`}
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  if (filteredProducts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-end">
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Product Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map(product => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCategoryIcon(product.category)}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-600">{formatPackageSize(product)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {product.is_critical && (
                      <Badge variant="destructive">Critical</Badge>
                    )}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(product.id, getQuantity(product.id) - 1)}
                        disabled={getQuantity(product.id) <= 0}
                      >
                        <MinusIcon className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={getQuantity(product.id)}
                        onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                        className="w-20 text-center"
                        min={0}
                        max={product.maximum_order_quantity}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(product.id, getQuantity(product.id) + 1)}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={getQuantity(product.id) === 0}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}