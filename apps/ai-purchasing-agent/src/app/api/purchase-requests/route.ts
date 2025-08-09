import { NextRequest, NextResponse } from 'next/server'
import { withStaffAuth } from '@ganger/auth/middleware'
import { StandardizedProductsRepository } from '@ganger/db'
import type { PurchaseRequest } from '@ganger/types'
import { createSuccessResponse, createErrorResponse, handleApiError, generateRequestId } from '@/lib/api-utils'
import { validateRequest, createPurchaseRequestSchema, checkRateLimit } from '@/lib/validation'
import { PurchaseRequestsAdapter } from '@/repositories/purchase-requests-adapter'

// GET /api/purchase-requests - List all purchase requests
export const GET = withStaffAuth(async (request: NextRequest, context: any) => {
  try {
    // Rate limiting
    const session = context.session
    if (!checkRateLimit(session?.user?.email || 'anonymous')) {
      return createErrorResponse('Rate limit exceeded', 429)
    }
    
    const { searchParams } = new URL(request.url)
    // const status = searchParams.get('status') // Future filtering
    // const department = searchParams.get('department') // Future filtering
    // const requesterEmail = searchParams.get('requester_email') // Future filtering
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = (page - 1) * limit
    
    // const requestRepo = new PurchaseRequestsAdapter() // TODO: Implement proper pagination
    
    // Apply filters
    let requests: PurchaseRequest[]
    // TODO: Implement proper repository methods with pagination
    // For now, return empty array with pagination structure
    requests = []
    
    // Sort by created date (most recent first)
    requests.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    const total = requests.length
    
    return createSuccessResponse({
      data: requests.slice(offset, offset + limit),
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
})

// POST /api/purchase-requests - Create a new purchase request
export const POST = withStaffAuth(async (request: NextRequest, context: any) => {
  const session = context.session
  
  try {
    // Rate limiting for creation
    if (!checkRateLimit(session?.user?.email || 'anonymous', 30, 60000)) {
      return createErrorResponse('Rate limit exceeded', 429)
    }
    
    const body = await request.json()
    
    // Validate request body
    const validation = validateRequest(createPurchaseRequestSchema, body)
    if (!validation.success) return validation.error
    
    const { department, urgency, notes, items } = validation.data
    
    if (!items || items.length === 0) {
      return createErrorResponse('At least one item is required', 400)
    }
    
    const requestRepo = new PurchaseRequestsAdapter()
    const productRepo = new StandardizedProductsRepository()
    
    // Validate all products exist (batch fetch for efficiency)
    const productIds = items.map((item: any) => item.productId)
    const products = await Promise.all(
      productIds.map((id: string) => productRepo.findById(id))
    )
    
    const missingProducts = productIds.filter((_id: string, index: number) => !products[index])
    if (missingProducts.length > 0) {
      return createErrorResponse(
        `Products not found: ${missingProducts.join(', ')}`,
        400
      )
    }
    
    // Generate proper request number
    const requestNumber = generateRequestId('PR')
    
    // Create the purchase request
    const newRequest = await requestRepo.create({
      request_number: requestNumber,
      requester_email: session?.user?.email || 'staff@gangerdermatology.com',
      requester_name: session?.user?.name || 'Staff User',
      requester_id: session?.user?.id || 'staff-user',
      department: department,
      request_type: 'manual_entry',
      status: 'draft',
      urgency: urgency || 'routine',
      notes: notes || ''
    })
    
    // TODO: Add items to the purchase request
    // This would require a separate purchase_request_items table
    
    return NextResponse.json({
      success: true,
      data: newRequest,
      message: `Purchase request ${newRequest.request_number} created successfully`
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase request:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create purchase request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})

// PUT /api/purchase-requests - Update a purchase request
export const PUT = withStaffAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      )
    }
    
    const requestRepo = new PurchaseRequestsAdapter()
    
    // Check if request exists
    const existingRequest = await requestRepo.findById(id)
    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Purchase request not found' },
        { status: 404 }
      )
    }
    
    // Update the request
    const updatedRequest = await requestRepo.update(id, updates)
    
    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: 'Purchase request updated successfully'
    })
  } catch (error) {
    console.error('Error updating purchase request:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update purchase request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})