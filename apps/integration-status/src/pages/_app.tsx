'use client'

import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { ErrorBoundary } from '@/components/errors/ErrorBoundary'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { ConnectionStatus } from '@/components/real-time/ConnectionStatus'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { AuthProvider } from '@/lib/auth'
import Head from 'next/head'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Integration Status Dashboard - Ganger Platform</title>
        <meta name="description" content="Monitor and manage all third-party integrations in real-time" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ErrorBoundary
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Application Error
              </h2>
              <p className="text-gray-600 mb-4">
                Something went wrong loading the Integration Status Dashboard.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Reload Application
              </button>
            </div>
          </div>
        }
        onError={(error, errorInfo) => {
          
          // Send error to monitoring service
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'exception', {
              description: error.toString(),
              fatal: true
            });
          }
        }}
      >
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <div className="relative min-h-screen bg-gray-50">
                {/* Connection Status Indicator */}
                <ConnectionStatus />
                
                {/* Main Application */}
                <Component {...pageProps} />
              </div>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </>
  )
}