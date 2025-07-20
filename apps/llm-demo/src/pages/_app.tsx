import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { AuthProvider, useAuth } from '@ganger/auth'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

function AuthenticatedApp({ Component, pageProps }: AppProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      router.push('/api/auth/login')
    }
  }, [user, loading, router])
  
  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we verify your access.</p>
        </div>
      </div>
    )
  }
  
  // Show nothing while redirecting
  if (!user) {
    return null
  }
  
  // Check if user has correct email domain
  if (!user.email?.endsWith('@gangerdermatology.com')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Access Denied</h2>
          <p className="text-gray-600">This application is restricted to Ganger Dermatology staff.</p>
        </div>
      </div>
    )
  }
  
  return <Component {...pageProps} />
}

export default function App(props: AppProps) {
  return (
    <AuthProvider>
      <AuthenticatedApp {...props} />
    </AuthProvider>
  )
}