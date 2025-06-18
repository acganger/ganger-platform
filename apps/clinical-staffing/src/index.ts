interface Env {
  ASSETS: any;
  ENVIRONMENT?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

const handler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Validate request method
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405 });
    }

    // Security headers applied to all responses
    const securityHeaders = {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    // Health check endpoint
    if (url.pathname === '/health' || url.pathname === '/staffing/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'staffing-staff',
        deployment: 'staff-portal-worker',
        environment: env.ENVIRONMENT || 'production',
        version: '1.0.0',
        route: '/staffing'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...securityHeaders
        }
      });
    }

    // API endpoints
    if (url.pathname.startsWith('/api/')) {
      return handleAPIRoutes(url, request, env);
    }

    // Serve static assets for all other requests
    const response = await env.ASSETS.fetch(request);
    
    // Add security headers to static content
    const headers = new Headers(response.headers);
    Object.entries(securityHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};

async function handleAPIRoutes(url: URL, request: Request, env: Env): Promise<Response> {
  const securityHeaders = {
    'Content-Type': 'application/json',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };

  try {
    // Validate content type for POST requests
    if (request.method === 'POST') {
      const contentType = request.headers.get('Content-Type');
      if (!contentType?.includes('application/json')) {
        return new Response(JSON.stringify({ error: 'Invalid content type' }), { 
          status: 400, 
          headers: securityHeaders 
        });
      }
    }

    // Staff schedules API
    if (url.pathname === '/api/staffing/schedules') {
      return handleStaffSchedules(request, env);
    }

    // Provider analytics API
    if (url.pathname === '/api/staffing/analytics') {
      return handleProviderAnalytics(request, env);
    }

    // Schedule conflicts API
    if (url.pathname === '/api/staffing/conflicts') {
      return handleScheduleConflicts(request, env);
    }

    // Drag-and-drop schedule update API
    if (url.pathname === '/api/staffing/update-schedule') {
      return handleScheduleUpdate(request, env);
    }

    return new Response(JSON.stringify({ error: 'API endpoint not found' }), { 
      status: 404, 
      headers: securityHeaders 
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500, 
      headers: securityHeaders 
    });
  }
}

async function handleStaffSchedules(request: Request, env: Env): Promise<Response> {
  const mockSchedules = {
    schedules: [
      {
        id: 'sched_1',
        provider: {
          id: 'provider_1',
          name: 'Dr. Emily Rodriguez',
          specialty: 'Dermatology',
          status: 'active'
        },
        shifts: [
          {
            id: 'shift_1',
            date: '2025-01-20',
            startTime: '08:00',
            endTime: '17:00',
            location: 'Ann Arbor Clinic',
            type: 'scheduled',
            coverage: 'full'
          },
          {
            id: 'shift_2',
            date: '2025-01-21',
            startTime: '08:00',
            endTime: '17:00',
            location: 'Plymouth Clinic',
            type: 'scheduled',
            coverage: 'full'
          }
        ],
        weeklyHours: 40,
        availability: 'normal'
      },
      {
        id: 'sched_2',
        provider: {
          id: 'provider_2',
          name: 'Dr. Michael Chen',
          specialty: 'Mohs Surgery',
          status: 'active'
        },
        shifts: [
          {
            id: 'shift_3',
            date: '2025-01-20',
            startTime: '09:00',
            endTime: '16:00',
            location: 'Ann Arbor Clinic',
            type: 'scheduled',
            coverage: 'full'
          }
        ],
        weeklyHours: 35,
        availability: 'limited'
      }
    ],
    coverage_analysis: {
      total_scheduled_hours: 75,
      coverage_gaps: 0,
      overtime_hours: 0,
      week_start: '2025-01-20'
    }
  };

  return Response.json(mockSchedules, {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

async function handleProviderAnalytics(request: Request, env: Env): Promise<Response> {
  const mockAnalytics = {
    provider_metrics: [
      {
        provider_id: 'provider_1',
        name: 'Dr. Emily Rodriguez',
        monthly_hours: 160,
        patient_count: 240,
        revenue_contribution: 85000,
        satisfaction_score: 4.8,
        utilization_rate: 0.95
      },
      {
        provider_id: 'provider_2',
        name: 'Dr. Michael Chen',
        monthly_hours: 140,
        patient_count: 180,
        revenue_contribution: 120000,
        satisfaction_score: 4.9,
        utilization_rate: 0.87
      }
    ],
    coverage_analytics: {
      average_coverage_per_day: 8.5,
      peak_demand_hours: ['10:00-12:00', '14:00-16:00'],
      coverage_gaps_identified: 2,
      optimal_staffing_level: 'current + 1'
    },
    performance_trends: {
      efficiency_trend: 'increasing',
      patient_satisfaction_trend: 'stable',
      cost_per_hour_trend: 'decreasing'
    }
  };

  return Response.json(mockAnalytics, {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

async function handleScheduleConflicts(request: Request, env: Env): Promise<Response> {
  const mockConflicts = {
    conflicts: [
      {
        id: 'conflict_1',
        type: 'double_booking',
        date: '2025-01-22',
        time: '14:00-16:00',
        providers: ['Dr. Emily Rodriguez', 'Dr. Michael Chen'],
        location: 'Ann Arbor Clinic',
        severity: 'high',
        suggested_resolution: 'Move Dr. Chen to Plymouth location'
      }
    ],
    conflict_prevention: {
      auto_detection_enabled: true,
      last_scan: '2025-01-17T10:30:00Z',
      next_scan: '2025-01-17T14:30:00Z'
    },
    resolution_history: {
      conflicts_resolved_this_week: 3,
      average_resolution_time: '15 minutes',
      prevention_accuracy: 0.94
    }
  };

  return Response.json(mockConflicts, {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

async function handleScheduleUpdate(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    });
  }

  // Mock schedule update response
  const mockUpdateResponse = {
    success: true,
    updated_schedule: {
      id: 'sched_update_1',
      provider_id: 'provider_1',
      changes_applied: [
        {
          type: 'shift_moved',
          from: '2025-01-20 09:00-17:00',
          to: '2025-01-20 08:00-16:00',
          location: 'Ann Arbor Clinic'
        }
      ],
      conflicts_resolved: 1,
      timestamp: new Date().toISOString()
    },
    validation: {
      conflicts_checked: true,
      coverage_maintained: true,
      compliance_verified: true
    }
  };

  return Response.json(mockUpdateResponse, {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

export default handler;