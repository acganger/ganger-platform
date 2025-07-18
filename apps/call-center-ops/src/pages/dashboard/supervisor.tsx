'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useStaffAuth } from '@ganger/auth/staff';
import { withAuthComponent } from '@ganger/auth';
import { 
  AppLayout, 
  PageHeader, 
  Button, 
  StatCard,
  LoadingSpinner
} from '@ganger/ui';
import { DataTable, Modal, FormField } from '@ganger/ui-catalyst';
import { Card } from '@ganger/ui-catalyst';
import { Input, Select } from '@ganger/ui-catalyst';
// Temporary local implementations until @ganger/utils is available
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString();
import type { TeamMetrics, CallRecord, JournalEntry, AgentStatus } from '../../types';

interface SupervisorDashboardData {
  teamMetrics: TeamMetrics;
  activeAgents: AgentStatus[];
  pendingReviews: JournalEntry[];
  recentCalls: CallRecord[];
  isLoading: boolean;
}

function SupervisorDashboard() {
  const { user } = useStaffAuth();
  const [data, setData] = useState<SupervisorDashboardData>({
    teamMetrics: {} as TeamMetrics,
    activeAgents: [],
    pendingReviews: [],
    recentCalls: [],
    isLoading: true
  });
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates every 15 seconds for supervisor view
    const interval = setInterval(loadDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [metricsRes, reviewsRes, callsRes] = await Promise.all([
        fetch('/api/analytics/team-metrics?role=supervisor'),
        fetch('/api/call-journals/simple?status=submitted&limit=20'),
        fetch('/api/call-records/simple?limit=20')
      ]);

      const [metrics, reviews, calls] = await Promise.all([
        metricsRes.json(),
        reviewsRes.json(),
        callsRes.json()
      ]);

      setData({
        teamMetrics: metrics.data?.team_summary || {},
        activeAgents: metrics.data?.agent_status || [],
        pendingReviews: reviews.data || [],
        recentCalls: calls.data || [],
        isLoading: false
      });
    } catch (error) {
      setData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleReviewJournal = (journal: JournalEntry) => {
    setSelectedJournal(journal);
    setShowReviewModal(true);
  };

  const submitReview = async (reviewData: any) => {
    try {
      await fetch(`/api/journals/${selectedJournal?.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });
      
      setShowReviewModal(false);
      setSelectedJournal(null);
      loadDashboardData(); // Refresh data
    } catch (error) {
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

  const agentColumns = [
    {
      key: 'agent_name',
      header: 'Agent',
      sortable: true
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: AgentStatus) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
          row.status === 'available' ? 'bg-green-100 text-green-800' :
          row.status === 'on_call' ? 'bg-blue-100 text-blue-800' :
          row.status === 'break' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      key: 'calls_today',
      header: 'Calls Today',
      sortable: true
    },
    {
      key: 'avg_call_time',
      header: 'Avg Call Time',
      render: (row: AgentStatus) => `${Math.round((row.avg_call_time || 0) / 60)}m`
    },
    {
      key: 'quality_score',
      header: 'Quality Score',
      render: (row: AgentStatus) => `${row.quality_score || 0}%`
    }
  ];

  const reviewColumns = [
    {
      key: 'agent_name',
      header: 'Agent',
      sortable: true
    },
    {
      key: 'call_summary',
      header: 'Call Summary',
      render: (row: JournalEntry) => (
        <div className="max-w-xs truncate">
          {row.call_summary}
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Submitted',
      render: (row: JournalEntry) => formatDate(row.created_at)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: JournalEntry) => (
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => handleReviewJournal(row)}
        >
          Review
        </Button>
      )
    }
  ];

  return (
    <AppLayout>
      <PageHeader 
        title="Supervisor Dashboard" 
        subtitle="Team monitoring and quality assurance"
      />
      
      <div className="flex justify-end space-x-3 mb-6">
        <Button 
          variant="primary" 
          onClick={() => window.location.href = '/performance/team'}
        >
          📊 Team Reports
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/management/goals'}
        >
          🎯 Manage Goals
        </Button>
      </div>

      <div className="space-y-6">
        {/* Team Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Active Agents"
            value={data.activeAgents.filter(a => a.status === 'available' || a.status === 'on_call').length}
            icon="users"
          />
          <StatCard
            title="Calls Today"
            value={data.teamMetrics.total_calls_today || 0}
            trend={{
              value: 5.2,
              direction: 'up'
            }}
            icon="phone"
          />
          <StatCard
            title="Avg Quality Score"
            value={`${data.teamMetrics.avg_quality_score || 0}%`}
            trend={{
              value: 1.3,
              direction: 'up'
            }}
            icon="star"
          />
          <StatCard
            title="Pending Reviews"
            value={data.pendingReviews.length}
            trend={{
              value: 2,
              direction: 'down'
            }}
            icon="clipboard"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Team Performance Trends</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500">Team performance trends chart will be displayed here</p>
            </div>
          </Card>

          {/* Call Queue Status */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Call Queue Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-green-900">Ann Arbor</div>
                  <div className="text-sm text-green-700">2 calls waiting</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-900">1:23</div>
                  <div className="text-xs text-green-700">avg wait</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-medium text-blue-900">Wixom</div>
                  <div className="text-sm text-blue-700">5 calls waiting</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-900">2:45</div>
                  <div className="text-xs text-blue-700">avg wait</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                <div>
                  <div className="font-medium text-amber-900">Plymouth</div>
                  <div className="text-sm text-amber-700">8 calls waiting</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-900">4:12</div>
                  <div className="text-xs text-amber-700">avg wait</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Agent Status Grid */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-neutral-900">Agent Status</h3>
            <div className="flex space-x-2">
              <Select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
              >
                <option value="">All Agents</option>
                {data.activeAgents.map(agent => (
                  <option key={agent.agent_email} value={agent.agent_email}>
                    {agent.agent_name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <DataTable
            data={data.activeAgents.filter(agent => 
              !selectedAgent || agent.agent_email === selectedAgent
            )}
            columns={agentColumns}
          />
        </Card>

        {/* Pending Journal Reviews */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-neutral-900">
              Pending Journal Reviews ({data.pendingReviews.length})
            </h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/calls/quality'}
            >
              Quality Dashboard
            </Button>
          </div>
          <DataTable
            data={data.pendingReviews}
            columns={reviewColumns}
          />
        </Card>
      </div>

      {/* Journal Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Review Call Journal"
        size="lg"
      >
        {selectedJournal && (
          <JournalReviewForm 
            journal={selectedJournal}
            onSubmit={submitReview}
            onCancel={() => setShowReviewModal(false)}
          />
        )}
      </Modal>
    </AppLayout>
  );
}

// Journal Review Form Component
function JournalReviewForm({ 
  journal, 
  onSubmit, 
  onCancel 
}: { 
  journal: JournalEntry;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [reviewScore, setReviewScore] = useState('');
  const [coachingNotes, setCoachingNotes] = useState('');
  const [improvementAreas, setImprovementAreas] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      review_score: parseInt(reviewScore),
      coaching_notes: coachingNotes,
      improvement_areas: improvementAreas.split(',').map(s => s.trim()).filter(Boolean),
      reviewed_at: new Date().toISOString()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Journal Details */}
      <div className="bg-neutral-50 p-4 rounded-lg">
        <h4 className="font-medium text-neutral-900 mb-2">Call Summary</h4>
        <p className="text-sm text-neutral-700 mb-3">{journal.call_summary}</p>
        
        <h4 className="font-medium text-neutral-900 mb-2">Detailed Notes</h4>
        <p className="text-sm text-neutral-700">{journal.detailed_notes}</p>
      </div>

      {/* Review Form */}
      <FormField label="Quality Score (1-100)" required>
        <Input
          type="number"
          min="1"
          max="100"
          value={reviewScore}
          onChange={(e) => setReviewScore(e.target.value)}
          placeholder="Enter score"
        />
      </FormField>

      <FormField label="Coaching Notes">
        <textarea
          className="w-full min-h-[100px] p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={coachingNotes}
          onChange={(e) => setCoachingNotes(e.target.value)}
          placeholder="Enter coaching feedback and suggestions..."
        />
      </FormField>

      <FormField label="Improvement Areas (comma-separated)">
        <Input
          value={improvementAreas}
          onChange={(e) => setImprovementAreas(e.target.value)}
          placeholder="e.g. Active listening, Product knowledge, Call control"
        />
      </FormField>

      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Submit Review
        </Button>
      </div>
    </form>
  );
}

export default withAuthComponent(SupervisorDashboard, {
  requiredRoles: ['clinical_staff', 'manager', 'superadmin']
});