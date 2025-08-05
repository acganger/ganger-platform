'use client'

import Link from 'next/link'
// Local GangerLogo component
const GangerLogo = ({ size = 'md', className = '' }: { size?: string; className?: string }) => {
  const sizeClass = size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${sizeClass} bg-blue-600 rounded-lg flex items-center justify-center`}>
        <span className="text-white font-bold text-sm">G</span>
      </div>
      <span className="ml-2 font-semibold">Ganger Dermatology</span>
    </div>
  );
}
import { Container } from '@/components/transmit/Container'
import { Activity, Database, Globe, Server, Shield, Zap } from 'lucide-react'

const integrations = [
  { name: 'Supabase', icon: Database, status: 'operational' },
  { name: 'Stripe', icon: Shield, status: 'operational' },
  { name: 'Twilio', icon: Globe, status: 'operational' },
  { name: 'Google Cloud', icon: Server, status: 'operational' },
  { name: 'Cloudflare', icon: Zap, status: 'operational' },
  { name: 'GitHub', icon: Activity, status: 'operational' },
]

function StatusIcon({ status }: { status: string }) {
  const statusConfig = {
    operational: 'text-green-500',
    degraded: 'text-yellow-500',
    outage: 'text-red-500'
  }
  
  return (
    <div className={`h-2 w-2 rounded-full ${statusConfig[status as keyof typeof statusConfig]?.replace('text-', 'bg-')}`} />
  )
}

export function TechnicalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-full">
      {/* Sidebar */}
      <header className="bg-slate-900 lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-80 lg:items-start lg:overflow-y-auto">
        <div className="relative z-10 mx-auto w-full px-4 pt-10 pb-4 sm:px-6 lg:min-h-full lg:px-8 lg:py-12">
          <div className="flex items-center justify-center lg:justify-start">
            <GangerLogo size="lg" className="text-white" />
          </div>
          
          <div className="mt-10 text-center lg:text-left">
            <p className="text-xl font-bold text-white">
              Integration Status
            </p>
            <p className="mt-3 text-lg font-medium text-slate-300">
              Real-time monitoring of critical third-party services and platform health.
            </p>
          </div>

          <nav className="mt-12">
            <ul role="list" className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="group flex items-center px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white rounded-md"
                >
                  <Activity className="mr-3 h-5 w-5" />
                  Overview
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="group flex items-center px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white rounded-md"
                >
                  <Server className="mr-3 h-5 w-5" />
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="/incidents"
                  className="group flex items-center px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white rounded-md"
                >
                  <Shield className="mr-3 h-5 w-5" />
                  Incidents
                </Link>
              </li>
              <li>
                <Link
                  href="/metrics"
                  className="group flex items-center px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white rounded-md"
                >
                  <Database className="mr-3 h-5 w-5" />
                  Metrics
                </Link>
              </li>
            </ul>
          </nav>

          <section className="mt-12">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Service Status
            </h2>
            <ul role="list" className="mt-4 space-y-3">
              {integrations.map((integration) => {
                const Icon = integration.icon
                return (
                  <li key={integration.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Icon className="h-4 w-4 text-slate-400 mr-3" />
                      <span className="text-sm text-slate-300">{integration.name}</span>
                    </div>
                    <StatusIcon status={integration.status} />
                  </li>
                )
              })}
            </ul>
          </section>

          <div className="mt-12 pt-6 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">System Status</span>
              <div className="flex items-center space-x-1">
                <StatusIcon status="operational" />
                <span className="text-xs text-slate-300">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:ml-80">
        <div className="min-h-full bg-slate-50">
          {/* Top Navigation */}
          <div className="bg-white shadow">
            <Container>
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-semibold text-slate-900">
                    Integration Monitoring
                  </h1>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <StatusIcon status="operational" />
                    <span className="text-sm text-slate-600">All systems operational</span>
                  </div>
                  <div className="text-sm text-slate-500">
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </Container>
          </div>

          {/* Page Content */}
          <div className="py-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}