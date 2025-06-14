'use client'

import { ClinicalProtocolLayout } from '@/components/protocol/ClinicalProtocolLayout'
import { Container } from '@/components/protocol/Container'
import { Button } from '@/components/protocol/Button'
import { FadeIn } from '@/components/protocol/FadeIn'
import { 
  Users, 
  Calendar, 
  Clock, 
  UserCheck, 
  AlertTriangle, 
  BarChart3,
  TrendingUp,
  Shield,
  Briefcase,
  CheckCircle,
  XCircle,
  Activity,
  Award
} from 'lucide-react'

const staffMetrics = [
  { name: 'Total Staff', value: '127', change: '+12%', changeType: 'positive' },
  { name: 'On Duty', value: '24', change: '100%', changeType: 'neutral' },
  { name: 'Available', value: '21', change: '+5%', changeType: 'positive' },
  { name: 'Overtime Hours', value: '45', change: '-15%', changeType: 'positive' },
]

const recentActivity = [
  {
    type: 'assignment',
    user: 'Dr. Sarah Johnson',
    action: 'Assigned to Emergency Department',
    time: '10 minutes ago',
    status: 'active'
  },
  {
    type: 'credential',
    user: 'Nurse Mike Rodriguez',
    action: 'BLS certification renewed',
    time: '25 minutes ago',
    status: 'completed'
  },
  {
    type: 'schedule',
    user: 'Tech Amanda Chen',
    action: 'Shift swap approved',
    time: '1 hour ago',
    status: 'completed'
  },
  {
    type: 'incident',
    user: 'Dr. James Wilson',
    action: 'Reported equipment malfunction',
    time: '2 hours ago',
    status: 'pending'
  },
]

const departments = [
  {
    name: 'Emergency Department',
    staffed: 8,
    required: 10,
    utilization: 80,
    status: 'understaffed'
  },
  {
    name: 'Dermatology',
    staffed: 6,
    required: 6,
    utilization: 100,
    status: 'optimal'
  },
  {
    name: 'Surgery',
    staffed: 4,
    required: 3,
    utilization: 133,
    status: 'overstaffed'
  },
  {
    name: 'Radiology',
    staffed: 3,
    required: 4,
    utilization: 75,
    status: 'understaffed'
  },
]

const upcomingShifts = [
  {
    staff: 'Dr. Emily Davis',
    role: 'Dermatologist',
    department: 'Dermatology',
    time: '8:00 AM - 5:00 PM',
    date: 'Today',
    status: 'confirmed'
  },
  {
    staff: 'Nurse Tom Wilson',
    role: 'RN',
    department: 'Emergency',
    time: '12:00 PM - 8:00 PM',
    date: 'Today',
    status: 'confirmed'
  },
  {
    staff: 'Tech Lisa Brown',
    role: 'Medical Tech',
    department: 'Radiology',
    time: '6:00 AM - 2:00 PM',
    date: 'Tomorrow',
    status: 'pending'
  },
]

const credentials = [
  {
    type: 'BLS Certification',
    expiring: 3,
    expired: 0,
    total: 45,
    urgency: 'medium'
  },
  {
    type: 'Medical License',
    expiring: 1,
    expired: 0,
    total: 12,
    urgency: 'high'
  },
  {
    type: 'DEA Registration',
    expiring: 0,
    expired: 0,
    total: 8,
    urgency: 'low'
  },
  {
    type: 'Specialty Certifications',
    expiring: 2,
    expired: 1,
    total: 23,
    urgency: 'medium'
  },
]

