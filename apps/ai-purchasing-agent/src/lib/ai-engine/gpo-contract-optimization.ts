import type { 
  VendorConfiguration,
  StandardizedProduct,
  VendorQuote,
  PurchaseRequestItem
} from '@ganger/types'

export interface GPOContract {
  id: string
  name: string
  vendorId: string
  contractNumber: string
  startDate: string
  endDate: string
  minimumCommitment?: number
  currentSpend: number
  compliancePercentage: number
  tierDiscounts: Array<{
    minSpend: number
    discountPercentage: number
  }>
  productCategories: string[]
  restrictions?: string[]
}

export interface ContractCompliance {
  contractId: string
  contractName: string
  vendorName: string
  complianceScore: number
  currentSpend: number
  minimumCommitment: number
  commitmentProgress: number
  daysRemaining: number
  projectedEndSpend: number
  atRisk: boolean
  recommendations: string[]
}

export interface ContractOptimizationResult {
  currentContracts: ContractCompliance[]
  optimizationOpportunities: Array<{
    type: 'shift_spend' | 'new_contract' | 'renegotiate' | 'consolidate'
    description: string
    estimatedSavings: number
    effort: 'low' | 'medium' | 'high'
    contracts: string[]
    products: string[]
  }>
  vendorRebalancing: Array<{
    fromVendor: string
    toVendor: string
    products: string[]
    annualSavings: number
    reason: string
  }>
  contractAlerts: Array<{
    severity: 'high' | 'medium' | 'low'
    contractId: string
    message: string
    action: string
  }>
}

export class GPOContractOptimizationEngine {
  // Analyze contract compliance and optimization opportunities
  analyzeContractOptimization(
    vendors: VendorConfiguration[],
    contracts: GPOContract[],
    annualSpend: Map<string, number>, // vendorId -> annual spend
    productUsage: Map<string, { vendorId: string; annualSpend: number }[]>
  ): ContractOptimizationResult {
    // Assess current contract compliance
    const contractCompliance = this.assessContractCompliance(contracts, annualSpend)
    
    // Identify optimization opportunities
    const opportunities = this.identifyOptimizationOpportunities(
      contracts,
      contractCompliance,
      vendors,
      productUsage
    )
    
    // Analyze vendor rebalancing potential
    const vendorRebalancing = this.analyzeVendorRebalancing(
      vendors,
      contracts,
      productUsage,
      contractCompliance
    )
    
    // Generate contract alerts
    const contractAlerts = this.generateContractAlerts(contractCompliance, contracts)

    return {
      currentContracts: contractCompliance,
      optimizationOpportunities: opportunities,
      vendorRebalancing,
      contractAlerts
    }
  }

