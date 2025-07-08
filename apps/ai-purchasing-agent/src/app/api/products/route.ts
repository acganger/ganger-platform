import { NextRequest, NextResponse } from 'next/server'
import { StandardizedProductsRepository } from '@ganger/db'
import { withStaffAuth } from '@ganger/auth/middleware'
import type { StandardizedProduct, ProductCategory } from '@ganger/types'
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api-utils'
import { validateRequest, searchProductsSchema, paginationSchema, checkRateLimit } from '@/lib/validation'

const getHandler = async (request: NextRequest, context: any) => {
  try {
    const session = context.session
    
    // Rate limiting
    if (!checkRateLimit(session?.user?.email || 'anonymous', 100, 60000)) {
      return createErrorResponse('Rate limit exceeded', 429)
    }
    
    const { searchParams } = new URL(request.url)
    
    // Parse search parameters manually for now
    const search = searchParams.get('search') || undefined
    const category = searchParams.get('category') || undefined
    const vendorId = searchParams.get('vendorId') || undefined
    const inStock = searchParams.get('inStock') ? searchParams.get('inStock') === 'true' : undefined
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = (page - 1) * limit
    
    const onlyActive = searchParams.get('active') !== 'false'
    const critical = searchParams.get('critical')

    const repository = new StandardizedProductsRepository()
    let products: StandardizedProduct[]

    if (category && category !== 'all') {
      products = await repository.findByCategory(category as ProductCategory, onlyActive)
    } else {
      products = await repository.findAll(onlyActive)
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

    // Apply critical filter
    if (critical === 'true') {
      products = products.filter(product => product.is_critical)
    } else if (critical === 'false') {
      products = products.filter(product => !product.is_critical)
    }

    // Sort by critical items first, then by name
    products.sort((a, b) => {
      if (a.is_critical && !b.is_critical) return -1
      if (!a.is_critical && b.is_critical) return 1
      return a.name.localeCompare(b.name)
    })

    const total = products.length
    const paginatedProducts = products.slice(offset, offset + limit)
    
    return createSuccessResponse({
      data: paginatedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// Apply authentication
export const GET = withStaffAuth(getHandler)

export const POST = withStaffAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const repository = new StandardizedProductsRepository()
    
    // Validate required fields
    const requiredFields = ['name', 'category', 'standard_package_size', 'units_per_package', 'unit_of_measure']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          missingFields
        },
        { status: 400 }
      )
    }

    // Set defaults
    const productData = {
      ...body,
      specifications: body.specifications || [],
      substitute_product_ids: body.substitute_product_ids || [],
      tags: body.tags || [],
      is_active: body.is_active !== false,
      is_critical: body.is_critical || false
    }

    const product = await repository.create(productData)
    
    return NextResponse.json({
      success: true,
      data: product
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})