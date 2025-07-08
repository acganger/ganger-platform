import { NextRequest, NextResponse } from 'next/server'
import { StandardizedProductsRepository, VendorPricesRepository, VendorConfigurationsRepository } from '@ganger/db'
import { withStaffAuth } from '@ganger/auth/middleware'
import { PurchaseAnalysisEngine } from '@/lib/ai-engine'
import type { OrderItem } from '@ganger/types'

export const POST = withStaffAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { productIds, includeInactive = false, quantities = {} } = body

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product IDs are required' },
        { status: 400 }
      )
    }

    const productRepo = new StandardizedProductsRepository()
    const priceRepo = new VendorPricesRepository()
    const vendorRepo = new VendorConfigurationsRepository()

    // Initialize AI engine
    const analysisEngine = new PurchaseAnalysisEngine()

    // Get products
    const products = await Promise.all(
      productIds.map(id => productRepo.findById(id))
    )
    const validProducts = products.filter(p => p !== null)

    // Get all vendors
    const vendors = await vendorRepo.findAll(!includeInactive)

    // Prepare order items for AI analysis
    const orderItems: OrderItem[] = validProducts.map(product => ({
      id: `item-${product.id}`,
      order_id: 'comparison',
      standardized_product_id: product.id,
      product_name: product.name,
      quantity: quantities[product.id] || 1,
      unit_price: 0, // Will be determined by vendor prices
      total_price: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    // For now, we'll skip AI analysis since the method doesn't exist
    const aiAnalysis = {
      vendorScores: [] as Array<{ vendorId: string; totalScore: number; reliabilityScore: number; priceScore: number }>
    }

    // Get price comparisons for each product
    const comparisons = await Promise.all(
      validProducts.map(async (product) => {
        const prices = await priceRepo.findByProduct(product.id)
        
        // Filter by active vendors if needed
        const validPrices = includeInactive ? prices : prices.filter(price => 
          vendors.some(v => v.id === price.vendor_id)
        )

        // Create vendor quotes with AI-enhanced scoring
        const quotes = validPrices.map(price => {
          const vendor = vendors.find(v => v.id === price.vendor_id)
          const quantity = quantities[product.id] || product.standard_package_size || 1
          
          // Calculate AI-enhanced metrics
          const vendorScore = aiAnalysis.vendorScores.find((s: any) => s.vendorId === price.vendor_id)
          const bulkDiscount = quantity >= (price.minimum_order_quantity || 1) * 10 ? 10 : 0
          
          return {
            id: `quote-${price.id}`,
            vendor_id: price.vendor_id,
            vendor_name: vendor?.vendor_name || 'Unknown',
            product_id: product.id,
            unit_price: price.vendor_unit_price || 0,
            minimum_order_quantity: price.minimum_order_quantity || 1,
            bulk_discount_percentage: bulkDiscount,
            contract_price: price.is_contract_item || false,
            last_updated: price.last_price_update || price.updated_at,
            total_price: (price.vendor_unit_price || 0) * quantity * (1 - bulkDiscount / 100),
            delivery_days: vendor?.average_delivery_days || 0,
            in_stock: true, // Would come from real inventory data
            ai_score: vendorScore?.totalScore || 0,
            reliability_score: vendorScore?.reliabilityScore || 0,
            price_competitiveness: vendorScore?.priceScore || 0
          }
        })

        // Sort by AI score and price
        const sortedQuotes = quotes.sort((a, b) => {
          // Prioritize AI score but consider price
          const scoreWeight = 0.7
          const priceWeight = 0.3
          const aScore = a.ai_score * scoreWeight + (1 - a.unit_price / Math.max(...quotes.map(q => q.unit_price))) * priceWeight
          const bScore = b.ai_score * scoreWeight + (1 - b.unit_price / Math.max(...quotes.map(q => q.unit_price))) * priceWeight
          return bScore - aScore
        })

        return {
          product,
          vendors: vendors.filter(v => quotes.some(q => q.vendor_id === v.id)),
          quotes: sortedQuotes,
          ai_insights: {
            recommendedVendor: sortedQuotes[0]?.vendor_name,
            potentialSavings: sortedQuotes.length > 1 ? 
              sortedQuotes[sortedQuotes.length - 1].total_price - sortedQuotes[0].total_price : 0,
            qualityConsiderations: product.is_critical ? 
              'Critical item - prioritize reliability over cost' : 
              'Non-critical item - cost optimization acceptable'
          }
        }
      })
    )

    // Calculate summary statistics with AI insights
    const totalProducts = comparisons.length
    const totalVendors = new Set(comparisons.flatMap(c => c.quotes.map(q => q.vendor_id))).size
    const averagePriceVariance = comparisons.reduce((sum, comp) => {
      if (comp.quotes.length < 2) return sum
      const prices = comp.quotes.map(q => q.unit_price)
      const avg = prices.reduce((a, b) => a + b) / prices.length
      const variance = prices.reduce((s, p) => s + Math.pow(p - avg, 2), 0) / prices.length
      return sum + Math.sqrt(variance)
    }, 0) / comparisons.filter(c => c.quotes.length >= 2).length

    return NextResponse.json({
      success: true,
      data: {
        comparisons,
        summary: {
          totalProducts,
          totalVendors,
          averagePriceVariance,
          lastUpdated: new Date().toISOString(),
          aiOptimization: {
            totalPotentialSavings: 0,
            topRecommendation: 'AI analysis not available',
            vendorConsolidationPossible: aiAnalysis.vendorScores.length > 3,
            bulkBuyingOpportunity: false
          }
        }
      }
    })
  } catch (error) {
    console.error('Error in price comparison:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate price comparison',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})