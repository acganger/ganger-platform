import type { 
  StandardizedProduct, 
  OrderItem,
  PurchaseRequest
} from '@ganger/types'

export interface UsagePattern {
  productId: string
  averageMonthlyUsage: number
  usageVariance: number
  seasonalPattern: boolean
  seasonalFactors?: Array<{
    month: number
    monthName: string
    factor: number
  }>
  trend: 'increasing' | 'stable' | 'decreasing'
  reorderPoint: number
  safetyStock: number
  optimalOrderQuantity: number
  predictedNextOrder: {
    date: Date
    quantity: number
    confidence: number
  }
}

export interface DepartmentUsageInsight {
  department: string
  topProducts: Array<{
    productId: string
    productName: string
    monthlyUsage: number
    percentOfDepartmentSpend: number
  }>
  totalMonthlySpend: number
  orderFrequency: number // orders per month
  preferredVendors: string[]
}

export interface UsageAnalysisReport {
  patterns: UsagePattern[]
  departmentInsights: DepartmentUsageInsight[]
  criticalItemAlerts: Array<{
    productId: string
    productName: string
    currentStock?: number
    daysUntilStockout: number
    recommendedOrderDate: Date
    recommendedQuantity: number
  }>
  costSavingOpportunities: Array<{
    type: 'bulk_buying' | 'vendor_consolidation' | 'substitute_product' | 'reduce_variety'
    description: string
    estimatedSavings: number
    products: string[]
  }>
  unusualActivity: Array<{
    productId: string
    productName: string
    type: 'spike' | 'drop' | 'new_product' | 'discontinued'
    description: string
  }>
}

export class UsagePatternAnalysisEngine {
  // Analyze historical order data to identify patterns
  analyzeUsagePatterns(
    orderHistory: Array<{
      date: string
      items: OrderItem[]
      department?: string
    }>,
    products: Map<string, StandardizedProduct>
  ): UsageAnalysisReport {
    const productUsage = this.aggregateProductUsage(orderHistory)
    const patterns = this.calculateUsagePatterns(productUsage, products)
    const departmentInsights = this.analyzeDepartmentUsage(orderHistory, products)
    const criticalItemAlerts = this.identifyCriticalItemAlerts(patterns, products)
    const costSavingOpportunities = this.identifyCostSavings(patterns, departmentInsights, products)
    const unusualActivity = this.detectUnusualActivity(productUsage, products)

    return {
      patterns,
      departmentInsights,
      criticalItemAlerts,
      costSavingOpportunities,
      unusualActivity
    }
  }

  private aggregateProductUsage(
    orderHistory: Array<{
      date: string
      items: OrderItem[]
      department?: string
    }>
  ): Map<string, Array<{ date: string; quantity: number; department?: string }>> {
    const usage = new Map()

    for (const order of orderHistory) {
      for (const item of order.items) {
        if (!item.standardized_product_id) continue

        const productUsage = usage.get(item.standardized_product_id) || []
        productUsage.push({
          date: order.date,
          quantity: item.quantity,
          department: order.department
        })
        usage.set(item.standardized_product_id, productUsage)
      }
    }

    return usage
  }

  private calculateUsagePatterns(
    productUsage: Map<string, Array<{ date: string; quantity: number }>>,
    products: Map<string, StandardizedProduct>
  ): UsagePattern[] {
    const patterns: UsagePattern[] = []

    for (const [productId, usage] of productUsage.entries()) {
      const product = products.get(productId)
      if (!product || usage.length < 3) continue

      // Sort by date
      const sorted = usage.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      // Calculate monthly aggregates
      const monthlyUsage = this.aggregateMonthly(sorted)
      
      // Calculate statistics
      const quantities = monthlyUsage.map(m => m.quantity)
      const averageMonthlyUsage = quantities.reduce((sum, q) => sum + q, 0) / quantities.length
      const variance = this.calculateVariance(quantities, averageMonthlyUsage)
      
      // Detect seasonality
      const { isSeasonsal, factors } = this.detectSeasonality(monthlyUsage)
      
      // Calculate trend
      const trend = this.calculateTrend(monthlyUsage)
      
      // Calculate inventory parameters
      const leadTime = 7 // days (would come from vendor data)
      const serviceFactor = 1.65 // 95% service level
      const safetyStock = serviceFactor * Math.sqrt(variance) * Math.sqrt(leadTime / 30)
      const reorderPoint = (averageMonthlyUsage / 30) * leadTime + safetyStock
      
      // EOQ calculation
      const orderingCost = 50
      const holdingCostRate = 0.25
      const unitCost = 10 // Would come from pricing data
      const annualDemand = averageMonthlyUsage * 12
      const optimalOrderQuantity = Math.sqrt(
        (2 * annualDemand * orderingCost) / (unitCost * holdingCostRate)
      )

      // Predict next order
      const predictedNextOrder = this.predictNextOrder(
        sorted,
        averageMonthlyUsage,
        reorderPoint,
        trend
      )

      patterns.push({
        productId,
        averageMonthlyUsage,
        usageVariance: variance,
        seasonalPattern: isSeasonsal,
        seasonalFactors: factors,
        trend,
        reorderPoint: Math.round(reorderPoint),
        safetyStock: Math.round(safetyStock),
        optimalOrderQuantity: Math.round(optimalOrderQuantity),
        predictedNextOrder
      })
    }

    return patterns
  }

