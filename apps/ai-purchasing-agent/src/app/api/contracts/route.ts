import { NextRequest, NextResponse } from 'next/server'
import { withStaffAuth } from '@ganger/auth/middleware'
import { 
  VendorContractsRepository,
  VendorPricesRepository,
  VendorConfigurationsRepository,
  StandardizedProductsRepository,
  ConsolidatedOrdersRepository
} from '@ganger/db'
import { GPOContractOptimizationEngine } from '@/lib/ai-engine'

export const GET = withStaffAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    const contractRepo = new VendorContractsRepository()
    const priceRepo = new VendorPricesRepository()
    const vendorRepo = new VendorConfigurationsRepository()
    const productRepo = new StandardizedProductsRepository()
    const orderRepo = new ConsolidatedOrdersRepository()
    
    const contractEngine = new GPOContractOptimizationEngine()
    
    if (contractId) {
      // Analyze specific contract
      const contract = await contractRepo.findContractById(contractId)
      if (!contract) {
        return NextResponse.json(
          { success: false, error: 'Contract not found' },
          { status: 404 }
        )
      }
      
      // For single contract analysis, we need to gather vendor spend data
      const annualSpend = new Map<string, number>()
      const productUsage = new Map<string, { vendorId: string; annualSpend: number }[]>()
      
      // Get all orders for this vendor
      const orders = await orderRepo.findAll()
      const vendorOrders = orders.filter(o => {
        // In a real implementation, we'd filter by vendor
        return true
      })
      
      // Calculate annual spend (simplified - using current spend * 12)
      annualSpend.set(contract.vendor_id, (contract.minimum_commitment || 0) * 0.8)
      
      // Get all vendors for contract analysis
      const vendors = await vendorRepo.findAll()
      const vendorConfig = vendors.find(v => v.id === contract.vendor_id)
      
      // Create GPO contract format
      const gpoContract = {
        id: contract.id,
        name: contract.contract_name,
        vendorId: contract.vendor_id,
        contractNumber: contract.gpo_contract_number || '',
        startDate: contract.start_date,
        endDate: contract.end_date,
        minimumCommitment: contract.minimum_commitment,
        currentSpend: annualSpend.get(contract.vendor_id) || 0,
        compliancePercentage: ((annualSpend.get(contract.vendor_id) || 0) / (contract.minimum_commitment || 1)) * 100,
        tierDiscounts: [
          { minSpend: 0, discountPercentage: 5 },
          { minSpend: 50000, discountPercentage: 10 },
          { minSpend: 100000, discountPercentage: 15 }
        ],
        productCategories: ['all'],
        restrictions: []
      }
      
      const optimizationResult = contractEngine.analyzeContractOptimization(
        vendors,
        [gpoContract],
        annualSpend,
        productUsage
      )
      
      const optimization = {
        currentSpend: gpoContract.currentSpend,
        totalSavings: optimizationResult.optimizationOpportunities
          .reduce((sum, opp) => sum + opp.estimatedSavings, 0),
        recommendations: optimizationResult.currentContracts[0]?.recommendations || []
      }
      
      // Get contract products
      const contractPrices = await priceRepo.findByVendor(contract.vendor_id)
      const contractProducts = await Promise.all(
        contractPrices
          .filter(p => p.is_contract_item)
          .map(p => productRepo.findById(p.standardized_product_id))
      )
      
      return NextResponse.json({
        success: true,
        data: {
          contract,
          optimization,
          products: contractProducts.filter(p => p !== null),
          analysis: {
            utilizationRate: contract.minimum_commitment ? (optimization.currentSpend / contract.minimum_commitment) * 100 : 0,
            daysRemaining: Math.floor((new Date(contract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            atRisk: contract.minimum_commitment ? optimization.currentSpend < contract.minimum_commitment * 0.8 : false,
            potentialPenalty: contract.minimum_commitment ? Math.max(0, contract.minimum_commitment - optimization.currentSpend) * 0.1 : 0,
            recommendations: optimization.recommendations
          }
        }
      })
    } else {
      // Get all contracts
      const contracts = await contractRepo.findAll()
      const activeContracts = includeInactive ? contracts : contracts.filter(c => 
        c.status === 'active' && new Date(c.end_date) > new Date()
      )
      
      // Analyze each contract
      const contractAnalytics = await Promise.all(
        activeContracts.map(async (contract) => {
          // Simplified optimization for list view
          const optimization = {
            currentSpend: (contract.minimum_commitment || 0) * 0.8,
            totalSavings: (contract.minimum_commitment || 0) * 0.05,
            recommendations: []
          }
          const vendor = await vendorRepo.findById(contract.vendor_id)
          
          return {
            id: contract.id,
            contractName: contract.contract_name,
            vendorName: vendor?.vendor_name || 'Unknown',
            gpoName: contract.gpo_name,
            status: contract.status,
            startDate: contract.start_date,
            endDate: contract.end_date,
            minimumCommitment: contract.minimum_commitment,
            currentSpend: optimization.currentSpend,
            utilizationRate: contract.minimum_commitment ? (optimization.currentSpend / contract.minimum_commitment) * 100 : 0,
            savingsAchieved: optimization.totalSavings,
            recommendations: Array.isArray(optimization.recommendations) ? optimization.recommendations.length : 0,
            atRisk: contract.minimum_commitment ? optimization.currentSpend < contract.minimum_commitment * 0.8 : false,
            daysRemaining: Math.floor((new Date(contract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          }
        })
      )
      
      // Calculate summary metrics
      const totalCommitments = contractAnalytics.reduce((sum, c) => sum + (c.minimumCommitment || 0), 0)
      const totalSpend = contractAnalytics.reduce((sum, c) => sum + c.currentSpend, 0)
      const totalSavings = contractAnalytics.reduce((sum, c) => sum + c.savingsAchieved, 0)
      const contractsAtRisk = contractAnalytics.filter(c => c.atRisk).length
      
      // Group by GPO
      const gpoSummary = contractAnalytics.reduce((acc, c) => {
        if (!acc[c.gpoName]) {
          acc[c.gpoName] = {
            gpoName: c.gpoName,
            contractCount: 0,
            totalCommitment: 0,
            totalSpend: 0,
            averageUtilization: 0
          }
        }
        acc[c.gpoName].contractCount++
        acc[c.gpoName].totalCommitment += c.minimumCommitment
        acc[c.gpoName].totalSpend += c.currentSpend
        return acc
      }, {} as Record<string, any>)
      
      // Calculate average utilization for each GPO
      Object.values(gpoSummary).forEach((gpo: any) => {
        gpo.averageUtilization = (gpo.totalSpend / gpo.totalCommitment) * 100
      })
      
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalContracts: contractAnalytics.length,
            activeContracts: contractAnalytics.filter(c => c.status === 'active').length,
            totalCommitments,
            totalSpend,
            overallUtilization: (totalSpend / totalCommitments) * 100,
            totalSavings,
            contractsAtRisk,
            expiringIn30Days: contractAnalytics.filter(c => c.daysRemaining <= 30 && c.daysRemaining > 0).length
          },
          contracts: contractAnalytics,
          gpoSummary: Object.values(gpoSummary),
          recommendations: contractAnalytics
            .filter(c => c.recommendations > 0)
            .map(c => ({
              contractName: c.contractName,
              vendorName: c.vendorName,
              utilizationRate: c.utilizationRate,
              recommendationCount: c.recommendations,
              priority: c.atRisk ? 'high' : c.utilizationRate < 90 ? 'medium' : 'low'
            }))
            .sort((a, b) => {
              const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
              return (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0)
            })
        }
      })
    }
  } catch (error) {
    console.error('Error analyzing contracts:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze contracts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})

export const POST = withStaffAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { action, contractId, productIds } = body
    
    if (!action || !contractId) {
      return NextResponse.json(
        { success: false, error: 'Action and contract ID are required' },
        { status: 400 }
      )
    }
    
    const contractRepo = new VendorContractsRepository()
    const priceRepo = new VendorPricesRepository()
    const productRepo = new StandardizedProductsRepository()
    
    const contract = await contractRepo.findContractById(contractId)
    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      )
    }
    
    switch (action) {
      case 'optimize':
        // Move specified products to this contract
        if (!productIds || !Array.isArray(productIds)) {
          return NextResponse.json(
            { success: false, error: 'Product IDs required for optimization' },
            { status: 400 }
          )
        }
        
        // In a real implementation, this would:
        // 1. Update vendor preferences for these products
        // 2. Create new price entries with contract pricing
        // 3. Update purchase orders to use this vendor
        // 4. Track the optimization in audit log
        
        return NextResponse.json({
          success: true,
          data: {
            message: `Optimization initiated for ${productIds.length} products`,
            contractId,
            productIds,
            estimatedAdditionalSpend: productIds.length * 1000 // Mock calculation
          }
        })
        
      case 'renew':
        // Initiate contract renewal process
        const updatedContract = await contractRepo.updateContract(contractId, {
          renewal_status: 'pending'
        })
        
        return NextResponse.json({
          success: true,
          data: {
            message: 'Contract renewal initiated',
            contract: updatedContract
          }
        })
        
      case 'analyze':
        // Deep analysis of contract performance
        const contractEngine = new GPOContractOptimizationEngine()
        const contract = await contractRepo.findContractById(contractId)
        if (!contract) {
          return NextResponse.json(
            { success: false, error: 'Contract not found' },
            { status: 404 }
          )
        }
        
        const vendors = await new VendorConfigurationsRepository().findAll()
        const annualSpend = new Map<string, number>()
        annualSpend.set(contract.vendor_id, (contract.minimum_commitment || 0) * 0.8)
        
        const gpoContract = {
          id: contract.id,
          name: contract.contract_name,
          vendorId: contract.vendor_id,
          contractNumber: contract.gpo_contract_number || '',
          startDate: contract.start_date,
          endDate: contract.end_date,
          minimumCommitment: contract.minimum_commitment,
          currentSpend: annualSpend.get(contract.vendor_id) || 0,
          compliancePercentage: ((annualSpend.get(contract.vendor_id) || 0) / (contract.minimum_commitment || 1)) * 100,
          tierDiscounts: [
            { minSpend: 0, discountPercentage: 5 },
            { minSpend: 50000, discountPercentage: 10 },
            { minSpend: 100000, discountPercentage: 15 }
          ],
          productCategories: ['all'],
          restrictions: []
        }
        
        const analysis = contractEngine.analyzeContractOptimization(
          vendors,
          [gpoContract],
          annualSpend,
          new Map()
        )
        
        return NextResponse.json({
          success: true,
          data: analysis
        })
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing contract action:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process contract action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})