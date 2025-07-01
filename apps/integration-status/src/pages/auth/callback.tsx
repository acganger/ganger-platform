export const dynamic = 'force-dynamic';

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/auth'
import { LoadingState } from '@/components/ui/LoadingState'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/?error=auth_failed')
          return
        }

        if (data.session) {
          // Successfully authenticated, redirect to main page
          router.push('/')
        } else {
          // No session found, redirect to login
          router.push('/?error=no_session')
        }
      } catch (error) {
        console.error('Unexpected auth callback error:', error)
        router.push('/?error=unexpected')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingState 
          message="Completing authentication..."
          showProgress={true}
        />
      </div>
    </div>
  )
}