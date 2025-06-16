import { BatchProtocolLayout } from '@/components/protocol/BatchProtocolLayout'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  CreditCardIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'

// Mock data for batch processing
const batchSummary = {
  totalBatches: 12,
  successfulBatches: 10,
  failedBatches: 1,
  pendingBatches: 1,
  totalAmount: 48750.50,
  successfulAmount: 45230.25,
  failedAmount: 1250.00,
  pendingAmount: 2270.25
}

const recentBatches = [
  {
    id: 'BCO-2024-001',
    type: 'Credit Card Settlement',
    status: 'completed',
    amount: 15430.75,
    transactions: 45,
    startTime: '2024-01-15T09:00:00Z',
    endTime: '2024-01-15T09:15:23Z',
    processor: 'Stripe'
  },
  {
    id: 'BCO-2024-002',
    type: 'Insurance Claims',
    status: 'processing',
    amount: 22150.50,
    transactions: 78,
    startTime: '2024-01-15T10:30:00Z',
    endTime: null,
    processor: 'Clearinghouse'
  },
  {
    id: 'BCO-2024-003',
    type: 'Patient Payments',
    status: 'failed',
    amount: 1250.00,
    transactions: 8,
    startTime: '2024-01-15T11:00:00Z',
    endTime: '2024-01-15T11:02:45Z',
    processor: 'Square'
  }
]

const processingSteps = [
  {
    step: 1,
    title: 'Transaction Collection',
    description: 'Gather all pending transactions from payment processors and billing systems.',
    status: 'completed',
    duration: '2-3 minutes'
  },
  {
    step: 2,
    title: 'Data Validation',
    description: 'Verify transaction integrity, check for duplicates, and validate amounts.',
    status: 'completed',
    duration: '3-5 minutes'
  },
  {
    step: 3,
    title: 'Batch Processing',
    description: 'Process transactions in secure batches with real-time monitoring.',
    status: 'active',
    duration: '5-10 minutes'
  },
  {
    step: 4,
    title: 'Settlement & Reconciliation',
    description: 'Settle funds with payment processors and update financial records.',
    status: 'pending',
    duration: '2-3 minutes'
  },
  {
    step: 5,
    title: 'Report Generation',
    description: 'Generate comprehensive reports and notifications for stakeholders.',
    status: 'pending',
    duration: '1-2 minutes'
  }
]

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    completed: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
    processing: { color: 'bg-blue-100 text-blue-800', icon: ClockIcon },
    active: { color: 'bg-blue-100 text-blue-800', icon: ClockIcon },
    failed: { color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon },
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon }
  }

  const config = statusConfig[status as keyof typeof statusConfig]
  const Icon = config?.icon || ClockIcon

  return (
    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config?.color}`}>
      <Icon className="h-3 w-3" />
      <span className="capitalize">{status}</span>
    </span>
  )
}

function BatchCard({ batch }: { batch: typeof recentBatches[0] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{batch.id}</h3>
          <p className="text-sm text-slate-600">{batch.type}</p>
        </div>
        <StatusBadge status={batch.status} />
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500">Amount</p>
          <p className="text-sm font-medium text-slate-900">${batch.amount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Transactions</p>
          <p className="text-sm font-medium text-slate-900">{batch.transactions}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Processor</p>
          <p className="text-sm font-medium text-slate-900">{batch.processor}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Started</p>
          <p className="text-sm font-medium text-slate-900">
            {new Date(batch.startTime).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  )
}

function ProcessStep({ step }: { step: typeof processingSteps[0] }) {
  return (
    <div className="relative flex items-start space-x-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
        <span className="text-sm font-medium text-slate-600">{step.step}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-900">{step.title}</h4>
          <StatusBadge status={step.status} />
        </div>
        <p className="text-sm text-slate-600 mt-1">{step.description}</p>
        <p className="text-xs text-slate-500 mt-1">Duration: {step.duration}</p>
      </div>
    </div>
  )
}

export default function BatchProtocolPage() {
  return (
    <BatchProtocolLayout>
      <div className="space-y-16">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Batch Closeout Processing Documentation
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Comprehensive financial processing system for payment settlements, 
            insurance claims, and transaction reconciliation.
          </p>
        </div>

        {/* System Overview */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">System Overview</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
              <div className="flex items-center">
                <CreditCardIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Batches</p>
                  <p className="text-2xl font-bold text-slate-900">{batchSummary.totalBatches}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Successful</p>
                  <p className="text-2xl font-bold text-slate-900">{batchSummary.successfulBatches}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Pending</p>
                  <p className="text-2xl font-bold text-slate-900">{batchSummary.pendingBatches}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Failed</p>
                  <p className="text-2xl font-bold text-slate-900">{batchSummary.failedBatches}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Processing Steps */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Processing Workflow</h2>
          <div className="space-y-6">
            {processingSteps.map((step) => (
              <ProcessStep key={step.step} step={step} />
            ))}
          </div>
        </section>

        {/* Recent Batches */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Recent Batch Activity</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {recentBatches.map((batch) => (
              <BatchCard key={batch.id} batch={batch} />
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-left text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50">
              Start New Batch
            </button>
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-left text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50">
              View Reports
            </button>
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-left text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50">
              Export Data
            </button>
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-left text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50">
              System Health
            </button>
          </div>
        </section>
      </div>
    </BatchProtocolLayout>
  )
}