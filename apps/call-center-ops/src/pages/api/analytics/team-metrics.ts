import type { NextApiRequest, NextApiResponse } from 'next';

// Mock team analytics data for supervisor and manager dashboards
const mockTeamMetrics = {
  team_summary: {
    total_agents: 12,
    agents_online: 9,
    agents_on_call: 6,
    agents_available: 3,
    agents_in_break: 2,
    agents_offline: 1,
    queue_length: 4,
    avg_wait_time: 2.3,
    calls_in_progress: 6,
    calls_completed_today: 287,
    calls_pending_journal: 23,
    journals_pending_review: 15
  },
  
  agent_status: [
    { 
      id: 'agent_001',
      name: 'Sarah Johnson', 
      email: 'sarah.johnson@gangerdermatology.com',
      status: 'on_call', 
      current_call_duration: 240,
      calls_today: 28,
      quality_avg: 94.2,
      satisfaction_avg: 4.5,
      location: 'Ann Arbor',
      break_time_used: 45,
      login_time: '08:00',
      last_activity: '14:32'
    },
    {
      id: 'agent_002', 
      name: 'Mike Chen',
      email: 'mike.chen@gangerdermatology.com',
      status: 'available',
      calls_today: 31,
      quality_avg: 89.1,
      satisfaction_avg: 4.2,
      location: 'Wixom',
      break_time_used: 30,
      login_time: '08:15',
      last_activity: '14:30'
    },
    {
      id: 'agent_003',
      name: 'Lisa Williams',
      email: 'lisa.williams@gangerdermatology.com', 
      status: 'on_call',
      current_call_duration: 180,
      calls_today: 25,
      quality_avg: 91.8,
      satisfaction_avg: 4.3,
      location: 'Plymouth',
      break_time_used: 15,
      login_time: '08:30',
      last_activity: '14:25'
    },
    {
      id: 'agent_004',
      name: 'David Rodriguez',
      email: 'david.rodriguez@gangerdermatology.com',
      status: 'break',
      calls_today: 22,
      quality_avg: 87.5,
      satisfaction_avg: 4.1,
      location: 'Ann Arbor',
      break_time_used: 60,
      login_time: '09:00',
      last_activity: '14:20'
    },
    {
      id: 'agent_005',
      name: 'Emily Thompson',
      email: 'emily.thompson@gangerdermatology.com',
      status: 'on_call',
      current_call_duration: 120,
      calls_today: 29,
      quality_avg: 93.7,
      satisfaction_avg: 4.4,
      location: 'Wixom',
      break_time_used: 30,
      login_time: '08:00',
      last_activity: '14:28'
    }
  ],

  performance_comparison: [
    { metric: 'Calls Handled', current: 287, target: 400, percentage: 71.8, trend: 'up' },
    { metric: 'Avg Quality Score', current: 91.2, target: 90.0, percentage: 101.3, trend: 'up' },
    { metric: 'Customer Satisfaction', current: 4.2, target: 4.0, percentage: 105.0, trend: 'stable' },
    { metric: 'First Call Resolution', current: 84.3, target: 85.0, percentage: 99.2, trend: 'down' },
    { metric: 'Avg Handle Time', current: 4.8, target: 5.0, percentage: 96.0, trend: 'up' },
    { metric: 'Journal Completion', current: 92.1, target: 95.0, percentage: 97.0, trend: 'up' }
  ],

  hourly_activity: [
    { hour: '08:00', calls: 12, agents: 8, avg_quality: 89.2, wait_time: 1.2 },
    { hour: '09:00', calls: 28, agents: 9, avg_quality: 91.5, wait_time: 2.1 },
    { hour: '10:00', calls: 45, agents: 10, avg_quality: 90.8, wait_time: 3.4 },
    { hour: '11:00', calls: 52, agents: 11, avg_quality: 92.1, wait_time: 2.8 },
    { hour: '12:00', calls: 38, agents: 9, avg_quality: 88.9, wait_time: 1.9 },
    { hour: '13:00', calls: 41, agents: 10, avg_quality: 91.3, wait_time: 2.3 },
    { hour: '14:00', calls: 49, agents: 11, avg_quality: 93.2, wait_time: 2.7 },
    { hour: '15:00', calls: 22, agents: 8, avg_quality: 90.1, wait_time: 1.8 }
  ],

  queue_analysis: {
    current_queue: [
      { position: 1, wait_time: 45, caller_type: 'appointment', priority: 'normal' },
      { position: 2, wait_time: 32, caller_type: 'prescription', priority: 'high' },
      { position: 3, wait_time: 18, caller_type: 'billing', priority: 'normal' },
      { position: 4, wait_time: 8, caller_type: 'general', priority: 'low' }
    ],
    queue_metrics: {
      avg_wait_time: 25.8,
      longest_wait: 45,
      abandoned_calls: 3,
      callback_requests: 2
    }
  },

  journal_review_queue: [
    {
      id: 'journal_001',
      call_id: 'call_045',
      agent_name: 'Sarah Johnson',
      submitted_at: '2025-01-07T14:15:00Z',
      call_summary: 'Patient appointment scheduling for mole check',
      priority: 'normal',
      follow_up_required: true
    },
    {
      id: 'journal_002', 
      call_id: 'call_042',
      agent_name: 'Mike Chen',
      submitted_at: '2025-01-07T13:45:00Z',
      call_summary: 'Prescription refill inquiry - tretinoin cream',
      priority: 'high',
      follow_up_required: true
    },
    {
      id: 'journal_003',
      call_id: 'call_039',
      agent_name: 'Lisa Williams', 
      submitted_at: '2025-01-07T13:20:00Z',
      call_summary: 'Urgent consultation request - suspicious lesion',
      priority: 'urgent',
      follow_up_required: true
    }
  ],

  location_breakdown: [
    {
      location: 'Ann Arbor',
      agents_active: 4,
      calls_today: 128,
      avg_quality: 92.1,
      satisfaction: 4.3,
      queue_length: 2,
      revenue_impact: 15400
    },
    {
      location: 'Wixom',
      agents_active: 3,
      calls_today: 97,
      avg_quality: 90.8,
      satisfaction: 4.1,
      queue_length: 1,
      revenue_impact: 11200
    },
    {
      location: 'Plymouth',
      agents_active: 2,
      calls_today: 62,
      avg_quality: 90.5,
      satisfaction: 4.2,
      queue_length: 1,
      revenue_impact: 8100
    }
  ]
};

