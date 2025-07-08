import { NextRequest, NextResponse } from 'next/server'
import { PurchaseRequestsRepository, VendorManagementRepository } from '@ganger/db'
import type { VendorQuote, PriceComparison } from '@ganger/types'

interface PriceComparisonRequest {
  productId: string
  requestedQuantity: number
  urgency?: 'routine' | 'urgent' | 'emergency'
  requesterId?: string
  department?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PriceComparisonRequest = await request.json()
    const { productId, requestedQuantity, urgency = 'routine', requesterId, department } = body

    if (!productId || !requestedQuantity || requestedQuantity <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product ID and valid requested quantity are required'
        },
        { status: 400 }
      )
    }

    const vendorRepo = new VendorManagementRepository()
    const purchaseRepo = new PurchaseRequestsRepository()

    // Get all active vendors
    const vendors = await vendorRepo.findAll(true)
    
    // Get vendor quotes for this product
    const quotes = await vendorRepo.getQuotesForProduct(productId)
    
    // Calculate total prices based on requested quantity
    const quotesWithTotals: VendorQuote[] = quotes.map(quote => ({
      ...quote,
      total_price: quote.unit_price * requestedQuantity
    }))

    // Find the lowest price quote
    const lowestPriceQuote = quotesWithTotals.reduce((lowest, current) => 
      current.total_price < lowest.total_price ? current : lowest
    )

    // Find the highest price for savings calculation
    const highestPriceQuote = quotesWithTotals.reduce((highest, current) => 
      current.total_price > highest.total_price ? current : highest
    )

    const potentialSavings = highestPriceQuote.total_price - lowestPriceQuote.total_price
    const savingsPercentage = (potentialSavings / highestPriceQuote.total_price) * 100

    // Get vendor details for the lowest price quote
    const recommendedVendor = vendors.find(v => v.id === lowestPriceQuote.vendor_id)

    // AI confidence scoring logic
    let aiConfidenceScore = 0.7 // Base confidence
    
    // Increase confidence for contract pricing
    if (lowestPriceQuote.is_contract_pricing) {
      aiConfidenceScore += 0.15
    }
    
    // Increase confidence for in-stock items
    if (lowestPriceQuote.is_in_stock) {
      aiConfidenceScore += 0.1
    }
    
    // Increase confidence for significant savings
    if (savingsPercentage > 10) {
      aiConfidenceScore += 0.05
    }
    
    // Cap at 0.99
    aiConfidenceScore = Math.min(aiConfidenceScore, 0.99)

    // Generate recommendation reason
    const reasons = []
    if (lowestPriceQuote.is_contract_pricing) {
      reasons.push('GPO contract pricing available')
    }
    if (potentialSavings > 0) {
      reasons.push(`Save $${potentialSavings.toFixed(2)} compared to highest quote`)
    }
    if (lowestPriceQuote.is_in_stock) {
      reasons.push('Item is in stock for immediate delivery')
    }
    if (recommendedVendor?.average_delivery_days) {
      reasons.push(`${recommendedVendor.average_delivery_days}-day delivery available`)
    }

    const recommendationReason = reasons.join('; ')

    // Create price comparison record
    const comparisonData: Omit<PriceComparison, 'id' | 'created_at'> = {
      purchase_request_item_id: `mock-item-${Date.now()}`, // In real app, would be actual item ID
      analysis_timestamp: new Date().toISOString(),
      recommended_vendor_id: lowestPriceQuote.vendor_id,
      potential_savings: potentialSavings,
      savings_percentage: savingsPercentage,
      recommendation_reason: recommendationReason,
      ai_confidence_score: aiConfidenceScore
    }

    return NextResponse.json({
      success: true,
      data: {
        comparison: comparisonData,
        quotes: quotesWithTotals,
        vendors: vendors,
        recommendedVendor,
        analysis: {
          totalQuotes: quotesWithTotals.length,
          lowestPrice: lowestPriceQuote.total_price,
          highestPrice: highestPriceQuote.total_price,
          averagePrice: quotesWithTotals.reduce((sum, q) => sum + q.total_price, 0) / quotesWithTotals.length,
          contractOptionsAvailable: quotesWithTotals.filter(q => q.is_contract_pricing).length,
          inStockOptions: quotesWithTotals.filter(q => q.is_in_stock).length
        }
      }
    })
  } catch (error) {
    console.error('Error performing price comparison:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform price comparison',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // In a real implementation, this would fetch historical price comparisons
    // For now, return mock data structure
    return NextResponse.json({
      success: true,
      data: {
        productId,
        recentComparisons: [],
        priceHistory: {
          averagePrice: 0,
          priceVariation: 0,
          lastUpdated: new Date().toISOString()
        }
      }
    })
  } catch (error) {
    console.error('Error fetching price comparison history:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch price comparison history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}