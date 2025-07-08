import { NextResponse } from 'next/server'
import { StandardizedProductsRepository, VendorManagementRepository } from '@ganger/db'

export async function GET() {
  try {
    // Test database connections
    const productRepo = new StandardizedProductsRepository()
    const vendorRepo = new VendorManagementRepository()

    // Simple health checks
    const productCount = (await productRepo.findAll(true)).length
    const vendorCount = (await vendorRepo.findAll(true)).length

    return NextResponse.json({
      success: true,
      service: 'AI Purchasing Agent',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      status: 'healthy',
      database: {
        connected: true,
        productCount,
        vendorCount
      },
      features: {
        priceComparison: true,
        cartInterceptor: true,
        vendorManagement: true,
        aiRecommendations: true
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        success: false,
        service: 'AI Purchasing Agent',
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}