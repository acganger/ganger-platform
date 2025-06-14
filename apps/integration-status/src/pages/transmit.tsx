'use client'

import { motion } from 'framer-motion'
import { TechnicalLayout } from '@/components/transmit/TechnicalLayout'
import { Container } from '@/components/transmit/Container'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  TrendingUp,
  Activity,
  Server,
  Database,
  Globe,
  Shield,
  Zap
} from 'lucide-react'

// Mock integration data
const integrationStatus = [
  {
    name: 'Supabase Database',
    service: 'Database & Auth',
    status: 'operational',
    uptime: '99.98%',
    responseTime: '45ms',
    lastIncident: null,
    icon: Database,
    description: 'PostgreSQL database, authentication, and real-time subscriptions'
  },
  {
    name: 'Stripe Payments',
    service: 'Payment Processing',
    status: 'operational',
    uptime: '99.99%',
    responseTime: '120ms',
    lastIncident: null,
    icon: Shield,
    description: 'Credit card processing and subscription management'
  },
  {
    name: 'Twilio Communications',
    service: 'SMS & Voice',
    status: 'operational',
    uptime: '99.95%',
    responseTime: '200ms',
    lastIncident: '2 days ago',
    icon: Globe,
    description: 'SMS notifications and voice communication services'
  },
  {
    name: 'Google Cloud Platform',
    service: 'Cloud Infrastructure',
    status: 'operational',
    uptime: '99.97%',
    responseTime: '35ms',
    lastIncident: null,
    icon: Server,
    description: 'Compute resources, storage, and AI/ML services'
  },
  {
    name: 'Cloudflare CDN',
    service: 'Content Delivery',
    status: 'operational',
    uptime: '99.99%',
    responseTime: '15ms',
    lastIncident: null,
    icon: Zap,
    description: 'Global content delivery network and DDoS protection'
  },
  {
    name: 'GitHub Repository',
    service: 'Version Control',
    status: 'operational',
    uptime: '99.96%',
    responseTime: '80ms',
    lastIncident: '1 week ago',
    icon: Activity,
    description: 'Source code management and CI/CD pipelines'
  }
]

const systemMetrics = [
  { label: 'Overall Uptime', value: '99.97%', change: '+0.02%', trend: 'up' },
  { label: 'Active Integrations', value: '6/6', change: '0', trend: 'stable' },
  { label: 'Avg Response Time', value: '82ms', change: '-5ms', trend: 'down' },
  { label: 'Incidents (30d)', value: '2', change: '-1', trend: 'down' }
]

const recentEvents = [
  {
    timestamp: '2024-01-15T14:30:00Z',
    type: 'resolved',
    service: 'Twilio',
    message: 'SMS delivery delays resolved - all services restored',
    duration: '23 minutes'
  },
  {
    timestamp: '2024-01-14T09:15:00Z',
    type: 'maintenance',
    service: 'Supabase',
    message: 'Scheduled maintenance completed successfully',
    duration: '1 hour'
  },
  {
    timestamp: '2024-01-12T16:45:00Z',
    type: 'incident',
    service: 'GitHub',
    message: 'API rate limiting triggered - monitoring increased traffic',
    duration: '45 minutes'
  }
]

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    operational: { icon: CheckCircle, color: 'text-green-700 bg-green-100', label: 'Operational' },
    degraded: { icon: AlertTriangle, color: 'text-yellow-700 bg-yellow-100', label: 'Degraded' },
    outage: { icon: XCircle, color: 'text-red-700 bg-red-100', label: 'Outage' }
  }

  const config = statusConfig[status as keyof typeof statusConfig]
  const Icon = config?.icon || CheckCircle

  return (
    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config?.color}`}>
      <Icon className="h-3 w-3" />
      <span>{config?.label}</span>
    </span>
  )
}

function IntegrationCard({ integration }: { integration: typeof integrationStatus[0] }) {
  const Icon = integration.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Icon className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{integration.name}</h3>
            <p className="text-sm text-slate-500">{integration.service}</p>
          </div>
        </div>
        <StatusBadge status={integration.status} />
      </div>

      <p className="mt-4 text-sm text-slate-600">{integration.description}</p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-slate-500">Uptime</p>
          <p className="text-sm font-medium text-slate-900">{integration.uptime}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Response Time</p>
          <p className="text-sm font-medium text-slate-900">{integration.responseTime}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Last Incident</p>
          <p className="text-sm font-medium text-slate-900">
            {integration.lastIncident || 'None'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function MetricCard({ metric }: { metric: typeof systemMetrics[0] }) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-slate-600'
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">{metric.label}</p>
        <TrendingUp className={`h-4 w-4 ${trendColors[metric.trend as keyof typeof trendColors]}`} />
      </div>
      <p className="text-3xl font-bold text-slate-900 mt-2">{metric.value}</p>
      <p className={`text-sm ${trendColors[metric.trend as keyof typeof trendColors]} mt-1`}>
        {metric.change} from last period
      </p>
    </div>
  )
}

function EventItem({ event }: { event: typeof recentEvents[0] }) {
  const typeConfig = {
    resolved: { icon: CheckCircle, color: 'text-green-600' },
    maintenance: { icon: Clock, color: 'text-blue-600' },
    incident: { icon: AlertTriangle, color: 'text-yellow-600' }
  }

  const config = typeConfig[event.type as keyof typeof typeConfig]
  const Icon = config?.icon || CheckCircle

  return (
    <div className="flex space-x-3">
      <div className="flex-shrink-0">
        <Icon className={`h-5 w-5 ${config?.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-900">{event.service}</p>
          <p className="text-xs text-slate-500">
            {new Date(event.timestamp).toLocaleString()}
          </p>
        </div>
        <p className="text-sm text-slate-600 mt-1">{event.message}</p>
        <p className="text-xs text-slate-500 mt-1">Duration: {event.duration}</p>
      </div>
    </div>
  )
}

export default function IntegrationTransmitPage() {
  return (
    <TechnicalLayout>
      <Container>
        <div className="space-y-8">
          {/* System Metrics */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-6">System Performance</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {systemMetrics.map((metric) => (
                <MetricCard key={metric.label} metric={metric} />
              ))}
            </div>
          </section>

          {/* Integration Status */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Integration Status</h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {integrationStatus.map((integration) => (
                <IntegrationCard key={integration.name} integration={integration} />
              ))}
            </div>
          </section>

          {/* Recent Events */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Recent Events</h2>
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="space-y-6">
                {recentEvents.map((event, index) => (
                  <EventItem key={index} event={event} />
                ))}
              </div>
            </div>
          </section>

          {/* Status Summary */}
          <section>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-green-900">All Systems Operational</h3>
                  <p className="text-sm text-green-700 mt-1">
                    All integrations are functioning normally. No active incidents reported.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </Container>
    </TechnicalLayout>
  )
}