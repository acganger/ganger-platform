import { NextRequest, NextResponse } from 'next/server'
import { ConsolidatedOrdersRepository } from '@ganger/db'
import { withStaffAuth } from '@ganger/auth'

interface RouteParams {
  params: {
    id: string
  }
}

export const POST = withStaffAuth(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const repository = new ConsolidatedOrdersRepository()
    
    // Check if order exists
    const existingOrder = await repository.findById(params.id)
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Only allow submission of draft orders
    if (existingOrder.status !== 'draft') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot submit order with status: ${existingOrder.status}` 
        },
        { status: 400 }
      )
    }

    // Get order items to validate
    const items = await repository.getItems(params.id)
    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot submit order without items' },
        { status: 400 }
      )
    }

    // Submit the order (change status to submitted)
    const updatedOrder = await repository.update(params.id, {
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })

    // In a real implementation, this would:
    // 1. Trigger AI analysis workflow
    // 2. Send notifications to procurement team
    // 3. Start price comparison process
    // 4. Create audit trail entry

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: `Order ${existingOrder.order_number} submitted successfully and is now in analysis queue`
    })
  } catch (error) {
    console.error('Error submitting order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})