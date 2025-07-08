import { NextRequest, NextResponse } from 'next/server'
import { withStaffAuth, type AuthenticatedHandler } from '@ganger/auth/middleware'
import { PurchaseRequestsAdapter } from '@/repositories/purchase-requests-adapter'
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api-utils'
import { checkRateLimit } from '@/lib/validation'

interface RouteContext {
  params: {
    id: string
  }
  session: {
    user?: {
      id: string
      email: string
      name?: string
    }
  }
}

const handler: AuthenticatedHandler = async (request: NextRequest, context: any) => {
  const { params } = context as RouteContext
  const session = context.user ? { user: context.user } : undefined
  try {
    // Rate limiting
    if (!checkRateLimit(session?.user?.email || 'anonymous', 10, 60000)) {
      return createErrorResponse('Rate limit exceeded', 429)
    }
    const repository = new PurchaseRequestsAdapter()
    
    // Get purchase request
    const purchaseRequest = await repository.findById(params.id)
    if (!purchaseRequest) {
      return createErrorResponse('Purchase request not found', 404)
    }

    // Check if already approved
    if (purchaseRequest.status === 'approved') {
      return createErrorResponse('Purchase request already approved', 400)
    }

    // Only allow approval of submitted requests
    if (purchaseRequest.status !== 'submitted') {
      return createErrorResponse(
        `Cannot approve request with status: ${purchaseRequest.status}`,
        400
      )
    }

    // Update purchase request
    const updatedRequest = await repository.update(params.id, {
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by_email: session?.user?.email || 'system',
      approved_by_id: session?.user?.id
    })

    // In a real implementation, this would:
    // 1. Send notification to requester
    // 2. Create tasks for procurement team
    // 3. Update inventory projections
    // 4. Log audit trail

    return createSuccessResponse({
      data: updatedRequest,
      message: 'Purchase request approved successfully'
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export const POST = withStaffAuth(handler)