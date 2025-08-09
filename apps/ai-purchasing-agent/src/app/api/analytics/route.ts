import { NextRequest, NextResponse } from 'next/server'
import { withStaffAuth } from '@ganger/auth/middleware'
import { 
  StandardizedProductsRepository,
  UsageHistoryRepository,
  ConsolidatedOrdersRepository,
  VendorPricesRepository
} from '@ganger/db'
import { UsagePatternAnalysisEngine } from '@/lib/ai-engine'

export const dynamic = 'force-dynamic'

export const GET = withStaffAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    
    const usageRepo = new UsageHistoryRepository()
    const productRepo = new StandardizedProductsRepository()
    const orderRepo = new ConsolidatedOrdersRepository()
    const priceRepo = new VendorPricesRepository()
    
    const usageEngine = new UsagePatternAnalysisEngine()
    
    if (productId) {
      // Analyze specific product
      const product = await productRepo.findById(productId)
      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        )
      }
      
      // Get historical usage data
      const usageHistory = await usageRepo.findByProduct(productId)
      
      // Convert to format expected by engine
      const orderHistory = usageHistory.map(u => ({
        date: u.usage_date,
        items: [{
          id: u.id,
          order_id: 'historical',
          standardized_product_id: productId,
          product_name: product.name,
          quantity: u.quantity_used,
          unit_price: 0,
          total_price: 0,
          created_at: u.created_at,
          updated_at: u.created_at
        }],
        department: u.department
      }))
      
      const products = new Map([[productId, product]])
      const analysisReport = usageEngine.analyzeUsagePatterns(orderHistory, products)
      const analysis = analysisReport.patterns[0] || {
        productId,
        averageMonthlyUsage: product.average_monthly_usage || 0,
        usageVariance: 0,
        seasonalPattern: false,
        trend: 'stable' as const,
        reorderPoint: product.reorder_point || 0,
        safetyStock: 0,
        optimalOrderQuantity: 0,
        predictedNextOrder: {
          date: new Date(),
          quantity: 0,
          confidence: 0
        }
      }
      
      // Calculate cost trends
      const prices = await priceRepo.findByProduct(productId)
      const avgPrice = prices.length > 0 
        ? prices.reduce((sum, p) => sum + (p.vendor_unit_price || 0), 0) / prices.length 
        : 0
      
      return NextResponse.json({
        success: true,
        data: {
          product,
          analysis: {
            ...analysis,
            monthlySpend: analysis.averageMonthlyUsage * avgPrice,
            annualSpend: analysis.averageMonthlyUsage * avgPrice * 12,
            usageHistory: usageHistory.map(u => ({
              date: u.usage_date,
              quantity: u.quantity_used,
              department: u.department
            }))
          },
          seasonality: analysis.seasonalFactors || [],
          insights: {
            stockoutRisk: analysis.reorderPoint > 0,
            orderFrequency: `Every ${Math.round(30 / (analysis.averageMonthlyUsage / analysis.reorderPoint))} days`,
            trendDescription: getTrendDescription(analysis.trend, analysis.usageVariance),
            costOptimization: analysis.averageMonthlyUsage > 100 ? 
              'Consider bulk purchasing for volume discounts' : 
              'Current volume appropriate for standard ordering'
          }
        }
      })
    } else {
      // Overall analytics
      const products = await productRepo.findAll(true)
      const recentOrders = await orderRepo.findAll()
      
      // Analyze top products
      const productAnalytics = await Promise.all(
        products.slice(0, 20).map(async (product) => {
          // For now, return simplified analysis
          const analysisData = {
            averageMonthlyUsage: product.average_monthly_usage || 0,
            trend: 'stable' as 'increasing' | 'stable' | 'decreasing',
            stockoutRisk: 'low' as 'low' | 'medium' | 'high'
          }
          const prices = await priceRepo.findByProduct(product.id)
          const avgPrice = prices.length > 0 
            ? prices.reduce((sum, p) => sum + (p.vendor_unit_price || 0), 0) / prices.length 
            : 0
          
          return {
            productId: product.id,
            productName: product.name,
            category: product.category,
            monthlyUsage: analysisData.averageMonthlyUsage,
            monthlySpend: analysisData.averageMonthlyUsage * avgPrice,
            trend: analysisData.trend,
            stockoutRisk: analysisData.stockoutRisk as 'low' | 'medium' | 'high',
            isCritical: product.is_critical
          }
        })
      )
      
      // Sort by monthly spend
      productAnalytics.sort((a, b) => b.monthlySpend - a.monthlySpend)
      
      // Calculate summary metrics
      const totalMonthlySpend = productAnalytics.reduce((sum, p) => sum + p.monthlySpend, 0)
      const criticalItemsAtRisk = productAnalytics.filter(p => p.isCritical && p.stockoutRisk === 'high').length
      const increasingTrendCount = productAnalytics.filter(p => p.trend === 'increasing').length
      
      // Category breakdown
      const categorySpend = productAnalytics.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + p.monthlySpend
        return acc
      }, {} as Record<string, number>)
      
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalMonthlySpend,
            totalAnnualSpend: totalMonthlySpend * 12,
            totalProducts: products.length,
            activeOrders: recentOrders.filter(o => o.status === 'submitted').length,
            criticalItemsAtRisk,
            increasingTrendCount
          },
          topProducts: productAnalytics.slice(0, 10),
          categoryBreakdown: Object.entries(categorySpend)
            .map(([category, spend]) => ({
              category,
              monthlySpend: spend,
              percentage: (spend / totalMonthlySpend) * 100
            }))
            .sort((a, b) => b.monthlySpend - a.monthlySpend),
          trends: {
            increasing: productAnalytics.filter(p => p.trend === 'increasing').length,
            stable: productAnalytics.filter(p => p.trend === 'stable').length,
            decreasing: productAnalytics.filter(p => p.trend === 'decreasing').length
          },
          riskAlerts: productAnalytics
            .filter(p => p.stockoutRisk === 'high')
            .map(p => ({
              productName: p.productName,
              risk: 'high' as const,
              isCritical: p.isCritical,
              message: p.isCritical 
                ? `Critical item ${p.productName} has high stockout risk`
                : `${p.productName} has high stockout risk`
            }))
        }
      })
    }
  } catch (error) {
    console.error('Error generating analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})

function getTrendDescription(trend: string, variance: number): string {
  if (trend === 'increasing') {
    if (variance > 0.3) {
      return 'Usage is increasing with high variability - monitor closely'
    }
    return 'Usage is steadily increasing - consider adjusting reorder quantities'
  } else if (trend === 'decreasing') {
    if (variance > 0.3) {
      return 'Usage is decreasing but unpredictable'
    }
    return 'Usage is steadily decreasing - reduce order quantities to avoid excess inventory'
  } else {
    if (variance > 0.3) {
      return 'Usage is stable but with high variability'
    }
    return 'Usage is stable and predictable'
  }
}