export default function ProtocolShowcase() {
  return (
    <ClinicalProtocolLayout>
      <div className="space-y-8">
        <FadeIn>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Clinical Staffing Dashboard
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Comprehensive staffing management for optimal patient care and operational efficiency.
            </p>
          </div>
        </FadeIn>

        {/* Key Metrics */}
        <FadeIn>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {staffMetrics.map((metric) => (
              <div
                key={metric.name}
                className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow ring-1 ring-gray-900/5 sm:px-6"
              >
                <dt>
                  <div className="absolute rounded-md bg-blue-500 p-3">
                    <Users className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-500">
                    {metric.name}
                  </p>
                </dt>
                <dd className="ml-16 flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                  <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                    metric.changeType === 'positive' ? 'text-green-600' :
                    metric.changeType === 'negative' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {metric.change}
                  </p>
                </dd>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Department Status */}
        <FadeIn>
          <div className="bg-white shadow ring-1 ring-gray-900/5 rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Department Staffing Status
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                {departments.map((dept) => (
                  <div key={dept.name} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        dept.status === 'optimal' ? 'bg-green-500' :
                        dept.status === 'understaffed' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{dept.name}</p>
                        <p className="text-sm text-gray-500">
                          {dept.staffed}/{dept.required} staff • {dept.utilization}% utilization
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        dept.status === 'optimal' ? 'bg-green-100 text-green-800' :
                        dept.status === 'understaffed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {dept.status}
                      </span>
                      <Button variant="outline" className="text-xs">
                        Adjust
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Quick Actions */}
        <FadeIn>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Button href="/staff/add" variant="primary" className="h-20 flex-col gap-2">
              <Users className="h-6 w-6" />
              Add Staff Member
            </Button>
            <Button href="/schedule/create" variant="secondary" className="h-20 flex-col gap-2">
              <Calendar className="h-6 w-6" />
              Create Schedule
            </Button>
            <Button href="/assignments/new" variant="outline" className="h-20 flex-col gap-2">
              <Briefcase className="h-6 w-6" />
              New Assignment
            </Button>
            <Button href="/reports/generate" variant="ghost" className="h-20 flex-col gap-2">
              <BarChart3 className="h-6 w-6" />
              Generate Report
            </Button>
          </div>
        </FadeIn>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Shifts */}
          <FadeIn>
            <div className="bg-white shadow ring-1 ring-gray-900/5 rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming Shifts
                </h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  {upcomingShifts.map((shift, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">{shift.staff}</p>
                        <p className="text-sm text-gray-500">{shift.role} • {shift.department}</p>
                        <p className="text-sm text-gray-500">{shift.time} • {shift.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {shift.status === 'confirmed' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                        <span className={`text-xs font-medium ${
                          shift.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {shift.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Recent Activity */}
          <FadeIn>
            <div className="bg-white shadow ring-1 ring-gray-900/5 rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </h3>
              </div>
              <div className="px-6 py-4">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {recentActivity.map((activity, activityIdx) => (
                      <li key={activityIdx}>
                        <div className="relative pb-8">
                          {activityIdx !== recentActivity.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                activity.type === 'assignment' ? 'bg-blue-500' :
                                activity.type === 'credential' ? 'bg-green-500' :
                                activity.type === 'schedule' ? 'bg-purple-500' :
                                'bg-red-500'
                              }`}>
                                {activity.type === 'assignment' && <Briefcase className="h-5 w-5 text-white" />}
                                {activity.type === 'credential' && <Award className="h-5 w-5 text-white" />}
                                {activity.type === 'schedule' && <Calendar className="h-5 w-5 text-white" />}
                                {activity.type === 'incident' && <AlertTriangle className="h-5 w-5 text-white" />}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">
                                  <span className="font-medium text-gray-900">{activity.user}</span>{' '}
                                  {activity.action}
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
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
            </div>
          </FadeIn>
        </div>

        {/* Credentials Status */}
        <FadeIn>
          <div className="bg-white shadow ring-1 ring-gray-900/5 rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Credential Management
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {credentials.map((cred) => (
                  <div key={cred.type} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{cred.type}</h4>
                      <div className={`w-3 h-3 rounded-full ${
                        cred.urgency === 'high' ? 'bg-red-500' :
                        cred.urgency === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Total: {cred.total}</p>
                      <p className="text-yellow-600">Expiring: {cred.expiring}</p>
                      {cred.expired > 0 && (
                        <p className="text-red-600">Expired: {cred.expired}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Protocol Documentation */}
        <FadeIn>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Staffing Protocols</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">Emergency Response</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Protocols for rapid staff deployment during emergencies and critical situations.
                </p>
                <Button variant="outline" className="w-full text-sm">
                  View Protocol
                </Button>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">Credential Management</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Guidelines for maintaining current certifications and professional licenses.
                </p>
                <Button variant="outline" className="w-full text-sm">
                  View Protocol
                </Button>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">Shift Coverage</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Procedures for ensuring adequate coverage during shift changes and breaks.
                </p>
                <Button variant="outline" className="w-full text-sm">
                  View Protocol
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </ClinicalProtocolLayout>
  )
}