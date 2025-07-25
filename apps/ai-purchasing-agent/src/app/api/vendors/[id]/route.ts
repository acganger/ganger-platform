import { NextRequest, NextResponse } from 'next/server'
import { VendorManagementRepository } from '@ganger/db'
import { withStaffAuth, type AuthenticatedHandler } from '@ganger/auth/middleware'

interface RouteContext {
  params: {
    id: string
  }
}

const getHandler: AuthenticatedHandler = async (request: NextRequest, context: any) => {
  const { params } = context as RouteContext
  try {
    const repository = new VendorManagementRepository()
    const vendor = await repository.findById(params.id)
    
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Get additional vendor statistics
    const quotes = await repository.getQuotesForVendor(params.id)
    const productMappings = await repository.getProductMappingsForVendor(params.id)

    // Calculate vendor performance metrics
    const totalQuotes = quotes.length
    const contractQuotes = quotes.filter(q => q.is_contract_pricing).length
    const inStockQuotes = quotes.filter(q => q.is_in_stock).length
    const averageUnitPrice = quotes.reduce((sum, q) => sum + q.unit_price, 0) / (totalQuotes || 1)

    return NextResponse.json({
      success: true,
      data: {
        ...vendor,
        statistics: {
          totalQuotes,
          contractQuotes,
          inStockQuotes,
          averageUnitPrice,
          productsCovered: productMappings.length
        }
      }
    })
  } catch (error) {
    console.error('Error fetching vendor:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch vendor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export const GET = withStaffAuth(getHandler)

const patchHandler: AuthenticatedHandler = async (request: NextRequest, context: any) => {
  const { params } = context as RouteContext
  try {
    const body = await request.json()
    const repository = new VendorManagementRepository()
    
    // Check if vendor exists
    const existingVendor = await repository.findById(params.id)
    if (!existingVendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    const updatedVendor = await repository.update(params.id, body)
    
    return NextResponse.json({
      success: true,
      data: updatedVendor
    })
  } catch (error) {
    console.error('Error updating vendor:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update vendor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export const PATCH = withStaffAuth(patchHandler)

const deleteHandler: AuthenticatedHandler = async (request: NextRequest, context: any) => {
  const { params } = context as RouteContext
  try {
    const repository = new VendorManagementRepository()
    
    // Check if vendor exists
    const existingVendor = await repository.findById(params.id)
    if (!existingVendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Soft delete by setting is_active to false
    await repository.update(params.id, { is_active: false })
    
    return NextResponse.json({
      success: true,
      message: 'Vendor deactivated successfully'
    })
  } catch (error) {
    console.error('Error deleting vendor:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete vendor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export const DELETE = withStaffAuth(deleteHandler)