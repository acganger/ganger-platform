'use client'

import Link from 'next/link'
import { Button } from '@ganger/ui'
import { Card, CardContent } from '@ganger/ui-catalyst'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="text-center py-12 px-6">
          <FileQuestion className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          
          <h1 className="text-2xl font-semibold mb-2">Page Not Found</h1>
          
          <p className="text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved. 
            Please check the URL or navigate back to the order form.
          </p>

          <div className="flex gap-3 justify-center">
            <Link href="/">
              <Button
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </Link>
            
            <Link href="/">
              <Button>
                <Home className="h-4 w-4 mr-2" />
                Order Form
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}