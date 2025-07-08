import type { 
  StandardizedProduct, 
  VendorConfiguration, 
  VendorQuote,
  PurchaseRequestItem,
  VendorProductMapping,
  PurchaseRequest
} from '@ganger/types'

import { PurchaseAnalysisEngine } from './analysis-engine'
import { PriceOptimizationEngine } from './price-optimization'

export interface VendorRecommendation {
  vendorId: string
  vendorName: string
  score: number
  confidence: number
  products: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    isContractPrice: boolean
  }>
  totalCost: number
  estimatedDeliveryDays: number
  contractCompliance: boolean
  warnings: string[]
  benefits: string[]
}

export interface RecommendationSet {
  primaryRecommendation: VendorRecommendation
  alternatives: VendorRecommendation[]
  consolidationSavings: number
  splitOrderRecommendation?: {
    vendors: VendorRecommendation[]
    totalCost: number
    reason: string
  }
  insights: string[]
  riskFactors: string[]
}

export class VendorRecommendationEngine {
  private analysisEngine: PurchaseAnalysisEngine
  private optimizationEngine: PriceOptimizationEngine

  constructor() {
    this.analysisEngine = new PurchaseAnalysisEngine()
    this.optimizationEngine = new PriceOptimizationEngine()
  }

  async generateRecommendations(
    request: PurchaseRequest,
    items: PurchaseRequestItem[],
    products: Map<string, StandardizedProduct>,
    vendors: VendorConfiguration[],
    quotes: Map<string, VendorQuote[]>,
    mappings: VendorProductMapping[]
  ): Promise<RecommendationSet> {
    // Group items by vendor capability
    const vendorCapabilities = this.assessVendorCapabilities(
      items,
      vendors,
      quotes,
      mappings
    )

    // Generate recommendations for each capable vendor
    const recommendations: VendorRecommendation[] = []
    
    for (const [vendorId, capability] of vendorCapabilities.entries()) {
      const vendor = vendors.find(v => v.id === vendorId)
      if (!vendor || capability.coverage < 0.5) continue // Skip vendors with poor coverage

      const recommendation = await this.generateVendorRecommendation(
        vendor,
        request,
        items,
        products,
        quotes,
        capability
      )
      
      if (recommendation) {
        recommendations.push(recommendation)
      }
    }

    // Sort by score
    recommendations.sort((a, b) => b.score - a.score)

    if (recommendations.length === 0) {
      throw new Error('No vendors available for the requested products')
    }

    // Check for split order opportunities
    const splitOrderRecommendation = this.analyzeSplitOrderOpportunity(
      request,
      items,
      products,
      vendors,
      quotes,
      recommendations
    )

    // Generate insights
    const insights = this.generateInsights(
      recommendations,
      splitOrderRecommendation,
      request
    )

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(
      recommendations[0],
      request,
      items,
      products
    )

    return {
      primaryRecommendation: recommendations[0],
      alternatives: recommendations.slice(1, 4), // Top 3 alternatives
      consolidationSavings: this.calculateConsolidationSavings(
        recommendations[0],
        items,
        quotes
      ),
      splitOrderRecommendation,
      insights,
      riskFactors
    }
  }

  private assessVendorCapabilities(
    items: PurchaseRequestItem[],
    vendors: VendorConfiguration[],
    quotes: Map<string, VendorQuote[]>,
    mappings: VendorProductMapping[]
  ): Map<string, { coverage: number; canFulfill: Set<string> }> {
    const capabilities = new Map()

    for (const vendor of vendors) {
      const canFulfill = new Set<string>()
      
      for (const item of items) {
        const productQuotes = quotes.get(item.standardized_product_id || '') || []
        const hasQuote = productQuotes.some(q => q.vendor_id === vendor.id)
        
        if (hasQuote) {
          canFulfill.add(item.standardized_product_id || '')
        }
      }

      capabilities.set(vendor.id, {
        coverage: canFulfill.size / items.length,
        canFulfill
      })
    }

    return capabilities
  }

