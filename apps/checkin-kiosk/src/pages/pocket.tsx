'use client'

import { CheckinPocketLayout } from '@/components/pocket/CheckinPocketLayout'
import { Container } from '@/components/pocket/Container'
import { Button } from '@/components/pocket/Button'
import { FadeIn } from '@/components/pocket/FadeIn'
import { 
  Clock, 
  CreditCard, 
  FileText, 
  Shield, 
  Users,
  CheckCircle,
  Phone,
  Printer,
  QrCode,
  Smartphone,
  Calendar,
  AlertTriangle
} from 'lucide-react'

const quickActions = [
  {
    title: 'Check In',
    description: 'Start your appointment check-in process',
    icon: CheckCircle,
    href: '/checkin',
    color: 'bg-green-500',
    urgent: false
  },
  {
    title: 'Update Insurance',
    description: 'Verify or update your insurance information',
    icon: Shield,
    href: '/insurance',
    color: 'bg-blue-500',
    urgent: false
  },
  {
    title: 'Make Payment',
    description: 'Pay your copay or outstanding balance',
    icon: CreditCard,
    href: '/payment',
    color: 'bg-purple-500',
    urgent: false
  },
  {
    title: 'Emergency',
    description: 'Alert staff for urgent medical attention',
    icon: AlertTriangle,
    href: '/emergency',
    color: 'bg-red-500',
    urgent: true
  }
]

const features = [
  {
    name: 'Quick Check-In',
    description: 'Fast and easy appointment check-in with barcode scanning.',
    icon: QrCode,
  },
  {
    name: 'Insurance Verification',
    description: 'Real-time insurance verification and eligibility checking.',
    icon: Shield,
  },
  {
    name: 'Secure Payments',
    description: 'PCI-compliant payment processing for copays and balances.',
    icon: CreditCard,
  },
  {
    name: 'Digital Forms',
    description: 'Complete intake forms and consents digitally.',
    icon: FileText,
  },
  {
    name: 'Appointment Management',
    description: 'View, reschedule, or cancel upcoming appointments.',
    icon: Calendar,
  },
  {
    name: '24/7 Support',
    description: 'Get help anytime with our integrated support system.',
    icon: Phone,
  },
]

const stats = [
  { name: 'Average Check-in Time', value: '2.3 min', unit: 'minutes' },
  { name: 'Patient Satisfaction', value: '98%', unit: 'rating' },
  { name: 'Daily Check-ins', value: '450+', unit: 'patients' },
  { name: 'Success Rate', value: '99.8%', unit: 'uptime' },
]

export default function PocketShowcase() {
  return (
    <CheckinPocketLayout>
      <div className="pt-20 pb-16">
        {/* Hero Section */}
        <Container>
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Welcome to Ganger Dermatology
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Streamline your visit with our self-service check-in kiosk. 
                Quick, secure, and designed for your convenience.
              </p>
            </div>
          </FadeIn>
        </Container>

        {/* Quick Actions Grid */}
        <Container className="mt-16">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Quick Actions
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Choose what you'd like to do today
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => (
                <div
                  key={action.title}
                  className={`relative overflow-hidden rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-200 hover:ring-gray-300 transition-all duration-200 hover:scale-105 ${
                    action.urgent ? 'ring-red-200 hover:ring-red-300' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${action.color}`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {action.title}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-600">
                    {action.description}
                  </p>
                  <div className="mt-6">
                    <Button 
                      href={action.href} 
                      color={action.urgent ? 'blue' : 'slate'}
                      className="w-full"
                    >
                      {action.urgent ? 'Get Help Now' : 'Start'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </Container>

        {/* Stats Section */}
        <Container className="mt-20">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Trusted by thousands of patients
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.name} className="text-center">
                  <div className="text-4xl font-bold text-blue-600">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-lg font-medium text-gray-900">
                    {stat.name}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </Container>

        {/* Features Section */}
        <Container className="mt-20">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Everything you need for a smooth visit
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Our kiosk provides comprehensive self-service options to enhance your experience.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="mt-6 text-lg font-medium text-gray-900">
                    {feature.name}
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>
        </Container>

        {/* Current Status */}
        <Container className="mt-20">
          <FadeIn>
            <div className="rounded-2xl bg-blue-50 p-8">
              <div className="mx-auto max-w-2xl text-center">
                <Clock className="mx-auto h-12 w-12 text-blue-600" />
                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                  Current Wait Time: 15 minutes
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  Dr. Ganger is currently seeing patients. Your estimated wait time may vary based on appointment complexity.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <Button href="/checkin" color="blue">
                    Check In Now
                  </Button>
                  <Button href="/reschedule" variant="outline">
                    Reschedule Appointment
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>
        </Container>

        {/* Contact Information */}
        <Container className="mt-20">
          <FadeIn>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm ring-1 ring-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Need Assistance?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-600">(555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-600">Front desk assistance available</span>
                  </div>
                </div>
                <div className="mt-6">
                  <Button href="/help" variant="outline" className="w-full">
                    Get Help
                  </Button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm ring-1 ring-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Office Information
                </h3>
                <div className="space-y-2 text-gray-600">
                  <p>123 Medical Drive</p>
                  <p>Suite 200</p>
                  <p>Healthcare City, HC 12345</p>
                </div>
                <div className="mt-6">
                  <Button href="/directions" variant="outline" className="w-full">
                    Get Directions
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>
        </Container>

        {/* Emergency Notice */}
        <Container className="mt-12">
          <FadeIn>
            <div className="rounded-2xl bg-red-50 border border-red-200 p-6">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900">
                    Medical Emergency?
                  </h3>
                  <p className="text-red-700">
                    If you are experiencing a medical emergency, please call 911 or go to the nearest emergency room immediately.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </Container>
      </div>
    </CheckinPocketLayout>
  )
}