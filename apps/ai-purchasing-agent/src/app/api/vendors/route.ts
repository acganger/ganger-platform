import { NextRequest, NextResponse } from 'next/server'
import { VendorManagementRepository } from '@ganger/db'
import type { VendorConfiguration } from '@ganger/types'
import { withStaffAuth } from '@ganger/auth/middleware'

export const GET = withStaffAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const onlyActive = searchParams.get('active') !== 'false'
    const hasContracts = searchParams.get('contracts')
    // const category = searchParams.get('category') // Future filtering implementation

    const repository = new VendorManagementRepository()
    let vendors = await repository.findAll(onlyActive)

    // Filter by contract availability
    if (hasContracts === 'true') {
      vendors = vendors.filter(vendor => vendor.gpo_contract_number)
    } else if (hasContracts === 'false') {
      vendors = vendors.filter(vendor => !vendor.gpo_contract_number)
    }

    // Add category-specific filtering if needed
    // This would require additional data modeling for vendor categories

    // Calculate contract expiry warnings
    const vendorsWithWarnings = vendors.map(vendor => {
      const warnings = []
      const daysUntilExpiry = vendor.contract_expiry_date 
        ? Math.ceil((new Date(vendor.contract_expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null

      if (daysUntilExpiry !== null && daysUntilExpiry <= 60) {
        warnings.push(`Contract expires in ${daysUntilExpiry} days`)
      }

      if (!vendor.supports_real_time_pricing) {
        warnings.push('Manual pricing required')
      }

      return {
        ...vendor,
        warnings,
        daysUntilExpiry
      }
    })

    // Sort by contract status and delivery speed
    vendorsWithWarnings.sort((a, b) => {
      // Vendors with active contracts first
      if (a.gpo_contract_number && !b.gpo_contract_number) return -1
      if (!a.gpo_contract_number && b.gpo_contract_number) return 1
      
      // Then by delivery speed
      const aDelivery = a.average_delivery_days || 999
      const bDelivery = b.average_delivery_days || 999
      if (aDelivery !== bDelivery) return aDelivery - bDelivery
      
      // Finally by name
      return a.vendor_name.localeCompare(b.vendor_name)
    })

    return NextResponse.json({
      success: true,
      data: vendorsWithWarnings,
      count: vendorsWithWarnings.length,
      summary: {
        totalVendors: vendorsWithWarnings.length,
        activeContracts: vendorsWithWarnings.filter(v => v.gpo_contract_number).length,
        expiringContracts: vendorsWithWarnings.filter(v => v.daysUntilExpiry !== null && v.daysUntilExpiry <= 60).length,
        realTimePricingEnabled: vendorsWithWarnings.filter(v => v.supports_real_time_pricing).length
      }
    })
  } catch (error) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch vendors',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})

export const POST = withStaffAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const repository = new VendorManagementRepository()
    
    // Validate required fields
    const requiredFields = ['vendor_name', 'supports_real_time_pricing', 'supports_bulk_ordering']
    const missingFields = requiredFields.filter(field => body[field] === undefined)
    
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
    const vendorData: Omit<VendorConfiguration, 'id' | 'created_at' | 'updated_at'> = {
      vendor_name: body.vendor_name,
      is_active: body.is_active !== false,
      api_endpoint: body.api_endpoint,
      api_key_encrypted: body.api_key_encrypted,
      auth_method: body.auth_method || 'none',
      rate_limit_per_minute: body.rate_limit_per_minute,
      supports_real_time_pricing: body.supports_real_time_pricing,
      supports_bulk_ordering: body.supports_bulk_ordering,
      minimum_order_amount: body.minimum_order_amount,
      free_shipping_threshold: body.free_shipping_threshold,
      average_delivery_days: body.average_delivery_days,
      gpo_contract_number: body.gpo_contract_number,
      contract_expiry_date: body.contract_expiry_date,
      notes: body.notes
    }

    const vendor = await repository.create(vendorData)
    
    return NextResponse.json({
      success: true,
      data: vendor
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating vendor:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create vendor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})