  private async generateVendorRecommendation(
    vendor: VendorConfiguration,
    request: PurchaseRequest,
    items: PurchaseRequestItem[],
    products: Map<string, StandardizedProduct>,
    quotes: Map<string, VendorQuote[]>,
    capability: { coverage: number; canFulfill: Set<string> }
  ): Promise<VendorRecommendation | null> {
    const vendorProducts = []
    let totalCost = 0
    let hasContractPricing = false
    const warnings: string[] = []
    const benefits: string[] = []

    // Calculate products and pricing
    for (const item of items) {
      if (!capability.canFulfill.has(item.standardized_product_id || '')) {
        continue
      }

      const product = products.get(item.standardized_product_id || '')
      if (!product) continue

      const productQuotes = quotes.get(product.id) || []
      const vendorQuote = productQuotes.find(q => q.vendor_id === vendor.id)
      if (!vendorQuote) continue

      vendorProducts.push({
        productId: product.id,
        productName: product.name,
        quantity: item.requested_quantity,
        unitPrice: vendorQuote.unit_price,
        totalPrice: vendorQuote.total_price,
        isContractPrice: vendorQuote.is_contract_pricing
      })

      totalCost += vendorQuote.total_price
      if (vendorQuote.is_contract_pricing) {
        hasContractPricing = true
      }
    }

    if (vendorProducts.length === 0) {
      return null
    }

    // Calculate score using analysis engine
    const analysisResults = await Promise.all(
      vendorProducts.map(async (vp) => {
        const product = products.get(vp.productId)!
        return this.analysisEngine.analyzeVendorOptions(
          {
            product,
            requestedQuantity: vp.quantity,
            urgency: request.urgency || 'routine',
            department: request.department
          },
          [vendor],
          quotes.get(vp.productId) || [],
          []
        )
      })
    )

    // Average the scores
    const avgScore = analysisResults.reduce((sum, r) => sum + r.confidence, 0) / analysisResults.length

    // Generate warnings and benefits
    if (vendor.contract_expiry_date) {
      const daysUntilExpiry = Math.ceil(
        (new Date(vendor.contract_expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      if (daysUntilExpiry < 30) {
        warnings.push(`Contract expires in ${daysUntilExpiry} days`)
      }
    }

    if (capability.coverage < 1) {
      warnings.push(`Can only fulfill ${Math.round(capability.coverage * 100)}% of requested items`)
    }

    if (hasContractPricing) {
      benefits.push('GPO contract pricing available')
    }

    if (vendor.free_shipping_threshold && totalCost >= vendor.free_shipping_threshold) {
      benefits.push('Qualifies for free shipping')
    }

    if (vendor.supports_real_time_pricing) {
      benefits.push('Real-time pricing ensures accuracy')
    }

    return {
      vendorId: vendor.id,
      vendorName: vendor.vendor_name,
      score: avgScore,
      confidence: avgScore * capability.coverage,
      products: vendorProducts,
      totalCost,
      estimatedDeliveryDays: vendor.average_delivery_days || 5,
      contractCompliance: hasContractPricing,
      warnings,
      benefits
    }
  }

  private analyzeSplitOrderOpportunity(
    request: PurchaseRequest,
    items: PurchaseRequestItem[],
    products: Map<string, StandardizedProduct>,
    vendors: VendorConfiguration[],
    quotes: Map<string, VendorQuote[]>,
    recommendations: VendorRecommendation[]
  ): RecommendationSet['splitOrderRecommendation'] | undefined {
    // Only consider split orders if we have multiple vendors
    if (recommendations.length < 2) {
      return undefined
    }

    // Use optimization engine to analyze split order
    const optimizedOrder = this.optimizationEngine.optimizeOrderSplitting(
      items,
      products,
      quotes,
      vendors
    )

    // Check if split order provides significant savings
    const singleVendorCost = recommendations[0].totalCost
    const splitOrderCost = optimizedOrder.totalOptimizedCost

    if (splitOrderCost >= singleVendorCost * 0.95) {
      // Less than 5% savings, not worth the complexity
      return undefined
    }

    // Group optimized items by vendor
    const vendorGroups = new Map<string, typeof optimizedOrder.items>()
    
    for (const item of optimizedOrder.items) {
      const vendorId = item.vendor.id
      const group = vendorGroups.get(vendorId) || []
      group.push(item)
      vendorGroups.set(vendorId, group)
    }

    // Create mini-recommendations for each vendor in the split
    const splitVendors: VendorRecommendation[] = []
    
    for (const [vendorId, items] of vendorGroups.entries()) {
      const vendor = vendors.find(v => v.id === vendorId)
      if (!vendor) continue

      const vendorProducts = items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.optimizedQuantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        isContractPrice: false // Would need to look up from quotes
      }))

      const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0)

      splitVendors.push({
        vendorId,
        vendorName: vendor.vendor_name,
        score: 0.8, // Split orders get a moderate score
        confidence: 0.8,
        products: vendorProducts,
        totalCost,
        estimatedDeliveryDays: vendor.average_delivery_days || 5,
        contractCompliance: false,
        warnings: [],
        benefits: []
      })
    }

