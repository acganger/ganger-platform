'use client'

import { HandoutsSyntaxLayout } from '@/components/syntax/HandoutsSyntaxLayout'
import { Button } from '@/components/syntax/Button'
import { FadeIn } from '@/components/syntax/FadeIn'
import { 
  FileText, 
  Download, 
  QrCode, 
  BarChart3,
  Clock,
  CheckCircle,
  Eye,
  Share2,
  Printer,
  Globe,
  Smartphone
} from 'lucide-react'

const handoutTemplates = [
  {
    title: 'Acne Treatment Guide',
    category: 'Dermatology',
    downloads: 1250,
    views: 8900,
    lastUpdated: '2024-01-15',
    description: 'Comprehensive guide for acne treatment and skincare routines.'
  },
  {
    title: 'Eczema Care Instructions',
    category: 'Dermatology', 
    downloads: 890,
    views: 5600,
    lastUpdated: '2024-01-12',
    description: 'Detailed instructions for managing eczema symptoms and flare-ups.'
  },
  {
    title: 'Sun Protection Guidelines',
    category: 'Prevention',
    downloads: 2100,
    views: 12400,
    lastUpdated: '2024-01-10',
    description: 'Essential sun protection tips and recommended products.'
  },
  {
    title: 'Post-Surgery Care',
    category: 'Procedures',
    downloads: 670,
    views: 3200,
    lastUpdated: '2024-01-08',
    description: 'Step-by-step post-operative care instructions.'
  },
]

const recentActivity = [
  { action: 'Downloaded "Acne Treatment Guide"', user: 'Dr. Smith', time: '2 minutes ago' },
  { action: 'Created new handout "Rosacea Management"', user: 'Dr. Johnson', time: '15 minutes ago' },
  { action: 'Updated "Sun Protection Guidelines"', user: 'Dr. Chen', time: '1 hour ago' },
  { action: 'Generated QR code for "Eczema Care"', user: 'Dr. Rodriguez', time: '2 hours ago' },
]

const stats = [
  { name: 'Total Handouts', value: '247', icon: FileText, change: '+12%' },
  { name: 'Downloads This Month', value: '8,956', icon: Download, change: '+23%' },
  { name: 'Active QR Codes', value: '89', icon: QrCode, change: '+8%' },
  { name: 'Patient Views', value: '45,678', icon: Eye, change: '+31%' },
]

export default function SyntaxShowcase() {
  return (
    <HandoutsSyntaxLayout>
      <div className="space-y-8">
        <FadeIn>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Patient Handouts Platform
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">
              Create, customize, and distribute professional patient education materials with 
              QR code integration, digital delivery, and comprehensive analytics.
            </p>
          </div>
        </FadeIn>

        {/* Quick Actions */}
        <FadeIn>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">
              Create New Handout
            </Button>
            <Button variant="secondary">
              Browse Templates
            </Button>
            <Button href="/analytics" variant="secondary">
              View Analytics
            </Button>
          </div>
        </FadeIn>

        {/* Statistics */}
        <FadeIn>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.name}
                className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow dark:bg-slate-800 sm:px-6 sm:py-6"
              >
                <dt>
                  <div className="absolute rounded-md bg-sky-500 p-3">
                    <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-slate-500 dark:text-slate-400">
                    {stat.name}
                  </p>
                </dt>
                <dd className="ml-16 flex items-baseline">
                  <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                    {stat.change}
                  </p>
                </dd>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Popular Templates */}
        <FadeIn>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Popular Handout Templates
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {handoutTemplates.map((template) => (
                <div
                  key={template.title}
                  className="relative flex flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {template.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {template.category}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-900 dark:text-sky-200">
                      Template
                    </span>
                  </div>
                  
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    {template.description}
                  </p>
                  
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        {template.downloads}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {template.views}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {template.lastUpdated}
                    </span>
                  </div>
                  
                  <div className="mt-6 flex gap-2">
                    <Button variant="primary" className="flex-1">
                      Use Template
                    </Button>
                    <Button variant="secondary">
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Features Section */}
        <FadeIn>
          <div className="rounded-lg bg-sky-50 p-6 dark:bg-sky-900/20">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Platform Features
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3">
                <QrCode className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">QR Code Integration</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Generate QR codes for instant digital access to handouts
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Smartphone className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Mobile Optimized</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Handouts optimized for mobile viewing and interaction
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <BarChart3 className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Analytics Dashboard</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Track usage, downloads, and patient engagement metrics
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Printer className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Print Ready</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Professional formatting for both digital and print distribution
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Globe className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Multi-language Support</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Create handouts in multiple languages for diverse patients
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Version Control</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Track changes and maintain updated medical information
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Recent Activity */}
        <FadeIn>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Recent Activity
            </h2>
            <div className="flow-root">
              <ul className="-mb-8">
                {recentActivity.map((activity, activityIdx) => (
                  <li key={activityIdx}>
                    <div className="relative pb-8">
                      {activityIdx !== recentActivity.length - 1 ? (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-700"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-sky-500 flex items-center justify-center ring-8 ring-white dark:ring-slate-900">
                            <FileText className="h-5 w-5 text-white" aria-hidden="true" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {activity.action} by{' '}
                              <span className="font-medium text-slate-900 dark:text-white">
                                {activity.user}
                              </span>
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-slate-500 dark:text-slate-400">
                            {activity.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FadeIn>

        {/* Getting Started */}
        <FadeIn>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Getting Started
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-sky-100 dark:bg-sky-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">1</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Choose from our library of medical handout templates
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-sky-100 dark:bg-sky-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">2</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Customize content with your practice information and branding
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-sky-100 dark:bg-sky-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">3</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Generate QR codes and distribute to patients digitally or in print
                </p>
              </div>
            </div>
            <div className="mt-6">
              <Button variant="primary">
                Create Your First Handout
              </Button>
            </div>
          </div>
        </FadeIn>
      </div>
    </HandoutsSyntaxLayout>
  )
}