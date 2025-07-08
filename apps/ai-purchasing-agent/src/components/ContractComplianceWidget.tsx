'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ganger/ui'
import { Badge } from '@ganger/ui'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { VendorConfiguration } from '@ganger/types'

interface ContractComplianceWidgetProps {
  totalItems: number
  contractItems: number
  nonContractItems: number
  potentialSavings?: number
  vendors: VendorConfiguration[]
  expiringContracts?: Array<{
    vendor: VendorConfiguration
    daysUntilExpiry: number
  }>
}

export function ContractComplianceWidget({
  totalItems,
  contractItems,
  nonContractItems,
  potentialSavings = 0,
  vendors,
  expiringContracts = []
}: ContractComplianceWidgetProps) {
  const complianceRate = totalItems > 0 ? (contractItems / totalItems) * 100 : 0
  
  const getComplianceStatus = (rate: number) => {
    if (rate >= 90) return { color: 'text-green-600', icon: CheckCircleIcon, status: 'Excellent' }
    if (rate >= 70) return { color: 'text-yellow-600', icon: ExclamationTriangleIcon, status: 'Good' }
    return { color: 'text-red-600', icon: XCircleIcon, status: 'Needs Improvement' }
  }

  const status = getComplianceStatus(complianceRate)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Contract Compliance</span>
          <Badge variant={complianceRate >= 90 ? 'primary' : complianceRate >= 70 ? 'secondary' : 'destructive'}>
            {status.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Compliance Meter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Compliance Rate</span>
            <span className={`text-2xl font-bold ${status.color}`}>
              {complianceRate.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className={`h-4 rounded-full transition-all ${
                complianceRate >= 90 ? 'bg-green-500' : 
                complianceRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${complianceRate}%` }}
            />
          </div>
        </div>

        {/* Item Breakdown */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-xl font-semibold">{totalItems}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Contract</p>
            <p className="text-xl font-semibold text-green-600">{contractItems}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Non-Contract</p>
            <p className="text-xl font-semibold text-red-600">{nonContractItems}</p>
          </div>
        </div>

        {/* Potential Savings */}
        {potentialSavings > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Potential Savings from Contract Use</span>
              <span className="text-lg font-bold text-blue-900">{formatCurrency(potentialSavings)}</span>
            </div>
          </div>
        )}

        {/* Contract Expiry Warnings */}
        {expiringContracts.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Expiring Contracts</h4>
            <div className="space-y-2">
              {expiringContracts.map((contract, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span className="text-sm text-gray-700">{contract.vendor.vendor_name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {contract.daysUntilExpiry} days
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Contracts */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Active GPO Contracts</h4>
          <div className="space-y-1">
            {vendors
              .filter(v => v.gpo_contract_number)
              .map((vendor) => (
                <div key={vendor.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{vendor.vendor_name}</span>
                  <span className="text-gray-500">{vendor.gpo_contract_number}</span>
                </div>
              ))
            }
          </div>
        </div>
      </CardContent>
    </Card>
  )
}