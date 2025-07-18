'use client'

import { useState } from 'react'
import { ProductCatalog } from '@/components/ProductCatalog'
import { OrderBuilder } from '@/components/OrderBuilder'
import { DepartmentSelector } from '@/components/DepartmentSelector'
import { Input, Select } from '@ganger/ui-catalyst'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import type { StandardizedProduct, ConsolidatedOrderItem, ProductCategory } from '@ganger/types'

// Mock products data
const mockProducts: StandardizedProduct[] = [
  {
    id: '1',
    name: 'Nitrile Exam Gloves - Small',
    category: 'gloves_ppe',
    standard_package_size: 'Box of 100',
    units_per_package: 100,
    unit_of_measure: 'gloves',
    description: 'Powder-free nitrile examination gloves, small size',
    specifications: ['Powder-free', 'Latex-free', 'Textured fingertips'],
    is_critical: true,
    average_monthly_usage: 300,
    reorder_point: 10,
    minimum_order_quantity: 5,
    maximum_order_quantity: 50,
    substitute_product_ids: [],
    tags: ['exam', 'nitrile', 'small', 'powder-free'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Nitrile Exam Gloves - Medium',
    category: 'gloves_ppe',
    standard_package_size: 'Box of 100',
    units_per_package: 100,
    unit_of_measure: 'gloves',
    description: 'Powder-free nitrile examination gloves, medium size',
    specifications: ['Powder-free', 'Latex-free', 'Textured fingertips'],
    is_critical: true,
    average_monthly_usage: 500,
    reorder_point: 15,
    minimum_order_quantity: 5,
    maximum_order_quantity: 50,
    substitute_product_ids: [],
    tags: ['exam', 'nitrile', 'medium', 'powder-free'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Adhesive Bandages',
    category: 'wound_care',
    standard_package_size: 'Box of 100',
    units_per_package: 100,
    unit_of_measure: 'bandages',
    description: 'Assorted sizes adhesive bandages',
    specifications: ['Hypoallergenic', 'Latex-free', 'Sterile'],
    is_critical: false,
    average_monthly_usage: 200,
    reorder_point: 5,
    minimum_order_quantity: 1,
    maximum_order_quantity: 20,
    substitute_product_ids: [],
    tags: ['bandages', 'adhesive', 'wound care'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    name: '2x2 Gauze Pads',
    category: 'wound_care',
    standard_package_size: 'Pack of 200',
    units_per_package: 200,
    unit_of_measure: 'pads',
    description: 'Sterile 2x2 inch gauze pads',
    specifications: ['Sterile', '12-ply', '100% cotton'],
    is_critical: false,
    average_monthly_usage: 400,
    reorder_point: 10,
    minimum_order_quantity: 2,
    maximum_order_quantity: 30,
    substitute_product_ids: [],
    tags: ['gauze', 'sterile', 'wound care'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Alcohol Prep Pads',
    category: 'antiseptics',
    standard_package_size: 'Box of 100',
    units_per_package: 100,
    unit_of_measure: 'pads',
    description: '70% isopropyl alcohol prep pads',
    specifications: ['70% isopropyl alcohol', 'Sterile', 'Single-use'],
    is_critical: true,
    average_monthly_usage: 1000,
    reorder_point: 20,
    minimum_order_quantity: 5,
    maximum_order_quantity: 100,
    substitute_product_ids: [],
    tags: ['alcohol', 'prep pads', 'antiseptic'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '6',
    name: '3mL Syringe with Needle',
    category: 'syringes',
    standard_package_size: 'Box of 100',
    units_per_package: 100,
    unit_of_measure: 'syringes',
    description: '3mL syringe with 25G needle',
    specifications: ['3mL capacity', '25G x 1" needle', 'Luer lock'],
    is_critical: true,
    average_monthly_usage: 300,
    reorder_point: 10,
    minimum_order_quantity: 1,
    maximum_order_quantity: 20,
    substitute_product_ids: [],
    tags: ['syringe', '3ml', '25g', 'needle'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

interface OrderItem extends ConsolidatedOrderItem {
  product: StandardizedProduct
}

export default function TestComponentsPage() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('clinical')
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cartItems, setCartItems] = useState<Map<string, number>>(new Map())
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])

  const handleAddToCart = (product: StandardizedProduct, quantity: number) => {
    // Update cart items count
    const newCart = new Map(cartItems)
    const currentQuantity = newCart.get(product.id) || 0
    newCart.set(product.id, currentQuantity + quantity)
    setCartItems(newCart)

    // Add to order items
    const existingItemIndex = orderItems.findIndex(item => item.product.id === product.id)
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...orderItems]
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        requested_quantity: updatedItems[existingItemIndex].requested_quantity + quantity
      }
      setOrderItems(updatedItems)
    } else {
      // Add new item
      const newItem: OrderItem = {
        id: `order-item-${Date.now()}`,
        consolidated_order_id: 'test-order',
        standardized_product_id: product.id,
        requested_quantity: quantity,
        urgency_level: 'routine',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        product
      }
      setOrderItems([...orderItems, newItem])
    }

    // Product added to cart successfully
  }

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    const updatedItems = orderItems.map(item => 
      item.id === itemId ? { ...item, requested_quantity: quantity } : item
    )
    setOrderItems(updatedItems)

    // Update cart count
    const newCart = new Map()
    updatedItems.forEach(item => {
      newCart.set(item.product.id, item.requested_quantity)
    })
    setCartItems(newCart)
  }

  const handleRemoveItem = (itemId: string) => {
    const item = orderItems.find(i => i.id === itemId)
    if (item) {
      cartItems.delete(item.product.id)
      setCartItems(new Map(cartItems))
    }
    setOrderItems(orderItems.filter(item => item.id !== itemId))
  }

  const handleUpdateJustification = (itemId: string, justification: string) => {
    const updatedItems = orderItems.map(item => 
      item.id === itemId ? { ...item, justification } : item
    )
    setOrderItems(updatedItems)
  }

  const handleUpdateUrgency = (itemId: string, urgency: 'routine' | 'urgent') => {
    const updatedItems = orderItems.map(item => 
      item.id === itemId ? { ...item, urgency_level: urgency } : item
    )
    setOrderItems(updatedItems)
  }

  const handleSubmitOrder = () => {
    // Submit order logic here
    alert('Order submitted successfully!')
  }

  const handleSaveDraft = () => {
    // Save draft logic here
    alert('Draft saved successfully!')
  }

  const handleQuickAction = (action: string) => {
    setSearchQuery(action)
  }

  const categories: Array<{ value: ProductCategory; label: string }> = [
    { value: 'gloves_ppe', label: '🧤 Gloves & PPE' },
    { value: 'wound_care', label: '🩹 Wound Care' },
    { value: 'syringes', label: '💉 Syringes' },
    { value: 'antiseptics', label: '🧴 Antiseptics' }
  ]

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Consolidated Order Form - Component Test</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Department & Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Department Selector */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Department</h2>
            <DepartmentSelector
              selectedDepartment={selectedDepartment}
              onSelectDepartment={setSelectedDepartment}
              showQuickActions={true}
              onQuickAction={handleQuickAction}
            />
          </section>

          {/* Product Filters */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Browse Products</h2>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ProductCategory | 'all')}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categories
                ]}
              />
            </div>
          </section>

          {/* Product Catalog */}
          <section>
            <ProductCatalog
              products={mockProducts}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              onAddToCart={handleAddToCart}
              cartItems={cartItems}
              showUsageHints={true}
            />
          </section>
        </div>

        {/* Right Column - Order Builder */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Order</h2>
            <OrderBuilder
              items={orderItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onUpdateJustification={handleUpdateJustification}
              onUpdateUrgency={handleUpdateUrgency}
              onSubmitOrder={handleSubmitOrder}
              onSaveDraft={handleSaveDraft}
              department={selectedDepartment}
            />
          </div>
        </div>
      </div>
    </div>
  )
}