    return {
      vendors: splitVendors,
      totalCost: splitOrderCost,
      reason: optimizedOrder.recommendations.join('; ')
    }
  }

  private calculateConsolidationSavings(
    recommendation: VendorRecommendation,
    items: PurchaseRequestItem[],
    quotes: Map<string, VendorQuote[]>
  ): number {
    // Calculate what it would cost to order each item from its cheapest vendor
    let individualCost = 0
    
    for (const item of items) {
      const productQuotes = quotes.get(item.standardized_product_id || '') || []
      if (productQuotes.length > 0) {
        const cheapest = Math.min(...productQuotes.map(q => q.total_price))
        individualCost += cheapest
      }
    }

    // Add estimated shipping for individual orders (assume $15 per vendor)
    const uniqueVendorCount = new Set(
      items.map(item => {
        const productQuotes = quotes.get(item.standardized_product_id || '') || []
        const cheapest = productQuotes.reduce((min, q) => 
          !min || q.total_price < min.total_price ? q : min, null as VendorQuote | null
        )
        return cheapest?.vendor_id
      }).filter(Boolean)
    ).size

    individualCost += uniqueVendorCount * 15 // Shipping estimate

    // Consolidation savings is the difference
    return Math.max(0, individualCost - recommendation.totalCost)
  }

  private generateInsights(
    recommendations: VendorRecommendation[],
    splitOrder: RecommendationSet['splitOrderRecommendation'],
    request: PurchaseRequest
  ): string[] {
    const insights: string[] = []

    // Price variance insight
    if (recommendations.length >= 2) {
      const priceVariance = (recommendations[recommendations.length - 1].totalCost - 
                            recommendations[0].totalCost) / recommendations[0].totalCost
      
      if (priceVariance > 0.2) {
        insights.push(
          `Significant price variance detected: up to ${Math.round(priceVariance * 100)}% difference between vendors`
        )
      }
    }

    // Contract compliance insight
    const contractVendors = recommendations.filter(r => r.contractCompliance).length
    if (contractVendors > 0) {
      insights.push(
        `${contractVendors} vendor${contractVendors > 1 ? 's' : ''} offer GPO contract pricing`
      )
    }

    // Delivery time insight
    const fastestDelivery = Math.min(...recommendations.map(r => r.estimatedDeliveryDays))
    if (request.urgency === 'urgent' && fastestDelivery > 2) {
      insights.push(
        `Fastest delivery is ${fastestDelivery} days - consider expedited shipping for urgent needs`
      )
    }

    // Split order insight
    if (splitOrder) {
      const savings = recommendations[0].totalCost - splitOrder.totalCost
      insights.push(
        `Splitting order across ${splitOrder.vendors.length} vendors saves $${savings.toFixed(2)}`
      )
    }

    // Free shipping insight
    const freeShippingVendors = recommendations.filter(r => 
      r.benefits.some(b => b.includes('free shipping'))
    )
    if (freeShippingVendors.length > 0) {
      insights.push(
        `${freeShippingVendors.length} vendor${freeShippingVendors.length > 1 ? 's' : ''} qualify for free shipping`
      )
    }

    return insights
  }

  private identifyRiskFactors(
    recommendation: VendorRecommendation,
    request: PurchaseRequest,
    items: PurchaseRequestItem[],
    products: Map<string, StandardizedProduct>
  ): string[] {
    const risks: string[] = []

    // Single vendor dependency
    if (recommendation.products.length > 10) {
      risks.push('Large order with single vendor creates supply chain risk')
    }

    // Critical items
    const criticalItems = items.filter(item => {
      const product = products.get(item.standardized_product_id || '')
      return product?.is_critical
    })
    
    if (criticalItems.length > 0) {
      risks.push(`Order contains ${criticalItems.length} critical item${criticalItems.length > 1 ? 's' : ''}`)
    }

    // Delivery time vs urgency
    if (request.urgency === 'urgent' && recommendation.estimatedDeliveryDays > 3) {
      risks.push('Delivery time may not meet urgency requirements')
    }

    // Contract expiry
    if (recommendation.warnings.some(w => w.includes('Contract expires'))) {
      risks.push('Vendor contract expiring soon - prices may increase')
    }

    // Partial fulfillment
    if (recommendation.warnings.some(w => w.includes('Can only fulfill'))) {
      risks.push('Vendor cannot fulfill entire order - additional vendors needed')
    }

    return risks
  }
}