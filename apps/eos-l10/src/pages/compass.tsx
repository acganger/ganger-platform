'use client'

import { EOSCompassLayout } from '@/components/compass/EOSCompassLayout'
import { Container } from '@/components/compass/Container'
import { Button } from '@/components/compass/Button'
import { FadeIn } from '@/components/compass/FadeIn'
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  CheckSquare, 
  Users, 
  Calendar,
  Award,
  ArrowUpRight,
  Clock,
  AlertTriangle
} from 'lucide-react'

const scorecardMetrics = [
  { name: 'Revenue', current: '$125K', target: '$120K', status: 'above' },
  { name: 'Customer Satisfaction', current: '94%', target: '90%', status: 'above' },
  { name: 'Employee Engagement', current: '87%', target: '85%', status: 'above' },
  { name: 'Safety Incidents', current: '2', target: '0', status: 'below' },
]

const rocks = [
  { title: 'Implement New CRM System', owner: 'Sarah Johnson', progress: 85, due: '2024-03-31' },
  { title: 'Launch Mobile App', owner: 'Mike Chen', progress: 60, due: '2024-04-15' },
  { title: 'Expand to West Coast', owner: 'Emily Rodriguez', progress: 40, due: '2024-06-30' },
]

const headlines = [
  { type: 'good', text: 'Closed $50K deal with major healthcare client' },
  { type: 'bad', text: 'Server downtime affected 200 users for 2 hours' },
  { type: 'good', text: 'New hire Sarah started in Marketing department' },
  { type: 'fyi', text: 'Office renovation begins next Monday' },
]

const todos = [
  { task: 'Review Q1 budget proposals', owner: 'Finance Team', priority: 'high' },
  { task: 'Update employee handbook', owner: 'HR', priority: 'medium' },
  { task: 'Schedule server maintenance', owner: 'IT', priority: 'high' },
  { task: 'Plan team building event', owner: 'Operations', priority: 'low' },
]

const issues = [
  { 
    title: 'High employee turnover in support', 
    discussion: 'Need to identify root causes and develop retention strategy',
    status: 'identified'
  },
  { 
    title: 'Customer onboarding taking too long', 
    discussion: 'Average time is 3 weeks, target is 1 week',
    status: 'discussed'
  },
  { 
    title: 'Website performance issues', 
    discussion: 'Page load times increased 40% since last update',
    status: 'solved'
  },
]

export default function CompassShowcase() {
  return (
    <EOSCompassLayout>
      <div className="space-y-8">
        <FadeIn>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">EOS L10 Meeting Dashboard</h1>
            <p className="text-blue-100 text-lg">
              Streamline your weekly Level 10 meetings with structured accountability and clear visibility.
            </p>
          </div>
        </FadeIn>

        {/* Scorecard Section */}
        <FadeIn>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Scorecard</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {scorecardMetrics.map((metric) => (
                <div key={metric.name} className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-600 mb-1">{metric.name}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-900">{metric.current}</div>
                    <div className={`flex items-center text-sm ${
                      metric.status === 'above' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <ArrowUpRight className={`h-4 w-4 ${
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

        {/* Rocks Section */}
        <FadeIn>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Target className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Rocks (90-Day Priorities)</h2>
            </div>
            <div className="space-y-4">
              {rocks.map((rock, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{rock.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {rock.due}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Owner: {rock.owner}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${rock.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{rock.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Headlines Section */}
        <FadeIn>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Headlines</h2>
            </div>
            <div className="space-y-3">
              {headlines.map((headline, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    headline.type === 'good' ? 'bg-green-500' :
                    headline.type === 'bad' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                  <span className="text-gray-900">{headline.text}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* To-Do List Section */}
        <FadeIn>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <CheckSquare className="h-6 w-6 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">To-Do List</h2>
            </div>
            <div className="space-y-3">
              {todos.map((todo, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                    <span className="text-gray-900">{todo.task}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{todo.owner}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      todo.priority === 'high' ? 'bg-red-100 text-red-800' :
                      todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {todo.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* IDS Section */}
        <FadeIn>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">IDS (Identify, Discuss, Solve)</h2>
            </div>
            <div className="space-y-4">
              {issues.map((issue, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{issue.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      issue.status === 'identified' ? 'bg-red-100 text-red-800' :
                      issue.status === 'discussed' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {issue.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{issue.discussion}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Meeting Actions */}
        <FadeIn>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">Meeting Actions</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">
                Start Weekly L10
              </Button>
              <Button variant="secondary">
                Export Meeting Notes
              </Button>
              <Button variant="outline">
                Schedule Next Meeting
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* Performance Summary */}
        <FadeIn>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <Award className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Weekly Performance</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">85%</div>
                <div className="text-sm text-gray-600">Goals Met</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">3</div>
                <div className="text-sm text-gray-600">Issues Resolved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">12</div>
                <div className="text-sm text-gray-600">Action Items</div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </EOSCompassLayout>
  )
}

// Force SSR to prevent auth context issues during build
export async function getServerSideProps() {
  return {
    props: {}
  };
}export const runtime = 'experimental-edge';
