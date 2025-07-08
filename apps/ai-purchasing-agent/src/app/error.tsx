'use client'

import { useEffect } from 'react'
import { Button, Card, CardContent, Alert } from '@ganger/ui'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="text-center py-12 px-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          
          <h1 className="text-2xl font-semibold mb-2">Something went wrong!</h1>
          
          <p className="text-gray-600 mb-6">
            An unexpected error occurred while processing your request. 
            Our team has been notified and is working to resolve the issue.
          </p>

          <Alert variant="error" className="mb-6 text-left">
            <div className="font-semibold">Error Details</div>
            <div className="font-mono text-xs mt-1">
              {error.message || 'Unknown error occurred'}
            </div>
          </Alert>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={reset}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button
              onClick={() => router.push('/')}
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}