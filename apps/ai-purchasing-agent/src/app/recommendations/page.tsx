'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { useAuth } from '@ganger/auth'
import { PageLayout } from '@/components/PageLayout'
import { Card, CardHeader, CardContent, Button, Alert, LoadingSpinner, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@ganger/ui'
import { RecommendationCard } from '@/components/RecommendationCard'
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  AlertTriangle,
  ShoppingCart,
  Lightbulb,
  BarChart3,
  Clock
} from 'lucide-react'
import type { StandardizedProduct, VendorConfiguration } from '@ganger/types'

interface Recommendation {
  id: string
  type: 'price_optimization' | 'bulk_buying' | 'vendor_consolidation' | 'substitute_product' | 'contract_optimization'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  estimatedSavings: number
  confidence: number
  products: StandardizedProduct[]
  vendors?: VendorConfiguration[]
  actionItems: string[]
  metrics?: {
    currentCost: number
    optimizedCost: number
    implementationEffort: 'low' | 'medium' | 'high'
    timeToRealize: string
  }
}

interface UsageInsight {
  productId: string
  productName: string
  trend: 'increasing' | 'stable' | 'decreasing'
  averageMonthlyUsage: number
  reorderPoint: number
  currentStock?: number
  daysUntilStockout?: number
}

export default function RecommendationsPage() {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [usageInsights, setUsageInsights] = useState<UsageInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([])

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/recommendations')
      if (!response.ok) throw new Error('Failed to load recommendations')
      
      const data = await response.json()
      setRecommendations(data.data.recommendations)
      setUsageInsights(data.data.usageInsights)
    } catch (error) {
      setError('Failed to load recommendations')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filterRecommendations = (type: string) => {
    if (type === 'all') return recommendations
    return recommendations.filter(r => r.type === type)
  }

  const getTotalSavings = () => {
    return recommendations.reduce((sum, rec) => sum + Math.max(0, rec.estimatedSavings), 0)
  }

  const handleImplementRecommendations = async () => {
    // In production, this would create purchase orders or update vendor preferences
    console.log('Implementing recommendations:', selectedRecommendations)
  }

  if (loading) {
    return (
      <PageLayout
        title="AI Recommendations"
        user={user}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Recommendations', href: '/recommendations' }
        ]}
      >
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3">Analyzing purchasing patterns...</span>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="AI-Powered Recommendations"
      user={user}
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Recommendations', href: '/recommendations' }
      ]}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Lightbulb className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-500">Active Recommendations</p>
                  <p className="text-xl font-semibold">{recommendations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Total Potential Savings</p>
                  <p className="text-xl font-semibold">${getTotalSavings().toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500">Critical Alerts</p>
                  <p className="text-xl font-semibold">
                    {usageInsights.filter(i => i.daysUntilStockout && i.daysUntilStockout < 7).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">Avg Confidence</p>
                  <p className="text-xl font-semibold">
                    {(recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Critical Alerts */}
        {usageInsights.some(i => i.daysUntilStockout && i.daysUntilStockout < 7) && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <div className="font-semibold">Low Stock Alert</div>
              <div className="text-sm mt-1">
                {usageInsights
                  .filter(i => i.daysUntilStockout && i.daysUntilStockout < 7)
                  .map(i => `${i.productName} (${i.daysUntilStockout} days)`)
                  .join(', ')} running low. Review recommendations below.
              </div>
            </div>
          </Alert>
        )}

        {/* Recommendations Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All ({recommendations.length})</TabsTrigger>
            <TabsTrigger value="price_optimization">Price</TabsTrigger>
            <TabsTrigger value="bulk_buying">Bulk</TabsTrigger>
            <TabsTrigger value="vendor_consolidation">Vendor</TabsTrigger>
            <TabsTrigger value="contract_optimization">Contract</TabsTrigger>
            <TabsTrigger value="substitute_product">Substitute</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {filterRecommendations(activeTab).map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={{
                  id: recommendation.id,
                  title: recommendation.title,
                  description: recommendation.description,
                  type: recommendation.type as any,
                  priority: recommendation.priority,
                  savings: recommendation.estimatedSavings,
                  confidence: recommendation.confidence,
                  actionRequired: recommendation.actionItems[0]
                }}
                onAccept={() => {
                  setSelectedRecommendations([...selectedRecommendations, recommendation.id])
                }}
                onReject={() => {
                  setSelectedRecommendations(selectedRecommendations.filter(id => id !== recommendation.id))
                }}
                expanded={
                  <div className="space-y-4 pt-4 border-t">
                    {/* Metrics */}
                    {recommendation.metrics && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Current Cost</p>
                          <p className="font-semibold">${recommendation.metrics.currentCost.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Optimized Cost</p>
                          <p className="font-semibold text-green-600">
                            ${recommendation.metrics.optimizedCost.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Implementation</p>
                          <Badge variant={
                            recommendation.metrics.implementationEffort === 'low' ? 'success' :
                            recommendation.metrics.implementationEffort === 'medium' ? 'warning' : 'destructive'
                          }>
                            {recommendation.metrics.implementationEffort}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Time to Realize</p>
                          <p className="font-semibold">{recommendation.metrics.timeToRealize}</p>
                        </div>
                      </div>
                    )}

                    {/* Action Items */}
                    <div>
                      <h4 className="font-medium mb-2">Action Items:</h4>
                      <ul className="space-y-1">
                        {recommendation.actionItems.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-gray-400 mr-2">•</span>
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                }
              />
            ))}
          </TabsContent>
        </Tabs>

        {/* Usage Insights */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Usage Pattern Insights</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {usageInsights.map((insight) => (
                <div key={insight.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{insight.productName}</span>
                      <Badge variant={
                        insight.trend === 'increasing' ? 'success' :
                        insight.trend === 'decreasing' ? 'destructive' : 'secondary'
                      } size="sm">
                        <TrendingUp className={`h-3 w-3 mr-1 ${
                          insight.trend === 'decreasing' ? 'rotate-180' : ''
                        }`} />
                        {insight.trend}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Avg usage: {insight.averageMonthlyUsage}/month • Reorder at: {insight.reorderPoint} units
                    </div>
                  </div>
                  {insight.daysUntilStockout && (
                    <div className="text-right">
                      <div className={`font-semibold ${
                        insight.daysUntilStockout < 7 ? 'text-red-600' :
                        insight.daysUntilStockout < 14 ? 'text-orange-600' : 'text-gray-600'
                      }`}>
                        {insight.daysUntilStockout} days
                      </div>
                      <div className="text-xs text-gray-500">until stockout</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Bar */}
        {selectedRecommendations.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t p-4 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {selectedRecommendations.length} recommendation{selectedRecommendations.length !== 1 ? 's' : ''} selected
                </p>
                <p className="font-semibold">
                  Total savings: ${recommendations
                    .filter(r => selectedRecommendations.includes(r.id))
                    .reduce((sum, r) => sum + Math.max(0, r.estimatedSavings), 0)
                    .toFixed(2)}
                </p>
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRecommendations([])}
                >
                  Clear Selection
                </Button>
                <Button
                  onClick={handleImplementRecommendations}
                  disabled={selectedRecommendations.length === 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Implement Selected
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}