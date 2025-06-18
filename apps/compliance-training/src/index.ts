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
    if (url.pathname === '/health' || url.pathname === '/compliance/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'compliance-staff',
        deployment: 'staff-portal-worker',
        environment: env.ENVIRONMENT || 'production',
        version: '1.0.0',
        route: '/compliance'
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

    // Compliance dashboard API
    if (url.pathname === '/api/compliance/dashboard') {
      return handleComplianceDashboard(request, env);
    }

    // Employee compliance API
    if (url.pathname.startsWith('/api/compliance/employee/')) {
      return handleEmployeeCompliance(request, env);
    }

    // Compliance export API
    if (url.pathname === '/api/compliance/export') {
      return handleComplianceExport(request, env);
    }

    // Compliance sync API
    if (url.pathname === '/api/compliance/sync') {
      return handleComplianceSync(request, env);
    }

    // Monitoring metrics API
    if (url.pathname === '/api/monitoring/metrics') {
      return handleMonitoringMetrics(request, env);
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

async function handleComplianceDashboard(request: Request, env: Env): Promise<Response> {
  const mockDashboard = {
    overview: {
      total_employees: 87,
      compliance_rate: 0.94,
      pending_trainings: 12,
      expired_certifications: 3,
      upcoming_deadlines: 8
    },
    training_progress: [
      {
        training_id: 'hipaa_2025',
        title: 'HIPAA Privacy & Security Training 2025',
        completion_rate: 0.89,
        completed_employees: 77,
        pending_employees: 10,
        deadline: '2025-02-15'
      },
      {
        training_id: 'fire_safety_2024',
        title: 'Fire Safety & Emergency Procedures',
        completion_rate: 0.96,
        completed_employees: 84,
        pending_employees: 3,
        deadline: '2025-01-31'
      },
      {
        training_id: 'osha_bloodborne',
        title: 'OSHA Bloodborne Pathogens',
        completion_rate: 0.92,
        completed_employees: 80,
        pending_employees: 7,
        deadline: '2025-03-01'
      }
    ],
    certifications: {
      active: 245,
      expiring_30_days: 8,
      expiring_90_days: 15,
      expired: 3
    },
    departments: [
      {
        name: 'Clinical Staff',
        employees: 45,
        compliance_rate: 0.97,
        pending_items: 2
      },
      {
        name: 'Administrative',
        employees: 25,
        compliance_rate: 0.91,
        pending_items: 5
      },
      {
        name: 'Support Staff',
        employees: 17,
        compliance_rate: 0.89,
        pending_items: 5
      }
    ]
  };

  return Response.json(mockDashboard, {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

async function handleEmployeeCompliance(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const employeeId = url.pathname.split('/').pop();

  const mockEmployee = {
    employee: {
      id: employeeId,
      name: 'Dr. Sarah Johnson',
      department: 'Clinical Staff',
      position: 'Dermatologist',
      hire_date: '2022-03-15',
      compliance_status: 'compliant'
    },
    training_records: [
      {
        training_id: 'hipaa_2025',
        title: 'HIPAA Privacy & Security Training 2025',
        completion_date: '2025-01-10',
        score: 95,
        status: 'completed',
        certificate_url: '/certificates/hipaa_2025_sarah_johnson.pdf'
      },
      {
        training_id: 'fire_safety_2024',
        title: 'Fire Safety & Emergency Procedures',
        completion_date: '2024-12-20',
        score: 92,
        status: 'completed',
        certificate_url: '/certificates/fire_safety_2024_sarah_johnson.pdf'
      },
      {
        training_id: 'osha_bloodborne',
        title: 'OSHA Bloodborne Pathogens',
        completion_date: null,
        score: null,
        status: 'pending',
        deadline: '2025-03-01'
      }
    ],
    certifications: [
      {
        certification_id: 'medical_license',
        title: 'Michigan Medical License',
        issue_date: '2020-06-01',
        expiration_date: '2026-06-01',
        status: 'active'
      },
      {
        certification_id: 'dermatology_board',
        title: 'Board Certification - Dermatology',
        issue_date: '2021-08-15',
        expiration_date: '2031-08-15',
        status: 'active'
      }
    ],
    compliance_metrics: {
      overall_score: 94,
      trainings_completed: 8,
      trainings_pending: 1,
      certifications_current: 5,
      last_update: '2025-01-17T10:30:00Z'
    }
  };

  return Response.json(mockEmployee, {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

async function handleComplianceExport(request: Request, env: Env): Promise<Response> {
  const mockExport = {
    export_id: 'export_' + Date.now(),
    requested_at: new Date().toISOString(),
    status: 'completed',
    format: 'xlsx',
    records_included: 87,
    download_url: '/exports/compliance_report_2025_01_17.xlsx',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    report_summary: {
      total_employees: 87,
      compliant_employees: 82,
      non_compliant_employees: 5,
      pending_trainings: 12,
      expired_certifications: 3
    },
    columns_included: [
      'Employee Name',
      'Department',
      'Position',
      'Compliance Status',
      'Training Completion Rate',
      'Certification Status',
      'Last Training Date',
      'Next Required Training'
    ]
  };

  return Response.json(mockExport, {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

async function handleComplianceSync(request: Request, env: Env): Promise<Response> {
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

  const mockSync = {
    sync_id: 'sync_' + Date.now(),
    initiated_at: new Date().toISOString(),
    status: 'completed',
    records_processed: 87,
    records_updated: 12,
    records_added: 3,
    errors: 0,
    sync_sources: [
      {
        source: 'Google Classroom',
        records_synced: 8,
        last_sync: new Date().toISOString()
      },
      {
        source: 'Zenefits HR',
        records_synced: 87,
        last_sync: new Date().toISOString()
      },
      {
        source: 'Certificate Provider',
        records_synced: 15,
        last_sync: new Date().toISOString()
      }
    ],
    next_scheduled_sync: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };

  return Response.json(mockSync, {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

async function handleMonitoringMetrics(request: Request, env: Env): Promise<Response> {
  const mockMetrics = {
    system_health: {
      status: 'healthy',
      uptime: '99.8%',
      last_downtime: '2025-01-10T02:15:00Z',
      response_time_avg: '245ms'
    },
    compliance_metrics: {
      overall_compliance_rate: 0.94,
      trend_7_days: 0.02,
      critical_items: 3,
      pending_reviews: 8
    },
    training_metrics: {
      completion_rate_this_month: 0.89,
      average_completion_time: '45 minutes',
      most_popular_training: 'HIPAA Privacy & Security',
      least_completed_training: 'Advanced Fire Safety'
    },
    integration_status: [
      {
        integration: 'Google Classroom',
        status: 'connected',
        last_sync: new Date().toISOString(),
        sync_frequency: 'hourly'
      },
      {
        integration: 'Zenefits HR',
        status: 'connected',
        last_sync: new Date().toISOString(),
        sync_frequency: 'daily'
      },
      {
        integration: 'Certificate Provider',
        status: 'connected',
        last_sync: new Date().toISOString(),
        sync_frequency: 'weekly'
      }
    ],
    alerts: [
      {
        level: 'warning',
        message: '3 certifications expiring within 30 days',
        timestamp: new Date().toISOString()
      },
      {
        level: 'info',
        message: 'Monthly compliance report ready for review',
        timestamp: new Date().toISOString()
      }
    ]
  };

  return Response.json(mockMetrics, {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

export default handler;