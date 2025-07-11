'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { withAuthComponent } from '@ganger/auth/staff';
import { 
  AppLayout, 
  PageHeader, 
  Button, 
  Card, 
  StatCard,
  LoadingSpinner,
  Badge
} from '@ganger/ui';
import { CallMonitoringPanel } from '@/components/dashboard/CallMonitoringPanel';
import { ActiveCallsGrid } from '@/components/dashboard/ActiveCallsGrid';
import { DemoScenarioPanel } from '@/components/demo/DemoScenarioPanel';
import { SystemHealthIndicator } from '@/components/monitoring/SystemHealthIndicator';
import { useDemoData } from '@/hooks/useDemoData';
import { useRealtimeCallUpdates } from '@/hooks/useRealtimeCallUpdates';

const AIReceptionistDashboard: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'live' | 'demo' | 'analytics'>('live');
  const [isLoading, setIsLoading] = useState(true);
  
  // Demo data and real-time updates
  const { metrics, activeCalls, callHistory, demoScenarios } = useDemoData();
  const { liveUpdates, systemHealth } = useRealtimeCallUpdates();

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-slate-600">Initializing AI Receptionist Demo...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="AI Receptionist Demo"
        subtitle="Real-time call monitoring and AI conversation management"
        actions={
          <div className="flex items-center gap-4">
            <SystemHealthIndicator health={systemHealth} />
            <div className="flex bg-slate-100 rounded-lg p-1">
              <Button
                variant={selectedView === 'live' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedView('live')}
              >
                Live Monitoring
              </Button>
              <Button
                variant={selectedView === 'demo' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedView('demo')}
              >
                Demo Scenarios
              </Button>
              <Button
                variant={selectedView === 'analytics' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedView('analytics')}
              >
                Analytics
              </Button>
            </div>
          </div>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Calls"
          value={metrics.active_calls}
          trend={metrics.active_calls > 0 ? { value: 12, direction: 'up' } : undefined}
        />
        <StatCard
          title="AI Resolution Rate"
          value={`${metrics.ai_resolution_rate}%`}
          trend={{ value: 5.2, direction: 'up' }}
        />
        <StatCard
          title="Avg Call Duration"
          value={`${metrics.average_call_duration}s`}
          trend={{ value: 8.1, direction: 'down' }}
        />
        <StatCard
          title="Patient Satisfaction"
          value={`${metrics.patient_satisfaction}/5.0`}
          trend={{ value: 0.3, direction: 'up' }}
        />
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {selectedView === 'live' && (
          <>
            {/* Active Calls Grid */}
            <Card title="Active Calls" className="mb-6">
              <ActiveCallsGrid 
                calls={activeCalls} 
                liveUpdates={liveUpdates}
                onTransferCall={(callId, reason) => {
                  console.log('Transfer call:', callId, reason);
                  // Demo transfer logic
                }}
                onEmergencyEscalate={(callId) => {
                  console.log('Emergency escalation:', callId);
                  // Demo emergency logic
                }}
              />
            </Card>

            {/* Call Monitoring Panel */}
            <CallMonitoringPanel 
              activeCalls={activeCalls}
              onSelectCall={(callId) => {
                console.log('Selected call for monitoring:', callId);
              }}
            />

            {/* Recent Call History */}
            <Card title="Recent Call History">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Caller</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">AI Confidence</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {callHistory.slice(0, 10).map((call) => (
                      <tr key={call.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {new Date(call.started_at).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-slate-900">{call.caller_name || 'Unknown'}</div>
                          <div className="text-xs text-slate-500">{call.caller_phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">{call.location}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={
                            call.call_status === 'active' ? 'bg-ai-active text-white' :
                            call.call_status === 'completed' ? 'bg-slate-500 text-white' :
                            call.call_status === 'transferred' ? 'bg-human-transfer text-white' :
                            'bg-red-500 text-white'
                          }>
                            {call.call_status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {call.ai_confidence_score ? (
                            <span className={`font-medium ${
                              call.ai_confidence_score >= 0.8 ? 'text-ai-confident' :
                              call.ai_confidence_score >= 0.6 ? 'text-ai-uncertain' :
                              'text-red-600'
                            }`}>
                              {(call.ai_confidence_score * 100).toFixed(0)}%
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {call.duration_seconds ? (
                            `${Math.floor(call.duration_seconds / 60)}:${(call.duration_seconds % 60).toString().padStart(2, '0')}`
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {selectedView === 'demo' && (
          <DemoScenarioPanel 
            scenarios={demoScenarios}
            onRunScenario={(scenario) => {
              console.log('Running demo scenario:', scenario.name);
              // Demo scenario execution logic
            }}
          />
        )}

        {selectedView === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Performance Trends">
              <div className="h-64 flex items-center justify-center text-slate-500">
                Performance charts would be displayed here
                <br />
                (Using Chart.js or similar in production)
              </div>
            </Card>
            
            <Card title="Intent Analysis">
              <div className="space-y-4">
                {Object.entries(metrics.calls_by_status).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="capitalize">{status}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </Card>
            
            <Card title="Location Distribution">
              <div className="space-y-4">
                {Object.entries(metrics.calls_by_location).map(([location, count]) => (
                  <div key={location} className="flex justify-between items-center">
                    <span>{location}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </Card>
            
            <Card title="Recent Performance">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Success Rate</span>
                  <span className="font-medium text-ai-confident">
                    {metrics.recent_performance.success_rate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Avg Confidence</span>
                  <span className="font-medium text-ai-confident">
                    {(metrics.recent_performance.avg_confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Escalations</span>
                  <span className="font-medium text-human-transfer">
                    {metrics.recent_performance.escalations}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default withAuthComponent(AIReceptionistDashboard, {
  requiredRoles: ['staff', 'manager', 'superadmin']
});