import { NextRequest, NextResponse } from 'next/server'
import { ConsolidatedOrdersRepository } from '@ganger/db'
import { withStaffAuth } from '@ganger/auth'

interface RouteParams {
  params: {
    id: string
  }
}

export const GET = withStaffAuth(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const repository = new ConsolidatedOrdersRepository()
    const order = await repository.findById(params.id)
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get order items
    const items = await repository.getItems(params.id)
    
    const orderWithItems = {
      ...order,
      items,
      itemCount: items.length
    }

    return NextResponse.json({
      success: true,
      data: orderWithItems
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})

export const PATCH = withStaffAuth(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const body = await request.json()
    const repository = new ConsolidatedOrdersRepository()
    
    // Check if order exists
    const existingOrder = await repository.findById(params.id)
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Don't allow modification of completed orders
    if (existingOrder.status === 'ordered') {
      return NextResponse.json(
        { success: false, error: 'Cannot modify completed orders' },
        { status: 400 }
      )
    }

    const updatedOrder = await repository.update(params.id, body)
    
    return NextResponse.json({
      success: true,
      data: updatedOrder
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})

export const DELETE = withStaffAuth(async (request: NextRequest, { params }: RouteParams) => {
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

    // Only allow deletion of draft orders
    if (existingOrder.status !== 'draft') {
      return NextResponse.json(
        { success: false, error: 'Only draft orders can be deleted' },
        { status: 400 }
      )
    }

    await repository.delete(params.id)
    
    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})