import type { NextApiRequest, NextApiResponse } from 'next';

// Mock performance metrics data for agent dashboards
const mockAgentMetrics = {
  current: {
    calls_handled: 32,
    talk_time_minutes: 148,
    avg_call_duration: 4.6,
    first_call_resolution_rate: 87.5,
    customer_satisfaction_avg: 4.3,
    quality_score_avg: 92.1,
    calls_missed: 2,
    follow_ups_pending: 5,
    appointments_scheduled: 18
  },
  daily_goals: {
    calls_handled: 50,
    talk_time_minutes: 240,
    avg_call_duration: 5.0,
    first_call_resolution_rate: 85.0,
    customer_satisfaction_avg: 4.2,
    quality_score_avg: 90.0,
    appointments_scheduled: 20
  },
  weekly_trend: [
    { date: '2025-01-01', calls: 45, quality: 94, satisfaction: 4.4 },
    { date: '2025-01-02', calls: 38, quality: 91, satisfaction: 4.2 },
    { date: '2025-01-03', calls: 42, quality: 89, satisfaction: 4.1 },
    { date: '2025-01-04', calls: 40, quality: 93, satisfaction: 4.5 },
    { date: '2025-01-05', calls: 35, quality: 90, satisfaction: 4.3 },
    { date: '2025-01-06', calls: 32, quality: 92, satisfaction: 4.3 },
    { date: '2025-01-07', calls: 32, quality: 92, satisfaction: 4.3 }
  ],
  recent_calls: [
    {
      id: 'call_001',
      time: '2025-01-07T14:30:00Z',
      caller: 'John Doe',
      duration: 296,
      outcome: 'appointment_scheduled',
      quality_score: 95,
      satisfaction: 5
    },
    {
      id: 'call_002', 
      time: '2025-01-07T14:15:00Z',
      caller: 'Jane Smith',
      duration: 185,
      outcome: 'information_provided',
      quality_score: 88,
      satisfaction: 4
    },
    {
      id: 'call_003',
      time: '2025-01-07T13:45:00Z', 
      caller: 'Bob Johnson',
      duration: 342,
      outcome: 'transfer_required',
      quality_score: 91,
      satisfaction: 4
    }
  ]
};

const mockTeamMetrics = {
  team_summary: {
    total_agents: 12,
    agents_online: 9,
    agents_on_call: 6,
    agents_available: 3,
    queue_length: 4,
    avg_wait_time: 2.3,
    calls_in_progress: 6,
    calls_completed_today: 287
  },
  agent_status: [
    { 
      id: 'agent_001',
      name: 'Sarah Johnson', 
      email: 'sarah.johnson@gangerdermatology.com',
      status: 'on_call', 
      current_call_duration: 240,
      calls_today: 28,
      quality_avg: 94,
      location: 'Ann Arbor'
    },
    {
      id: 'agent_002', 
      name: 'Mike Chen',
      email: 'mike.chen@gangerdermatology.com',
      status: 'available',
      calls_today: 31,
      quality_avg: 89,
      location: 'Wixom'
    },
    {
      id: 'agent_003',
      name: 'Lisa Williams',
      email: 'lisa.williams@gangerdermatology.com', 
      status: 'on_call',
      current_call_duration: 180,
      calls_today: 25,
      quality_avg: 91,
      location: 'Plymouth'
    }
  ],
  performance_comparison: [
    { metric: 'Calls Handled', current: 287, target: 400, percentage: 71.8 },
    { metric: 'Avg Quality Score', current: 91.2, target: 90.0, percentage: 101.3 },
    { metric: 'Customer Satisfaction', current: 4.2, target: 4.0, percentage: 105.0 },
    { metric: 'First Call Resolution', current: 84.3, target: 85.0, percentage: 99.2 }
  ]
};

const mockManagerMetrics = {
  executive_summary: {
    total_calls_today: 487,
    total_calls_week: 2156,
    revenue_impact: 48750,
    appointments_scheduled: 156,
    customer_satisfaction: 4.2,
    quality_score_avg: 91.2
  },
  location_performance: [
    {
      location: 'Ann Arbor',
      calls: 198,
      agents: 5,
      quality: 92.1,
      satisfaction: 4.3,
      revenue: 22100
    },
    {
      location: 'Wixom', 
      calls: 167,
      agents: 4,
      quality: 90.8,
      satisfaction: 4.1,
      revenue: 15650
    },
    {
      location: 'Plymouth',
      calls: 122,
      agents: 3,
      quality: 90.5,
      satisfaction: 4.2,
      revenue: 11000
    }
  ],
  campaign_performance: [
    {
      campaign: 'Annual Skin Check Reminders',
      calls: 156,
      appointments: 89,
      conversion_rate: 57.1,
      revenue: 17800
    },
    {
      campaign: 'Follow-up Calls',
      calls: 98,
      appointments: 34,
      conversion_rate: 34.7,
      revenue: 6800
    }
  ],
  hourly_volume: [
    { hour: '08:00', calls: 12, wait_time: 1.2 },
    { hour: '09:00', calls: 28, wait_time: 2.1 },
    { hour: '10:00', calls: 45, wait_time: 3.4 },
    { hour: '11:00', calls: 52, wait_time: 2.8 },
    { hour: '12:00', calls: 38, wait_time: 1.9 },
    { hour: '13:00', calls: 41, wait_time: 2.3 },
    { hour: '14:00', calls: 49, wait_time: 2.7 },
    { hour: '15:00', calls: 44, wait_time: 2.1 },
    { hour: '16:00', calls: 39, wait_time: 1.8 }
  ]
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const { role, agent_id, period = '1d' } = req.query;

    let responseData;

    switch (role) {
      case 'agent':
        responseData = {
          success: true,
          data: mockAgentMetrics,
          meta: {
            agent_id,
            period,
            timestamp: new Date().toISOString()
          }
        };
        break;

      case 'clinical_staff':
        responseData = {
          success: true,
          data: {
            ...mockTeamMetrics,
            agent_metrics: mockAgentMetrics
          },
          meta: {
            period,
            timestamp: new Date().toISOString()
          }
        };
        break;

      case 'manager':
        responseData = {
          success: true,
          data: {
            ...mockManagerMetrics,
            team_metrics: mockTeamMetrics,
            agent_metrics: mockAgentMetrics
          },
          meta: {
            period,
            timestamp: new Date().toISOString()
          }
        };
        break;

      default:
        responseData = {
          success: true,
          data: mockAgentMetrics,
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