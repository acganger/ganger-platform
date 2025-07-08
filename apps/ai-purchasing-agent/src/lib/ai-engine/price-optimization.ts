import type { 
  StandardizedProduct, 
  VendorQuote,
  VendorConfiguration,
  PurchaseRequestItem
} from '@ganger/types'

export interface PriceTrend {
  productId: string
  averagePrice: number
  priceVariance: number
  trend: 'increasing' | 'stable' | 'decreasing'
  volatility: number
  seasonalFactors?: {
    month: number
    factor: number
  }[]
}

export interface BulkDiscountTier {
  minQuantity: number
  maxQuantity: number
  discountPercentage: number
  unitPrice: number
}

export interface OptimizedOrder {
  items: Array<{
    product: StandardizedProduct
    originalQuantity: number
    optimizedQuantity: number
    vendor: VendorConfiguration
    unitPrice: number
    totalPrice: number
    savings: number
    reason: string
  }>
  totalOriginalCost: number
  totalOptimizedCost: number
  totalSavings: number
  savingsPercentage: number
  recommendations: string[]
}

export class PriceOptimizationEngine {
  // Economic Order Quantity (EOQ) calculation
  calculateEOQ(
    averageMonthlyUsage: number,
    orderingCost: number = 50, // Default ordering cost per order
    holdingCostPercentage: number = 0.25, // 25% of unit cost per year
    unitCost: number
  ): number {
    const annualDemand = averageMonthlyUsage * 12
    const holdingCost = unitCost * holdingCostPercentage
    
    // EOQ = sqrt((2 * D * S) / H)
    // D = Annual demand, S = Ordering cost, H = Holding cost per unit
    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost)
    
