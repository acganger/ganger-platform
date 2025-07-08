'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, Button, Badge } from '@ganger/ui'
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface Recommendation {
  id: string
  type: 'price_optimization' | 'bulk_buying' | 'vendor_consolidation' | 'substitute_product' | 'contract_optimization'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  savings: number
  confidence: number
  actionRequired: string
}

interface RecommendationCardProps {
  recommendation: Recommendation
  onAccept?: () => void
  onReject?: () => void
  expanded?: React.ReactNode
}

export function RecommendationCard({ 
  recommendation, 
  onAccept, 
  onReject,
  expanded 
}: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAccepted, setIsAccepted] = useState(false)
  const [isRejected, setIsRejected] = useState(false)

  const getIcon = () => {
    switch (recommendation.type) {
      case 'price_optimization':
        return <DollarSign className="h-5 w-5 text-green-500" />
      case 'bulk_buying':
        return <Package className="h-5 w-5 text-blue-500" />
      case 'vendor_consolidation':
        return <Users className="h-5 w-5 text-purple-500" />
      case 'contract_optimization':
        return <FileText className="h-5 w-5 text-orange-500" />
      default:
        return <TrendingUp className="h-5 w-5 text-gray-500" />
    }
  }

  const handleAccept = () => {
    setIsAccepted(true)
    setIsRejected(false)
    onAccept?.()
  }

  const handleReject = () => {
    setIsRejected(true)
    setIsAccepted(false)
    onReject?.()
  }

  return (
    <Card className={isAccepted ? 'ring-2 ring-green-500' : isRejected ? 'opacity-50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {getIcon()}
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{recommendation.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={
                recommendation.priority === 'high' ? 'destructive' : 
                recommendation.priority === 'medium' ? 'warning' : 
                'secondary'
              }
              size="sm"
            >
              {recommendation.priority}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="font-semibold text-green-600">
                ${recommendation.savings.toFixed(2)} savings
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${recommendation.confidence * 100}%` }}
                />
              </div>
              <span className="text-gray-500 text-xs">
                {(recommendation.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isAccepted && !isRejected && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReject}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Dismiss
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAccept}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Apply
                </Button>
              </>
            )}
            {isAccepted && (
              <Badge variant="success" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Accepted
              </Badge>
            )}
            {isRejected && (
              <Badge variant="secondary" className="ml-2">
                <XCircle className="h-3 w-3 mr-1" />
                Dismissed
              </Badge>
            )}
          </div>
        </div>

        {isExpanded && expanded && (
          <div className="mt-4 pt-4 border-t">
            {expanded}
          </div>
        )}

        {isExpanded && !expanded && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Action Required:</p>
              <p>{recommendation.actionRequired}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}