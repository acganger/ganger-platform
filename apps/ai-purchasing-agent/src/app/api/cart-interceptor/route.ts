import { NextRequest, NextResponse } from 'next/server'
import { PurchaseRequestsRepository, StandardizedProductsRepository } from '@ganger/db'
import type { PurchaseRequest, PurchaseRequestItem, RequestType } from '@ganger/types'
import { withStaffAuth } from '@ganger/auth/middleware'
import { createErrorResponse } from '@/lib/api-utils'
import { checkRateLimit } from '@/lib/validation'

export const POST = withStaffAuth(async (request: NextRequest, context: any) => {
  try {
    const session = context.session
    
    // Rate limiting
    if (!checkRateLimit(session?.user?.email || 'anonymous', 20, 60000)) {
      return createErrorResponse('Rate limit exceeded', 429)
    }
    
    const body = await request.json()
    
    // For cart interceptor, we have a different schema
    // Validate basic structure
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return createErrorResponse('Items array is required and must not be empty', 400)
    }
    
    const { 
      items, 
      requesterEmail = session?.user?.email, 
      requesterName = session?.user?.name, 
      department = 'General', 
      urgency = 'routine', 
      notes
    } = body

    if (!requesterEmail) {
      return createErrorResponse('Requester email is required', 400)
    }

    const purchaseRepo = new PurchaseRequestsRepository()
    const productRepo = new StandardizedProductsRepository()

    // Generate unique request number
    const requestNumber = `AI-${Date.now()}`

    // Create purchase request
    const requestData: Omit<PurchaseRequest, 'id' | 'created_at' | 'updated_at'> = {
      request_number: requestNumber,
      requester_email: requesterEmail,
      requester_name: requesterName || 'Unknown User',
      department,
      request_type: 'shopping_cart' as RequestType,
      status: 'analyzing',
      urgency,
      notes: notes ? `${notes}\n\nOriginal cart intercepted and processed by AI` : 'Shopping cart intercepted and processed by AI'
    }

    const purchaseRequest = await purchaseRepo.create(requestData)

    // Process each cart item
    const processedItems: Array<{
      originalItem: any
      matchedProduct?: any
      purchaseRequestItem: any
      matchConfidence: number
      recommendations: string[]
    }> = []

    let totalEstimatedCost = 0

    for (const item of items) {
      // Try to match the item with standardized products
      const allProducts = await productRepo.findAll(true)
      
      // Simple fuzzy matching algorithm
      const matchScores = allProducts.map(product => {
        const nameMatch = calculateStringMatch(item.productName.toLowerCase(), product.name.toLowerCase())
        const tagMatch = product.tags.some((tag: string) => 
          item.productName.toLowerCase().includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(item.productName.toLowerCase())
        ) ? 0.3 : 0
        
        return {
          product,
          score: nameMatch + tagMatch
        }
      })

      // Get the best match
      const bestMatch = matchScores.reduce((best, current) => 
        current.score > best.score ? current : best
      )

      const matchConfidence = bestMatch.score
      const matchedProduct = matchConfidence > 0.6 ? bestMatch.product : undefined

      // Generate recommendations
      const recommendations: string[] = []
      if (matchedProduct) {
        if (matchedProduct.is_critical) {
          recommendations.push('⚠️ Critical supply item - prioritize in procurement')
        }
        if (matchedProduct.average_monthly_usage) {
          const suggestedQuantity = Math.ceil(matchedProduct.average_monthly_usage / 4) // Weekly supply
          if (item.quantity < suggestedQuantity) {
            recommendations.push(`💡 Consider ordering ${suggestedQuantity} units (weekly supply)`)
          }
        }
        if (matchedProduct.substitute_product_ids.length > 0) {
          recommendations.push('🔄 Alternative products available for cost optimization')
        }
      } else {
        recommendations.push('❓ Product not found in standardized catalog - manual review required')
      }

      // Create purchase request item
      const itemData: Omit<PurchaseRequestItem, 'id' | 'created_at' | 'updated_at'> = {
        purchase_request_id: purchaseRequest.id,
        standardized_product_id: matchedProduct?.id,
        product_name: item.productName,
        requested_quantity: item.quantity,
        unit_of_measure: item.unitOfMeasure,
        estimated_unit_price: item.estimatedPrice || 0,
        notes: item.notes,
        vendor_sku: item.vendorSku,
        clinical_specifications: [] // Could be extracted from product name or notes
      }

      const purchaseRequestItem = await purchaseRepo.addItem(itemData)
      
      totalEstimatedCost += (item.estimatedPrice || 0) * item.quantity

      processedItems.push({
        originalItem: item,
        matchedProduct,
        purchaseRequestItem,
        matchConfidence,
        recommendations
      })
    }

    // Update purchase request with total estimated cost
    await purchaseRepo.update(purchaseRequest.id, {
      total_estimated_cost: totalEstimatedCost
    })

    // Calculate analysis summary
    const analysis = {
      totalItems: items.length,
      matchedItems: processedItems.filter(item => item.matchedProduct).length,
      criticalItems: processedItems.filter(item => item.matchedProduct?.is_critical).length,
      averageMatchConfidence: processedItems.reduce((sum, item) => sum + item.matchConfidence, 0) / processedItems.length,
      totalEstimatedCost,
      readyForOptimization: processedItems.filter(item => item.matchConfidence > 0.8).length,
      requiresReview: processedItems.filter(item => item.matchConfidence < 0.6).length
    }

    return NextResponse.json({
      success: true,
      data: {
        purchaseRequest: {
          ...purchaseRequest,
          total_estimated_cost: totalEstimatedCost
        },
        processedItems,
        analysis
      },
      message: `Shopping cart with ${items.length} items intercepted and converted to purchase request ${requestNumber}`
    }, { status: 201 })
  } catch (error) {
    console.error('Error processing cart interceptor:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process shopping cart',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})

// Helper functions for string matching (should be moved to utils)
function calculateStringMatch(str1: string, str2: string): number {
  // Simple implementation - could be replaced with more sophisticated algorithm
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = Array(str2.length + 1).fill(0).map(() => Array(str1.length + 1).fill(0))
  
  for (let i = 0; i <= str1.length; i++) matrix[0]![i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j]![0] = j
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j]![i] = Math.min(
        matrix[j]![i - 1]! + 1,
        matrix[j - 1]![i]! + 1,
        matrix[j - 1]![i - 1]! + indicator
      )
    }
  }
  
  return matrix[str2.length]![str1.length]!
}