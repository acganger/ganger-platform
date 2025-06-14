'use client'

import { ComplianceCompassLayout } from '@/components/compass/ComplianceCompassLayout'
import { Container } from '@/components/compass/Container'
import { Button } from '@/components/compass/Button'
import { FadeIn } from '@/components/compass/FadeIn'
import { 
  BookOpen, 
  Target, 
  Award, 
  CheckSquare, 
  Users, 
  Calendar,
  Shield,
  AlertTriangle,
  TrendingUp,
  Clock,
  FileText,
  BarChart3
} from 'lucide-react'

const complianceMetrics = [
  { name: 'Overall Compliance', current: '94%', target: '95%', status: 'warning' },
  { name: 'Training Completion', current: '87%', target: '90%', status: 'warning' },
  { name: 'Certifications Current', current: '96%', target: '95%', status: 'above' },
  { name: 'Overdue Trainings', current: '8', target: '0', status: 'below' },
]

const trainingModules = [
  { 
    title: 'HIPAA Privacy & Security', 
    completion: 92, 
    due: '2024-03-31', 
    required: true,
    category: 'Healthcare Compliance'
  },
  { 
    title: 'Infection Control Protocols', 
    completion: 78, 
    due: '2024-02-15', 
    required: true,
    category: 'Safety'
  },
  { 
    title: 'Emergency Response Procedures', 
    completion: 85, 
    due: '2024-04-30', 
    required: true,
    category: 'Emergency Preparedness'
  },
  { 
    title: 'DEA Compliance Training', 
    completion: 67, 
    due: '2024-01-31', 
    required: true,
    category: 'Regulatory'
  },
]

const upcomingAssessments = [
  { type: 'quiz', title: 'HIPAA Knowledge Check', due: '2024-01-20', participants: 45 },
  { type: 'practical', title: 'Emergency Drill Assessment', due: '2024-01-25', participants: 23 },
  { type: 'certification', title: 'CPR Recertification', due: '2024-02-01', participants: 12 },
  { type: 'audit', title: 'Documentation Review', due: '2024-02-10', participants: 8 },
]

const recentActivity = [
  { type: 'completion', text: 'Sarah Johnson completed HIPAA training', time: '5 minutes ago' },
  { type: 'overdue', text: 'Mike Rodriguez - Infection Control overdue', time: '1 hour ago' },
  { type: 'certification', text: 'Dr. Chen renewed Medical License', time: '2 hours ago' },
  { type: 'incident', text: 'New compliance incident reported', time: '3 hours ago' },
]

const departmentStatus = [
  { 
    name: 'Dermatology', 
    compliance: 98, 
    staff: 12, 
    overdue: 0,
    status: 'excellent'
  },
  { 
    name: 'Nursing', 
    compliance: 91, 
    staff: 25, 
    overdue: 3,
    status: 'good'
  },
  { 
    name: 'Administration', 
    compliance: 89, 
    staff: 8, 
    overdue: 2,
    status: 'needs_attention'
  },
  { 
    name: 'Maintenance', 
    compliance: 85, 
    staff: 6, 
    overdue: 1,
    status: 'needs_attention'
  },
]

export default function ComplianceCompassShowcase() {
  return (
    <ComplianceCompassLayout>
      <div className="space-y-8">
        <FadeIn>
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-lg p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Compliance Training Dashboard</h1>
            <p className="text-blue-100 text-lg">
              Comprehensive training management system ensuring regulatory compliance and staff readiness.
            </p>
          </div>
        </FadeIn>

        {/* Compliance Metrics */}
        <FadeIn>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Target className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Compliance Scorecard</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {complianceMetrics.map((metric) => (
                <div key={metric.name} className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-600 mb-1">{metric.name}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-900">{metric.current}</div>
                    <div className={`flex items-center text-sm ${
                      metric.status === 'above' ? 'text-green-600' : 
                      metric.status === 'warning' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      <TrendingUp className={`h-4 w-4 ${
                        metric.status === 'below' ? 'rotate-180' : ''
                      }`} />
                      Target: {metric.target}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Training Modules */}
        <FadeIn>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Active Training Modules</h2>
            </div>
            <div className="space-y-4">
              {trainingModules.map((module, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{module.title}</h3>
                      <p className="text-sm text-gray-600">{module.category}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      Due: {module.due}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            module.completion >= 90 ? 'bg-green-600' :
                            module.completion >= 75 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${module.completion}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{module.completion}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {module.required && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          Required
                        </span>
                      )}
                      <Button variant="outline" className="text-xs">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Department Compliance Status */}
        <FadeIn>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Department Compliance</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departmentStatus.map((dept, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{dept.name}</h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      dept.status === 'excellent' ? 'bg-green-100 text-green-800' :
                      dept.status === 'good' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {dept.compliance}% Compliant
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Staff Count:</span>
                      <span>{dept.staff}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overdue Trainings:</span>
                      <span className={dept.overdue > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                        {dept.overdue}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Upcoming Assessments */}
        <FadeIn>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <CheckSquare className="h-6 w-6 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Assessments</h2>
            </div>
            <div className="space-y-3">
              {upcomingAssessments.map((assessment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      assessment.type === 'quiz' ? 'bg-blue-500' :
                      assessment.type === 'practical' ? 'bg-green-500' :
                      assessment.type === 'certification' ? 'bg-purple-500' :
                      'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{assessment.title}</p>
                      <p className="text-sm text-gray-600">{assessment.participants} participants • Due {assessment.due}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="text-xs">
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Recent Activity */}
        <FadeIn>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'completion' ? 'bg-green-500' :
                    activity.type === 'overdue' ? 'bg-red-500' :
                    activity.type === 'certification' ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-gray-900">{activity.text}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Quick Actions */}
        <FadeIn>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="primary" className="h-16 flex-col gap-2">
                <BookOpen className="h-5 w-5" />
                Create Training
              </Button>
              <Button variant="secondary" className="h-16 flex-col gap-2">
                <FileText className="h-5 w-5" />
                Generate Report
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2">
                <Shield className="h-5 w-5" />
                Audit Compliance
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2">
                <Award className="h-5 w-5" />
                Manage Certificates
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* Compliance Alerts */}
        <FadeIn>
          <div className="bg-gradient-to-r from-red-50 to-yellow-50 rounded-lg p-6 border border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">Compliance Alerts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">Overdue Trainings</h3>
                <p className="text-sm text-gray-600 mb-3">
                  8 staff members have overdue mandatory training requirements.
                </p>
                <Button variant="outline" className="w-full text-sm">
                  Send Reminders
                </Button>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">Expiring Certifications</h3>
                <p className="text-sm text-gray-600 mb-3">
                  5 professional certifications expire within 30 days.
                </p>
                <Button variant="outline" className="w-full text-sm">
                  Review Expirations
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Training Calendar */}
        <FadeIn>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Training Calendar</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">12</div>
                <div className="text-sm text-gray-600">Sessions This Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">45</div>
                <div className="text-sm text-gray-600">Participants Enrolled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">3</div>
                <div className="text-sm text-gray-600">New Modules Available</div>
              </div>
            </div>
            <div className="mt-6">
              <Button variant="primary" className="w-full">
                View Full Calendar
              </Button>
            </div>
          </div>
        </FadeIn>
      </div>
    </ComplianceCompassLayout>
  )
}