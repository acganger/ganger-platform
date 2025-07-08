'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ganger/ui'
import { Badge } from '@ganger/ui'
import { Button } from '@ganger/ui'
import { 
  LightBulbIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  ShieldCheckIcon,
  TruckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import type { PriceComparison, VendorConfiguration } from '@ganger/types'

interface RecommendationReason {
  type: 'price' | 'delivery' | 'contract' | 'reliability' | 'consolidation'
  description: string
  impact?: string
}

interface RecommendationCardProps {
  comparison: PriceComparison
  vendor?: VendorConfiguration
  reasons: RecommendationReason[]
  alternativeOptions?: {
    vendor: VendorConfiguration
    savingsPercent: number
    tradeoff: string
  }[]
  onAccept?: () => void
  onReject?: () => void
  onViewDetails?: () => void
}

export function RecommendationCard({
  comparison,
  vendor,
  reasons,
  alternativeOptions = [],
  onAccept,
  onReject,
  onViewDetails
}: RecommendationCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getReasonIcon = (type: RecommendationReason['type']) => {
    switch (type) {
      case 'price':
        return CurrencyDollarIcon
      case 'delivery':
        return TruckIcon
      case 'contract':
        return ShieldCheckIcon
      case 'reliability':
        return ChartBarIcon
      case 'consolidation':
        return ClockIcon
      default:
        return LightBulbIcon
    }
  }

  const getConfidenceBadge = (score?: number) => {
    if (!score) return null
    
    if (score >= 0.9) {
      return <Badge variant="primary">High Confidence ({(score * 100).toFixed(0)}%)</Badge>
    } else if (score >= 0.7) {
      return <Badge variant="secondary">Medium Confidence ({(score * 100).toFixed(0)}%)</Badge>
    } else {
      return <Badge variant="destructive">Low Confidence ({(score * 100).toFixed(0)}%)</Badge>
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <LightBulbIcon className="h-5 w-5 text-indigo-600" />
              <span>AI Recommendation</span>
            </CardTitle>
            {vendor && (
              <p className="mt-1 text-sm text-gray-600">
                We recommend ordering from <span className="font-semibold">{vendor.vendor_name}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            {comparison.potential_savings && comparison.potential_savings > 0 && (
              <div>
                <p className="text-sm text-gray-600">Potential Savings</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(comparison.potential_savings)}
                </p>
                {comparison.savings_percentage && (
                  <p className="text-sm text-green-600">
                    ({comparison.savings_percentage.toFixed(1)}%)
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-3">
          {getConfidenceBadge(comparison.ai_confidence_score)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {/* Reasoning */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Why this recommendation?</h4>
          <div className="space-y-2">
            {reasons.map((reason, index) => {
              const Icon = getReasonIcon(reason.type)
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{reason.description}</p>
                    {reason.impact && (
                      <p className="text-xs text-gray-500 mt-1">{reason.impact}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Alternative Options */}
        {alternativeOptions.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Alternative Options</h4>
            <div className="space-y-2">
              {alternativeOptions.map((option, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{option.vendor.vendor_name}</p>
                    <p className="text-xs text-gray-500">{option.tradeoff}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {option.savingsPercent.toFixed(0)}% savings
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-3 pt-4 border-t">
          <Button
            variant="primary"
            onClick={onAccept}
            className="flex-1"
          >
            Accept Recommendation
          </Button>
          <Button
            variant="secondary"
            onClick={onViewDetails}
            className="flex-1"
          >
            View Details
          </Button>
          {onReject && (
            <Button
              variant="ghost"
              onClick={onReject}
              className="text-gray-500"
            >
              Dismiss
            </Button>
          )}
        </div>

        {/* Additional Context */}
        {comparison.recommendation_reason && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <span className="font-medium">Additional Context:</span> {comparison.recommendation_reason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}