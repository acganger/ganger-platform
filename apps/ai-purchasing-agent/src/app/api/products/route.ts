import { NextRequest, NextResponse } from 'next/server'
import { StandardizedProductsRepository } from '@ganger/db'
import type { StandardizedProduct, ProductCategory } from '@ganger/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
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

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length
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
}