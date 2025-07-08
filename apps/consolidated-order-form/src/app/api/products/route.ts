import { NextRequest, NextResponse } from 'next/server'
import { StandardizedProductsRepository } from '@ganger/db'
import type { StandardizedProduct, ProductCategory } from '@ganger/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as ProductCategory | null
    const search = searchParams.get('search')
    const department = searchParams.get('department')

    const repository = new StandardizedProductsRepository()
    let products: StandardizedProduct[]

    if (category && category !== 'all') {
      products = await repository.findByCategory(category, true) // Only active products
    } else {
      products = await repository.findAll(true) // Only active products
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      products = products.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // Department-specific filtering could be added here
    // For now, we'll return all products but this could be enhanced
    // to show department-preferred products first
    
    // Sort by critical items first, then by usage frequency
    products.sort((a, b) => {
      // Critical items first
      if (a.is_critical && !b.is_critical) return -1
      if (!a.is_critical && b.is_critical) return 1
      
      // Then by monthly usage (higher usage first)
      const aUsage = a.average_monthly_usage || 0
      const bUsage = b.average_monthly_usage || 0
      if (aUsage !== bUsage) return bUsage - aUsage
      
      // Finally by name
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
      filters: {
        category,
        search,
        department
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // This endpoint is primarily for quick order requests
    // It could create a purchase request with the specified products
    const { products, department, notes, urgency = 'routine' } = body
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Products array is required and must not be empty'
        },
        { status: 400 }
      )
    }

    // For now, return a mock response
    // In a real implementation, this would create a purchase request
    const orderNumber = `ORD-${Date.now()}`
    
    return NextResponse.json({
      success: true,
      data: {
        orderNumber,
        department,
        urgency,
        itemCount: products.length,
        status: 'draft',
        notes
      },
      message: 'Order draft created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}