  private aggregateMonthly(
    usage: Array<{ date: string; quantity: number }>
  ): Array<{ month: string; quantity: number; count: number }> {
    const monthly = new Map<string, { quantity: number; count: number }>()

    for (const u of usage) {
      const date = new Date(u.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      const existing = monthly.get(monthKey) || { quantity: 0, count: 0 }
      existing.quantity += u.quantity
      existing.count += 1
      monthly.set(monthKey, existing)
    }

    return Array.from(monthly.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  private calculateVariance(values: number[], mean: number): number {
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length
  }

  private detectSeasonality(
    monthlyUsage: Array<{ month: string; quantity: number }>
  ): { isSeasonsal: boolean; factors?: UsagePattern['seasonalFactors'] } {
    if (monthlyUsage.length < 12) {
      return { isSeasonsal: false }
    }

    // Group by month number
    const monthlyAverages = new Map<number, number[]>()
    
    for (const usage of monthlyUsage) {
      const month = parseInt(usage.month.split('-')[1])
      const quantities = monthlyAverages.get(month) || []
      quantities.push(usage.quantity)
      monthlyAverages.set(month, quantities)
    }

    // Calculate seasonal factors
    const overallAverage = monthlyUsage.reduce((sum, m) => sum + m.quantity, 0) / monthlyUsage.length
    const factors: UsagePattern['seasonalFactors'] = []
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    for (const [month, quantities] of monthlyAverages.entries()) {
      const monthAverage = quantities.reduce((sum, q) => sum + q, 0) / quantities.length
      const factor = monthAverage / overallAverage
      
      factors.push({
        month,
        monthName: monthNames[month - 1],
        factor: Math.round(factor * 100) / 100
      })
    }

    // Check if seasonal (significant variation from 1.0)
    const maxFactor = Math.max(...factors.map(f => f.factor))
    const minFactor = Math.min(...factors.map(f => f.factor))
    const isSeasonsal = (maxFactor > 1.2 || minFactor < 0.8)

    return { isSeasonsal, factors: isSeasonsal ? factors : undefined }
  }

  private calculateTrend(
    monthlyUsage: Array<{ month: string; quantity: number }>
  ): UsagePattern['trend'] {
    if (monthlyUsage.length < 3) return 'stable'

    // Simple linear regression
    const n = monthlyUsage.length
    const x = monthlyUsage.map((_, i) => i)
    const y = monthlyUsage.map(m => m.quantity)
    
    const sumX = x.reduce((sum, xi) => sum + xi, 0)
    const sumY = y.reduce((sum, yi) => sum + yi, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const avgY = sumY / n

    // Determine trend based on slope relative to average
    const slopePercentage = (slope / avgY) * 100

    if (slopePercentage > 5) return 'increasing'
    if (slopePercentage < -5) return 'decreasing'
    return 'stable'
  }

  private predictNextOrder(
    usage: Array<{ date: string; quantity: number }>,
    averageMonthlyUsage: number,
    reorderPoint: number,
    trend: UsagePattern['trend']
  ): UsagePattern['predictedNextOrder'] {
    // Get last order date
    const lastOrder = usage[usage.length - 1]
    const lastOrderDate = new Date(lastOrder.date)
    
    // Calculate average days between orders
    const daysBetweenOrders = []
    for (let i = 1; i < usage.length; i++) {
      const days = (new Date(usage[i].date).getTime() - new Date(usage[i - 1].date).getTime()) 
                   / (1000 * 60 * 60 * 24)
      daysBetweenOrders.push(days)
    }
    
    const avgDaysBetween = daysBetweenOrders.length > 0
      ? daysBetweenOrders.reduce((sum, d) => sum + d, 0) / daysBetweenOrders.length
      : 30

    // Predict next order date
    const predictedDate = new Date(lastOrderDate)
    predictedDate.setDate(predictedDate.getDate() + Math.round(avgDaysBetween))

    // Adjust quantity based on trend
    let predictedQuantity = averageMonthlyUsage
    if (trend === 'increasing') {
      predictedQuantity *= 1.1
    } else if (trend === 'decreasing') {
      predictedQuantity *= 0.9
    }

    // Calculate confidence based on variance
    const variance = this.calculateVariance(usage.map(u => u.quantity), averageMonthlyUsage)
    const coefficientOfVariation = Math.sqrt(variance) / averageMonthlyUsage
    const confidence = Math.max(0.5, Math.min(0.95, 1 - coefficientOfVariation))

    return {
      date: predictedDate,
      quantity: Math.round(predictedQuantity),
      confidence
    }
  }

  private analyzeDepartmentUsage(
    orderHistory: Array<{
      date: string
      items: OrderItem[]
      department?: string
    }>,
    products: Map<string, StandardizedProduct>
  ): DepartmentUsageInsight[] {
    const departmentData = new Map<string, {
      products: Map<string, { quantity: number; totalCost: number }>
      orderCount: number
      vendors: Set<string>
    }>()

    // Aggregate by department
    for (const order of orderHistory) {
      const dept = order.department || 'Unknown'
      const deptData = departmentData.get(dept) || {
        products: new Map(),
        orderCount: 0,
        vendors: new Set()
      }

      deptData.orderCount++

      for (const item of order.items) {
        if (!item.standardized_product_id) continue

        const product = products.get(item.standardized_product_id)
        if (!product) continue

        const productData = deptData.products.get(item.standardized_product_id) || {
          quantity: 0,
          totalCost: 0
        }

        productData.quantity += item.quantity
        productData.totalCost += item.total_price || 0
        deptData.products.set(item.standardized_product_id, productData)

        if (item.vendor_id) {
          deptData.vendors.add(item.vendor_id)
        }
      }

      departmentData.set(dept, deptData)
    }

    // Convert to insights
    const insights: DepartmentUsageInsight[] = []
    const months = this.getMonthSpan(orderHistory)

    for (const [department, data] of departmentData.entries()) {
      const totalSpend = Array.from(data.products.values())
        .reduce((sum, p) => sum + p.totalCost, 0)

      const topProducts = Array.from(data.products.entries())
        .map(([productId, productData]) => ({
          productId,
          productName: products.get(productId)?.name || 'Unknown',
          monthlyUsage: productData.quantity / months,
          percentOfDepartmentSpend: (productData.totalCost / totalSpend) * 100
        }))
        .sort((a, b) => b.percentOfDepartmentSpend - a.percentOfDepartmentSpend)
        .slice(0, 5)

      insights.push({
        department,
        topProducts,
        totalMonthlySpend: totalSpend / months,
        orderFrequency: data.orderCount / months,
        preferredVendors: Array.from(data.vendors)
      })
    }

    return insights
  }

  private getMonthSpan(
    orderHistory: Array<{ date: string }>
  ): number {
    if (orderHistory.length === 0) return 1

    const dates = orderHistory.map(o => new Date(o.date))
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))

    const months = (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
                  (maxDate.getMonth() - minDate.getMonth()) + 1

    return Math.max(1, months)
  }

  private identifyCriticalItemAlerts(
    patterns: UsagePattern[],
    products: Map<string, StandardizedProduct>
  ): UsageAnalysisReport['criticalItemAlerts'] {
    const alerts = []

    for (const pattern of patterns) {
      const product = products.get(pattern.productId)
      if (!product?.is_critical) continue

      // Calculate days until stockout (simplified - would need actual inventory data)
      const dailyUsage = pattern.averageMonthlyUsage / 30
      const currentStock = pattern.reorderPoint * 1.5 // Estimate
      const daysUntilStockout = currentStock / dailyUsage

      if (daysUntilStockout < 14) { // Alert if less than 2 weeks
        const recommendedOrderDate = new Date()
        recommendedOrderDate.setDate(recommendedOrderDate.getDate() + Math.max(0, daysUntilStockout - 7))

        alerts.push({
          productId: product.id,
          productName: product.name,
          currentStock,
          daysUntilStockout: Math.round(daysUntilStockout),
          recommendedOrderDate,
          recommendedQuantity: pattern.optimalOrderQuantity
        })
      }
    }

    return alerts.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)
  }

  private identifyCostSavings(
    patterns: UsagePattern[],
    departmentInsights: DepartmentUsageInsight[],
    products: Map<string, StandardizedProduct>
  ): UsageAnalysisReport['costSavingOpportunities'] {
    const opportunities = []

    // Bulk buying opportunities
    for (const pattern of patterns) {
      if (pattern.averageMonthlyUsage > 100 && pattern.optimalOrderQuantity > pattern.averageMonthlyUsage * 1.5) {
        opportunities.push({
          type: 'bulk_buying' as const,
          description: `Order ${products.get(pattern.productId)?.name} in bulk (${pattern.optimalOrderQuantity} units)`,
          estimatedSavings: pattern.averageMonthlyUsage * 0.05 * 10, // 5% discount estimate
          products: [pattern.productId]
        })
      }
    }

    // Vendor consolidation
    const totalDepartments = departmentInsights.length
    const vendorCount = new Set(
      departmentInsights.flatMap(d => d.preferredVendors)
    ).size

    if (vendorCount > 5) {
      opportunities.push({
        type: 'vendor_consolidation' as const,
        description: `Consolidate from ${vendorCount} vendors to 3-4 preferred vendors`,
        estimatedSavings: totalDepartments * 100 * 12, // $100/month per department
        products: []
      })
    }

    // Substitute products
    for (const product of products.values()) {
      if (product.substitute_product_ids.length > 0) {
        const pattern = patterns.find(p => p.productId === product.id)
        if (pattern && pattern.averageMonthlyUsage > 50) {
          opportunities.push({
            type: 'substitute_product' as const,
            description: `Consider substitutes for ${product.name}`,
            estimatedSavings: pattern.averageMonthlyUsage * 0.1 * 10, // 10% savings estimate
            products: [product.id, ...product.substitute_product_ids]
          })
        }
      }
    }

    return opportunities.sort((a, b) => b.estimatedSavings - a.estimatedSavings)
  }

  private detectUnusualActivity(
    productUsage: Map<string, Array<{ date: string; quantity: number }>>,
    products: Map<string, StandardizedProduct>
  ): UsageAnalysisReport['unusualActivity'] {
    const activities = []

    for (const [productId, usage] of productUsage.entries()) {
      const product = products.get(productId)
      if (!product) continue

      // Sort by date
      const sorted = usage.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      // Check for spikes/drops in recent orders
      if (sorted.length >= 3) {
        const recent = sorted.slice(-3)
        const older = sorted.slice(0, -3)
        
        const recentAvg = recent.reduce((sum, u) => sum + u.quantity, 0) / recent.length
        const olderAvg = older.length > 0 
          ? older.reduce((sum, u) => sum + u.quantity, 0) / older.length
          : recentAvg

        if (recentAvg > olderAvg * 2) {
          activities.push({
            productId,
            productName: product.name,
            type: 'spike' as const,
            description: `Usage increased ${Math.round((recentAvg / olderAvg - 1) * 100)}% recently`
          })
        } else if (recentAvg < olderAvg * 0.5) {
          activities.push({
            productId,
            productName: product.name,
            type: 'drop' as const,
            description: `Usage decreased ${Math.round((1 - recentAvg / olderAvg) * 100)}% recently`
          })
        }
      }

      // Check for new products (first order within 3 months)
      const firstOrderDate = new Date(sorted[0].date)
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

      if (firstOrderDate > threeMonthsAgo) {
        activities.push({
          productId,
          productName: product.name,
          type: 'new_product' as const,
          description: 'Recently added to purchasing catalog'
        })
      }
    }

    return activities
  }
}