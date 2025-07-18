'use client'

import { Button } from '@ganger/ui'
import { Card, CardContent } from '@ganger/ui-catalyst'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="text-center py-12 px-6">
          <FileQuestion className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          
          <h1 className="text-2xl font-semibold mb-2">Page Not Found</h1>
          
          <p className="text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved. 
            Please check the URL or navigate back to a valid page.
          </p>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.back()}
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            
            <Button
              onClick={() => router.push('/')}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}