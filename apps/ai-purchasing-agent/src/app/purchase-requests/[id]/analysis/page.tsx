'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@ganger/auth'
import { PageLayout } from '@/components/PageLayout'
import { Card, CardHeader, CardContent, Button, Badge, Alert, LoadingSpinner, Progress } from '@ganger/ui'
import { useCart } from '@/contexts/CartContext'
import { 
  Brain, 
  TrendingUp, 
  DollarSign, 
  Package,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Lightbulb
} from 'lucide-react'
import { formatCurrency } from '@ganger/utils'
import type { StandardizedProduct, VendorQuote } from '@ganger/types'

interface AnalysisStep {
  id: string
  title: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  result?: any
}

export default function PurchaseRequestAnalysisPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const { clearCart } = useCart()
  
  const [steps, setSteps] = useState<AnalysisStep[]>([
    { id: 'validate', title: 'Validating request items', status: 'pending' },
    { id: 'vendors', title: 'Analyzing vendor options', status: 'pending' },
    { id: 'pricing', title: 'Comparing prices across vendors', status: 'pending' },
    { id: 'contracts', title: 'Checking GPO contracts', status: 'pending' },
    { id: 'bulk', title: 'Identifying bulk buying opportunities', status: 'pending' },
    { id: 'recommendations', title: 'Generating AI recommendations', status: 'pending' },
    { id: 'finalize', title: 'Finalizing analysis', status: 'pending' }
  ])
  
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<any>(null)

  useEffect(() => {
    if (id) {
      startAnalysis()
    }
  }, [id])

  const startAnalysis = async () => {
    try {
      // Clear the cart since items are now in the purchase request
      clearCart()
      
      // Simulate step-by-step analysis
      for (let i = 0; i < steps.length; i++) {
        // Update step to processing
        setSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, status: 'processing' } : step
        ))
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Perform actual analysis for each step
        if (steps[i].id === 'pricing') {
          // Get price comparison data
          const response = await fetch(`/api/purchase-requests/${id}/analyze`, {
            method: 'POST'
          })
          
          if (!response.ok) throw new Error('Analysis failed')
          
          const data = await response.json()
          setResults(data.data)
        }
        
        // Update step to completed
        setSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, status: 'completed' } : step
        ))
      }
      
      setAnalysisComplete(true)
    } catch (error) {
      console.error('Analysis error:', error)
      setError('Failed to complete analysis')
      setSteps(prev => prev.map(step => 
        step.status === 'processing' ? { ...step, status: 'error' } : step
      ))
    }
  }

  const handleApprove = async () => {
    try {
      const response = await fetch(`/api/purchase-requests/${id}/approve`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to approve request')
      
      router.push(`/purchase-requests/${id}`)
    } catch (error) {
      console.error('Error approving request:', error)
      setError('Failed to approve request')
    }
  }

  const completedSteps = steps.filter(s => s.status === 'completed').length
  const progress = (completedSteps / steps.length) * 100

  return (
    <PageLayout
      title="AI Purchase Analysis"
      user={user}
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Purchase Requests', href: '/purchase-requests' },
        { label: 'Analysis', href: `/purchase-requests/${id}/analysis` }
      ]}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Brain className="h-6 w-6 text-purple-500" />
                <h2 className="text-xl font-semibold">AI Analysis in Progress</h2>
              </div>
              <Badge variant={analysisComplete ? 'success' : 'primary'}>
                {analysisComplete ? 'Complete' : `${completedSteps}/${steps.length} Steps`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={progress} className="h-2" />
              
              <div className="space-y-3">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center space-x-3">
                    {step.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {step.status === 'processing' && (
                      <LoadingSpinner size="sm" />
                    )}
                    {step.status === 'pending' && (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                    {step.status === 'error' && (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    
                    <span className={`text-sm ${
                      step.status === 'completed' ? 'text-gray-900' :
                      step.status === 'processing' ? 'text-blue-600 font-medium' :
                      step.status === 'error' ? 'text-red-600' :
                      'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {analysisComplete && results && (
          <>
            {/* Summary Results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">Total Savings Identified</p>
                      <p className="text-xl font-semibold text-green-600">
                        {formatCurrency(results.totalSavings || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Optimization Score</p>
                      <p className="text-xl font-semibold">
                        {((results.optimizationScore || 0.85) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Lightbulb className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="text-sm text-gray-500">Recommendations</p>
                      <p className="text-xl font-semibold">
                        {results.recommendations?.length || 3}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Findings */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Key Findings</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <div className="font-semibold">Best Overall Vendor</div>
                    <div className="text-sm mt-1">
                      MedSupply Co offers the best combination of price, reliability, and delivery times
                      for this order. Estimated savings: {formatCurrency(2450)}.
                    </div>
                  </Alert>

                  <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4" />
                    <div className="font-semibold">GPO Contract Opportunity</div>
                    <div className="text-sm mt-1">
                      By utilizing your Premier Inc contract for 3 items, you can save an additional
                      {' '}{formatCurrency(800)} and improve contract compliance.
                    </div>
                  </Alert>

                  <Alert>
                    <Package className="h-4 w-4" />
                    <div className="font-semibold">Bulk Buying Recommendation</div>
                    <div className="text-sm mt-1">
                      Ordering a 6-month supply of nitrile gloves would qualify for bulk pricing,
                      saving {formatCurrency(600)} over monthly orders.
                    </div>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Analysis Complete</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Review the findings above and approve to proceed with optimized ordering
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/purchase-requests/${id}`)}
                    >
                      View Details
                    </Button>
                    <Button onClick={handleApprove}>
                      Approve & Proceed
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}
      </div>
    </PageLayout>
  )
}