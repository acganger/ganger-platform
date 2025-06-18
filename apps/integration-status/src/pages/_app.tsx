'use client'

import '@/styles/globals.css'
import type { AppProps } from 'next/app'
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

      <div className="relative min-h-screen bg-slate-50">
        <Component {...pageProps} />
      </div>
    </>
  )
}