  private assessContractCompliance(
    contracts: GPOContract[],
    annualSpend: Map<string, number>
  ): ContractCompliance[] {
    const compliance: ContractCompliance[] = []

    for (const contract of contracts) {
      const currentSpend = annualSpend.get(contract.vendorId) || 0
      const minimumCommitment = contract.minimumCommitment || 0
      
      // Calculate days remaining
      const endDate = new Date(contract.endDate)
      const today = new Date()
      const daysRemaining = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      // Calculate projected end spend
      const daysInContract = Math.ceil(
        (endDate.getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      const daysElapsed = daysInContract - daysRemaining
      const dailySpend = daysElapsed > 0 ? currentSpend / daysElapsed : 0
      const projectedEndSpend = currentSpend + (dailySpend * daysRemaining)
      
      // Calculate compliance score
      const commitmentProgress = minimumCommitment > 0 
        ? (currentSpend / minimumCommitment) * 100 
        : 100
      
      const complianceScore = this.calculateComplianceScore(
        commitmentProgress,
        daysRemaining,
        daysInContract
      )
      
      // Determine if at risk
      const atRisk = minimumCommitment > 0 && projectedEndSpend < minimumCommitment * 0.9
      
      // Generate recommendations
      const recommendations = this.generateComplianceRecommendations(
        contract,
        currentSpend,
        minimumCommitment,
        projectedEndSpend,
        daysRemaining
      )

      compliance.push({
        contractId: contract.id,
        contractName: contract.name,
        vendorName: contract.vendorId, // Would be resolved to vendor name
        complianceScore,
        currentSpend,
        minimumCommitment,
        commitmentProgress,
        daysRemaining,
        projectedEndSpend,
        atRisk,
        recommendations
      })
    }

    return compliance
  }

  private calculateComplianceScore(
    commitmentProgress: number,
    daysRemaining: number,
    totalDays: number
  ): number {
    // Expected progress based on time elapsed
    const timeProgress = ((totalDays - daysRemaining) / totalDays) * 100
    
    // Score based on actual vs expected progress
    const progressRatio = commitmentProgress / timeProgress
    
    if (progressRatio >= 1) {
      return Math.min(100, 80 + (progressRatio - 1) * 20) // 80-100 for on/ahead of track
    } else if (progressRatio >= 0.8) {
      return 60 + (progressRatio - 0.8) * 100 // 60-80 for slightly behind
    } else if (progressRatio >= 0.6) {
      return 40 + (progressRatio - 0.6) * 100 // 40-60 for concerning
    } else {
      return progressRatio * 66.67 // 0-40 for at risk
    }
  }

  private generateComplianceRecommendations(
    contract: GPOContract,
    currentSpend: number,
    minimumCommitment: number,
    projectedEndSpend: number,
    daysRemaining: number
  ): string[] {
    const recommendations: string[] = []

    if (minimumCommitment > 0) {
      const shortfall = minimumCommitment - projectedEndSpend
      
      if (shortfall > 0) {
        const dailyShortfall = shortfall / Math.max(1, daysRemaining)
        recommendations.push(
          `Increase spend by $${dailyShortfall.toFixed(2)}/day to meet commitment`
        )
        
        if (contract.productCategories.length > 0) {
          recommendations.push(
            `Focus on ${contract.productCategories.join(', ')} categories for this vendor`
          )
        }
      }
      
      // Check for tier discount opportunities
      const nextTier = contract.tierDiscounts.find(
        tier => tier.minSpend > currentSpend
      )
      
      if (nextTier) {
        const additionalSpend = nextTier.minSpend - currentSpend
        if (additionalSpend < minimumCommitment * 0.2) {
          recommendations.push(
            `Spend $${additionalSpend.toFixed(2)} more to reach ${nextTier.discountPercentage}% discount tier`
          )
        }
      }
    }

    if (daysRemaining < 90) {
      recommendations.push('Contract expires soon - begin renewal negotiations')
    }

    return recommendations
  }

  private identifyOptimizationOpportunities(
    contracts: GPOContract[],
    compliance: ContractCompliance[],
    vendors: VendorConfiguration[],
    productUsage: Map<string, { vendorId: string; annualSpend: number }[]>
  ): ContractOptimizationResult['optimizationOpportunities'] {
    const opportunities = []

    // Check for spend shift opportunities
    const underutilizedContracts = compliance.filter(c => 
      c.commitmentProgress < 80 && c.minimumCommitment > 0
    )
    
    const overutilizedContracts = compliance.filter(c => 
      c.commitmentProgress > 120
    )

    if (underutilizedContracts.length > 0 && overutilizedContracts.length > 0) {
      // Find products that could be shifted
      const shiftableProducts: string[] = []
      
      for (const [productId, usage] of productUsage.entries()) {
        const currentVendors = usage.map(u => u.vendorId)
        const underutilizedVendors = underutilizedContracts.map(c => 
          contracts.find(con => con.id === c.contractId)?.vendorId
        ).filter(Boolean)
        
        if (currentVendors.some(v => overutilizedContracts.some(c => 
          contracts.find(con => con.id === c.contractId)?.vendorId === v
        ))) {
          if (underutilizedVendors.some(v => currentVendors.includes(v!))) {
            shiftableProducts.push(productId)
          }
        }
      }

      if (shiftableProducts.length > 0) {
        opportunities.push({
          type: 'shift_spend' as const,
          description: 'Rebalance spend from over-utilized to under-utilized contracts',
          estimatedSavings: underutilizedContracts.reduce((sum, c) => 
            sum + (c.minimumCommitment - c.currentSpend) * 0.02, 0
          ), // 2% penalty avoidance
          effort: 'low' as const,
          contracts: [
            ...underutilizedContracts.map(c => c.contractId),
            ...overutilizedContracts.map(c => c.contractId)
          ],
          products: shiftableProducts.slice(0, 5)
        })
      }
    }

    // Check for contract consolidation
    const vendorContractCounts = new Map<string, number>()
    contracts.forEach(c => {
      const count = vendorContractCounts.get(c.vendorId) || 0
      vendorContractCounts.set(c.vendorId, count + 1)
    })

    const multiContractVendors = Array.from(vendorContractCounts.entries())
      .filter(([_, count]) => count > 1)

    if (multiContractVendors.length > 0) {
      opportunities.push({
        type: 'consolidate' as const,
        description: `Consolidate multiple contracts with ${multiContractVendors.length} vendors`,
        estimatedSavings: multiContractVendors.length * 50000 * 0.05, // 5% better terms
        effort: 'medium' as const,
        contracts: contracts
          .filter(c => multiContractVendors.some(([v]) => v === c.vendorId))
          .map(c => c.id),
        products: []
      })
    }

    // Check for renegotiation opportunities
    const highSpendNoDiscount = compliance.filter(c => {
      const contract = contracts.find(con => con.id === c.contractId)
      return c.currentSpend > 100000 && 
             (!contract?.tierDiscounts || contract.tierDiscounts.length === 0)
    })

    if (highSpendNoDiscount.length > 0) {
      opportunities.push({
        type: 'renegotiate' as const,
        description: 'Negotiate volume discounts for high-spend vendors without tier pricing',
        estimatedSavings: highSpendNoDiscount.reduce((sum, c) => 
          sum + c.currentSpend * 0.08, 0
        ), // 8% potential discount
        effort: 'high' as const,
        contracts: highSpendNoDiscount.map(c => c.contractId),
        products: []
      })
    }

    // Check for new contract opportunities
    const nonContractSpend = Array.from(productUsage.values())
      .flat()
      .filter(usage => !contracts.some(c => c.vendorId === usage.vendorId))
      .reduce((sum, usage) => sum + usage.annualSpend, 0)

    if (nonContractSpend > 50000) {
      opportunities.push({
        type: 'new_contract' as const,
        description: 'Establish GPO contracts for high-spend non-contract vendors',
        estimatedSavings: nonContractSpend * 0.12, // 12% typical GPO savings
        effort: 'high' as const,
        contracts: [],
        products: []
      })
    }

    return opportunities.sort((a, b) => b.estimatedSavings - a.estimatedSavings)
  }

  private analyzeVendorRebalancing(
    vendors: VendorConfiguration[],
    contracts: GPOContract[],
    productUsage: Map<string, { vendorId: string; annualSpend: number }[]>,
    compliance: ContractCompliance[]
  ): ContractOptimizationResult['vendorRebalancing'] {
    const rebalancing = []

    // Find vendors with better contract terms
    const vendorContractScores = new Map<string, number>()
    
    for (const contract of contracts) {
      const complianceInfo = compliance.find(c => c.contractId === contract.id)
      if (!complianceInfo) continue

      // Score based on discount tiers and compliance
      const maxDiscount = Math.max(...contract.tierDiscounts.map(t => t.discountPercentage), 0)
      const score = maxDiscount * (complianceInfo.complianceScore / 100)
      
      vendorContractScores.set(contract.vendorId, score)
    }

    // Analyze each product for rebalancing opportunities
    for (const [productId, usage] of productUsage.entries()) {
      if (usage.length < 2) continue // Need multiple vendors to rebalance

      // Sort vendors by contract score
      const sortedVendors = usage
        .map(u => ({
          ...u,
          score: vendorContractScores.get(u.vendorId) || 0
        }))
        .sort((a, b) => b.score - a.score)

      const bestVendor = sortedVendors[0]
      const worstVendor = sortedVendors[sortedVendors.length - 1]

      if (bestVendor.score > worstVendor.score + 5) {
        const savingsPercentage = (bestVendor.score - worstVendor.score) / 100
        const annualSavings = worstVendor.annualSpend * savingsPercentage

        if (annualSavings > 1000) {
          rebalancing.push({
            fromVendor: worstVendor.vendorId,
            toVendor: bestVendor.vendorId,
            products: [productId],
            annualSavings,
            reason: `Better contract terms (${bestVendor.score.toFixed(0)}% vs ${worstVendor.score.toFixed(0)}%)`
          })
        }
      }
    }

    // Consolidate similar rebalancing recommendations
    const consolidated = this.consolidateRebalancing(rebalancing)

    return consolidated.sort((a, b) => b.annualSavings - a.annualSavings).slice(0, 5)
  }

  private consolidateRebalancing(
    rebalancing: ContractOptimizationResult['vendorRebalancing']
  ): ContractOptimizationResult['vendorRebalancing'] {
    const consolidated = new Map<string, typeof rebalancing[0]>()

    for (const item of rebalancing) {
      const key = `${item.fromVendor}-${item.toVendor}`
      const existing = consolidated.get(key)

      if (existing) {
        existing.products.push(...item.products)
        existing.annualSavings += item.annualSavings
      } else {
        consolidated.set(key, {
          ...item,
          products: [...item.products]
        })
      }
    }

    return Array.from(consolidated.values())
  }

  private generateContractAlerts(
    compliance: ContractCompliance[],
    contracts: GPOContract[]
  ): ContractOptimizationResult['contractAlerts'] {
    const alerts = []

    for (const comp of compliance) {
      const contract = contracts.find(c => c.id === comp.contractId)
      if (!contract) continue

      // High severity alerts
      if (comp.atRisk && comp.daysRemaining < 90) {
        alerts.push({
          severity: 'high' as const,
          contractId: comp.contractId,
          message: `Contract at risk: Only ${comp.daysRemaining} days to meet $${(comp.minimumCommitment - comp.currentSpend).toFixed(2)} shortfall`,
          action: 'Immediate action required to shift spend or renegotiate terms'
        })
      }

      // Contract expiry alerts
      if (comp.daysRemaining < 30) {
        alerts.push({
          severity: 'high' as const,
          contractId: comp.contractId,
          message: `Contract expires in ${comp.daysRemaining} days`,
          action: 'Begin renewal negotiations immediately'
        })
      } else if (comp.daysRemaining < 90) {
        alerts.push({
          severity: 'medium' as const,
          contractId: comp.contractId,
          message: `Contract expires in ${comp.daysRemaining} days`,
          action: 'Schedule renewal discussions'
        })
      }

      // Underutilization alerts
      if (comp.commitmentProgress < 50 && comp.daysRemaining < 180) {
        alerts.push({
          severity: 'medium' as const,
          contractId: comp.contractId,
          message: `Only ${comp.commitmentProgress.toFixed(0)}% of commitment met`,
          action: 'Review product catalog and shift appropriate spend'
        })
      }

      // Tier threshold alerts
      const currentTier = contract.tierDiscounts
        .filter(t => t.minSpend <= comp.currentSpend)
        .sort((a, b) => b.minSpend - a.minSpend)[0]
      
      const nextTier = contract.tierDiscounts
        .find(t => t.minSpend > comp.currentSpend)

      if (nextTier && (nextTier.minSpend - comp.currentSpend) < 10000) {
        alerts.push({
          severity: 'low' as const,
          contractId: comp.contractId,
          message: `Close to ${nextTier.discountPercentage}% discount tier (need $${(nextTier.minSpend - comp.currentSpend).toFixed(2)} more)`,
          action: 'Consider consolidating purchases to reach next tier'
        })
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    })
  }
}