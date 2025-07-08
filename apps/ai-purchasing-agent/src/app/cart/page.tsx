'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@ganger/auth'
import { PageLayout } from '@/components/PageLayout'
import { Cart } from '@/components/Cart'
import { useCart } from '@/contexts/CartContext'
import { Alert, LoadingSpinner } from '@ganger/ui'

export default function CartPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { items } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCheckout = async () => {
    try {
      setLoading(true)
      setError('')

      // Create a purchase request from cart items
      const requestData = {
        requester_id: user?.id || 'staff-user',
        department: 'General', // Could be selected by user
        urgency: 'routine' as const,
        notes: 'Created from AI Purchasing Agent cart',
        items: items.map(item => ({
          product_id: item.product.id,
          requested_quantity: item.quantity * (item.product.units_per_package || 1),
          notes: item.notes || ''
        }))
      }

      const response = await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        throw new Error('Failed to create purchase request')
      }

      const data = await response.json()
      
      // Redirect to the analysis page for this request
      router.push(`/purchase-requests/${data.data.id}/analysis`)
    } catch (error) {
      console.error('Checkout error:', error)
      setError('Failed to process cart. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout
      title="Shopping Cart"
      user={user}
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Cart', href: '/cart' }
      ]}
    >
      <div className="max-w-4xl mx-auto">
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3">Creating purchase request...</span>
          </div>
        ) : (
          <Cart onCheckout={handleCheckout} />
        )}
      </div>
    </PageLayout>
  )
}