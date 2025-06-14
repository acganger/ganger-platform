'use client'

import { MedicationAuthLayout } from '@/components/salient/MedicationAuthLayout'
import { Container } from '@/components/salient/Container'
import { FadeIn, FadeInStagger } from '@/components/salient/FadeIn'
import { Button } from '@/components/salient/Button'
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

// Mock data for medication authorizations
const recentAuthorizations = [
  {
    id: 'PA-2024-001',
    patient: 'Sarah Johnson',
    medication: 'Dupixent (dupilumab)',
    status: 'approved',
    priority: 'standard',
    submitDate: '2024-01-15',
    responseDate: '2024-01-17',
    insurance: 'Blue Cross Blue Shield'
  },
  {
    id: 'PA-2024-002', 
    patient: 'Michael Chen',
    medication: 'Skyrizi (risankizumab)',
    status: 'pending',
    priority: 'urgent',
    submitDate: '2024-01-16',
    responseDate: null,
    insurance: 'Aetna'
  },
  {
    id: 'PA-2024-003',
    patient: 'Emily Rodriguez',
    medication: 'Otezla (apremilast)',
    status: 'approved',
    priority: 'standard',
    submitDate: '2024-01-14',
    responseDate: '2024-01-16',
    insurance: 'UnitedHealthcare'
  }
]

const statsData = [
  { label: 'Total Authorizations', value: '156', change: '+12%', period: 'this month' },
  { label: 'Average Response Time', value: '2.3 days', change: '-15%', period: 'vs last month' },
  { label: 'Approval Rate', value: '94%', change: '+3%', period: 'this quarter' },
  { label: 'Active Requests', value: '23', change: '+5', period: 'pending review' }
]

function AuthorizationCard({ auth }: { auth: typeof recentAuthorizations[0] }) {
  const statusColors = {
    approved: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    denied: 'bg-red-100 text-red-800'
  }

  const StatusIcon = {
    approved: CheckCircleIcon,
    pending: ClockIcon,
    denied: ExclamationTriangleIcon
  }

  const Icon = StatusIcon[auth.status as keyof typeof StatusIcon]

  return (
    <FadeIn>
      <div className="relative rounded-3xl bg-white p-6 shadow-md shadow-slate-900/5 ring-1 ring-slate-900/5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-slate-900">{auth.id}</h3>
              {auth.priority === 'urgent' && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                  Urgent
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-1">{auth.patient}</p>
            <p className="text-sm font-medium text-slate-900 mt-2">{auth.medication}</p>
            <p className="text-xs text-slate-500 mt-1">{auth.insurance}</p>
          </div>
          <div className="flex flex-col items-end">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[auth.status as keyof typeof statusColors]}`}>
              <Icon className="h-3 w-3" />
              <span className="capitalize">{auth.status}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Submitted: {new Date(auth.submitDate).toLocaleDateString()}</span>
            {auth.responseDate && (
              <span>Responded: {new Date(auth.responseDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
    </FadeIn>
  )
}

function StatCard({ stat }: { stat: typeof statsData[0] }) {
  return (
    <FadeIn>
      <div className="rounded-3xl bg-white p-6 shadow-md shadow-slate-900/5 ring-1 ring-slate-900/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
            {stat.change}
          </span>
          <span className="text-slate-500 ml-1">{stat.period}</span>
        </div>
      </div>
    </FadeIn>
  )
}

export default function MedicationAuthSalient() {
  return (
    <MedicationAuthLayout>
      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <FadeIn className="max-w-2xl">
          <h1 className="font-display text-5xl font-medium tracking-tight text-slate-900 sm:text-7xl">
            AI-powered medication authorization management.
          </h1>
          <p className="mt-6 text-xl text-slate-600">
            Streamline prior authorization requests with intelligent automation, 
            real-time tracking, and comprehensive analytics for better patient outcomes.
          </p>
          <div className="mt-10 flex gap-x-6">
            <Button href="/create">Create New Authorization</Button>
            <Button href="/dashboard" variant="outline">
              View Dashboard
            </Button>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <FadeIn>
          <h2 className="text-center font-display text-sm font-semibold tracking-wider text-slate-900 uppercase">
            Performance Overview
          </h2>
        </FadeIn>
        <FadeInStagger className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </FadeInStagger>
      </Container>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <FadeIn>
          <h2 className="font-display text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl">
            Recent Authorization Requests
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Track the status of recent medication authorization requests and their processing timelines.
          </p>
        </FadeIn>
        <FadeInStagger className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {recentAuthorizations.map((auth) => (
            <AuthorizationCard key={auth.id} auth={auth} />
          ))}
        </FadeInStagger>
      </Container>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <FadeIn className="rounded-3xl bg-slate-50 py-20 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl">
              Ready to streamline your authorization process?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Start processing medication authorizations more efficiently with our AI-powered platform.
            </p>
            <Button href="/create" className="mt-10">
              Get Started Today
            </Button>
          </div>
        </FadeIn>
      </Container>
    </MedicationAuthLayout>
  )
}