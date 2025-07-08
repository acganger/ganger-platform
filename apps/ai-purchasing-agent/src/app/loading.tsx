import { LoadingSpinner } from '@ganger/ui'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600">Loading AI Purchasing Agent...</p>
      </div>
    </div>
  )
}