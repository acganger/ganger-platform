import type { 
  StandardizedProduct, 
  VendorConfiguration, 
  VendorQuote,
  PurchaseRequestItem,
  VendorProductMapping
} from '@ganger/types'

export interface AnalysisContext {
  product: StandardizedProduct
  requestedQuantity: number
  urgency: 'routine' | 'urgent' | 'emergency'
  department?: string
  historicalUsage?: number[]
  previousOrders?: Array<{
    date: string
    quantity: number
    vendor: string
    price: number
  }>
}

export interface VendorAnalysis {
  vendor: VendorConfiguration
  quote?: VendorQuote
  mapping?: VendorProductMapping
  score: number
  factors: {
    price: number
    delivery: number
    contractCompliance: number
    reliability: number
    consolidation: number
  }
  recommendation: {
    primary: boolean
    reason: string
    confidence: number
  }
}

export interface OptimizationResult {
  recommendedVendor: VendorConfiguration
  vendorAnalyses: VendorAnalysis[]
  potentialSavings: number
  savingsPercentage: number
  consolidationOpportunities: string[]
  warnings: string[]
  confidence: number
}

export class PurchaseAnalysisEngine {
  private readonly weights = {
    price: 0.35,
    delivery: 0.25,
    contractCompliance: 0.20,
    reliability: 0.15,
    consolidation: 0.05
  }

  async analyzeVendorOptions(
    context: AnalysisContext,
    vendors: VendorConfiguration[],
    quotes: VendorQuote[],
    mappings: VendorProductMapping[]
  ): Promise<OptimizationResult> {
    // Analyze each vendor
    const vendorAnalyses: VendorAnalysis[] = []
    
    for (const vendor of vendors) {
      const analysis = await this.analyzeVendor(vendor, context, quotes, mappings)
      if (analysis) {
        vendorAnalyses.push(analysis)
      }
    }

    // Sort by overall score
    vendorAnalyses.sort((a, b) => b.score - a.score)

    if (vendorAnalyses.length === 0) {
      throw new Error('No vendors available for this product')
    }

    // Calculate savings
    const lowestPrice = Math.min(...vendorAnalyses.map(v => v.quote?.total_price || Infinity))
    const highestPrice = Math.max(...vendorAnalyses.map(v => v.quote?.total_price || 0))
    const potentialSavings = highestPrice - lowestPrice
    const savingsPercentage = highestPrice > 0 ? (potentialSavings / highestPrice) * 100 : 0

    // Find consolidation opportunities
    const consolidationOpportunities = this.findConsolidationOpportunities(
      vendorAnalyses[0].vendor,
      context
    )

    // Generate warnings
    const warnings = this.generateWarnings(context, vendorAnalyses[0])

    return {
      recommendedVendor: vendorAnalyses[0].vendor,
      vendorAnalyses,
      potentialSavings,
      savingsPercentage,
      consolidationOpportunities,
      warnings,
      confidence: vendorAnalyses[0].recommendation.confidence
    }
  }

  private async analyzeVendor(
    vendor: VendorConfiguration,
    context: AnalysisContext,
    quotes: VendorQuote[],
    mappings: VendorProductMapping[]
  ): Promise<VendorAnalysis | null> {
    // Find quote and mapping for this vendor
    const quote = quotes.find(q => q.vendor_id === vendor.id)
    const mapping = mappings.find(m => m.vendor_id === vendor.id && m.standardized_product_id === context.product.id)

    if (!quote) {
      return null
    }

    // Calculate factor scores
    const factors = {
      price: this.calculatePriceScore(quote, quotes),
      delivery: this.calculateDeliveryScore(vendor, context.urgency),
      contractCompliance: this.calculateContractScore(vendor, quote),
      reliability: this.calculateReliabilityScore(vendor),
      consolidation: this.calculateConsolidationScore(vendor, context)
    }

    // Calculate weighted score
    const score = Object.entries(factors).reduce((sum, [factor, value]) => {
      return sum + (value * this.weights[factor as keyof typeof this.weights])
    }, 0)

    // Generate recommendation
    const recommendation = this.generateRecommendation(vendor, factors, score)

    return {
      vendor,
      quote,
      mapping,
      score,
      factors,
      recommendation
    }
  }

  private calculatePriceScore(quote: VendorQuote, allQuotes: VendorQuote[]): number {
    const prices = allQuotes.map(q => q.total_price).filter(p => p > 0)
    if (prices.length === 0) return 0

    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    
    if (maxPrice === minPrice) return 1

    // Normalize: lowest price gets score 1, highest gets 0
    return 1 - ((quote.total_price - minPrice) / (maxPrice - minPrice))
  }

