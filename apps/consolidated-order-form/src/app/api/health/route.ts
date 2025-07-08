import { NextResponse } from 'next/server'
import { StandardizedProductsRepository, ConsolidatedOrdersRepository } from '@ganger/db'

export async function GET() {
  try {
    // Test database connections
    const productRepo = new StandardizedProductsRepository()
    const orderRepo = new ConsolidatedOrdersRepository()

    // Simple health checks
    const productCount = (await productRepo.findAll(true)).length
    const orderCount = (await orderRepo.findAll()).length

    return NextResponse.json({
      success: true,
      service: 'Consolidated Order Form',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      status: 'healthy',
      database: {
        connected: true,
        productCount,
        orderCount
      },
      features: {
        productCatalog: true,
        orderManagement: true,
        departmentOrdering: true,
        bulkOrdering: true
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        success: false,
        service: 'Consolidated Order Form',
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}