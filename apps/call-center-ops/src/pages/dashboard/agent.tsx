'use client'

import { useState, useEffect } from 'react';
import { useAuth, withAuthComponent } from '@ganger/auth';
import { 
  AppLayout, 
  PageHeader, 
  Card, 
  Button, 
  DataTable,
  StatCard,
  LoadingSpinner
} from '@ganger/ui';
// Temporary local implementations until @ganger/utils is available
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString();
import type { CallRecord, PerformanceMetrics, GoalProgress } from '../../types';

interface AgentDashboardData {
  performanceMetrics: PerformanceMetrics;
  goalProgress: GoalProgress[];
  recentCalls: CallRecord[];
  coachingFeedback: any[];
  isLoading: boolean;
}

function AgentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<AgentDashboardData>({
    performanceMetrics: {} as PerformanceMetrics,
    goalProgress: [],
    recentCalls: [],
    coachingFeedback: [],
    isLoading: true
  });

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [metricsRes, callsRes] = await Promise.all([
        fetch(`/api/performance/agent-metrics?role=agent&agent_id=${user?.email}`),
        fetch('/api/call-records/simple?limit=10')
      ]);

      const [metrics, calls] = await Promise.all([
        metricsRes.json(),
        callsRes.json()
      ]);

      setData({
        performanceMetrics: metrics.data?.current || {},
        recentCalls: calls.data || [],
        goalProgress: metrics.data?.weekly_trend || [],
        coachingFeedback: [],
        isLoading: false
      });
    } catch (error) {
      setData(prev => ({ ...prev, isLoading: false }));
    }
  };

  if (data.isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  const callColumns = [
    {
      key: 'caller_name',
      header: 'Caller',
      sortable: true,
      render: (row: CallRecord) => row.caller_name || 'Unknown'
    },
    {
      key: 'call_start_time',
      header: 'Time',
      sortable: true,
      render: (row: CallRecord) => formatTime(row.call_start_time)
    },
    {
      key: 'call_outcome',
      header: 'Outcome',
      render: (row: CallRecord) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
          row.call_outcome === 'appointment_scheduled' ? 'bg-green-100 text-green-800' :
          row.call_outcome === 'information_provided' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.call_outcome?.replace('_', ' ') || 'No outcome'}
        </span>
      )
    },
    {
      key: 'talk_duration_seconds',
      header: 'Duration',
      render: (row: CallRecord) => {
        const minutes = Math.floor((row.talk_duration_seconds || 0) / 60);
        const seconds = (row.talk_duration_seconds || 0) % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
  ];

  return (
    <AppLayout>
      <PageHeader 
        title="Agent Dashboard" 
        subtitle={`Welcome back, ${user?.user_metadata?.full_name || user?.email || 'Agent'}`}
        actions={
          <div className="flex space-x-3">
            <Button 
              variant="primary" 
              onClick={() => window.location.href = '/calls/journal'}
            >
              📝 Log Call
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/calls/history'}
            >
              📞 Call History
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Performance Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Calls Today"
            value={data.performanceMetrics.calls_today || 0}
            trend={data.performanceMetrics.calls_trend && data.performanceMetrics.calls_trend !== 'neutral' ? {
              value: data.performanceMetrics.calls_change || 0,
              direction: data.performanceMetrics.calls_trend as 'up' | 'down'
            } : undefined}
            icon="phone"
          />
          <StatCard
            title="Avg Call Time"
            value={`${Math.round((data.performanceMetrics.avg_call_time || 0) / 60)}m`}
            trend={data.performanceMetrics.time_trend && data.performanceMetrics.time_trend !== 'neutral' ? {
              value: data.performanceMetrics.time_change || 0,
              direction: data.performanceMetrics.time_trend as 'up' | 'down'
            } : undefined}
            icon="clock"
          />
          <StatCard
            title="Quality Score"
            value={`${data.performanceMetrics.quality_score || 0}%`}
            trend={data.performanceMetrics.quality_trend && data.performanceMetrics.quality_trend !== 'neutral' ? {
              value: data.performanceMetrics.quality_change || 0,
              direction: data.performanceMetrics.quality_trend as 'up' | 'down'
            } : undefined}
            icon="star"
          />
          <StatCard
            title="Appointments"
            value={data.performanceMetrics.appointments_today || 0}
            trend={data.performanceMetrics.appointments_trend && data.performanceMetrics.appointments_trend !== 'neutral' ? {
              value: data.performanceMetrics.appointments_change || 0,
              direction: data.performanceMetrics.appointments_trend as 'up' | 'down'
            } : undefined}
            icon="calendar"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Goal Progress */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Goal Progress</h3>
            <div className="space-y-4">
              {data.goalProgress.map((goal, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-neutral-700">
                      {goal.title}
                    </span>
                    <span className="text-sm text-neutral-600">
                      {goal.current}/{goal.target}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        goal.progress >= 100 ? 'bg-green-600' :
                        goal.progress >= 80 ? 'bg-blue-600' :
                        goal.progress >= 60 ? 'bg-amber-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-neutral-500">
                    {goal.progress.toFixed(1)}% complete
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Daily Performance</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            </div>
          </Card>
        </div>

        {/* Recent Calls */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-neutral-900">Recent Calls</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/calls/history'}
            >
              View All
            </Button>
          </div>
          <DataTable
            data={data.recentCalls}
            columns={callColumns}
          />
        </Card>

        {/* Coaching Feedback */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Recent Coaching Feedback</h3>
          {data.coachingFeedback.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <p>No recent coaching feedback available.</p>
              <p className="text-sm mt-2">Keep up the great work!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.coachingFeedback.map((feedback, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {feedback.title}
                      </p>
                      <p className="text-sm text-neutral-600 mt-1">
                        {feedback.content}
                      </p>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {formatDate(feedback.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}

export default withAuthComponent(AgentDashboard, {
  requiredRoles: ['staff', 'manager', 'superadmin']
});