    return Math.round(eoq)
  }

  // Analyze bulk discount opportunities
  analyzeBulkDiscounts(
    quotes: VendorQuote[],
    requestedQuantity: number
  ): {
    optimalQuantity: number
    vendor: string
    savings: number
    breakEvenPoint: number
  } | null {
    let bestOption = null
    let maxSavings = 0

    for (const quote of quotes) {
      // Simulate bulk discount tiers (in real app, this would come from vendor data)
      const discountTiers = this.simulateBulkDiscountTiers(quote.unit_price, requestedQuantity)
      
      for (const tier of discountTiers) {
        if (tier.minQuantity > requestedQuantity * 3) continue // Don't suggest more than 3x quantity
        
        const originalCost = quote.unit_price * requestedQuantity
        const bulkCost = tier.unitPrice * tier.minQuantity
        const savings = (originalCost / requestedQuantity * tier.minQuantity) - bulkCost
        
        if (savings > maxSavings) {
          maxSavings = savings
          bestOption = {
            optimalQuantity: tier.minQuantity,
            vendor: quote.vendor_id,
            savings,
            breakEvenPoint: Math.ceil(bulkCost / originalCost * requestedQuantity)
          }
        }
      }
    }

    return bestOption
  }

  // Simulate bulk discount tiers (in production, this would be real vendor data)
  private simulateBulkDiscountTiers(basePrice: number, baseQuantity: number): BulkDiscountTier[] {
    return [
      {
        minQuantity: baseQuantity,
        maxQuantity: baseQuantity * 2,
        discountPercentage: 0,
        unitPrice: basePrice
      },
      {
        minQuantity: baseQuantity * 2,
        maxQuantity: baseQuantity * 5,
        discountPercentage: 5,
        unitPrice: basePrice * 0.95
      },
      {
        minQuantity: baseQuantity * 5,
        maxQuantity: baseQuantity * 10,
        discountPercentage: 10,
        unitPrice: basePrice * 0.90
      },
      {
        minQuantity: baseQuantity * 10,
        maxQuantity: Number.MAX_SAFE_INTEGER,
        discountPercentage: 15,
        unitPrice: basePrice * 0.85
      }
    ]
  }

  // Multi-vendor order splitting optimization
  optimizeOrderSplitting(
    items: PurchaseRequestItem[],
    products: Map<string, StandardizedProduct>,
    vendorQuotes: Map<string, VendorQuote[]>,
    vendors: VendorConfiguration[]
  ): OptimizedOrder {
    const optimizedItems = []
    let totalOriginalCost = 0
    let totalOptimizedCost = 0

    // Group items by potential vendors
    const vendorGroups = this.groupItemsByOptimalVendor(items, products, vendorQuotes, vendors)

    // Optimize each vendor group
    for (const [vendorId, groupItems] of vendorGroups.entries()) {
      const vendor = vendors.find(v => v.id === vendorId)
      if (!vendor) continue

      // Check if consolidation reaches minimum order or free shipping
      const groupTotal = groupItems.reduce((sum, item) => {
        const quotes = vendorQuotes.get(item.standardized_product_id || '') || []
        const vendorQuote = quotes.find(q => q.vendor_id === vendorId)
        return sum + (vendorQuote?.total_price || 0)
      }, 0)

      for (const item of groupItems) {
        const product = products.get(item.standardized_product_id || '')
        if (!product) continue

        const quotes = vendorQuotes.get(product.id) || []
        const vendorQuote = quotes.find(q => q.vendor_id === vendorId)
        if (!vendorQuote) continue

        // Calculate original cost (cheapest individual quote)
        const cheapestQuote = quotes.reduce((min, q) => 
          q.total_price < min.total_price ? q : min
        )
        const originalCost = cheapestQuote.unit_price * item.requested_quantity
        totalOriginalCost += originalCost

        // Optimize quantity based on EOQ if product has usage data
        let optimizedQuantity = item.requested_quantity
        let reason = 'Standard order'

        if (product.average_monthly_usage) {
          const eoq = this.calculateEOQ(
            product.average_monthly_usage,
            50,
            0.25,
            vendorQuote.unit_price
          )

          // Only suggest EOQ if it's within reasonable range
          if (eoq > item.requested_quantity && eoq < item.requested_quantity * 2) {
            optimizedQuantity = eoq
            reason = `EOQ optimization: order ${eoq} units for optimal cost efficiency`
          }
        }

        // Check bulk discounts
        const bulkOption = this.analyzeBulkDiscounts(quotes, optimizedQuantity)
        if (bulkOption && bulkOption.savings > vendorQuote.unit_price * 2) {
          optimizedQuantity = bulkOption.optimalQuantity
          reason = `Bulk discount: save $${bulkOption.savings.toFixed(2)} by ordering ${bulkOption.optimalQuantity} units`
        }

        const optimizedCost = vendorQuote.unit_price * optimizedQuantity
        totalOptimizedCost += optimizedCost

        optimizedItems.push({
          product,
          originalQuantity: item.requested_quantity,
          optimizedQuantity,
          vendor,
          unitPrice: vendorQuote.unit_price,
          totalPrice: optimizedCost,
          savings: originalCost - optimizedCost,
          reason
        })
      }

      // Add shipping optimization recommendation
      if (vendor.free_shipping_threshold && groupTotal < vendor.free_shipping_threshold) {
        const shortfall = vendor.free_shipping_threshold - groupTotal
        if (shortfall < vendor.free_shipping_threshold * 0.2) { // Within 20% of threshold
          optimizedItems.push({
            product: { name: 'Shipping Optimization' } as any,
            originalQuantity: 0,
            optimizedQuantity: 1,
            vendor,
            unitPrice: shortfall,
            totalPrice: shortfall,
            savings: -15, // Estimated shipping cost saved
            reason: `Add $${shortfall.toFixed(2)} more to qualify for free shipping (save ~$15)`
          })
        }
      }
    }

    const totalSavings = totalOriginalCost - totalOptimizedCost
    const recommendations = this.generateOptimizationRecommendations(optimizedItems, vendors)

    return {
      items: optimizedItems,
      totalOriginalCost,
      totalOptimizedCost,
      totalSavings,
      savingsPercentage: totalOriginalCost > 0 ? (totalSavings / totalOriginalCost) * 100 : 0,
      recommendations
    }
  }

  // Group items by the vendor that offers the best total value
  private groupItemsByOptimalVendor(
    items: PurchaseRequestItem[],
    products: Map<string, StandardizedProduct>,
    vendorQuotes: Map<string, VendorQuote[]>,
    vendors: VendorConfiguration[]
  ): Map<string, PurchaseRequestItem[]> {
    const vendorGroups = new Map<string, PurchaseRequestItem[]>()

    // Calculate total cost for each vendor combination
    const vendorTotals = new Map<string, number>()
    
    for (const vendor of vendors) {
      let total = 0
      let canFulfillAll = true

      for (const item of items) {
        const quotes = vendorQuotes.get(item.standardized_product_id || '') || []
        const vendorQuote = quotes.find(q => q.vendor_id === vendor.id)
        
        if (!vendorQuote) {
          canFulfillAll = false
          break
        }
        
        total += vendorQuote.total_price
      }

      if (canFulfillAll) {
        // Apply shipping cost if below threshold
        if (vendor.free_shipping_threshold && total < vendor.free_shipping_threshold) {
          total += 15 // Estimated shipping
        }
        vendorTotals.set(vendor.id, total)
      }
    }

    // Find best single vendor
    let bestVendor = ''
    let bestTotal = Infinity

    for (const [vendorId, total] of vendorTotals.entries()) {
      if (total < bestTotal) {
        bestTotal = total
        bestVendor = vendorId
      }
    }

    // For now, assign all items to best vendor
    // In production, would do more sophisticated multi-vendor splitting
    if (bestVendor) {
      vendorGroups.set(bestVendor, items)
    } else {
      // Fallback: assign each item to its cheapest vendor
      for (const item of items) {
        const quotes = vendorQuotes.get(item.standardized_product_id || '') || []
        if (quotes.length > 0) {
          const cheapest = quotes.reduce((min, q) => 
            q.total_price < min.total_price ? q : min
          )
          
          const group = vendorGroups.get(cheapest.vendor_id) || []
          group.push(item)
          vendorGroups.set(cheapest.vendor_id, group)
        }
      }
    }

    return vendorGroups
  }

  private generateOptimizationRecommendations(
    items: any[],
    vendors: VendorConfiguration[]
  ): string[] {
    const recommendations: string[] = []

    // Consolidation recommendation
    const vendorCounts = new Map<string, number>()
    items.forEach(item => {
      const count = vendorCounts.get(item.vendor.id) || 0
      vendorCounts.set(item.vendor.id, count + 1)
    })

    if (vendorCounts.size > 1) {
      recommendations.push(
        `Order split across ${vendorCounts.size} vendors for optimal pricing`
      )
    }

    // EOQ recommendations
    const eoqItems = items.filter(item => item.reason.includes('EOQ'))
    if (eoqItems.length > 0) {
      recommendations.push(
        `${eoqItems.length} items optimized using Economic Order Quantity analysis`
      )
    }

    // Bulk discount recommendations
    const bulkItems = items.filter(item => item.reason.includes('Bulk'))
    if (bulkItems.length > 0) {
      const totalBulkSavings = bulkItems.reduce((sum, item) => sum + item.savings, 0)
      recommendations.push(
        `Bulk ordering opportunities identified: save $${totalBulkSavings.toFixed(2)}`
      )
    }

    // Contract compliance
    const contractVendors = vendors.filter(v => v.gpo_contract_number)
    if (contractVendors.length > 0) {
      recommendations.push(
        `Prioritizing ${contractVendors.length} vendors with active GPO contracts`
      )
    }

    return recommendations
  }

  // Predict future price trends based on historical data
  analyzePriceTrends(
    productId: string,
    historicalPrices: Array<{ date: string; price: number; vendor: string }>
  ): PriceTrend {
    if (historicalPrices.length < 3) {
      return {
        productId,
        averagePrice: historicalPrices[0]?.price || 0,
        priceVariance: 0,
        trend: 'stable',
        volatility: 0
      }
    }

    // Sort by date
    const sorted = historicalPrices
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calculate average and variance
    const prices = sorted.map(h => h.price)
    const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - averagePrice, 2), 0) / prices.length
    const stdDev = Math.sqrt(variance)

    // Calculate trend using linear regression
    const n = prices.length
    const sumX = prices.reduce((sum, _, i) => sum + i, 0)
    const sumY = prices.reduce((sum, p) => sum + p, 0)
    const sumXY = prices.reduce((sum, p, i) => sum + i * p, 0)
    const sumX2 = prices.reduce((sum, _, i) => sum + i * i, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    
    // Determine trend
    let trend: PriceTrend['trend'] = 'stable'
    if (Math.abs(slope) > stdDev * 0.1) {
      trend = slope > 0 ? 'increasing' : 'decreasing'
    }

    // Calculate volatility (coefficient of variation)
    const volatility = stdDev / averagePrice

    // Analyze seasonal patterns (simplified)
    const monthlyAverages = new Map<number, number[]>()
    sorted.forEach(h => {
      const month = new Date(h.date).getMonth()
      const prices = monthlyAverages.get(month) || []
      prices.push(h.price)
      monthlyAverages.set(month, prices)
    })

    const seasonalFactors = Array.from(monthlyAverages.entries()).map(([month, prices]) => ({
      month,
      factor: (prices.reduce((sum, p) => sum + p, 0) / prices.length) / averagePrice
    }))

    return {
      productId,
      averagePrice,
      priceVariance: variance,
      trend,
      volatility,
      seasonalFactors: seasonalFactors.length >= 3 ? seasonalFactors : undefined
    }
  }
}