  private calculateDeliveryScore(vendor: VendorConfiguration, urgency: string): number {
    const deliveryDays = vendor.average_delivery_days || 7
    
    switch (urgency) {
      case 'emergency':
        // For emergency, only 1-2 day delivery gets high score
        if (deliveryDays <= 1) return 1
        if (deliveryDays <= 2) return 0.8
        if (deliveryDays <= 3) return 0.4
        return 0.1
        
      case 'urgent':
        // For urgent, up to 3 days is good
        if (deliveryDays <= 2) return 1
        if (deliveryDays <= 3) return 0.9
        if (deliveryDays <= 5) return 0.6
        return 0.3
        
      default: // routine
        // For routine, up to 7 days is fine
        if (deliveryDays <= 3) return 1
        if (deliveryDays <= 5) return 0.9
        if (deliveryDays <= 7) return 0.8
        return 0.5
    }
  }

  private calculateContractScore(vendor: VendorConfiguration, quote: VendorQuote): number {
    // Higher score for contract pricing
    let score = quote.is_contract_pricing ? 0.8 : 0.3

    // Bonus for active GPO contract
    if (vendor.gpo_contract_number) {
      score += 0.2
    }

    // Check contract expiry
    if (vendor.contract_expiry_date) {
      const daysUntilExpiry = Math.ceil(
        (new Date(vendor.contract_expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysUntilExpiry < 30) {
        score *= 0.7 // Reduce score for expiring contracts
      } else if (daysUntilExpiry < 60) {
        score *= 0.85
      }
    }

    return Math.min(score, 1)
  }

  private calculateReliabilityScore(vendor: VendorConfiguration): number {
    // Base score on vendor capabilities
    let score = 0.5

    if (vendor.supports_real_time_pricing) score += 0.2
    if (vendor.supports_bulk_ordering) score += 0.2
    if (vendor.api_endpoint) score += 0.1 // API integration available

    return Math.min(score, 1)
  }

  private calculateConsolidationScore(vendor: VendorConfiguration, context: AnalysisContext): number {
    // This would analyze if ordering from this vendor allows consolidation
    // For now, return a moderate score
    return 0.7
  }

  private generateRecommendation(
    vendor: VendorConfiguration,
    factors: VendorAnalysis['factors'],
    score: number
  ): VendorAnalysis['recommendation'] {
    const reasons: string[] = []
    
    // Identify top factors
    const sortedFactors = Object.entries(factors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)

    for (const [factor, value] of sortedFactors) {
      if (value >= 0.8) {
        switch (factor) {
          case 'price':
            reasons.push('Best price available')
            break
          case 'delivery':
            reasons.push('Fast delivery time')
            break
          case 'contractCompliance':
            reasons.push('GPO contract pricing')
            break
          case 'reliability':
            reasons.push('Reliable vendor with API integration')
            break
          case 'consolidation':
            reasons.push('Consolidation opportunity')
            break
        }
      }
    }

    // Calculate confidence based on score distribution
    const confidence = score >= 0.8 ? 0.95 : score >= 0.6 ? 0.80 : 0.65

    return {
      primary: true,
      reason: reasons.join('; ') || 'Balanced option across all factors',
      confidence
    }
  }

  private findConsolidationOpportunities(
    vendor: VendorConfiguration,
    context: AnalysisContext
  ): string[] {
    const opportunities: string[] = []

    // Check if vendor minimum order is close
    if (vendor.minimum_order_amount) {
      opportunities.push(
        `Add $${vendor.minimum_order_amount} to reach minimum order amount`
      )
    }

    // Check free shipping threshold
    if (vendor.free_shipping_threshold) {
      opportunities.push(
        `Add $${vendor.free_shipping_threshold} to qualify for free shipping`
      )
    }

    return opportunities
  }

  private generateWarnings(
    context: AnalysisContext,
    topAnalysis: VendorAnalysis
  ): string[] {
    const warnings: string[] = []

    // Check if critical item has low score
    if (context.product.is_critical && topAnalysis.score < 0.7) {
      warnings.push('Critical item - consider maintaining safety stock')
    }

    // Check delivery time for urgent orders
    if (context.urgency === 'urgent' && topAnalysis.factors.delivery < 0.8) {
      warnings.push('Delivery time may not meet urgency requirements')
    }

    // Check contract expiry
    if (topAnalysis.vendor.contract_expiry_date) {
      const daysUntilExpiry = Math.ceil(
        (new Date(topAnalysis.vendor.contract_expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysUntilExpiry < 60) {
        warnings.push(`Contract expires in ${daysUntilExpiry} days`)
      }
    }

    return warnings
  }
}