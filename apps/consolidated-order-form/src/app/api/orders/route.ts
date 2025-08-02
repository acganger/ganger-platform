import { NextRequest, NextResponse } from 'next/server'
import { ConsolidatedOrdersRepository } from '@ganger/db'
import type { ConsolidatedOrder, ConsolidatedOrderItem, UrgencyLevel } from '@ganger/types'
import { withStaffAuth } from '@ganger/auth/middleware'

interface CreateOrderRequest {
  department: string
  urgency: UrgencyLevel
  items: Array<{
    productId: string
    quantity: number
    justification?: string
    urgency?: UrgencyLevel
  }>
  notes?: string
  requesterEmail?: string
  requesterName?: string
}

export const POST = withStaffAuth(async (request: NextRequest) => {
  try {
    const body: CreateOrderRequest = await request.json()
    const { department, urgency, items, notes, requesterEmail, requesterName } = body

    // Validation
    if (!department || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Department and items array are required'
        },
        { status: 400 }
      )
    }

    // Validate each item
    const invalidItems = items.filter(item => 
      !item.productId || !item.quantity || item.quantity <= 0
    )

    if (invalidItems.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'All items must have valid productId and quantity > 0',
          invalidItems: invalidItems.length
        },
        { status: 400 }
      )
    }

    const repository = new ConsolidatedOrdersRepository()
    
    // Generate order number
    const orderNumber = `COF-${Date.now()}`
    
    // Create the consolidated order
    const orderData: Omit<ConsolidatedOrder, 'id' | 'created_at' | 'updated_at'> = {
      order_number: orderNumber,
      requester_email: requesterEmail || 'unknown@gangerdermatology.com',
      requester_name: requesterName || 'Unknown User',
      department,
      status: 'draft',
      urgency,
      notes,
      total_estimated_savings: 0
    }

    const order = await repository.create(orderData)

    // Create order items
    const orderItems: Array<Omit<ConsolidatedOrderItem, 'id' | 'created_at' | 'updated_at'>> = items.map(item => ({
      consolidated_order_id: order.id,
      standardized_product_id: item.productId,
      requested_quantity: item.quantity,
      urgency_level: (item.urgency === 'emergency' ? 'urgent' : item.urgency) || (urgency === 'emergency' ? 'urgent' : urgency) || 'routine',
      justification: item.justification
    }))

    const createdItems = await Promise.all(
      orderItems.map(item => repository.addItem(item))
    )

    // Calculate estimated costs (mock calculation for now)
    // const estimatedTotal = createdItems.length * 25.50 // Mock calculation

    return NextResponse.json({
      success: true,
      data: {
        order,
        items: createdItems
      },
      message: `Order ${orderNumber} created successfully with ${createdItems.length} items`
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
})

export const GET = withStaffAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department')
    const status = searchParams.get('status')
    const urgency = searchParams.get('urgency')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const repository = new ConsolidatedOrdersRepository()
    
    // Build filters
    const filters: any = {}
    if (department) filters.department = department
    if (status) filters.status = status
    if (urgency) filters.urgency = urgency

    // Get orders with items
    const orders = await repository.findWithFilters(filters, limit, offset)
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await repository.getItems(order.id)
        return {
          ...order,
          items,
          itemCount: items.length
        }
      })
    )

    // Calculate summary statistics
    const summary = {
      totalOrders: ordersWithItems.length,
      totalItems: ordersWithItems.reduce((sum, order) => sum + order.itemCount, 0),
      totalEstimatedCost: ordersWithItems.reduce((sum, order) => sum + (order.itemCount * 25.50), 0), // Mock calculation
      statusBreakdown: {
        draft: ordersWithItems.filter(o => o.status === 'draft').length,
        submitted: ordersWithItems.filter(o => o.status === 'submitted').length,
        analyzing: ordersWithItems.filter(o => o.status === 'analyzing').length,
        optimized: ordersWithItems.filter(o => o.status === 'optimized').length,
        approved: ordersWithItems.filter(o => o.status === 'approved').length,
        ordered: ordersWithItems.filter(o => o.status === 'ordered').length
      },
      urgencyBreakdown: {
        routine: ordersWithItems.filter(o => o.urgency === 'routine').length,
        urgent: ordersWithItems.filter(o => o.urgency === 'urgent').length,
        emergency: ordersWithItems.filter(o => o.urgency === 'emergency').length
      }
    }

    return NextResponse.json({
      success: true,
      data: ordersWithItems,
      summary,
      pagination: {
        limit,
        offset,
        hasMore: ordersWithItems.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})