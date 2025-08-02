'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button, Alert } from '@ganger/ui'
import { Card, CardContent } from '@ganger/ui-catalyst'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
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
            An unexpected error occurred while processing your order form. 
            Please try again or contact support if the issue persists.
          </p>

          <Alert variant="error" className="mb-6 text-left">
            <div className="font-semibold mb-1">Error Details</div>
            <div className="font-mono text-xs">
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
            
            <Link href="/">
              <Button>
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}