const mockManagerAnalytics = {
  executive_summary: {
    total_calls_today: 487,
    total_calls_week: 2156,
    total_calls_month: 8945,
    revenue_impact_today: 48750,
    revenue_impact_week: 215600,
    appointments_scheduled_today: 156,
    appointments_scheduled_week: 687,
    customer_satisfaction: 4.2,
    quality_score_avg: 91.2,
    first_call_resolution: 84.3,
    agent_utilization: 78.5
  },

  campaign_performance: [
    {
      campaign: 'Annual Skin Check Reminders',
      calls: 156,
      appointments: 89,
      conversion_rate: 57.1,
      revenue: 17800,
      cost_per_acquisition: 12.50,
      roi: 285
    },
    {
      campaign: 'Follow-up Calls',
      calls: 98,
      appointments: 34,
      conversion_rate: 34.7,
      revenue: 6800,
      cost_per_acquisition: 8.75,
      roi: 195
    },
    {
      campaign: 'Prescription Renewals',
      calls: 145,
      appointments: 12,
      conversion_rate: 8.3,
      revenue: 2400,
      cost_per_acquisition: 15.20,
      roi: 105
    }
  ],

  financial_impact: {
    daily_revenue: 48750,
    weekly_revenue: 215600,
    monthly_revenue: 892450,
    cost_per_call: 12.35,
    revenue_per_call: 100.10,
    profit_margin: 87.7,
    appointment_value: 312.50,
    consultation_value: 485.75
  },

  operational_efficiency: [
    { metric: 'Agent Utilization', value: 78.5, target: 80.0, status: 'good' },
    { metric: 'Queue Management', value: 95.2, target: 92.0, status: 'excellent' },
    { metric: 'Call Resolution', value: 84.3, target: 85.0, status: 'needs_improvement' },
    { metric: 'Journal Compliance', value: 92.1, target: 95.0, status: 'good' },
    { metric: 'Training Completion', value: 88.7, target: 90.0, status: 'needs_improvement' }
  ],

  trend_analysis: {
    call_volume_trend: [
      { period: 'Week 1', calls: 1980, quality: 90.1, satisfaction: 4.1 },
      { period: 'Week 2', calls: 2045, quality: 91.2, satisfaction: 4.2 },
      { period: 'Week 3', calls: 2089, quality: 90.8, satisfaction: 4.0 },
      { period: 'Week 4', calls: 2156, quality: 91.2, satisfaction: 4.2 }
    ],
    revenue_trend: [
      { period: 'Week 1', revenue: 198000, appointments: 634 },
      { period: 'Week 2', revenue: 204500, appointments: 655 },
      { period: 'Week 3', revenue: 208900, appointments: 668 },
      { period: 'Week 4', revenue: 215600, appointments: 687 }
    ]
  }
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const { role, location, period = '1d', include_analytics = 'false' } = req.query;

    let responseData;

    switch (role) {
      case 'clinical_staff':
        responseData = {
          success: true,
          data: {
            ...mockTeamMetrics,
            // Filter by location if supervisor has location restrictions
            ...(location && location !== 'all' && {
              agent_status: mockTeamMetrics.agent_status.filter(agent => 
                agent.location === location
              ),
              location_breakdown: mockTeamMetrics.location_breakdown.filter(loc => 
                loc.location === location
              )
            })
          },
          meta: {
            role,
            location,
            period,
            timestamp: new Date().toISOString()
          }
        };
        break;

      case 'manager':
      case 'superadmin':
        responseData = {
          success: true,
          data: {
            ...mockTeamMetrics,
            ...(include_analytics === 'true' && {
              manager_analytics: mockManagerAnalytics
            })
          },
          meta: {
            role,
            period,
            include_analytics,
            timestamp: new Date().toISOString()
          }
        };
        break;

      default:
        responseData = {
          success: true,
          data: mockTeamMetrics,
          meta: {
            period,
            timestamp: new Date().toISOString()
          }
        };
    }

    res.status(200).json(responseData);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}